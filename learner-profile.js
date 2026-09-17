const PROFILE_CLOUD=window.BEYOND100_CLOUD;
const PROFILE_CACHE='beyond100.learner-profile.v1';
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

function scoreCandidate(row){
  const id=String(row.id||'').toLowerCase(),label=String(row.label||row.name||'').trim().toLowerCase();
  if(label==='sai')return 100;
  if(id==='sai')return 95;
  if(label.startsWith('sai '))return 80;
  if(id.startsWith('sai-'))return 70;
  if(row.kind==='learner')return 10;
  return 0;
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
    const sorted=rows.map(row=>({row,score:scoreCandidate(row)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    let chosen=sorted[0]?.row||null;
    const cached=cachedProfile();
    if(cached?.id&&rows.some(r=>r.id===cached.id)&&scoreCandidate(rows.find(r=>r.id===cached.id))>=70)chosen=rows.find(r=>r.id===cached.id);
    if(!chosen)throw new Error('No learner profile matching Sai was found');
    const profile={id:chosen.id,label:chosen.label||chosen.name||'Sai',kind:chosen.kind||'learner'};
    cacheProfile(profile);
    PROFILE_CLOUD.learner={id:profile.id,label:profile.label};
    PROFILE_CLOUD.learnerId=profile.id;
    PROFILE_CLOUD.learnerLabel=profile.label;
    PROFILE_CLOUD.learnerBase=['families',PROFILE_CLOUD.ownerUid,'learners',profile.id];
    PROFILE_CLOUD.learnerProgressBase=[...PROFILE_CLOUD.learnerBase,'progress'];
    PROFILE_CLOUD.beyond100={
      appId:'beyond100',
      displayName:'Beyond 100',
      meaning:'going beyond the average',
      learnerId:profile.id,
      progressBase:PROFILE_CLOUD.learnerProgressBase
    };
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
