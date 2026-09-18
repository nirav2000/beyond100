const CONFIG = window.BEYOND100_CLOUD;
const LOCAL_KEY = 'beyond100.notes.v1';
const APP_VERSION = window.BEYOND100_DATA?.meta?.version || '0.1.0';
const state = {
  notes: loadLocal(),
  filter: 'open',
  annotationMode: false,
  activeContext: null,
  editingId: null,
  firebase: null,
  auth: null,
  db: null,
  cloudState: 'local',
  cloudText: 'Saved on this device'
};

function loadLocal(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
  catch { return []; }
}
function saveLocal(){
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state.notes));
  renderPins();
  updateCount();
}
function esc(s=''){
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function slugify(s=''){
  return String(s).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
}
function now(){ return new Date().toISOString(); }
function byUpdated(a,b){ return Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0); }
function openNotes(){
  ensureDialog();
  document.querySelector('#notesDialog').showModal();
  renderNotesPanel();
}
function closeNotes(){ document.querySelector('#notesDialog')?.close(); }

function installTopbar(){
  const bar = document.querySelector('.topbar');
  if(!bar || document.querySelector('#notesButton')) return;
  const annotate = document.createElement('button');
  annotate.id='annotateButton';
  annotate.className='icon-button notes-top-button';
  annotate.innerHTML='<span>⌖</span><span class="notes-label">Annotate</span>';
  annotate.setAttribute('aria-label','Annotate this page');
  annotate.addEventListener('click', toggleAnnotationMode);
  const notes = document.createElement('button');
  notes.id='notesButton';
  notes.className='icon-button notes-top-button';
  notes.innerHTML='<span>✎</span><span class="notes-label">Notes</span><span class="notes-count" id="notesCount"></span>';
  notes.setAttribute('aria-label','Open notes');
  notes.addEventListener('click', openNotes);
  const nav = document.querySelector('#openNav');
  bar.insertBefore(annotate, nav || null);
  bar.insertBefore(notes, nav || null);
  updateCount();
}

function ensureDialog(){
  if(document.querySelector('#notesDialog')) return;
  const d=document.createElement('dialog');
  d.id='notesDialog';
  d.className='notes-dialog';
  d.innerHTML=`<div class="notes-shell">
    <header class="notes-head">
      <div><p class="eyebrow">ANNOTATIONS</p><h2>Notes for review</h2></div>
      <div class="notes-head-actions"><span class="cloud-status" id="cloudStatus">Saved on this device</span><button class="notes-close" id="closeNotes" aria-label="Close notes">×</button></div>
    </header>
    <div class="notes-body">
      <div class="notes-toolbar">
        <button class="primary-note" id="newGeneralNote">＋ General note</button>
        <button id="toggleAnnotateFromPanel">⌖ Select an element</button>
        <button id="copyReviewPack">Copy review pack</button>
        <button id="exportNotes">Export JSON</button>
      </div>
      <section class="note-composer" id="noteComposer" hidden>
        <div class="note-context"><strong id="noteContextLabel">General note</strong><span class="note-anchor-id" id="noteContextId">page:general</span></div>
        <blockquote class="selected-quote" id="selectedQuote" hidden></blockquote>
        <textarea id="noteText" maxlength="6000" placeholder="What should be reviewed, changed, clarified or kept?"></textarea>
        <div class="note-composer-row">
          <label class="note-review-check"><input id="reviewRequired" type="checkbox" checked> Include in ChatGPT review queue</label>
          <div><button class="notes-close" id="cancelNote" type="button" style="font-size:13px;margin-right:8px">Cancel</button><button class="note-save" id="saveNote" type="button">Save note</button></div>
        </div>
      </section>
      <div class="notes-filter" id="notesFilter">
        <button data-filter="open" class="active">Open</button>
        <button data-filter="review">For review</button>
        <button data-filter="all">All</button>
        <button data-filter="archived">Archived</button>
      </div>
      <div class="notes-list" id="notesList"></div>
      <details class="cloud-panel">
        <summary>Firebase sync</summary>
        <p class="muted">Notes save locally immediately. If your existing Firebase session is available they also sync to the shared kk-syllabus project.</p>
        <div class="cloud-form">
          <input id="firebaseEmail" type="email" autocomplete="username" placeholder="Firebase email">
          <input id="firebasePassword" type="password" autocomplete="current-password" placeholder="Password">
          <div class="cloud-actions"><button id="firebaseSignIn" type="button">Sign in & sync</button><button id="syncNow" type="button">Sync now</button><button id="firebaseSignOut" type="button">Disconnect</button></div>
        </div>
      </details>
    </div>
  </div>`;
  document.body.appendChild(d);
  d.querySelector('#closeNotes').onclick=closeNotes;
  d.addEventListener('cancel',e=>{e.preventDefault();closeNotes();});
  d.querySelector('#newGeneralNote').onclick=()=>openComposer({anchorId:'page:general',anchorLabel:'General page note',selectedText:'',elementText:''});
  d.querySelector('#toggleAnnotateFromPanel').onclick=()=>{closeNotes();toggleAnnotationMode(true)};
  d.querySelector('#cancelNote').onclick=closeComposer;
  d.querySelector('#saveNote').onclick=saveComposerNote;
  d.querySelector('#copyReviewPack').onclick=copyReviewPack;
  d.querySelector('#exportNotes').onclick=exportNotes;
  d.querySelector('#firebaseSignIn').onclick=signInAndSync;
  d.querySelector('#syncNow').onclick=()=>syncCloud(true);
  d.querySelector('#firebaseSignOut').onclick=signOutCloud;
  d.querySelector('#notesFilter').addEventListener('click',e=>{
    const b=e.target.closest('[data-filter]'); if(!b)return;
    state.filter=b.dataset.filter;
    d.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));
    renderNotesList();
  });
  d.addEventListener('click',e=>{if(e.target===d)closeNotes()});
}

