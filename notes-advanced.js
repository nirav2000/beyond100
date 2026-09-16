const ADV_CLOUD=window.BEYOND100_CLOUD;
const NOTES_KEY='beyond100.notes.v1';
const SESSION_KEY='beyond100.session.id.v1';
const AUTH_EPOCH_KEY='beyond100.auth.epoch.v1';
let advSdkPromise=null,sessionTimer=null,epochTimer=null,currentSession=null,dragState=null;

const q=(s,r=document)=>r.querySelector(s);
function notesData(){try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]')}catch{return[]}}
function uid(){let id=sessionStorage.getItem(SESSION_KEY);if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}return id}
function cloudBase(){return ADV_CLOUD.firestoreBase||['families',ADV_CLOUD.ownerUid,'learners',ADV_CLOUD.learnerId,'progress']}
async function sdk(){
  if(advSdkPromise)return advSdkPromise;
  advSdkPromise=(async()=>{const [A,Auth,F]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);const app=A.getApps()[0]||A.initializeApp(ADV_CLOUD.firebase);return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)}})();
  return advSdkPromise;
}

function installPasswordToggle(){
  const input=q('#firebasePassword');if(!input||q('#toggleFirebasePassword'))return;
  const button=document.createElement('button');button.id='toggleFirebasePassword';button.type='button';button.className='password-toggle';button.textContent='Show password';
  input.insertAdjacentElement('afterend',button);
  button.addEventListener('click',()=>{const showing=input.type==='text';input.type=showing?'password':'text';button.textContent=showing?'Show password':'Hide password';});
}

function installMinimiseAndDrag(){
  const d=q('#notesDialog'),head=q('.notes-head',d);if(!d||!head)return;
  if(!q('#minimiseNotes',d)){
    const b=document.createElement('button');b.id='minimiseNotes';b.type='button';b.className='notes-minimise';b.setAttribute('aria-label','Minimise notes');b.textContent='—';
    q('.notes-head-actions',d)?.insertBefore(b,q('#closeNotes',d));
    b.addEventListener('click',()=>{const on=!d.classList.contains('is-minimised');d.classList.toggle('is-minimised',on);b.textContent=on?'▢':'—';b.setAttribute('aria-label',on?'Restore notes':'Minimise notes');});
  }
  if(head.dataset.dragInstalled)return;head.dataset.dragInstalled='1';
  head.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,input,a')||d.classList.contains('is-minimised'))return;
    const rect=d.getBoundingClientRect();dragState={id:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};
    head.setPointerCapture?.(e.pointerId);d.classList.add('is-dragging');
    d.style.margin='0';d.style.position='fixed';d.style.left=`${rect.left}px`;d.style.top=`${rect.top}px`;
  });
  head.addEventListener('pointermove',e=>{
    if(!dragState||dragState.id!==e.pointerId)return;
    const maxLeft=Math.max(0,innerWidth-d.offsetWidth),maxTop=Math.max(0,innerHeight-70);
    d.style.left=`${Math.max(0,Math.min(maxLeft,dragState.left+e.clientX-dragState.x))}px`;
    d.style.top=`${Math.max(0,Math.min(maxTop,dragState.top+e.clientY-dragState.y))}px`;
  });
  const end=e=>{if(dragState&&dragState.id===e.pointerId){dragState=null;d.classList.remove('is-dragging')}};
  head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
}

