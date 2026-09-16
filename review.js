const CLOUD=window.BEYOND100_CLOUD;
const COLLECTION='beyond100_review_feeds';
const status=document.querySelector('#feedStatus');
const list=document.querySelector('#reviewList');
const summary=document.querySelector('#feedSummary');
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function feedId(){const raw=location.hash.replace(/^#/,'').trim();return /^[A-Za-z0-9_-]{40,120}$/.test(raw)?raw:''}
function rawUrl(id){const project=CLOUD?.firebase?.projectId||'kk-syllabus',key=CLOUD?.firebase?.apiKey||'';return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/%28default%29/documents/${COLLECTION}/${encodeURIComponent(id)}${key?`?key=${encodeURIComponent(key)}`:''}`}
function setStatus(text,kind=''){status.className=`feed-status ${kind}`;status.textContent=text}
function fmt(value){try{return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch{return value||'—'}}
async function statusLedger(){try{const r=await fetch(`review-status.json?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)return{};const j=await r.json();return j?.schema==='beyond100-review-status-v1'&&j.notes&&typeof j.notes==='object'?j.notes:{}}catch{return{}}}
function mergedNotes(feed,ledger){return (Array.isArray(feed.notes)?feed.notes:[]).map(n=>({...n,...(ledger[n.id]||{})})).filter(n=>n.status!=='actioned'&&n.status!=='archived')}
function render(feed,id,ledger){
  const notes=mergedNotes(feed,ledger);
  summary.hidden=false;
  document.querySelector('#pendingCount').textContent=String(notes.length);
  document.querySelector('#appVersion').textContent=feed.version||'—';
  document.querySelector('#updatedAt').textContent=fmt(feed.updatedAt);
  document.querySelector('#technicalDetails').hidden=false;
  document.querySelector('#rawJsonUrl').value=rawUrl(id);
  document.querySelector('#feedId').value=id;
  list.innerHTML=notes.length?notes.map((n,i)=>`<article class="review-note">
    <header><div><p class="eyebrow">NOTE ${i+1}</p><h2>${esc(n.anchorLabel||'General note')}</h2></div><span class="badge">${esc(n.status||'open')}</span></header>
    ${n.selectedText?`<blockquote class="quote">“${esc(n.selectedText)}”</blockquote>`:''}
    <div class="note-text">${esc(n.text||'')}</div>
    ${n.elementText&&!n.selectedText?`<p class="context"><strong>Element context:</strong> ${esc(n.elementText)}</p>`:''}
    ${n.message?`<p class="context"><strong>Review status:</strong> ${esc(n.message)}</p>`:''}
    <div class="meta"><span>${esc(n.anchorId||'page:general')}</span>${n.section?`<span>${esc(n.section)}</span>`:''}${n.topic?`<span>${esc(n.topic)}</span>`:''}${n.version?`<span>v${esc(n.version)}</span>`:''}<span>${esc(n.id||'')}</span>${n.commit?`<span>${esc(String(n.commit).slice(0,10))}</span>`:''}</div>
  </article>`).join(''):'<article class="review-note"><h2>No pending review notes</h2><p class="context">The feed is working; there are currently no notes awaiting action.</p></article>';
  setStatus(`Loaded ${notes.length} pending review note${notes.length===1?'':'s'} from the Firebase feed with GitHub status overlay.`,'good');
}

async function loadFeed(){
  const id=feedId();
  if(!id){setStatus('This review URL is incomplete. Open the permanent review link generated inside Beyond 100.','error');summary.hidden=true;list.innerHTML='';return}
  setStatus('Loading the current review feed from Firebase…');
  try{
    const [A,F,ledger]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'),
      statusLedger()
    ]);
    const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase),db=F.getFirestore(app),snap=await F.getDoc(F.doc(db,COLLECTION,id));
    if(!snap.exists())throw new Error('Review feed not found. It may have been replaced or revoked.');
    const feed=snap.data();if(feed.app!=='beyond100')throw new Error('This capability does not point to a Beyond 100 review feed.');render(feed,id,ledger);
  }catch(e){console.error(e);setStatus(e?.message||'Could not load the review feed.','error');summary.hidden=true;list.innerHTML=''}
}
async function copy(value,button){try{await navigator.clipboard.writeText(value);const old=button.textContent;button.textContent='Copied ✓';setTimeout(()=>button.textContent=old,1200)}catch{}}
document.querySelector('#refreshFeed').onclick=loadFeed;document.querySelector('#copyPageLink').onclick=e=>copy(location.href,e.currentTarget);document.querySelector('#copyRawLink').onclick=e=>{const id=feedId();if(id)copy(rawUrl(id),e.currentTarget)};loadFeed();
