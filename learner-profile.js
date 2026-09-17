const PROFILE_CLOUD=window.BEYOND100_CLOUD;
const PROFILE_CACHE='beyond100.learner-profile.v1';
const MIGRATION_KEY='beyond100.legacy-migration.v1';
let profileSdkPromise=null,resolving=null;

function cachedProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_CACHE)||'null')}catch{return null}}
function cacheProfile(profile){if(profile?.id)localStorage.setItem(PROFILE_CACHE,JSON.stringify(profile))}

async function profileSdk(){
  if(profileSdkPromise)return profileSdkPromise;
  profileSdkPromise=(async()=>{
    const[A,Auth,F]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]);
    const app=A.getApps()[0]||A.initializeApp(PROFILE_CLOUD.firebase);
    return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)};
  })();
  return profileSdkPromise;
}

function directSaiMatch(row){
  const id=String(row.id||'').trim().toLowerCase();
  const label=String(row.label||row.name||'').trim().toLowerCase();
  if(label==='sai')return 100;
  if(id==='sai')return 95;
  if(/^sai\b/.test(label))return 90;
  if(/^sai[-_]/.test(id))return 85;
  return 0;
}

function chooseProfile(rows){
  const cached=cachedProfile();
  if(cached?.id){
    const hit=rows.find(r=>r.id===cached.id);
    if(hit&&directSaiMatch(hit)>0)return hit;
  }
  const direct=rows.map(row=>({row,score:directSaiMatch(row)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(direct.length)return direct[0].row;
  const learners=rows.filter(r=>r.kind==='learner'&&!r.archived);
  if(learners.length===1)return learners[0];
  return null;
}

function sourceIsBeyond100(data){return data?.app==='beyond100'||String(data?.kind||'').startsWith('beyond100-')}

async function migrateLegacyProgress(S,profile){
  const legacyId=PROFILE_CLOUD.legacyLearnerId||PROFILE_CLOUD.learnerLookup?.legacyId;
  if(!legacyId||legacyId===profile.id)return;
  const migrationId=`${legacyId}->${profile.id}`;
  let status={};try{status=JSON.parse(localStorage.getItem(MIGRATION_KEY)||'{}')}catch{}
  if(status[migrationId])return;

  const legacy=S.F.collection(S.db,'families',PROFILE_CLOUD.ownerUid,'learners',legacyId,'progress');
  const target=S.F.collection(S.db,'families',PROFILE_CLOUD.ownerUid,'learners',profile.id,'progress');
  const snap=await S.F.getDocsFromServer(legacy);
  const rows=snap.docs.filter(d=>sourceIsBeyond100(d.data()));
  if(rows.length){
    for(let i=0;i<rows.length;i+=400){
      const batch=S.F.writeBatch(S.db);
      rows.slice(i,i+400).forEach(d=>batch.set(S.F.doc(target,d.id),d.data(),{merge:true}));
      await batch.commit();
    }
  }
  status[migrationId]={at:new Date().toISOString(),documents:rows.length};
  localStorage.setItem(MIGRATION_KEY,JSON.stringify(status));
}

async function resolveSaiProfile(force=false){
  if(resolving&&!force)return resolving;
  resolving=(async()=>{
    const S=await profileSdk();
    await S.auth.authStateReady();
    const user=S.auth.currentUser;
    if(!user||user.uid!==PROFILE_CLOUD.ownerUid)throw new Error('Parent Firebase sign-in required');
    const snap=await S.F.getDocsFromServer(S.F.collection(S.db,'families',PROFILE_CLOUD.ownerUid,'learners'));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    const chosen=chooseProfile(rows);
    if(!chosen)throw new Error('Sai learner profile could not be identified unambiguously');

    const profile={id:chosen.id,label:chosen.label||chosen.name||'Sai',kind:chosen.kind||'learner'};
    cacheProfile(profile);
    PROFILE_CLOUD.learner={id:profile.id,label:profile.label};
    PROFILE_CLOUD.learnerId=profile.id;
    PROFILE_CLOUD.learnerLabel=profile.label;
    PROFILE_CLOUD.learnerBase=['families',PROFILE_CLOUD.ownerUid,'learners',profile.id];
    PROFILE_CLOUD.learnerProgressBase=[...PROFILE_CLOUD.learnerBase,'progress'];
    PROFILE_CLOUD.firestoreBase=PROFILE_CLOUD.learnerProgressBase;
    PROFILE_CLOUD.beyond100={
      appId:'beyond100',
      displayName:'Beyond 100',
      meaning:'going beyond the average',
      learnerId:profile.id,
      progressBase:PROFILE_CLOUD.learnerProgressBase
    };

    await migrateLegacyProgress(S,profile).catch(()=>{});
    window.dispatchEvent(new CustomEvent('beyond100-learner-resolved',{detail:profile}));
    return profile;
  })();
  try{return await resolving}finally{resolving=null}
}

window.BEYOND100_RESOLVE_LEARNER=resolveSaiProfile;
window.BEYOND100_GET_LEARNER=()=>PROFILE_CLOUD.learner||cachedProfile();

(async()=>{
  try{
    const S=await profileSdk();await S.auth.authStateReady();
    S.Auth.onAuthStateChanged(S.auth,user=>{if(user?.uid===PROFILE_CLOUD.ownerUid)resolveSaiProfile(true).catch(()=>{})});
    if(S.auth.currentUser?.uid===PROFILE_CLOUD.ownerUid)await resolveSaiProfile();
  }catch{}
})();