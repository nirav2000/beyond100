const REVIEW_LINK_KEY='beyond100.review-link.v2';
const CLOUD=window.BEYOND100_CLOUD;
let sdkPromise=null;

function stored(){try{return JSON.parse(localStorage.getItem(REVIEW_LINK_KEY)||'null')}catch{return null}}
function save(value){if(value)localStorage.setItem(REVIEW_LINK_KEY,JSON.stringify(value));else localStorage.removeItem(REVIEW_LINK_KEY)}
function tokenFrom(url){try{return new URL(url).searchParams.get('token')||''}catch{return ''}}
async function firebase(){
  if(sdkPromise)return sdkPromise;
  sdkPromise=(async()=>{
    const [A,Auth,Fns]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js')
    ]);
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase),auth=Auth.getAuth(app);
    await auth.authStateReady();
    return {auth,Fns,functions:Fns.getFunctions(app,'europe-west2')};
  })();
  return sdkPromise;
}
function css(){
  if(document.querySelector('#reviewLinkV05Styles'))return;
  const s=document.createElement('style');s.id='reviewLinkV05Styles';s.textContent=`
  .review-share-panel{border:1px solid #d7dfc2;background:#f8faef;border-radius:14px;padding:0 12px}
  .review-share-panel summary{padding:12px 0;font-weight:800;cursor:pointer}.review-share-copy{font-size:12px;line-height:1.55;color:#596158}
  .review-share-actions,.review-share-create{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.review-share-actions button,.review-share-create button{border:1px solid #d2d7cf;background:white;border-radius:9px;padding:9px 11px;font-weight:700;font-size:12px;color:#29443b}
  .review-share-create .primary-review{background:#171717;color:white;border-color:#171717}.review-share-url{display:grid;gap:8px;margin:12px 0}.review-share-url input{width:100%;min-height:42px;padding:8px 10px;border:1px solid #d8dad3;border-radius:9px;background:white;font:500 11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace}
  .review-share-status{font-size:11px;line-height:1.5;color:#60685f;margin:8px 0 12px}.review-share-status.error{color:#982f2f;background:#fff0ec;border-radius:9px;padding:9px}.review-share-status.good{color:#245746;background:#edf5ef;border-radius:9px;padding:9px}
  .review-share-warning{font-size:11px;line-height:1.5;color:#765d20;background:#fff8df;border-radius:8px;padding:8px 10px;margin:10px 0}.review-backend-help{font-size:11px;line-height:1.5;background:#f2f3f0;border-radius:9px;padding:9px;margin-top:8px}.review-backend-help code{font-size:10px;overflow-wrap:anywhere}
  `;document.head.appendChild(s);
}
function markup(){return `<details class="cloud-panel review-share-panel" id="reviewSharePanel">
 <summary>Permanent ChatGPT notes link</summary>
 <p class="review-share-copy">Create one private capability URL for this app. It always returns the current notes marked <strong>For review</strong>, so you can paste the same link into ChatGPT again later rather than exporting JSON each time.</p>
 <div class="review-share-create"><button class="primary-review" id="createPermanentReviewLink" type="button">Create permanent link</button><button id="syncReviewNotes" type="button">Sync note statuses</button></div>
 <div class="review-share-url" id="reviewLinkResult" hidden><input id="reviewLinkUrl" readonly aria-label="Permanent ChatGPT notes URL"><div class="review-share-actions"><button id="copyReviewLink" type="button">Copy link</button><button id="openReviewLink" type="button">Open JSON</button><button id="rotateReviewLink" type="button">Replace link</button><button id="revokeReviewLink" type="button">Revoke</button></div><div class="review-share-status good">Permanent until you revoke or replace it. Treat the URL like a password.</div></div>
 <div class="review-share-warning">The link exposes only notes you marked for review. It does not contain your Firebase password or general learning history. Note-status actions remain two-step so a preview cannot accidentally mark work complete.</div>
 <div class="review-share-status" id="reviewLinkStatus"></div>
 </details>`}