function openComposer(context,note=null){
  ensureDialog();
  const d=document.querySelector('#notesDialog');
  if(!d.open)d.showModal();
  state.activeContext=context;
  state.editingId=note?.id||null;
  const box=d.querySelector('#noteComposer');
  box.hidden=false;
  d.querySelector('#noteContextLabel').textContent=context.anchorLabel||'General note';
  d.querySelector('#noteContextId').textContent=context.anchorId||'page:general';
  const quote=d.querySelector('#selectedQuote');
  quote.hidden=!context.selectedText;
  quote.textContent=context.selectedText?`“${context.selectedText}”`:'';
  d.querySelector('#noteText').value=note?.text||'';
  d.querySelector('#reviewRequired').checked=note?.reviewRequired!==false;
  d.querySelector('#saveNote').textContent=note?'Save changes':'Save note';
  setTimeout(()=>d.querySelector('#noteText').focus(),20);
}
function closeComposer(){
  const c=document.querySelector('#noteComposer'); if(c)c.hidden=true;
  state.activeContext=null; state.editingId=null;
}

function saveComposerNote(){
  const text=document.querySelector('#noteText').value.trim();
  if(!text){document.querySelector('#noteText').focus();return;}
  const existing=state.notes.find(n=>n.id===state.editingId);
  const context=state.activeContext||{anchorId:'page:general',anchorLabel:'General page note',selectedText:'',elementText:''};
  const note={
    ...(existing||{}),
    id:existing?.id||crypto.randomUUID(),
    text,
    anchorId:context.anchorId,
    anchorLabel:context.anchorLabel,
    selectedText:context.selectedText||'',
    elementText:context.elementText||'',
    topic:window.BEYOND100_DATA?.detailedTopics?.['Place Value & Number Structure']?.id||'maths-place-value',
    section:context.section||sectionForAnchor(context.anchorId),
    page:location.pathname+location.hash,
    app:'beyond100',
    version:APP_VERSION,
    status:existing?.status||'open',
    reviewRequired:document.querySelector('#reviewRequired').checked,
    createdAt:existing?.createdAt||now(),
    updatedAt:now()
  };
  const i=state.notes.findIndex(n=>n.id===note.id);
  if(i<0)state.notes.push(note);else state.notes[i]=note;
  saveLocal();
  upsertCloud(note).catch(()=>{});
  closeComposer();
  renderNotesPanel();
}

