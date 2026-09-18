const CLOUD = window.BEYOND100_CLOUD;
let authModulesPromise = null;

function byId(id){ return document.getElementById(id); }
function icon(name){
  const icons={
    firebase:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.1 18.5 7.3 4.7c.1-.6.9-.8 1.3-.3l2.4 4.5 1.8-3.4c.3-.5 1-.5 1.3 0l4.8 9.1-6.9 4.2-6.9-4.3Z"/><path d="m5.1 18.5 6.9 3.1 6.9-7-3.1-2.2-10.7 6.1Z"/></svg>',
    sync:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.1A7 7 0 0 1 18.5 6L20 8"/><path d="M17.9 15.9A7 7 0 0 1 5.5 18L4 16"/></svg>',
    unlink:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/><path d="M3 3l18 18"/></svg>'
  };
  return icons[name]||'';
}

// Native controls are more reliable on iOS than synthetic touch-to-click shims.
function installNativeInteractionHints(){
  document.documentElement.classList.add('native-touch-controls');
}

function toast(message){
  let el=byId('notesToast');
  if(!el){el=document.createElement('div');el.id='notesToast';el.className='notes-toast';el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent=message;el.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1800);
}
window.BEYOND100_NOTES_TOAST=toast;

function ensureHeaderCloudControls(dialog){
  if(byId('notesCloudCompact'))return;
  const actions=dialog.querySelector('.notes-head-actions');if(!actions)return;
  const cluster=document.createElement('div');
  cluster.id='notesCloudCompact';cluster.className='notes-cloud-compact';
  cluster.innerHTML=`
    <span id="firebaseStateIcon" class="state-icon firebase-state" data-state="checking" role="img" aria-label="Checking Firebase" title="Checking Firebase">${icon('firebase')}</span>
    <button id="firebaseSyncIcon" class="state-icon sync-state" type="button" data-state="idle" aria-label="Sync to Firebase" title="Sync to Firebase">${icon('sync')}</button>
  `;
  actions.insertBefore(cluster,actions.firstChild);
  byId('firebaseSyncIcon')?.addEventListener('click',()=>{
    const b=byId('syncNow');
    if(!b||byId('firebaseSyncIcon').disabled)return;
    b.click();
  });
}

function ensureAccountCard(panel){
  if(byId('firebaseAccountCard'))return;
  const summary=panel.querySelector('summary');
  const card=document.createElement('div');card.id='firebaseAccountCard';card.className='firebase-account-card';
  card.innerHTML=`
    <div class="firebase-account-main">
      <span class="firebase-account-flame" aria-hidden="true">${icon('firebase')}</span>
      <div><strong id="firebaseIdentityTitle">Checking Firebase…</strong><span id="firebaseIdentityDetail">Checking saved sign-in</span><small id="firebaseLastSync">Notes save locally immediately.</small></div>
    </div>
    <div class="firebase-account-actions">
      <button id="firebaseCardSync" class="icon-action" type="button" aria-label="Sync to Firebase" title="Sync to Firebase">${icon('sync')}</button>
      <button id="firebaseCardDisconnect" class="icon-action" type="button" aria-label="Disconnect Firebase" title="Disconnect Firebase">${icon('unlink')}</button>
    </div>
  `;
  summary?.insertAdjacentElement('afterend',card);
  byId('firebaseCardSync')?.addEventListener('click',()=>byId('syncNow')?.click());
  byId('firebaseCardDisconnect')?.addEventListener('click',()=>byId('firebaseSignOut')?.click());
}

function syncPresentationFromCloudStatus(){
  const status=byId('cloudStatus');if(!status)return;
  const text=(status.textContent||'').trim();
  const top=byId('firebaseSyncIcon'),card=byId('firebaseCardSync'),last=byId('firebaseLastSync');
  let state='idle',title=text||'Sync to Firebase';
  if(/syncing/i.test(text)){state='syncing';title='Syncing to Firebase';}
  else if(status.dataset.state==='error'||/failed|unavailable|denied|error|offline/i.test(text)){state='error';}
  else if(/synced/i.test(text)){state='synced';}
  [top,card].forEach(el=>{if(!el)return;el.dataset.state=state;el.title=title;el.setAttribute('aria-label',title)});
  if(last){
    if(state==='synced')last.textContent='Synced just now';
    else if(text)last.textContent=text.replace(/^✓\s*/,'');
  }
}