function mount(){
  const body=document.querySelector('.notes-body');if(!body||document.querySelector('#reviewSharePanel'))return false;
  css();const w=document.createElement('div');w.innerHTML=markup();const cloud=body.querySelector('.cloud-panel');body.insertBefore(w.firstElementChild,cloud||null);bind();render();return true;
}
function status(text,kind=''){const e=document.querySelector('#reviewLinkStatus');if(!e)return;e.className=`review-share-status ${kind}`;e.innerHTML=text}
function render(){
  const v=stored(),box=document.querySelector('#reviewLinkResult'),input=document.querySelector('#reviewLinkUrl');if(!box)return;
  const usable=v?.url&&(v.permanent===true||!v.expiresAt||Date.parse(v.expiresAt)>Date.now());box.hidden=!usable;if(usable)input.value=v.url;
}
async function ownerFirebase(){const f=await firebase();if(!f.auth.currentUser)throw new Error('Sign in under Firebase sync first.');if(f.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('The configured parent Firebase account is required.');return f}
function explainError(e){
  const code=String(e?.code||''),message=String(e?.message||'');
  if(code.includes('not-found')||code.includes('internal')||code.includes('unavailable')||/not found|internal|unavailable/i.test(message))return `The review-link backend is not live yet. Your Notes/Firebase sync still works. For now use <strong>Copy review pack</strong>. One Firebase Functions deployment will enable this permanent link.<div class="review-backend-help"><code>npx firebase-tools deploy --only functions:createBeyond100ReviewLink,functions:revokeBeyond100ReviewLink,functions:beyond100Review --project kk-syllabus</code></div>`;
  return message||'Could not create the review link.';
}
async function createPermanent(replace=false){
  try{
    status(replace?'Replacing permanent link…':'Creating permanent link…');
    const current=stored();
    if(replace&&current?.url){try{await revoke(false)}catch{}}
    const f=await ownerFirebase(),call=f.Fns.httpsCallable(f.functions,'createBeyond100ReviewLink'),result=(await call({permanent:true})).data;
    save({url:result.url,permanent:true,expiresAt:null,createdAt:new Date().toISOString()});render();status('Permanent review link ready. You can reuse this same URL whenever you ask ChatGPT to check Beyond 100 notes.','good');
  }catch(e){status(explainError(e),'error')}
}
async function revoke(show=true){
  const v=stored();if(!v?.url)return;
  const token=tokenFrom(v.url);if(!token)throw new Error('Saved review link is invalid.');
  const f=await ownerFirebase(),call=f.Fns.httpsCallable(f.functions,'revokeBeyond100ReviewLink');await call({token});save(null);render();if(show)status('Permanent link revoked.','good');
}
async function copy(){const u=stored()?.url;if(!u)return;try{await navigator.clipboard.writeText(u);status('Permanent link copied.','good')}catch{status('Select the URL and copy it manually.','error')}}
function openJson(){const u=stored()?.url;if(u)window.open(u,'_blank','noopener,noreferrer')}
function syncStatuses(){const b=document.querySelector('#syncNow');if(b){b.click();status('Refreshing note statuses from Firebase…')}else status('Firebase sync is not available yet.','error')}
function bind(){
  document.querySelector('#createPermanentReviewLink').onclick=()=>createPermanent(false);
  document.querySelector('#rotateReviewLink').onclick=()=>createPermanent(true);
  document.querySelector('#revokeReviewLink').onclick=()=>revoke(true).catch(e=>status(explainError(e),'error'));
  document.querySelector('#copyReviewLink').onclick=copy;document.querySelector('#openReviewLink').onclick=openJson;document.querySelector('#syncReviewNotes').onclick=syncStatuses;
}
if(!mount()){const o=new MutationObserver(()=>{if(mount())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}