function renderNotesPanel(){
  ensureDialog();
  setCloudStatus(state.cloudState,state.cloudText);
  renderNotesList();
  updateCount();
}
function renderNotesList(){
  const list=document.querySelector('#notesList'); if(!list)return;
  let notes=[...state.notes].sort(byUpdated);
  if(state.filter==='open')notes=notes.filter(n=>n.status!=='archived');
  if(state.filter==='review')notes=notes.filter(n=>n.status!=='archived'&&n.reviewRequired!==false);
  if(state.filter==='archived')notes=notes.filter(n=>n.status==='archived');
  if(!notes.length){list.innerHTML='<div class="notes-empty">No notes in this view yet.</div>';return;}
  list.innerHTML=notes.map(n=>`<article class="saved-note ${n.status==='archived'?'is-archived':''}" data-note-id="${esc(n.id)}">
    <div class="saved-note-top"><strong>${esc(n.anchorLabel||'General note')}</strong>${n.reviewRequired!==false&&n.status!=='archived'?'<span class="review-note-badge">Review</span>':''}</div>
    ${n.selectedText?`<blockquote>“${esc(n.selectedText)}”</blockquote>`:''}
    <p>${esc(n.text)}</p>
    <div class="saved-note-meta"><span>${esc(n.anchorId||'page:general')}</span><span>${esc(n.version||'')}</span><span>${formatDate(n.updatedAt)}</span><span>${esc(n.status||'open')}</span></div>
    <div class="saved-note-actions"><button data-action="goto">Go to</button><button data-action="edit">Edit</button><button data-action="review">${n.reviewRequired===false?'Add to review':'Remove from review'}</button><button data-action="archive">${n.status==='archived'?'Restore':'Archive'}</button></div>
  </article>`).join('');
  list.querySelectorAll('.saved-note').forEach(card=>card.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const note=state.notes.find(n=>n.id===card.dataset.noteId);if(!note)return;
    if(b.dataset.action==='goto')goToNote(note);
    if(b.dataset.action==='edit')openComposer(contextFromNote(note),note);
    if(b.dataset.action==='review'){note.reviewRequired=note.reviewRequired===false;note.updatedAt=now();saveLocal();upsertCloud(note).catch(()=>{});renderNotesList();}
    if(b.dataset.action==='archive'){note.status=note.status==='archived'?'open':'archived';note.updatedAt=now();saveLocal();upsertCloud(note).catch(()=>{});renderNotesList();}
  }));
}
function formatDate(s){
  try{return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(s));}catch{return ''}
}
function contextFromNote(n){return {anchorId:n.anchorId,anchorLabel:n.anchorLabel,selectedText:n.selectedText||'',elementText:n.elementText||'',section:n.section||''}}
function sectionForAnchor(anchor=''){
  if(anchor.startsWith('stage:'))return'progression';
  if(anchor.startsWith('mastery:')||anchor.startsWith('threshold:'))return'mastery';
  if(anchor.startsWith('misconception:'))return'misconceptions';
  if(anchor.startsWith('question:'))return'questions';
  return'';
}
function updateCount(){
  const el=document.querySelector('#notesCount'); if(!el)return;
  const count=state.notes.filter(n=>n.status!=='archived'&&n.reviewRequired!==false).length;
  el.textContent=count?String(count):'';
}

function toggleAnnotationMode(force){
  state.annotationMode=typeof force==='boolean'?force:!state.annotationMode;
  document.body.classList.toggle('annotating',state.annotationMode);
  document.querySelector('#annotationBanner')?.remove();
  if(state.annotationMode){
    const b=document.createElement('div');b.id='annotationBanner';b.className='annotation-banner';b.innerHTML='<span>Tap a highlighted box, or select text, to attach a note.</span><button type="button">Done</button>';document.body.appendChild(b);b.querySelector('button').onclick=()=>toggleAnnotationMode(false);
  }
}

