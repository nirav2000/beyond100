const CLOUD = window.BEYOND100_CLOUD;
const touchStarts = new WeakMap();
let authModulesPromise = null;

function byId(id){ return document.getElementById(id); }

function installTouchReliability(){
  // iOS can occasionally swallow the first synthetic click on dynamically
  // inserted controls. Convert a short, stationary touch into one explicit
  // click and suppress the delayed compatibility click.
  document.addEventListener('touchstart', e => {
    const control = e.target.closest?.('#notesButton,#annotateButton,.notes-dialog button,.notes-dialog summary');
    if(!control || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStarts.set(control,{x:t.clientX,y:t.clientY});
  },{passive:true,capture:true});

  document.addEventListener('touchend', e => {
    const control = e.target.closest?.('#notesButton,#annotateButton,.notes-dialog button');
    if(!control) return;
    const start = touchStarts.get(control);
    const t = e.changedTouches?.[0];
    touchStarts.delete(control);
    if(!start || !t || Math.abs(t.clientX-start.x)>12 || Math.abs(t.clientY-start.y)>12) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    control.click();
  },{passive:false,capture:true});

  // Guard against a rapid second activation of showModal().
  document.addEventListener('click', e => {
    if(!e.target.closest?.('#notesButton')) return;
    const dialog = byId('notesDialog');
    if(dialog?.open){ e.preventDefault(); e.stopImmediatePropagation(); }
  },true);
}

function installFirebasePresentation(){
  const dialog = byId('notesDialog');
  if(!dialog) return false;
  const signIn = byId('firebaseSignIn');
  if(!signIn) return false;
  const panel = signIn.closest('details.cloud-panel');
  if(!panel) return false;

  panel.open = true;
  panel.classList.add('firebase-panel-fixed');
  const summary = panel.querySelector('summary');
  if(summary){
    summary.textContent = 'Firebase connection';
    summary.setAttribute('aria-disabled','true');
    summary.addEventListener('click',e=>e.preventDefault());
  }

  if(!byId('firebaseIdentityCard')){
    const card = document.createElement('div');
    card.id='firebaseIdentityCard';
    card.className='firebase-identity-card';
    card.innerHTML=`<span class="firebase-identity-dot" aria-hidden="true"></span><div><strong id="firebaseIdentityTitle">Checking Firebase…</strong><span id="firebaseIdentityDetail">Checking saved sign-in</span></div>`;
    summary?.insertAdjacentElement('afterend',card);
  }

  if(!byId('firebaseSyncDetail')){
    const p=document.createElement('p');
    p.id='firebaseSyncDetail';
    p.className='firebase-sync-detail';
    p.textContent=byId('cloudStatus')?.textContent||'';
    byId('firebaseIdentityCard')?.insertAdjacentElement('afterend',p);
  }

  if(!byId('firebaseLoginBadge')){
    const badge=document.createElement('span');
    badge.id='firebaseLoginBadge';
    badge.className='firebase-login-badge';
    badge.textContent='Firebase: checking…';
    const headActions=dialog.querySelector('.notes-head-actions');
    headActions?.insertBefore(badge,byId('cloudStatus')||headActions.firstChild);
  }

  if(!byId('notesFirebaseDot')){
    const dot=document.createElement('span');
    dot.id='notesFirebaseDot';
    dot.className='notes-firebase-dot';
    dot.setAttribute('aria-hidden','true');
    byId('notesButton')?.appendChild(dot);
  }

  const cloudStatus=byId('cloudStatus');
  if(cloudStatus && !cloudStatus.dataset.identityObserved){
    cloudStatus.dataset.identityObserved='1';
    const sync=()=>{ const el=byId('firebaseSyncDetail'); if(el) el.textContent=cloudStatus.textContent||''; };
    new MutationObserver(sync).observe(cloudStatus,{childList:true,subtree:true,characterData:true,attributes:true});
    sync();
  }
  return true;
}

async function authModules(){
  if(authModulesPromise) return authModulesPromise;
  authModulesPromise = Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
  ]);
  return authModulesPromise;
}

function setIdentity(user){
  installFirebasePresentation();
  const title=byId('firebaseIdentityTitle');
  const detail=byId('firebaseIdentityDetail');
  const card=byId('firebaseIdentityCard');
  const badge=byId('firebaseLoginBadge');
  const dot=byId('notesFirebaseDot');
  const email=byId('firebaseEmail');
  const password=byId('firebasePassword');
  const signIn=byId('firebaseSignIn');
  const sync=byId('syncNow');
  const signOut=byId('firebaseSignOut');
  const owner = !!user && user.uid === CLOUD?.ownerUid;

  if(owner){
    const label=user.email||'parent account';
    if(title) title.textContent='Firebase signed in';
    if(detail) detail.textContent=label;
    if(card) card.dataset.state='connected';
    if(badge){badge.dataset.state='connected';badge.textContent='● Firebase signed in';badge.title=label;}
    if(dot){dot.dataset.state='connected';dot.title=`Firebase signed in: ${label}`;}
    if(email){email.value=label;email.hidden=true;}
    if(password){password.value='';password.hidden=true;}
    if(signIn) signIn.hidden=true;
    if(sync) sync.hidden=false;
    if(signOut) signOut.hidden=false;
  }else if(user){
    if(title) title.textContent='Different Firebase account';
    if(detail) detail.textContent=user.email||'Signed in with a different account';
    if(card) card.dataset.state='error';
    if(badge){badge.dataset.state='error';badge.textContent='● Wrong Firebase account';}
    if(dot){dot.dataset.state='error';dot.title='Different Firebase account signed in';}
    if(email){email.hidden=false;email.value=user.email||'';}
    if(password) password.hidden=false;
    if(signIn){signIn.hidden=false;signIn.textContent='Sign in with parent account';}
    if(sync) sync.hidden=true;
    if(signOut) signOut.hidden=false;
  }else{
    if(title) title.textContent='Firebase not signed in';
    if(detail) detail.textContent='Notes are safe on this device; sign in to sync them.';
    if(card) card.dataset.state='signed-out';
    if(badge){badge.dataset.state='signed-out';badge.textContent='○ Firebase signed out';badge.title='Notes are currently local only';}
    if(dot){dot.dataset.state='signed-out';dot.title='Firebase signed out';}
    if(email) email.hidden=false;
    if(password) password.hidden=false;
    if(signIn){signIn.hidden=false;signIn.textContent='Sign in & sync';}
    if(sync) sync.hidden=true;
    if(signOut) signOut.hidden=true;
  }
}

async function watchAuth(){
  try{
    const [A,Auth]=await authModules();
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
    const auth=Auth.getAuth(app);
    await auth.authStateReady();
    setIdentity(auth.currentUser);
    Auth.onAuthStateChanged(auth,setIdentity);
  }catch(e){
    installFirebasePresentation();
    const title=byId('firebaseIdentityTitle');
    const detail=byId('firebaseIdentityDetail');
    const badge=byId('firebaseLoginBadge');
    if(title) title.textContent='Firebase unavailable';
    if(detail) detail.textContent='Could not initialise Firebase on this device.';
    if(badge){badge.dataset.state='error';badge.textContent='● Firebase unavailable';}
  }
}

function mountWhenReady(){
  if(installFirebasePresentation()) return;
  const observer=new MutationObserver(()=>{ if(installFirebasePresentation()) observer.disconnect(); });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

installTouchReliability();
mountWhenReady();
watchAuth();