function category(note){
  const a=note.anchorId||'',s=note.section||'';
  if(a.startsWith('question:')||s==='questions')return'Questions';
  if(a.startsWith('stage:')||s==='progression')return'Progression';
  if(a.startsWith('mastery:')||a.startsWith('threshold:')||s==='mastery')return'Mastery';
  if(a.startsWith('misconception:')||s==='misconceptions')return'Misconceptions';
  if(a.includes('assessment')||s==='assessments')return'Assessment';
  if((note.text||'').toLowerCase().includes('firebase')||(note.text||'').toLowerCase().includes('notes'))return'App / workflow';
  return'Content / general';
}
function summaryStats(days){
  const since=Date.now()-days*86400000,notes=notesData().filter(n=>Date.parse(n.updatedAt||n.createdAt||0)>=since);
  const cats={},statuses={open:0,actioned:0,archived:0};
  for(const n of notes){cats[category(n)]=(cats[category(n)]||0)+1;const s=n.status||'open';statuses[s]=(statuses[s]||0)+1}
  return{notes,cats,statuses,review:notes.filter(n=>n.reviewRequired!==false&&n.status!=='actioned'&&n.status!=='archived').length};
}
function renderSummary(){
  const root=q('#notesInsights');if(!root)return;
  const make=(label,days)=>{const s=summaryStats(days);const cats=Object.entries(s.cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span>${k}: <b>${v}</b></span>`).join('')||'<span>No notes</span>';return `<div class="insight-period"><strong>${label}</strong><div class="insight-numbers"><span>Total <b>${s.notes.length}</b></span><span>Awaiting review <b>${s.review}</b></span><span>Actioned <b>${s.statuses.actioned||0}</b></span><span>Archived <b>${s.statuses.archived||0}</b></span></div><div class="insight-categories">${cats}</div></div>`};
  root.innerHTML=make('Last 7 days',7)+make('Last 30 days',30);
}
function installInsights(){
  const body=q('.notes-body');if(!body||q('#notesInsightsPanel'))return;
  const panel=document.createElement('details');panel.id='notesInsightsPanel';panel.className='cloud-panel notes-insights';panel.innerHTML='<summary>Review summary</summary><p class="muted">Weekly and monthly view of notes, review state and categories.</p><div id="notesInsights"></div>';
  const firebase=[...body.querySelectorAll('.cloud-panel')].find(x=>x.querySelector('#firebaseSignIn'));body.insertBefore(panel,firebase||null);panel.addEventListener('toggle',()=>{if(panel.open)renderSummary()});renderSummary();
}

async function publicIp(){try{const r=await fetch('https://api.ipify.org?format=json',{cache:'no-store'});if(!r.ok)return null;return (await r.json()).ip||null}catch{return null}}
async function writeSession(final=false){
  const S=await sdk(),user=S.auth.currentUser;if(!user||user.uid!==ADV_CLOUD.ownerUid)return;
  if(!currentSession){currentSession={id:uid(),startedAt:new Date().toISOString(),ip:await publicIp(),page:location.pathname,userAgent:navigator.userAgent,platform:navigator.platform||'',language:navigator.language||''}}
  const now=new Date(),durationSeconds=Math.max(0,Math.round((now-Date.parse(currentSession.startedAt))/1000));
  await S.F.setDoc(S.F.doc(S.db,...cloudBase(),`beyond100-session-${currentSession.id}`),{app:ADV_CLOUD.appId||'beyond100',kind:'session',sessionId:currentSession.id,startedAt:currentSession.startedAt,lastSeenAt:now.toISOString(),durationSeconds,endedAt:final?now.toISOString():null,ip:currentSession.ip||null,page:currentSession.page,userAgent:currentSession.userAgent,platform:currentSession.platform,language:currentSession.language},{merge:true});
}
async function startSessionTracking(){
  const S=await sdk();await S.auth.authStateReady();S.Auth.onAuthStateChanged(S.auth,user=>{
    clearInterval(sessionTimer);sessionTimer=null;currentSession=null;
    if(user?.uid===ADV_CLOUD.ownerUid){writeSession(false).catch(()=>{});sessionTimer=setInterval(()=>writeSession(false).catch(()=>{}),60000);startEpochWatch().catch(()=>{})}
  });
  addEventListener('pagehide',()=>{writeSession(true).catch(()=>{})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')writeSession(false).catch(()=>{})});
}

async function epochRef(){const S=await sdk();return{S,ref:S.F.doc(S.db,...cloudBase(),'beyond100-auth-epoch')}}
async function currentRemoteEpoch(){const {S,ref}=await epochRef(),snap=await S.F.getDoc(ref);return snap.exists()?snap.data().epoch:null}
async function startEpochWatch(){
  clearInterval(epochTimer);const S=await sdk();if(!S.auth.currentUser||S.auth.currentUser.uid!==ADV_CLOUD.ownerUid)return;
  let remote=await currentRemoteEpoch();if(!remote){remote=crypto.randomUUID();const {S:S2,ref}=await epochRef();await S2.F.setDoc(ref,{app:ADV_CLOUD.appId||'beyond100',kind:'auth-epoch',epoch:remote,updatedAt:new Date().toISOString()},{merge:true})}
  const local=localStorage.getItem(AUTH_EPOCH_KEY);if(!local)localStorage.setItem(AUTH_EPOCH_KEY,remote);else if(local!==remote){await S.Auth.signOut(S.auth);return}
  epochTimer=setInterval(async()=>{try{const latest=await currentRemoteEpoch();const mine=localStorage.getItem(AUTH_EPOCH_KEY);if(latest&&mine&&latest!==mine){clearInterval(epochTimer);await S.Auth.signOut(S.auth)}}catch{}},30000);
}
async function logoutAllDevices(){
  const S=await sdk();if(!S.auth.currentUser||S.auth.currentUser.uid!==ADV_CLOUD.ownerUid)return;
  const epoch=crypto.randomUUID(),{ref}=await epochRef();await S.F.setDoc(ref,{app:ADV_CLOUD.appId||'beyond100',kind:'auth-epoch',epoch,updatedAt:new Date().toISOString()},{merge:true});localStorage.removeItem(AUTH_EPOCH_KEY);await S.Auth.signOut(S.auth);
}
function installLogoutAll(){
  const actions=q('#firebaseSignOut')?.parentElement;if(!actions||q('#firebaseSignOutAll'))return;
  const b=document.createElement('button');b.id='firebaseSignOutAll';b.type='button';b.textContent='Log out all devices';b.addEventListener('click',async()=>{b.disabled=true;b.textContent='Logging out…';try{await logoutAllDevices()}finally{b.disabled=false;b.textContent='Log out all devices'}});actions.appendChild(b);
}

function mount(){installPasswordToggle();installMinimiseAndDrag();installInsights();installLogoutAll()}
if(!q('#notesDialog')){const mo=new MutationObserver(()=>{if(q('#notesDialog')){mount();mo.disconnect()}});mo.observe(document.documentElement,{subtree:true,childList:true})}else mount();
window.addEventListener('beyond100-review-status-applied',renderSummary);
window.addEventListener('storage',e=>{if(e.key===NOTES_KEY)renderSummary()});
setInterval(()=>{if(q('#notesDialog')){mount();renderSummary()}},4000);
startSessionTracking().catch(()=>{});