function annotateDynamicElements(){
  const targets=[...document.querySelectorAll('#whyCard,.hero-copy,.hero-card,.stage-card,.mastery-card,.threshold,.misconception,.question-card,.section-heading,.topic-item')];
  targets.forEach((el,index)=>{
    if(!el.dataset.noteAnchor)el.dataset.noteAnchor=stableAnchor(el,index);
    if(!el.dataset.noteLabel)el.dataset.noteLabel=anchorLabel(el);
  });
  renderPins();
}
function stableAnchor(el,index){
  if(el.id==='whyCard')return'topic:maths-place-value:why';
  if(el.classList.contains('hero-copy'))return'topic:maths-place-value:intro';
  if(el.classList.contains('hero-card'))return'learner:horizon';
  if(el.classList.contains('stage-card'))return`stage:${el.querySelector('.year-pill strong')?.textContent?.trim()||index}`;
  if(el.classList.contains('mastery-card'))return`mastery:${slugify(el.querySelector('h3')?.textContent||index)}`;
  if(el.classList.contains('threshold'))return`threshold:${slugify(el.querySelector('strong')?.textContent||index)}`;
  if(el.classList.contains('misconception'))return`misconception:${[...document.querySelectorAll('.misconception')].indexOf(el)+1}`;
  if(el.classList.contains('question-card'))return`question:${el.dataset.qid||index}`;
  if(el.classList.contains('section-heading'))return`section:${el.closest('.content-section')?.id||index}:heading`;
  if(el.classList.contains('topic-item'))return`catalogue:${slugify(el.textContent)}`;
  return`element:${el.id||slugify(el.textContent.slice(0,50))||index}`;
}
function anchorLabel(el){
  if(el.classList.contains('stage-card'))return`${el.querySelector('.year-pill strong')?.textContent||''} · ${el.querySelector('.stage-title strong')?.textContent||'Stage'}`.trim();
  if(el.classList.contains('mastery-card'))return`Mastery · ${el.querySelector('h3')?.textContent||''}`;
  if(el.classList.contains('misconception'))return`Misconception ${[...document.querySelectorAll('.misconception')].indexOf(el)+1}`;
  if(el.classList.contains('question-card'))return`${el.querySelector('.badge')?.textContent||''} question · ${el.querySelector('.question-prompt')?.textContent?.slice(0,90)||''}`;
  if(el.classList.contains('section-heading'))return`${el.querySelector('h2')?.textContent||'Section'} heading`;
  if(el.classList.contains('topic-item'))return`Syllabus topic · ${el.textContent.trim()}`;
  if(el.id==='whyCard')return'Why this matters';
  if(el.classList.contains('hero-copy'))return'Place Value topic introduction';
  if(el.classList.contains('hero-card'))return'Sai current year and horizon';
  return(el.querySelector('h1,h2,h3,strong')?.textContent||el.textContent||'Page element').trim().slice(0,120);
}
function renderPins(){
  document.querySelectorAll('.note-pin').forEach(x=>x.remove());
  document.querySelectorAll('.has-notes').forEach(x=>x.classList.remove('has-notes'));
  const counts=new Map();
  state.notes.filter(n=>n.status!=='archived').forEach(n=>counts.set(n.anchorId,(counts.get(n.anchorId)||0)+1));
  document.querySelectorAll('[data-note-anchor]').forEach(el=>{
    const count=counts.get(el.dataset.noteAnchor)||0;if(!count)return;
    el.classList.add('has-notes');
    const pin=document.createElement('button');pin.className='note-pin';pin.type='button';pin.textContent=String(count);pin.title=`${count} note${count===1?'':'s'}`;pin.onclick=e=>{e.stopPropagation();state.filter='all';openNotes();setTimeout(()=>{const first=state.notes.filter(n=>n.anchorId===el.dataset.noteAnchor).sort(byUpdated)[0];if(first){const card=document.querySelector(`[data-note-id="${CSS.escape(first.id)}"]`);card?.scrollIntoView({block:'center'});}},30)};el.appendChild(pin);
  });
}

function nearestAnnotatable(node){return node?.nodeType===1?node.closest?.('[data-note-anchor]'):node?.parentElement?.closest?.('[data-note-anchor]')}
function elementContext(el,selectedText=''){
  return {anchorId:el?.dataset.noteAnchor||'page:general',anchorLabel:el?.dataset.noteLabel||anchorLabel(el),selectedText:selectedText.trim().slice(0,1400),elementText:(el?.innerText||'').trim().replace(/\s+/g,' ').slice(0,1200),section:el?.closest('.content-section')?.id||''};
}

document.addEventListener('click',e=>{
  if(!state.annotationMode)return;
  if(e.target.closest('.notes-dialog,.annotation-banner,.selection-note-button,#annotateButton,#notesButton,input,textarea,select'))return;
  const el=nearestAnnotatable(e.target);if(!el)return;
  const control=e.target.closest('a,button');
  if(control && !control.matches('[data-note-anchor]') && !control.closest('[data-note-anchor]'))return;
  e.preventDefault();e.stopPropagation();
  const sel=window.getSelection();const selected=sel&&!sel.isCollapsed&&el.contains(sel.anchorNode)&&el.contains(sel.focusNode)?sel.toString():'';
  toggleAnnotationMode(false);openComposer(elementContext(el,selected));
},true);

