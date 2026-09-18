const REVIEW_FEED_STORAGE='beyond100.review-feed.v1';
const NOTES_STORAGE='beyond100.notes.v1';
const COLLECTION='beyond100_review_feeds';
const STATUS_FILE='review-status.json';
const CLOUD=window.BEYOND100_CLOUD;
const ACCOUNT_CONFIG_DOC='beyond100-review-config';
let sdkPromise=null,lastPublished='',statusSyncing=false;

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
      return {...local,id,createdAt:local?.createdAt||snap.data().createdAt||new Date().toISOString()};
    }
  }catch{}
  if(local?.id){
    await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:local.id,createdAt:local.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()},{merge:true});
    return local;
  }
  const meta={id:randomId(),createdAt:new Date().toISOString()};
  saveFeedMeta(meta);
  await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:meta.id,createdAt:meta.createdAt,updatedAt:new Date().toISOString()},{merge:true});
  return meta;
}
async function setAccountFeed(value){
  const f=await firebase();if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Sign in under Firebase sync first.');
  const id=parseFeedId(value);if(!id)throw new Error('Paste a valid Beyond 100 review JSON link or feed ID.');
  const meta={...(feedMeta()||{}),id,createdAt:feedMeta()?.createdAt||new Date().toISOString()};
  saveFeedMeta(meta);
  await f.F.setDoc(configRef(f),{app:'beyond100',kind:'review-config',feedId:id,createdAt:meta.createdAt,updatedAt:new Date().toISOString()},{merge:true});
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
function mount(){
  const body=document.querySelector('.notes-body');if(!body||document.querySelector('#staticReviewFeedPanel'))return false;
  const el=document.createElement('details');el.className='cloud-panel';el.id='staticReviewFeedPanel';el.open=true;el.innerHTML=`<summary>Permanent ChatGPT review feed</summary><p class="muted">Use the JSON link with ChatGPT. The human review page is for opening in Safari. While you are signed into Firebase, Beyond 100 keeps the limited review snapshot up to date and pulls completed-note statuses back from GitHub.</p><div class="cloud-form"><label class="muted">ChatGPT JSON link</label><input id="staticReviewRawUrl" readonly placeholder="Create / publish first"><label class="muted">Human review page</label><input id="staticReviewPageUrl" readonly placeholder="Create / publish first"><label class="muted">Account bridge link (private)</label><input id="accountReviewFeedInput" placeholder="Paste the existing ChatGPT JSON link once to link all devices"><div class="cloud-actions"><button id="createStaticReview" type="button">Create / publish</button><button id="copyStaticReview" type="button">Copy ChatGPT link</button><button id="openStaticReview" type="button">Open review page</button><button id="syncReviewStatuses" type="button">Sync statuses</button><button id="setAccountReviewFeed" type="button">Link this account feed</button><button id="replaceStaticReview" type="button">Republish</button></div><p class="muted" id="staticReviewStatus"></p></div>`;
  const firebasePanel=[...body.querySelectorAll('.cloud-panel')].find(x=>x!==el);body.insertBefore(el,firebasePanel||null);
  el.querySelector('#createStaticReview').onclick=()=>publish(true).then(ok=>setStatus(ok?'Published current review notes.':'Sign in under Firebase sync first.')).catch(e=>setStatus(e.message));
  el.querySelector('#copyStaticReview').onclick=async()=>{const id=feedMeta()?.id;if(!id)return;try{await navigator.clipboard.writeText(rawUrl(id));setStatus('ChatGPT JSON link copied.')}catch{}};
  el.querySelector('#openStaticReview').onclick=()=>{const u=feedMeta()?.url;if(u)window.open(u,'_blank','noopener,noreferrer')};
  el.querySelector('#syncReviewStatuses').onclick=()=>applyStatusLedger().then(changed=>setStatus(changed?'Review statuses applied.':'No newer review statuses found.'));
  el.querySelector('#setAccountReviewFeed').onclick=()=>setAccountFeed(el.querySelector('#accountReviewFeedInput').value).then(()=>setStatus('Account review feed linked and published.')).catch(e=>setStatus(e.message));
  el.querySelector('#replaceStaticReview').onclick=()=>replaceFeed().then(()=>setStatus('Permanent review feed republished.')).catch(e=>setStatus(e.message));renderPanel();return true;
}
function setStatus(t){const el=document.querySelector('#staticReviewStatus');if(el)el.textContent=t||''}
function renderPanel(){const raw=document.querySelector('#staticReviewRawUrl'),page=document.querySelector('#staticReviewPageUrl');if(!raw||!page)return;const meta=feedMeta();raw.value=meta?.id?rawUrl(meta.id):'';page.value=meta?.id?pageUrl(meta.id):'';setStatus(meta?.lastPublishedAt?`Review feed ✓ · ${pendingNotes().length} pending · published ${new Date(meta.lastPublishedAt).toLocaleString('en-GB')}. Firebase note sync is shown separately above.`:`Review feed ready · ${pendingNotes().length} pending. Firebase note sync is shown separately above.`)}
if(!mount()){const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(document.documentElement,{subtree:true,childList:true})}
async function cycle(){await applyStatusLedger();await publish(false)}
setInterval(()=>cycle().catch(()=>{}),5000);window.addEventListener('focus',()=>cycle().catch(()=>{}));window.addEventListener('online',()=>cycle().catch(()=>{}));cycle().catch(()=>{});
