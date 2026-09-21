const CLOUD=window.BEYOND100_CLOUD;
const PHASES=[
  ['diagnose','Diagnose','⌕'],['teach','Teach','▤'],['demonstrate','Demonstrate','▣'],
  ['practise','Practise','✎'],['retrieve1','Retrieve','↶'],['retrieve2','Retrieve again','↺'],['apply','Apply','→']
];
const OUTCOMES=[['fast','Correct + fast'],['hesitant','Correct + hesitant'],['prompted','Incorrect → understands after prompt'],['noConcept','Incorrect / no concept']];
const ERRORS=[['K','Knowledge'],['C','Concept'],['Q','Question interpretation'],['P','Procedure'],['F','Fluency'],['R','Reasoning'],['A','Attention']];
const PROMPTS=[['independent','Independent'],['read','Read aloud'],['clarify','Clarified wording'],['hint','Hint'],['explained','Explained']];
const CONFIDENCE={gotit:'😄 Got it',sense:'🙂 Makes sense',half:'🤔 Half sure',lost:'😕 Don’t understand'};
const q=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=null,unsubscribe=null,state=null,timerInterval=null;

async function sdk(){
  if(S)return S;
  const[A,Auth,F]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
  const auth=Auth.getAuth(app);
  await Auth.setPersistence(auth,Auth.browserLocalPersistence).catch(()=>{});
  S={A,Auth,F,auth,db:F.getFirestore(app)};
  return S;
}
function focusRef(){
  return S.F.doc(S.db,...(CLOUD.firestoreBase||CLOUD.legacyFirestoreBase),'beyond100-focus-live');
}
function setLoginStatus(text){const el=q('#parentLoginStatus');if(el)el.textContent=text||''}
function setView(which){
  q('#parentLogin').hidden=which!=='login';
  q('#parentWaiting').hidden=which!=='waiting';
  q('#parentController').hidden=which!=='controller';
  q('#parentSignOut').hidden=which==='login';
}
async function resolveLearner(){
  if(window.BEYOND100_RESOLVE_LEARNER){
    try{await window.BEYOND100_RESOLVE_LEARNER(true)}catch{}
  }
}
async function subscribe(){
  const s=await sdk();await s.auth.authStateReady();
  if(!s.auth.currentUser||s.auth.currentUser.uid!==CLOUD.ownerUid){setView('login');return}
  await resolveLearner();
  unsubscribe?.();
  unsubscribe=s.F.onSnapshot(focusRef(),snap=>{
    const data=snap.data(),next=data?.state||null;
    state=next;
    if(!next?.active){setView('waiting');return}
    setView('controller');render();
  },()=>setView('waiting'));
}
async function signIn(){
  const email=q('#parentEmail').value.trim(),password=q('#parentPassword').value;
  if(!email||!password){setLoginStatus('Enter email and password.');return}
  setLoginStatus('Signing in…');
  try{
    const s=await sdk();
    const cred=await s.Auth.signInWithEmailAndPassword(s.auth,email,password);
    if(cred.user.uid!==CLOUD.ownerUid){await s.Auth.signOut(s.auth);throw new Error('This is not the parent account.')}
    q('#parentPassword').value='';setLoginStatus('');await subscribe();
  }catch(e){setLoginStatus(e.message||'Could not sign in.')}
}
async function signOut(){const s=await sdk();unsubscribe?.();unsubscribe=null;await s.Auth.signOut(s.auth);setView('login')}
async function command(action,payload={}){
  if(!S?.auth.currentUser)return;
  await S.F.setDoc(focusRef(),{
    command:{id:crypto.randomUUID(),action,payload,at:new Date().toISOString()}
  },{merge:true});
}
function phaseRail(){
  if(!state)return'';
  return PHASES.map((p,i)=>{
    const st=state.phaseLog?.[p[0]]?.state||(state.phase===p[0]?'current':'future');
    const arrow=i<PHASES.length-1?'<span class="parent-phase-arrow">›</span>':'';
    return '<button class="parent-phase-tile" type="button" data-phase="'+p[0]+'" data-state="'+st+'" title="'+esc(p[1])+'">'+p[2]+'</button>'+arrow;
  }).join('');
}
function controlButtons(items,attr,current){
  return items.map(x=>'<button type="button" data-'+attr+'="'+x[0]+'" class="'+(current===x[0]?'selected':'')+'">'+esc(x[1])+'</button>').join('');
}
function errorButtons(){
  return ERRORS.map(x=>'<button type="button" data-error="'+x[0]+'" class="'+(state?.currentError===x[0]?'selected':'')+'"><b>'+x[0]+'</b><small>'+esc(x[1])+'</small></button>').join('');
}
function stats(){
  const rows=state?.stats||[],c={fast:0,hesitant:0,prompted:0,noConcept:0};
  rows.forEach(r=>{if(c[r.outcome]!==undefined)c[r.outcome]++});
  return '<span><b>'+rows.length+'</b> recorded</span><span><b>'+c.fast+'</b> fast</span><span><b>'+c.hesitant+'</b> hesitant</span><span><b>'+c.prompted+'</b> prompted</span><span><b>'+c.noConcept+'</b> no concept</span>';
}
function render(){
  if(!state)return;
  q('#parentScope').textContent=state.scope||state.topicLabel||'Focus session';
  q('#parentTaskMeta').textContent=(state.phase||'')+' · '+((state.index||0)+1)+' of '+(state.total||1);
  q('#parentPhaseRail').innerHTML=phaseRail();
  q('#parentInstruction').textContent=state.task?.instruction||'';
  q('#parentPrompt').textContent=state.task?.prompt||'';
  q('#parentAnswer').textContent=state.task?.answer||'No answer stored for this task.';
  q('#parentConfidenceStatus').textContent=state.currentConfidence?'Child confidence: '+(CONFIDENCE[state.currentConfidence]||state.currentConfidence):'';
  q('#parentOutcomes').innerHTML=controlButtons(OUTCOMES,'outcome',state.currentOutcome);
  q('#parentPrompts').innerHTML=controlButtons(PROMPTS,'prompt',state.promptLevel||'independent');
  q('#parentErrors').innerHTML=errorButtons();
  q('#parentRecord').textContent=state.recordedCurrent?'Saved ✓':'Save response';
  q('#parentNext').disabled=state.task?.kind==='question'&&!state.recordedCurrent;
  q('#parentNext').textContent=(state.index||0)>=(state.total||1)-1?'Finish':'Next task →';
  q('#parentStats').innerHTML=stats();
  if(document.activeElement!==q('#parentNote'))q('#parentNote').value=state.parentNote||'';
  bindDynamic();
  updateTimer();
}
function bindDynamic(){
  q('#parentPhaseRail').querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>command('set-phase',{phase:b.dataset.phase}));
  q('#parentOutcomes').querySelectorAll('[data-outcome]').forEach(b=>b.onclick=()=>command('set-outcome',{outcome:b.dataset.outcome}));
  q('#parentPrompts').querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>command('set-prompt',{prompt:b.dataset.prompt}));
  q('#parentErrors').querySelectorAll('[data-error]').forEach(b=>b.onclick=()=>command('set-error',{error:state.currentError===b.dataset.error?'':b.dataset.error}));
}
function updateTimer(){
  clearInterval(timerInterval);
  const el=q('#parentTimerValue');if(!el||!state)return;
  let base=Number(state.timer?.elapsed||0);
  const started=Date.now();
  const draw=()=>{
    const value=base+(state.timer?.running?(Date.now()-started)/1000:0);
    el.textContent=value.toFixed(1)+'s';
  };
  draw();
  if(state.timer?.running)timerInterval=setInterval(draw,100);
}
function init(){
  q('#parentSignIn').onclick=signIn;
  q('#parentSignOut').onclick=signOut;
  q('#parentRefresh').onclick=subscribe;
  q('#parentTimer').onclick=()=>command('timer');
  q('#parentRecord').onclick=()=>command('record');
  q('#parentNext').onclick=()=>command('next');
  q('#saveParentNote').onclick=()=>command('parent-note',{text:q('#parentNote').value});
  sdk().then(async s=>{
    await s.auth.authStateReady();
    s.Auth.onAuthStateChanged(s.auth,user=>{
      if(user?.uid===CLOUD.ownerUid)subscribe();else setView('login');
    });
    if(s.auth.currentUser?.uid===CLOUD.ownerUid)subscribe();else setView('login');
  }).catch(()=>setView('login'));
}
init();