function installFirebasePresentation(){
  const dialog=byId('notesDialog');if(!dialog)return false;
  const signIn=byId('firebaseSignIn');if(!signIn)return false;
  const panel=signIn.closest('details.cloud-panel');if(!panel)return false;

  panel.open=true;panel.classList.add('firebase-panel-fixed','firebase-account-panel');
  const summary=panel.querySelector('summary');
  if(summary){
    summary.textContent='Firebase account';
    summary.setAttribute('aria-disabled','true');
    if(!summary.dataset.fixedOpen){summary.dataset.fixedOpen='1';summary.addEventListener('click',e=>{e.preventDefault();panel.open=true})}
  }
  ensureHeaderCloudControls(dialog);
  ensureAccountCard(panel);

  const cloudStatus=byId('cloudStatus');
  if(cloudStatus&&!cloudStatus.dataset.productUiObserved){
    cloudStatus.dataset.productUiObserved='1';
    new MutationObserver(syncPresentationFromCloudStatus).observe(cloudStatus,{childList:true,subtree:true,characterData:true,attributes:true});
  }
  syncPresentationFromCloudStatus();
  return true;
}

async function authModules(){
  if(authModulesPromise)return authModulesPromise;
  authModulesPromise=Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
  ]);
  return authModulesPromise;
}

function emitAuth(owner,user){
  window.dispatchEvent(new CustomEvent('beyond100-firebase-auth',{detail:{signedIn:owner,email:user?.email||'',uid:user?.uid||''}}));
}

function setIdentity(user){
  installFirebasePresentation();
  const title=byId('firebaseIdentityTitle'),detail=byId('firebaseIdentityDetail');
  const card=byId('firebaseAccountCard'),flame=byId('firebaseStateIcon');
  const email=byId('firebaseEmail'),password=byId('firebasePassword'),signIn=byId('firebaseSignIn');
  const legacySync=byId('syncNow'),legacyOut=byId('firebaseSignOut');
  const topSync=byId('firebaseSyncIcon'),cardSync=byId('firebaseCardSync'),cardOut=byId('firebaseCardDisconnect');
  const owner=!!user&&user.uid===CLOUD?.ownerUid;

  if(owner){
    const label=user.email||'parent account';
    if(title)title.textContent='Firebase signed in';
    if(detail)detail.textContent=label;
    if(card)card.dataset.state='connected';
    if(flame){flame.dataset.state='connected';flame.title=`Firebase signed in as ${label}`;flame.setAttribute('aria-label',flame.title)}
    if(email){email.value=label;email.hidden=true}
    if(password){password.value='';password.hidden=true}
    if(signIn)signIn.hidden=true;
    if(legacySync)legacySync.hidden=true;
    if(legacyOut)legacyOut.hidden=true;
    [topSync,cardSync,cardOut].forEach(x=>{if(x)x.disabled=false});
  }else if(user){
    if(title)title.textContent='Different Firebase account';
    if(detail)detail.textContent=user.email||'Signed in with a different account';
    if(card)card.dataset.state='error';
    if(flame){flame.dataset.state='error';flame.title='Different Firebase account signed in';flame.setAttribute('aria-label',flame.title)}
    if(email){email.hidden=false;email.value=user.email||''}
    if(password)password.hidden=false;
    if(signIn){signIn.hidden=false;signIn.textContent='Sign in with parent account'}
    if(legacySync)legacySync.hidden=true;
    if(legacyOut)legacyOut.hidden=true;
    if(topSync)topSync.disabled=true;if(cardSync)cardSync.disabled=true;if(cardOut)cardOut.disabled=false;
  }else{
    if(title)title.textContent='Firebase not signed in';
    if(detail)detail.textContent='Notes remain safe on this device.';
    if(card)card.dataset.state='signed-out';
    if(flame){flame.dataset.state='signed-out';flame.title='Firebase not signed in';flame.setAttribute('aria-label',flame.title)}
    if(email)email.hidden=false;if(password)password.hidden=false;
    if(signIn){signIn.hidden=false;signIn.textContent='Sign in & sync'}
    if(legacySync)legacySync.hidden=true;if(legacyOut)legacyOut.hidden=true;
    [topSync,cardSync,cardOut].forEach(x=>{if(x)x.disabled=true});
  }
  emitAuth(owner,user);
}

async function watchAuth(){
  try{
    const [A,Auth]=await authModules();
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
    const auth=Auth.getAuth(app);await auth.authStateReady();
    setIdentity(auth.currentUser);Auth.onAuthStateChanged(auth,setIdentity);
  }catch{
    installFirebasePresentation();
    const title=byId('firebaseIdentityTitle'),detail=byId('firebaseIdentityDetail'),flame=byId('firebaseStateIcon');
    if(title)title.textContent='Firebase unavailable';
    if(detail)detail.textContent='Could not initialise Firebase on this device.';
    if(flame){flame.dataset.state='error';flame.title='Firebase unavailable'}
    emitAuth(false,null);
  }
}

function mountWhenReady(){
  if(installFirebasePresentation())return;
  const observer=new MutationObserver(()=>{if(installFirebasePresentation())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

installNativeInteractionHints();
mountWhenReady();
watchAuth();