let selectionTimer=null;
document.addEventListener('selectionchange',()=>{
  clearTimeout(selectionTimer);selectionTimer=setTimeout(showSelectionAction,180);
});
function showSelectionAction(){
  document.querySelector('#selectionNoteButton')?.remove();
  const sel=window.getSelection();if(!sel||sel.isCollapsed||!sel.toString().trim())return;
  const el=nearestAnnotatable(sel.anchorNode);if(!el||!document.querySelector('.main')?.contains(el))return;
  const text=sel.toString().trim();if(text.length<2)return;
  let rect;try{rect=sel.getRangeAt(0).getBoundingClientRect()}catch{return}
  const b=document.createElement('button');b.id='selectionNoteButton';b.className='selection-note-button';b.type='button';b.textContent='＋ Note on selection';
  const x=Math.max(12,Math.min(window.innerWidth-160,(rect.left||window.innerWidth/2)));
  const y=rect.bottom&&rect.bottom<window.innerHeight-60?rect.bottom+8:window.innerHeight-58;
  b.style.left=`${x}px`;b.style.top=`${Math.max(12,y)}px`;
  b.onclick=e=>{e.preventDefault();e.stopPropagation();openComposer(elementContext(el,text));b.remove();sel.removeAllRanges();};
  document.body.appendChild(b);
  setTimeout(()=>{if(document.body.contains(b)&&window.getSelection()?.isCollapsed)b.remove()},5000);
}

function goToNote(note){
  closeNotes();
  const section=note.section||sectionForAnchor(note.anchorId);
  if(section){document.querySelector(`.section-nav [data-section="${CSS.escape(section)}"]`)?.click();}
  setTimeout(()=>{
    annotateDynamicElements();
    const el=[...document.querySelectorAll('[data-note-anchor]')].find(x=>x.dataset.noteAnchor===note.anchorId);
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('note-flash');setTimeout(()=>el.classList.remove('note-flash'),1300)}
  },140);
}

