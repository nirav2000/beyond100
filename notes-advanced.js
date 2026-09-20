const ADV_CLOUD=window.BEYOND100_CLOUD;
const NOTES_KEY='beyond100.notes.v1';
const SESSION_KEY='beyond100.session.current.v1';
const AUTH_EPOCH_KEY='beyond100.auth.epoch.v1';
let advSdkPromise=null,sessionTimer=null,localSessionTimer=null,epochTimer=null,currentSession=null,dragState=null;

const q=(s,r=document)=>r.querySelector(s);
function notesData(){try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]')}catch{return[]}}
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

function newLocalSession(){
  const now=new Date().toISOString();
  const s={id:crypto.randomUUID(),startedAt:now,lastSeenAt:now,endedAt:null,durationSeconds:0,ip:null,page:location.pathname+location.hash,userAgent:navigator.userAgent,platform:navigator.platform||'',language:navigator.language||'',syncedAt:null};
  localStorage.setItem(SESSION_KEY,JSON.stringify(s));
  return s;
}
function loadLocalSession(){
  try{
    const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if(!s?.id||!s.startedAt)return null;
    const stale=Date.now()-Date.parse(s.lastSeenAt||s.startedAt)>30*60*1000;
    if(stale||s.endedAt)return null;
    return s;
  }catch{return null}
}
function ensureLocalSession(){
  if(currentSession)return currentSession;
  currentSession=loadLocalSession()||newLocalSession();
  localStorage.setItem(SESSION_KEY,JSON.stringify(currentSession));
  return currentSession;
}
function touchLocalSession(final=false){
  const s=ensureLocalSession(),now=new Date();
  s.lastSeenAt=now.toISOString();
  s.durationSeconds=Math.max(0,Math.round((now-Date.parse(s.startedAt))/1000));
  if(final)s.endedAt=now.toISOString();
  localStorage.setItem(SESSION_KEY,JSON.stringify(s));
  return s;
}

function eyeIcon(showing=false){
  return showing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a16.4 16.4 0 0 1-3.1 3.6"/><path d="M6.6 6.6C4.4 8.1 3 10 3 10s3.5 5 9 5c1 0 2-.2 2.8-.5"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.4"/></svg>';
}
function installPasswordToggle(){
  const input=q('#firebasePassword');if(!input)return;
  let wrap=input.closest('.password-field-wrap');
  if(!wrap){
    wrap=document.createElement('div');wrap.className='password-field-wrap';
    input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
  }
  if(q('#toggleFirebasePassword',wrap))return;
  const button=document.createElement('button');button.id='toggleFirebasePassword';button.type='button';button.className='password-toggle';
  button.setAttribute('aria-label','Show password');button.title='Show password';button.innerHTML=eyeIcon(false);
  wrap.appendChild(button);
  button.addEventListener('click',()=>{
    const showing=input.type==='text';input.type=showing?'password':'text';
    const label=showing?'Show password':'Hide password';
    button.setAttribute('aria-label',label);button.title=label;button.innerHTML=eyeIcon(!showing);
  });
}

function restoreNotesWindow(){
  const d=q('#notesDialog');if(!d||!d.classList.contains('is-minimised'))return false;
  if(d.open)d.close();
  d.classList.remove('is-minimised');
  d.style.left='';d.style.top='';d.style.margin='';d.style.position='';d.style.width='';d.style.height='';d.style.maxHeight='';
  const b=q('#minimiseNotes',d);
  if(b){
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>';
    b.setAttribute('aria-label','Minimise notes');b.title='Minimise notes';
  }
  d.showModal();return true;
}
window.BEYOND100_RESTORE_NOTES=restoreNotesWindow;

