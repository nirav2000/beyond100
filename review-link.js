const REVIEW_LINK_KEY='beyond100.review-link.v1';
const CLOUD=window.BEYOND100_CLOUD;
let sdkPromise=null;

function stored(){
  try{return JSON.parse(localStorage.getItem(REVIEW_LINK_KEY)||'null')}catch{return null}
}
function save(value){
  if(value)localStorage.setItem(REVIEW_LINK_KEY,JSON.stringify(value));
  else localStorage.removeItem(REVIEW_LINK_KEY);
}
function fmt(value){
  try{return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return value||''}
}
function tokenFrom(url){
  try{return new URL(url).searchParams.get('token')||''}catch{return ''}
}
async function firebase(){
  if(sdkPromise)return sdkPromise;
  sdkPromise=(async()=>{
    const [A,Auth,Fns]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js')
    ]);
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
    const auth=Auth.getAuth(app);
    await auth.authStateReady();
    const functions=Fns.getFunctions(app,'europe-west2');
    return {app,auth,Fns,functions};
  })();
  return sdkPromise;
}
function css(){
  if(document.querySelector('#reviewLinkStyles'))return;
  const style=document.createElement('style');
  style.id='reviewLinkStyles';
  style.textContent=`
    .review-share-panel{border:1px solid #d9dfc4;background:#f8faef}
    .review-share-panel summary{font-weight:800}
    .review-share-copy{font-size:12px;line-height:1.5;color:#5f6558;margin:8px 0 12px}
    .review-share-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
    .review-share-controls label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#65695f}
    .review-share-controls select{min-height:38px}
    .review-share-url{margin-top:12px;display:grid;gap:8px}
    .review-share-url input{width:100%;min-height:40px;padding:8px 10px;border:1px solid #d8dad3;border-radius:9px;background:white;font-size:11px}
    .review-share-actions{display:flex;gap:7px;flex-wrap:wrap}
    .review-share-actions button,.review-share-controls button{border:1px solid #d2d4cd;background:white;border-radius:9px;padding:8px 10px;font-weight:700;font-size:12px}
    .review-share-controls button{background:#171717;color:white;border-color:#171717}
    .review-share-status{font-size:11px;color:#65695f;margin-top:8px}
    .review-share-warning{font-size:11px;line-height:1.45;color:#765d20;background:#fff8df;border-radius:8px;padding:8px 10px;margin-top:10px}
  `;
  document.head.appendChild(style);
}
function panelMarkup(){
  return `<details class="cloud-panel review-share-panel" id="reviewSharePanel">
    <summary>ChatGPT review link</summary>
    <p class="review-share-copy">Create an expiring private URL containing only notes marked for review. The URL can be opened directly by ChatGPT and includes narrowly scoped, two-step actions for updating each note's review status.</p>
    <div class="review-share-controls">
      <label>Expires after<select id="reviewLinkDays"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
      <button id="createReviewLink" type="button">Create review link</button>
      <button id="refreshReviewNotes" type="button">Sync note statuses</button>
    </div>
    <div class="review-share-url" id="reviewLinkResult" hidden>
      <input id="reviewLinkUrl" readonly aria-label="ChatGPT review URL">
      <div class="review-share-actions"><button id="copyReviewLink" type="button">Copy link</button><button id="openReviewLink" type="button">Open JSON</button><button id="revokeReviewLink" type="button">Revoke link</button></div>
      <div class="review-share-status" id="reviewLinkExpiry"></div>
    </div>
    <div class="review-share-warning">Treat this like a temporary password: anyone who has the URL can read the notes you marked for review and request scoped note-status changes until it expires or you revoke it. It does not expose your Firebase password or the rest of the database.</div>
    <div class="review-share-status" id="reviewLinkStatus"></div>
  </details>`;
}
function mount(){
  const body=document.querySelector('.notes-body');
  if(!body||document.querySelector('#reviewSharePanel'))return false;
  css();
  const wrap=document.createElement('div');wrap.innerHTML=panelMarkup();
  const cloud=body.querySelector('.cloud-panel');
  body.insertBefore(wrap.firstElementChild,cloud||null);
  bind();render();return true;
}
function status(text,error=false){
  const el=document.querySelector('#reviewLinkStatus');if(!el)return;
  el.textContent=text;el.style.color=error?'#a12d2d':'#65695f';
}
function render(){
  const value=stored(),box=document.querySelector('#reviewLinkResult'),input=document.querySelector('#reviewLinkUrl'),expiry=document.querySelector('#reviewLinkExpiry');
  if(!box)return;
  const active=value?.url&&Date.parse(value.expiresAt)>Date.now();
  box.hidden=!active;
  if(active){input.value=value.url;expiry.textContent=`Expires ${fmt(value.expiresAt)}.`;}
  else if(value){save(null);}
}
async function ownerFirebase(){
  const fb=await firebase();
  if(!fb.auth.currentUser)throw new Error('Sign in under Firebase sync above first.');
  if(fb.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('The configured parent Firebase account is required.');
  return fb;
}
async function createLink(){
  try{
    status('Creating private review link…');
    const fb=await ownerFirebase(),days=Number(document.querySelector('#reviewLinkDays').value||7);
    const call=fb.Fns.httpsCallable(fb.functions,'createBeyond100ReviewLink');
    const result=(await call({days})).data;
    save({url:result.url,expiresAt:result.expiresAt,createdAt:new Date().toISOString()});
    render();status('Review link created. Share it only with the ChatGPT conversation you want to use for app development.');
  }catch(e){status(e?.message||'Could not create review link.',true)}
}
async function revoke(){
  const value=stored();if(!value?.url)return;
  try{
    status('Revoking link…');
    const token=tokenFrom(value.url);if(!token)throw new Error('The saved review link is invalid.');
    const fb=await ownerFirebase(),call=fb.Fns.httpsCallable(fb.functions,'revokeBeyond100ReviewLink');
    await call({token});save(null);render();status('Review link revoked.');
  }catch(e){status(e?.message||'Could not revoke review link.',true)}
}
async function copy(){
  const url=stored()?.url;if(!url)return;
  try{await navigator.clipboard.writeText(url);status('Review link copied.')}catch{status('Select and copy the URL manually.',true)}
}
function openJson(){const url=stored()?.url;if(url)window.open(url,'_blank','noopener,noreferrer')}
function syncStatuses(){
  const b=document.querySelector('#syncNow');
  if(b){b.click();status('Refreshing Firebase notes…')}else status('Open Firebase sync and sync notes.',true)
}
function bind(){
  document.querySelector('#createReviewLink').onclick=createLink;
  document.querySelector('#revokeReviewLink').onclick=revoke;
  document.querySelector('#copyReviewLink').onclick=copy;
  document.querySelector('#openReviewLink').onclick=openJson;
  document.querySelector('#refreshReviewNotes').onclick=syncStatuses;
}

if(!mount()){
  const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
