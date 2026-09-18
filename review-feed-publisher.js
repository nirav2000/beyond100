const REVIEW_FEED_STORAGE='beyond100.review-feed.v1';
const NOTES_STORAGE='beyond100.notes.v1';
const COLLECTION='beyond100_review_feeds';
const STATUS_FILE='review-status.json';
const CLOUD=window.BEYOND100_CLOUD;
const ACCOUNT_CONFIG_DOC='beyond100-review-config';
let sdkPromise=null,lastPublished='',statusSyncing=false,accountFeedLinked=false,reviewSignedIn=false;

function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function saveFeedMeta(value){localStorage.setItem(REVIEW_FEED_STORAGE,JSON.stringify(value))}
function feedMeta(){return loadJson(REVIEW_FEED_STORAGE,null)}
function randomId(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function pendingNotes(){return loadJson(NOTES_STORAGE,[]).filter(n=>n&&n.reviewRequired!==false&&n.status!=='archived'&&n.status!=='actioned').map(n=>({id:n.id||'',status:n.status||'open',text:n.text||'',anchorId:n.anchorId||'',anchorLabel:n.anchorLabel||'',selectedText:n.selectedText||'',elementText:n.elementText||'',topic:n.topic||'',section:n.section||'',page:n.page||'',version:n.version||'',createdAt:n.createdAt||null,updatedAt:n.updatedAt||null}))}
function appVersion(){return window.BEYOND100_RELEASES?.currentVersion||window.BEYOND100_DATA?.meta?.version||'0.0.0'}
function pageUrl(id){return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}review.html#${id}`}
function rawUrl(id){const project=CLOUD?.firebase?.projectId||'kk-syllabus',key=CLOUD?.firebase?.apiKey||'';return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/%28default%29/documents/${COLLECTION}/${encodeURIComponent(id)}${key?`?key=${encodeURIComponent(key)}`:''}`}
async function firebase(){
  if(sdkPromise)return sdkPromise;
  sdkPromise=(async()=>{const [A,Auth,F]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase),auth=Auth.getAuth(app);await auth.authStateReady();return {auth,F,db:F.getFirestore(app)}})();return sdkPromise;
}
function cloudBase(){return CLOUD.firestoreBase||['families',CLOUD.ownerUid,'learners',CLOUD.learnerId,'progress']}
function configRef(f){return f.F.doc(f.db,...cloudBase(),ACCOUNT_CONFIG_DOC)}
function parseFeedId(value=''){
  const text=String(value).trim();
  const hash=text.match(/#([A-Za-z0-9_-]{40,120})$/)?.[1];if(hash)return hash;
  const path=text.match(/beyond100_review_feeds\/([A-Za-z0-9_-]{40,120})/)?.[1];if(path)return path;
  return /^[A-Za-z0-9_-]{40,120}$/.test(text)?text:null;
}
async function accountFeedMeta(f){
  const local=feedMeta();
  try{
    const snap=await f.F.getDoc(configRef(f));
    if(snap.exists()&&parseFeedId(snap.data()?.feedId)){
      const id=parseFeedId(snap.data().feedId);
      if(local?.id!==id)saveFeedMeta({...local,id});
      accountFeedLinked=true;
      return {...local,id,createdAt:local?.createdAt||snap.data().createdAt||new Date().toISOString()};
    }
  }catch{}
  if(local?.id){
    await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:local.id,createdAt:local.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()},{merge:true});
    accountFeedLinked=true;
    return local;
  }
  const meta={id:randomId(),createdAt:new Date().toISOString()};
  saveFeedMeta(meta);
  await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:meta.id,createdAt:meta.createdAt,updatedAt:new Date().toISOString()},{merge:true});
  accountFeedLinked=true;
  return meta;
}
async function setAccountFeed(value){
  const f=await firebase();if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Sign in under Firebase sync first.');
  const id=parseFeedId(value);if(!id)throw new Error('Paste a valid Beyond 100 review JSON link or feed ID.');
  const meta={...(feedMeta()||{}),id,createdAt:feedMeta()?.createdAt||new Date().toISOString()};
  saveFeedMeta(meta);
  await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:id,createdAt:meta.createdAt,updatedAt:new Date().toISOString()},{merge:true});
  accountFeedLinked=true;
  lastPublished='';await publish(true);renderPanel();
}
function hashFeed(notes){return JSON.stringify(notes.map(n=>[n.id,n.updatedAt,n.status,n.text,n.anchorId]))}
function normalizedText(value=''){return String(value).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim()}
function ledgerDecision(ledger,note){
  const byId=ledger?.notes?.[note.id];if(byId)return byId;
  const text=normalizedText(note.text);
  return (ledger?.matches||[]).find(m=>{
    if(m.anchorId&&m.anchorId!==note.anchorId)return false;
    if(m.text&&normalizedText(m.text)!==text)return false;
    if(m.contains&&!text.includes(normalizedText(m.contains)))return false;
    return !!(m.text||m.contains);
  })||null;
}
async function publish(force=false){
  const f=await firebase();if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)return false;
  let meta=await accountFeedMeta(f);if(!meta?.createdAt){meta={...meta,createdAt:new Date().toISOString()};saveFeedMeta(meta)}
  const notes=pendingNotes(),signature=hashFeed(notes);if(!force&&signature===lastPublished)return true;
  const payload={app:'beyond100',schema:'beyond100-static-review-v1',repository:'nirav2000/beyond100',version:appVersion(),updatedAt:new Date().toISOString(),createdAt:meta.createdAt||new Date().toISOString(),pendingCount:notes.length,notes};
  await f.F.setDoc(f.F.doc(f.db,COLLECTION,meta.id),payload,{merge:false});lastPublished=signature;saveFeedMeta({...meta,lastPublishedAt:payload.updatedAt,url:pageUrl(meta.id),rawUrl:rawUrl(meta.id)});renderPanel();return true;
}
async function applyStatusLedger(){
  if(statusSyncing)return;statusSyncing=true;
  try{
    const f=await firebase();if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)return false;
    const response=await fetch(`${STATUS_FILE}?v=${Date.now()}`,{cache:'no-store'});if(!response.ok)return false;
    const ledger=await response.json();if(ledger?.schema!=='beyond100-review-status-v1'||!ledger.notes||typeof ledger.notes!=='object')return false;
    const notes=loadJson(NOTES_STORAGE,[]);let changed=false;const writes=[];
    for(const note of notes){
      const decision=ledgerDecision(ledger,note);if(!decision?.status||!decision.updatedAt)continue;
      const localStamp=Date.parse(note.reviewStatusUpdatedAt||note.updatedAt||0),remoteStamp=Date.parse(decision.updatedAt||0);if(!Number.isFinite(remoteStamp)||remoteStamp<=localStamp)continue;
      note.status=decision.status;note.reviewStatusUpdatedAt=decision.updatedAt;note.reviewStatusUpdatedVia='github-review-status';note.updatedAt=decision.updatedAt;
      if(decision.status==='actioned'){note.reviewRequired=false;note.actionedAt=decision.updatedAt}else{note.reviewRequired=true;delete note.actionedAt}
      if(decision.message)note.reviewStatusMessage=decision.message;if(decision.commit)note.reviewStatusCommit=decision.commit;changed=true;
      writes.push(f.F.setDoc(f.F.doc(f.db,...cloudBase(),`beyond100-note-${note.id}`),{app:CLOUD.appId||'beyond100',kind:'note',noteId:note.id,updatedAt:note.updatedAt,value:note},{merge:true}));
    }
    if(changed){localStorage.setItem(NOTES_STORAGE,JSON.stringify(notes));await Promise.all(writes);window.dispatchEvent(new CustomEvent('beyond100-review-status-applied'));lastPublished='';await publish(true);setStatus('Review statuses synced from GitHub.');}
    return changed;
  }catch{return false}finally{statusSyncing=false}
}
async function replaceFeed(){lastPublished='';await publish(true)}
async function revokeFeed(){throw new Error('Account-level review feeds are permanent. Rotate the bridge link instead if needed.')}
function reviewIcon(name){
  const icons={
    copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="10" height="10" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
    open:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>'
  };
  return icons[name]||'';
}
function reviewToast(text){window.BEYOND100_NOTES_TOAST?.(text)}
function setReviewControlsEnabled(signedIn){
  reviewSignedIn=!!signedIn;
  ['refreshStaticReview','syncReviewStatuses'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!reviewSignedIn});
  renderPanel();
}
async function copyReviewLink(){
  const id=feedMeta()?.id;if(!id)return;
  try{await navigator.clipboard.writeText(rawUrl(id));reviewToast('Review link copied');setStatus('Review link copied.')}
  catch{setStatus('Could not copy the review link.')}
}
function mount(){
  const body=document.querySelector('.notes-body');if(!body||document.querySelector('#staticReviewFeedPanel'))return false;
  const el=document.createElement('details');el.className='cloud-panel review-feed-panel';el.id='staticReviewFeedPanel';el.open=true;
  el.innerHTML=`<summary>Review feed</summary>
    <p class="muted review-feed-intro">Only notes marked for review are included. The same review link is shared across your signed-in devices.</p>
    <div class="review-link-list">
      <label class="review-link-row"><span>Review link for ChatGPT</span><div class="review-link-field"><input id="staticReviewRawUrl" readonly placeholder="Create review link first"><button id="copyStaticReview" class="field-icon-button" type="button" aria-label="Copy review link" title="Copy review link">${reviewIcon('copy')}</button></div></label>
      <label class="review-link-row"><span>Review page</span><div class="review-link-field"><input id="staticReviewPageUrl" readonly placeholder="Create review link first"><button id="openStaticReview" class="field-icon-button" type="button" aria-label="Open review page in browser" title="Open review page in browser">${reviewIcon('open')}</button></div></label>
    </div>
    <div class="review-feed-actions"><button id="refreshStaticReview" type="button">Create review link</button><button id="syncReviewStatuses" type="button">Check reviewed notes</button></div>
    <p class="muted" id="staticReviewStatus" role="status"></p>
    <details class="bridge-setup-help"><summary>Bridge setup</summary><p class="muted">For the GitHub bridge, copy the review link above into the <b>FBNOTES</b> Actions secret. This is separate from ordinary Firebase notes sync.</p></details>`;
  const firebasePanel=[...body.querySelectorAll('.cloud-panel')].find(x=>x!==el&&x.querySelector('#firebaseSignIn'));body.insertBefore(el,firebasePanel||null);
  el.querySelector('#refreshStaticReview').onclick=()=>publish(true).then(ok=>{setStatus(ok?'Review link refreshed.':'Sign in to Firebase first.');if(ok)reviewToast('Review link refreshed')}).catch(e=>setStatus(e.message));
  el.querySelector('#copyStaticReview').onclick=copyReviewLink;
  el.querySelector('#openStaticReview').onclick=()=>{const id=feedMeta()?.id;if(id)window.open(pageUrl(id),'_blank','noopener,noreferrer')};
  el.querySelector('#syncReviewStatuses').onclick=()=>applyStatusLedger().then(changed=>{setStatus(changed?'Reviewed-note statuses updated.':'No newer reviewed-note statuses found.');reviewToast(changed?'Reviewed notes updated':'No new reviewed-note statuses')});
  setReviewControlsEnabled(document.querySelector('#firebaseAccountCard')?.dataset.state==='connected');
  renderPanel();return true;
}
function setStatus(t){
  const el=document.querySelector('#staticReviewStatus');if(el)el.textContent=t||'';
}
function renderPanel(){
  const raw=document.querySelector('#staticReviewRawUrl'),page=document.querySelector('#staticReviewPageUrl');if(!raw||!page)return;
  const meta=feedMeta(),hasLink=!!meta?.id;
  raw.value=hasLink?rawUrl(meta.id):'';page.value=hasLink?pageUrl(meta.id):'';
  const refresh=document.querySelector('#refreshStaticReview');if(refresh)refresh.textContent=hasLink?'Refresh review link':'Create review link';
  const copy=document.querySelector('#copyStaticReview'),open=document.querySelector('#openStaticReview');
  if(copy)copy.disabled=!hasLink;if(open)open.disabled=!hasLink;
  ['refreshStaticReview','syncReviewStatuses'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!reviewSignedIn});
  const account=accountFeedLinked?' · account link ready':'';
  setStatus(meta?.lastPublishedAt?`Review feed ready${account} · ${pendingNotes().length} pending · refreshed ${new Date(meta.lastPublishedAt).toLocaleString('en-GB')}.`:`Review feed ${hasLink?'ready':'not created'}${account} · ${pendingNotes().length} pending.`);
}
if(!mount()){const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(document.documentElement,{subtree:true,childList:true})}
window.addEventListener('beyond100-firebase-auth',e=>setReviewControlsEnabled(!!e.detail?.signedIn));
async function cycle(){await applyStatusLedger();await publish(false)}
setInterval(()=>cycle().catch(()=>{}),5000);window.addEventListener('focus',()=>cycle().catch(()=>{}));window.addEventListener('online',()=>cycle().catch(()=>{}));cycle().catch(()=>{});