function reviewNotes(){return state.notes.filter(n=>n.status!=='archived'&&n.reviewRequired!==false).sort(byUpdated)}
async function copyReviewPack(){
  const notes=reviewNotes();
  const lines=[`Beyond 100 review notes`, `Generated: ${new Date().toLocaleString('en-GB')}`, `App version: ${APP_VERSION}`, '', ...notes.flatMap((n,i)=>[
    `${i+1}. ${n.anchorLabel||'General note'} [${n.anchorId}]`,
    n.selectedText?`Selected text: “${n.selectedText}”`:null,
    n.elementText&&!n.selectedText?`Element context: ${n.elementText.slice(0,350)}`:null,
    `Note: ${n.text}`,
    `Note ID: ${n.id}`,
    ''
  ].filter(Boolean))];
  const text=lines.join('\n');
  try{await navigator.clipboard.writeText(text);flashToolbar('copyReviewPack','Copied ✓')}catch{downloadBlob(text,'beyond100-review-notes.txt','text/plain')}
}
function exportNotes(){downloadBlob(JSON.stringify({app:'beyond100',version:APP_VERSION,exportedAt:now(),notes:state.notes},null,2),'beyond100-notes.json','application/json')}
function downloadBlob(text,name,type){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function flashToolbar(id,label){const b=document.querySelector('#'+id);if(!b)return;const old=b.textContent;b.textContent=label;setTimeout(()=>b.textContent=old,1300)}

async function firebaseReady(){
  if(state.firebase)return state.firebase;
  if(!CONFIG?.firebase)throw Error('Firebase configuration is unavailable.');
  setCloudStatus('syncing','Connecting to Firebase…');
  const [A,Auth,F]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const app=A.getApps()[0]||A.initializeApp(CONFIG.firebase);
  state.auth=Auth.getAuth(app);state.db=F.getFirestore(app);state.firebase={...Auth,...F};
  await state.firebase.setPersistence(state.auth,state.firebase.browserLocalPersistence);
  await state.auth.authStateReady();
  return state.firebase;
}
function cloudBase(){return CONFIG.firestoreBase||['families',CONFIG.ownerUid,'learners',CONFIG.learnerId,'progress']}
async function signInAndSync(){
  const email=document.querySelector('#firebaseEmail')?.value.trim();
  const password=document.querySelector('#firebasePassword')?.value||'';
  if(!email||!password){setCloudStatus('error','Enter Firebase email and password');return}
  try{
    const F=await firebaseReady();
    const result=await F.signInWithEmailAndPassword(state.auth,email,password);
    if(result.user.uid!==CONFIG.ownerUid){await F.signOut(state.auth);throw Error('This is not the configured parent account.');}
    document.querySelector('#firebasePassword').value='';await syncCloud(true);
  }catch(e){setCloudStatus('error',friendlyFirebaseError(e));}
}
async function signOutCloud(){
  try{const F=await firebaseReady();await F.signOut(state.auth);setCloudStatus('local','Disconnected · local notes safe');}
  catch(e){setCloudStatus('error',friendlyFirebaseError(e));}
}
async function upsertCloud(note){
  try{
    const F=await firebaseReady();
    if(!state.auth.currentUser||state.auth.currentUser.uid!==CONFIG.ownerUid){setCloudStatus('local','Saved locally · sign in to sync');return}
    setCloudStatus('syncing','Syncing…');
    const ref=F.doc(state.db,...cloudBase(),`beyond100-note-${note.id}`);
    await F.setDoc(ref,{app:CONFIG.appId||'beyond100',kind:'note',noteId:note.id,updatedAt:note.updatedAt,value:note},{merge:true});
    setCloudStatus('synced','✓ Firebase synced');
  }catch(e){setCloudStatus('error',friendlyFirebaseError(e));throw e}
}
async function syncCloud(force=false){
  try{
    const F=await firebaseReady();
    if(!state.auth.currentUser||state.auth.currentUser.uid!==CONFIG.ownerUid){setCloudStatus('local','Saved locally · sign in to sync');if(force)throw Error('Sign in first.');return}
    if(!navigator.onLine){setCloudStatus('local','Offline · local notes safe');if(force)throw Error('Offline');return}
    setCloudStatus('syncing','Syncing…');
    const snap=await F.getDocs(F.query(F.collection(state.db,...cloudBase()),F.where('app','==',CONFIG.appId||'beyond100')));
    const remote=snap.docs.map(d=>d.data()).filter(x=>x.kind==='note'&&x.value).map(x=>x.value);
    const merged=new Map();
    [...remote,...state.notes].forEach(n=>{const prior=merged.get(n.id);if(!prior||Date.parse(n.updatedAt||n.createdAt||0)>=Date.parse(prior.updatedAt||prior.createdAt||0))merged.set(n.id,n)});
    state.notes=[...merged.values()];saveLocal();
    await Promise.all(state.notes.map(n=>F.setDoc(F.doc(state.db,...cloudBase(),`beyond100-note-${n.id}`),{app:CONFIG.appId||'beyond100',kind:'note',noteId:n.id,updatedAt:n.updatedAt,value:n},{merge:true})));
    setCloudStatus('synced','✓ Firebase synced');renderNotesList();
  }catch(e){setCloudStatus('error',friendlyFirebaseError(e));if(force)throw e}
}
function friendlyFirebaseError(e){
  const c=e?.code||'',m=e?.message||'';
  if(c.includes('permission-denied'))return'Cloud access denied · check Firestore rules';
  if(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found'))return'Email or password did not match';
  if(c.includes('operation-not-allowed'))return'Enable Email/Password sign-in in Firebase';
  if(m==='Sign in first.')return'Sign in first';
  if(m==='Offline')return'Offline · local notes safe';
  return m||'Firebase sync unavailable · local notes safe';
}
function setCloudStatus(mode,text){
  state.cloudState=mode;state.cloudText=text;
  const el=document.querySelector('#cloudStatus');if(!el)return;
  el.dataset.state=mode==='error'?'error':mode==='syncing'?'syncing':'ok';el.textContent=text;
}

const observer=new MutationObserver(()=>{clearTimeout(observer.timer);observer.timer=setTimeout(annotateDynamicElements,60)});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('online',()=>syncCloud(false));

installTopbar();
annotateDynamicElements();
ensureDialog();
firebaseReady().then(()=>state.auth.currentUser?syncCloud(false):setCloudStatus('local','Saved locally · sign in to sync')).catch(()=>setCloudStatus('local','Firebase unavailable · local notes safe'));

window.addEventListener('beyond100-review-status-applied',()=>{
  state.notes=loadLocal();
  renderPins();
  updateCount();
  renderNotesList();
});
