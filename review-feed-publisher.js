const REVIEW_FEED_STORAGE='beyond100.review-feed.v1';
const NOTES_STORAGE='beyond100.notes.v1';
const COLLECTION='beyond100_review_feeds';
const CLOUD=window.BEYOND100_CLOUD;
let sdkPromise=null,lastPublished='';

function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function saveFeedMeta(value){localStorage.setItem(REVIEW_FEED_STORAGE,JSON.stringify(value))}
function feedMeta(){return loadJson(REVIEW_FEED_STORAGE,null)}
function randomId(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function pendingNotes(){
  return loadJson(NOTES_STORAGE,[]).filter(n=>n&&n.reviewRequired!==false&&n.status!=='archived'&&n.status!=='actioned').map(n=>({
    id:n.id||'',status:n.status||'open',text:n.text||'',anchorId:n.anchorId||'',anchorLabel:n.anchorLabel||'',selectedText:n.selectedText||'',elementText:n.elementText||'',topic:n.topic||'',section:n.section||'',page:n.page||'',version:n.version||'',createdAt:n.createdAt||null,updatedAt:n.updatedAt||null
  }));
}
function appVersion(){return window.BEYOND100_RELEASES?.currentVersion||window.BEYOND100_DATA?.meta?.version||'0.0.0'}
function pageUrl(id){return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}review.html#${id}`}
function rawUrl(id){
  const project=CLOUD?.firebase?.projectId||'kk-syllabus',key=CLOUD?.firebase?.apiKey||'';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(id)}${key?`?key=${encodeURIComponent(key)}`:''}`;
}
async function firebase(){
  if(sdkPromise)return sdkPromise;
  sdkPromise=(async()=>{
    const [A,Auth,F]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]);
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase),auth=Auth.getAuth(app);await auth.authStateReady();return {auth,F,db:F.getFirestore(app)};
  })();return sdkPromise;
}
function hashFeed(notes){return JSON.stringify(notes.map(n=>[n.id,n.updatedAt,n.status,n.reviewRequired,n.text,n.anchorId]))}
async function publish(force=false){
  const f=await firebase();
  if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)return false;
  let meta=feedMeta();if(!meta?.id){meta={id:randomId(),createdAt:new Date().toISOString()};saveFeedMeta(meta)}
  const notes=pendingNotes(),signature=hashFeed(notes);if(!force&&signature===lastPublished)return true;
  const payload={app:'beyond100',schema:'beyond100-static-review-v1',repository:'nirav2000/beyond100',version:appVersion(),updatedAt:new Date().toISOString(),createdAt:meta.createdAt||new Date().toISOString(),pendingCount:notes.length,notes};
  await f.F.setDoc(f.F.doc(f.db,COLLECTION,meta.id),payload,{merge:false});
  lastPublished=signature;saveFeedMeta({...meta,lastPublishedAt:payload.updatedAt,url:pageUrl(meta.id),rawUrl:rawUrl(meta.id)});renderPanel();return true;
}
async function replaceFeed(){
  const f=await firebase(),old=feedMeta();if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Sign in under Firebase sync first.');
  if(old?.id){try{await f.F.deleteDoc(f.F.doc(f.db,COLLECTION,old.id))}catch{}}
  saveFeedMeta({id:randomId(),createdAt:new Date().toISOString()});lastPublished='';await publish(true);
}
async function revokeFeed(){
  const f=await firebase(),meta=feedMeta();if(!meta?.id)return;if(!f.auth.currentUser||f.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Sign in under Firebase sync first.');
  try{await f.F.deleteDoc(f.F.doc(f.db,COLLECTION,meta.id))}catch{}localStorage.removeItem(REVIEW_FEED_STORAGE);lastPublished='';renderPanel();
}
function mount(){
  const body=document.querySelector('.notes-body');if(!body||document.querySelector('#staticReviewFeedPanel'))return false;
  const el=document.createElement('details');el.className='cloud-panel';el.id='staticReviewFeedPanel';el.open=true;el.innerHTML=`<summary>Permanent ChatGPT review page</summary><p class="muted">One reusable GitHub Pages link. While you are signed into Firebase, Beyond 100 keeps its limited review snapshot up to date.</p><div class="cloud-form"><input id="staticReviewUrl" readonly placeholder="Create the review page first"><div class="cloud-actions"><button id="createStaticReview" type="button">Create / publish</button><button id="copyStaticReview" type="button">Copy link</button><button id="openStaticReview" type="button">Open</button><button id="replaceStaticReview" type="button">Replace</button><button id="revokeStaticReview" type="button">Revoke</button></div><p class="muted" id="staticReviewStatus"></p></div>`;
  const firebasePanel=[...body.querySelectorAll('.cloud-panel')].find(x=>x!==el);body.insertBefore(el,firebasePanel||null);
  el.querySelector('#createStaticReview').onclick=()=>publish(true).then(ok=>setStatus(ok?'Published current review notes.':'Sign in under Firebase sync first.')).catch(e=>setStatus(e.message));
  el.querySelector('#copyStaticReview').onclick=async()=>{const u=feedMeta()?.url;if(!u)return;try{await navigator.clipboard.writeText(u);setStatus('Review link copied.')}catch{}};
  el.querySelector('#openStaticReview').onclick=()=>{const u=feedMeta()?.url;if(u)window.open(u,'_blank','noopener,noreferrer')};
  el.querySelector('#replaceStaticReview').onclick=()=>replaceFeed().then(()=>setStatus('Permanent review link replaced.')).catch(e=>setStatus(e.message));
  el.querySelector('#revokeStaticReview').onclick=()=>revokeFeed().then(()=>setStatus('Review link revoked.')).catch(e=>setStatus(e.message));
  renderPanel();return true;
}
function setStatus(t){const el=document.querySelector('#staticReviewStatus');if(el)el.textContent=t||''}
function renderPanel(){const input=document.querySelector('#staticReviewUrl');if(!input)return;const meta=feedMeta();input.value=meta?.url||'';setStatus(meta?.lastPublishedAt?`Last published ${new Date(meta.lastPublishedAt).toLocaleString('en-GB')}. Treat this URL like a password.`:'')}

if(!mount()){const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(document.documentElement,{subtree:true,childList:true})}
setInterval(()=>publish(false).catch(()=>{}),4000);
window.addEventListener('focus',()=>publish(false).catch(()=>{}));
window.addEventListener('online',()=>publish(false).catch(()=>{}));
