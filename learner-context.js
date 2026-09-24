const CONTEXT_CLOUD=window.BEYOND100_CLOUD;
const CONTEXT_DOC='beyond100-private-context';
let contextSdkPromise=null,contextMounted=false;

const q=(s,r=document)=>r.querySelector(s);

async function contextSdk(){
  if(contextSdkPromise)return contextSdkPromise;
  contextSdkPromise=(async()=>{
    const[A,Auth,F]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]);
    const app=A.getApps()[0]||A.initializeApp(CONTEXT_CLOUD.firebase);
    return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)};
  })();
  return contextSdkPromise;
}

async function resolveLearner(){
  if(window.BEYOND100_RESOLVE_LEARNER)return window.BEYOND100_RESOLVE_LEARNER();
  return window.BEYOND100_GET_LEARNER?.()||null;
}

async function contextRef(){
  const S=await contextSdk();
  await S.auth.authStateReady();
  if(!S.auth.currentUser||S.auth.currentUser.uid!==CONTEXT_CLOUD.ownerUid)throw new Error('Sign in to Firebase first');
  const profile=await resolveLearner();
  if(!profile?.id)throw new Error('Sai learner profile is not available');
  const base=CONTEXT_CLOUD.learnerProgressBase||['families',CONTEXT_CLOUD.ownerUid,'learners',profile.id,'progress'];
  return{S,profile,ref:S.F.doc(S.db,...base,CONTEXT_DOC)};
}

function mount(){
  if(contextMounted)return;
  const section=q('#evidence-plan');
  if(!section)return;
  contextMounted=true;
  const card=document.createElement('div');
  card.id='privateLearnerContext';
  card.className='private-context-panel';
  card.dataset.noteIgnore='true';
  card.innerHTML=`
    <div class="private-context-head">
      <div><p class="eyebrow">PRIVATE FIREBASE CONTEXT</p><h3>Sai's learner context</h3><p>Personal school information is stored only in the authenticated learner record in Firestore. It is not published in the GitHub repository or review feed.</p></div>
      <span id="privateContextStatus">Checking Firebase…</span>
    </div>
    <div class="private-context-grid">
      <label>School/source material<textarea id="privateContextSource" rows="7" placeholder="Paste the school email, meeting note or other source material here."></textarea></label>
      <label>School's key observations<textarea id="privateContextSchool" rows="7" placeholder="Record what the school actually says, keeping this separate from our interpretation."></textarea></label>
      <label>Assessment context<textarea id="privateContextAssessment" rows="5" placeholder="Assessment names, dates, scores and the school's interpretation."></textarea></label>
      <label>Parent observations / hypotheses<textarea id="privateContextParent" rows="5" placeholder="Your observations and working hypotheses. These are not treated as school findings."></textarea></label>
      <label>Current priorities<textarea id="privateContextPriorities" rows="4" placeholder="For example: place value, retention, secure recall."></textarea></label>
      <label>Next review / meeting aims<textarea id="privateContextNext" rows="4" placeholder="What we want to establish before the next school/SENDCo discussion."></textarea></label>
    </div>
    <div class="private-context-actions">
      <button id="pastePrivateContext" type="button" class="secondary">Paste source from clipboard</button>
      <button id="reloadPrivateContext" type="button" class="secondary">Reload from Firebase</button>
      <button id="savePrivateContext" type="button" class="primary">Save private context</button>
    </div>`;
  const first=section.querySelector('.breakdown-focus');
  if(first)first.insertAdjacentElement('beforebegin',card);else section.prepend(card);
  q('#pastePrivateContext',card).addEventListener('click',pasteSource);
  q('#reloadPrivateContext',card).addEventListener('click',()=>loadContext(true));
  q('#savePrivateContext',card).addEventListener('click',saveContext);
  loadContext(false);
}

function values(){
  return{
    sourceText:q('#privateContextSource')?.value||'',
    schoolObservations:q('#privateContextSchool')?.value||'',
    assessmentContext:q('#privateContextAssessment')?.value||'',
    parentObservations:q('#privateContextParent')?.value||'',
    priorities:q('#privateContextPriorities')?.value||'',
    nextReview:q('#privateContextNext')?.value||''
  };
}

function fill(value={}){
  const pairs={privateContextSource:'sourceText',privateContextSchool:'schoolObservations',privateContextAssessment:'assessmentContext',privateContextParent:'parentObservations',privateContextPriorities:'priorities',privateContextNext:'nextReview'};
  Object.entries(pairs).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.value=value[key]||''});
}

function setStatus(text,state='local'){
  const el=q('#privateContextStatus');if(!el)return;el.textContent=text;el.dataset.state=state;
}

function setEnabled(enabled){
  q('#privateLearnerContext')?.querySelectorAll('textarea,button').forEach(el=>{el.disabled=!enabled});
}

async function loadContext(showFeedback=true){
  try{
    setStatus('Loading private context…','syncing');setEnabled(false);
    const{S,profile,ref}=await contextRef();
    const snap=await S.F.getDoc(ref);window.FirebaseUsageMonitor?.read(1,'learner-context-read','beyond100','kk-syllabus','(default)');
    fill(snap.exists()?snap.data()?.value||{}:{});
    setEnabled(true);
    setStatus(`${profile.label||'Sai'} · Firebase private`, 'connected');
    if(showFeedback&&snap.exists())setStatus(`Loaded for ${profile.label||'Sai'} · ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`,'connected');
  }catch(e){
    setEnabled(false);
    setStatus(e.message?.includes('Sign in')?'Sign in via Notes to load private context':'Private context unavailable','local');
  }
}

async function saveContext(){
  const button=q('#savePrivateContext');
  try{
    if(button)button.disabled=true;setStatus('Saving private context…','syncing');
    const{S,profile,ref}=await contextRef();
    window.FirebaseUsageMonitor?.write(1,'learner-context-write','beyond100','kk-syllabus','(default)');await S.F.setDoc(ref,{
      app:'beyond100',
      kind:'private-learner-context',
      schema:'beyond100-private-context-v1',
      learnerId:profile.id,
      learnerLabel:profile.label||'Sai',
      updatedAt:new Date().toISOString(),
      value:values()
    },{merge:true});
    setStatus(`Saved privately for ${profile.label||'Sai'}`,'connected');
  }catch(e){setStatus(e.message||'Could not save private context','error')}
  finally{if(button)button.disabled=false}
}

async function pasteSource(){
  try{
    const text=await navigator.clipboard.readText();
    const el=q('#privateContextSource');if(el)el.value=text;
    setStatus('Pasted locally · press Save private context','local');
  }catch{setStatus('Clipboard access was not available','error')}
}

function boot(){
  if(q('#evidence-plan'))mount();
  else{
    const mo=new MutationObserver(()=>{if(q('#evidence-plan')){mo.disconnect();mount()}});
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }
}

window.addEventListener('beyond100-learner-resolved',()=>loadContext(false));
window.addEventListener('focus',()=>{if(contextMounted)loadContext(false)});
boot();