function installMinimiseAndDrag(){
  const d=q('#notesDialog'),head=q('.notes-head',d);if(!d||!head)return;
  if(!q('#minimiseNotes',d)){
    const b=document.createElement('button');b.id='minimiseNotes';b.type='button';b.className='notes-minimise';b.setAttribute('aria-label','Minimise notes');b.title='Minimise notes';
    const draw=on=>{b.innerHTML=on?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h10v10H5z"/><path d="M9 5h10v10"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>';};
    draw(false);
    q('.notes-head-actions',d)?.insertBefore(b,q('#closeNotes',d));
    b.addEventListener('click',()=>{
      const on=!d.classList.contains('is-minimised');
      if(on){
        // A modal dialog keeps the page inert even when visually tiny. Reopen it non-modally so
        // the user can inspect and interact with the page while preserving the draft in the DOM.
        if(d.open)d.close();
        d.classList.add('is-minimised');draw(true);
        d.style.left='';d.style.top='';d.style.margin='';
        d.show();
        d.style.setProperty('width','min(360px, calc(100vw - 24px))','important');
        d.style.setProperty('height','58px','important');
        d.style.setProperty('max-height','58px','important');
      }else{
        restoreNotesWindow();
      }
      const label=on?'Restore notes':'Minimise notes';b.setAttribute('aria-label',label);b.title=label;
    });
  }
  if(!head.dataset.restoreInstalled){
    head.dataset.restoreInstalled='1';
    head.addEventListener('click',e=>{
      if(!d.classList.contains('is-minimised'))return;
      if(document.body.classList.contains('annotating'))return;
      if(e.target.closest('button,a,input,select,textarea'))return;
      restoreNotesWindow();
    });
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
function summaryStats(days=null){
  const all=notesData();
  const notes=days==null?all:all.filter(n=>Date.parse(n.updatedAt||n.createdAt||0)>=Date.now()-days*86400000);
  const cats={},statuses={open:0,implemented:0,archived:0,manualArchived:0};
  for(const n of notes){
    cats[category(n)]=(cats[category(n)]||0)+1;
    if(n.implementationStatus==='implemented')statuses.implemented++;
    if(n.status==='archived'){
      statuses.archived++;
      if(n.implementationStatus!=='implemented')statuses.manualArchived++;
    }else statuses.open++;
  }
  return{notes,cats,statuses,review:notes.filter(n=>n.reviewRequired!==false&&n.status!=='archived').length};
}
function summaryTile(icon,label,value,tone,detail=''){
  return `<article class="notes-stat-tile" data-tone="${tone}"><span class="notes-stat-icon">${icon}</span><div><b>${value}</b><strong>${label}</strong>${detail?`<small>${detail}</small>`:''}</div></article>`;
}
function renderCategoryBars(cats,total){
  const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  if(!entries.length)return'<div class="notes-summary-empty">No note categories yet.</div>';
  return entries.map(([label,count],i)=>{
    const pct=Math.max(6,Math.round(count/Math.max(1,total)*100));
    return `<div class="notes-category-row" data-index="${i%6}"><div><span>${label}</span><b>${count}</b></div><div class="notes-category-track"><i style="width:${pct}%"></i></div></div>`;
  }).join('');
}
function renderSummary(){
  const root=q('#notesInsights');if(!root)return;
  const all=summaryStats(),week=summaryStats(7),month=summaryStats(30);
  const implementedPct=all.notes.length?Math.round(all.statuses.implemented/all.notes.length*100):0;
  const archiveDetail=all.statuses.manualArchived?`${all.statuses.manualArchived} manually archived`:'Includes implemented notes';
  root.innerHTML=`
    <div class="notes-summary-hero">
      <div class="notes-summary-ring" style="--implemented:${implementedPct}"><div><b>${all.notes.length}</b><span>all notes</span></div></div>
      <div class="notes-summary-copy"><strong>Notes at a glance</strong><span>All-time totals are shown here, so older archived notes remain visible in the summary.</span></div>
    </div>
    <div class="notes-stat-grid">
      ${summaryTile('✎','Open',all.statuses.open,'open','Not archived')}
      ${summaryTile('✦','For review',all.review,'review','Awaiting review')}
      ${summaryTile('✓','Implemented',all.statuses.implemented,'implemented','Automatically archived')}
      ${summaryTile('▣','Archived',all.statuses.archived,'archived',archiveDetail)}
    </div>
    <div class="notes-activity-periods">
      <article><span>Last 7 days</span><b>${week.notes.length}</b><small>${week.review} awaiting review · ${week.statuses.implemented} implemented</small></article>
      <article><span>Last 30 days</span><b>${month.notes.length}</b><small>${month.review} awaiting review · ${month.statuses.implemented} implemented</small></article>
    </div>
    <div class="notes-category-chart"><div class="notes-chart-head"><strong>Where the notes are</strong><span>all time</span></div>${renderCategoryBars(all.cats,all.notes.length)}</div>
  `;
}
function installInsights(){
  const body=q('.notes-body');if(!body||q('#notesInsightsPanel'))return;
  const panel=document.createElement('details');panel.id='notesInsightsPanel';panel.className='cloud-panel notes-insights';panel.open=false;panel.innerHTML='<summary>Notes activity summary</summary><p class="muted">A visual overview of the notes workflow: all-time open, review, implemented and archived totals, recent activity, and where notes are concentrated. It is separate from Sai’s learning-performance evidence.</p><div id="notesInsights"></div>';
  const firebase=[...body.querySelectorAll('.cloud-panel')].find(x=>x.querySelector('#firebaseSignIn'));body.insertBefore(panel,firebase||null);panel.addEventListener('toggle',()=>{if(panel.open)renderSummary()});renderSummary();
}

async function publicIp(){try{const r=await fetch('https://api.ipify.org?format=json',{cache:'no-store'});if(!r.ok)return null;return (await r.json()).ip||null}catch{return null}}
async function writeSession(final=false){
  const local=touchLocalSession(final),S=await sdk(),user=S.auth.currentUser;if(!user||user.uid!==ADV_CLOUD.ownerUid)return;
  if(!local.ip){local.ip=await publicIp();localStorage.setItem(SESSION_KEY,JSON.stringify(local))}
  await S.F.setDoc(S.F.doc(S.db,...cloudBase(),`beyond100-session-${local.id}`),{app:ADV_CLOUD.appId||'beyond100',kind:'session',sessionId:local.id,startedAt:local.startedAt,lastSeenAt:local.lastSeenAt,durationSeconds:local.durationSeconds,endedAt:local.endedAt||null,ip:local.ip||null,page:local.page,userAgent:local.userAgent,platform:local.platform,language:local.language},{merge:true});
  local.syncedAt=new Date().toISOString();localStorage.setItem(SESSION_KEY,JSON.stringify(local));
}
async function startSessionTracking(){
  ensureLocalSession();
  clearInterval(localSessionTimer);localSessionTimer=setInterval(()=>touchLocalSession(false),30000);
  const S=await sdk();await S.auth.authStateReady();S.Auth.onAuthStateChanged(S.auth,user=>{
    clearInterval(sessionTimer);sessionTimer=null;
    if(user?.uid===ADV_CLOUD.ownerUid){writeSession(false).catch(()=>{});sessionTimer=setInterval(()=>writeSession(false).catch(()=>{}),60000);startEpochWatch().catch(()=>{})}
  });
  addEventListener('pagehide',()=>{touchLocalSession(true);writeSession(true).catch(()=>{})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){touchLocalSession(false);writeSession(false).catch(()=>{})}});
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
function updateDangerVisibility(signedIn){
  const zone=q('#firebaseDangerZone');if(zone)zone.hidden=!signedIn;
}
function installLogoutAll(){
  const panel=q('#firebaseSignIn')?.closest('.cloud-panel');if(!panel||q('#firebaseSignOutAll'))return;
  const zone=document.createElement('div');zone.id='firebaseDangerZone';zone.className='firebase-danger-zone';zone.hidden=true;
  const b=document.createElement('button');b.id='firebaseSignOutAll';b.type='button';b.textContent='Log out from all devices';
  b.addEventListener('click',async()=>{
    b.disabled=true;b.textContent='Logging out…';
    try{await logoutAllDevices();window.BEYOND100_NOTES_TOAST?.('Logged out from all devices')}
    finally{b.disabled=false;b.textContent='Log out from all devices'}
  });
  zone.appendChild(b);panel.appendChild(zone);
  updateDangerVisibility(q('#firebaseAccountCard')?.dataset.state==='connected');
}

function mount(){installPasswordToggle();installMinimiseAndDrag();installInsights();installLogoutAll()}
if(!q('#notesDialog')){const mo=new MutationObserver(()=>{if(q('#notesDialog')){mount();mo.disconnect()}});mo.observe(document.documentElement,{subtree:true,childList:true})}else mount();
window.addEventListener('beyond100-review-status-applied',renderSummary);
window.addEventListener('beyond100-firebase-auth',e=>{mount();updateDangerVisibility(!!e.detail?.signedIn)});
window.addEventListener('storage',e=>{if(e.key===NOTES_KEY)renderSummary()});
setInterval(()=>{if(q('#notesDialog')){mount();renderSummary()}},4000);
startSessionTracking().catch(()=>{});
