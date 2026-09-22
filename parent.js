const CLOUD=window.BEYOND100_CLOUD;
const CONTROLLER_COLLECTION='beyond100_parent_controllers';
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
const now=()=>new Date().toISOString();
let S=null,unsubscribe=null,state=null,timerInterval=null,presenceTimer=null;
const capabilityToken=(()=>{
  const m=location.hash.match(/(?:^#|&)control=([A-Za-z0-9_-]{43})(?:&|$)/);
  return m?.[1]||'';
})();
const usingCapability=/^[A-Za-z0-9_-]{43}$/.test(capabilityToken);

async function sdk(){
  if(S)return S;
  const[A,Auth,F]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
  const auth=Auth.getAuth(app);
  if(!usingCapability)await Auth.setPersistence(auth,Auth.browserLocalPersistence).catch(()=>{});
  S={A,Auth,F,auth,db:F.getFirestore(app)};
  return S;
}
function focusRef(){
  if(usingCapability)return S.F.doc(S.db,CONTROLLER_COLLECTION,capabilityToken);
  return S.F.doc(S.db,...(CLOUD.firestoreBase||CLOUD.legacyFirestoreBase),'beyond100-focus-live');
}
function setLoginStatus(text){const el=q('#parentLoginStatus');if(el)el.textContent=text||''}
function setConnection(title,detail='',stateName='loading'){
  const root=q('#parentConnection');if(!root)return;
  root.dataset.state=stateName;
  q('#parentConnectionTitle').textContent=title;
  q('#parentConnectionDetail').textContent=detail;
}
function setView(which){
  const map={
    login:q('#parentLogin'),
    waiting:q('#parentWaiting'),
    revoked:q('#parentRevoked'),
    controller:q('#parentController')
  };
  Object.entries(map).forEach(([name,el])=>{
    if(!el)return;
    const show=name===which;
    el.hidden=!show;
    el.setAttribute('aria-hidden',String(!show));
    el.classList.toggle('is-visible',show);
  });
  q('#parentSignOut').hidden=usingCapability||which==='login'||which==='revoked';
}
async function resolveLearner(){
  if(window.BEYOND100_RESOLVE_LEARNER){
    try{await window.BEYOND100_RESOLVE_LEARNER(true)}catch{}
  }
}
function deviceLabel(){
  const ua=navigator.userAgent||'';
  if(/iPhone/i.test(ua))return'iPhone';
  if(/iPad/i.test(ua))return'iPad';
  if(/Android/i.test(ua))return'Android device';
  if(/Macintosh/i.test(ua))return'Mac';
  if(/Windows/i.test(ua))return'Windows device';
  return'Parent device';
}
async function sendPresence(){
  if(!usingCapability||!S)return;
  try{
    await S.F.updateDoc(focusRef(),{
      controllerPresence:{lastSeenAt:now(),device:deviceLabel(),page:'parent-controller'}
    });
  }catch{}
}
async function subscribeCapability(){
  const s=await sdk();
  setConnection('Connecting to Sai…','Persistent controller key recognised.','loading');
  unsubscribe?.();
  unsubscribe=s.F.onSnapshot(focusRef(),snap=>{
    if(!snap.exists()){setConnection('Controller unavailable','This QR/link does not point to an active controller.','error');setView('revoked');return}
    const doc=snap.data()||{};
    if(doc.active!==true||doc.app!=='beyond100'){setConnection('Controller disconnected','Create a new QR/link from Beyond 100.','error');setView('revoked');return}
    state=doc.state||null;
    const learner=state?.learnerLabel||doc.learnerLabel||'Sai';
    setConnection('Connected to '+learner,'Persistent QR controller · no Firebase login needed.','connected');
    if(!state?.active){setView('waiting');sendPresence();return}
    setView('controller');render();sendPresence();
  },()=>{setConnection('Connection failed','Check the network and try again.','error');setView('revoked')});
  clearInterval(presenceTimer);presenceTimer=setInterval(sendPresence,30000);
  sendPresence();
}
async function subscribeAuthenticated(){
  const s=await sdk();await s.auth.authStateReady();
  if(!s.auth.currentUser||s.auth.currentUser.uid!==CLOUD.ownerUid){setConnection('Not signed in','Sign in with the parent Firebase account.','idle');setView('login');return}
  setConnection('Firebase signed in','Finding Sai’s learner profile…','loading');
  await resolveLearner();
  unsubscribe?.();
  unsubscribe=s.F.onSnapshot(focusRef(),snap=>{
    const data=snap.data(),next=data?.state||null;
    state=next;
    if(!next?.active){setConnection('Signed in to Sai','Waiting for a Focus session on the child device.','connected');setView('waiting');return}
    setConnection('Signed in to Sai','Live Focus controller connected.','connected');
    setView('controller');render();
  },()=>setView('waiting'));
}
async function subscribe(){
  if(usingCapability)return subscribeCapability();
  return subscribeAuthenticated();
}
async function signIn(){
  const email=q('#parentEmail').value.trim(),password=q('#parentPassword').value;
  if(!email||!password){setLoginStatus('Enter email and password.');return}
  setLoginStatus('Signing in…');
  try{
    const s=await sdk();
    const cred=await s.Auth.signInWithEmailAndPassword(s.auth,email,password);
    if(cred.user.uid!==CLOUD.ownerUid){await s.Auth.signOut(s.auth);throw new Error('This is not the parent account.')}
    q('#parentPassword').value='';setLoginStatus('');await subscribeAuthenticated();
  }catch(e){setLoginStatus(e.message||'Could not sign in.')}
}
async function signOut(){
  const s=await sdk();unsubscribe?.();unsubscribe=null;clearInterval(presenceTimer);
  await s.Auth.signOut(s.auth);setView('login');
}
async function command(action,payload={}){
  if(!S)return;
  const row={id:crypto.randomUUID(),action,payload,at:now()};
  try{
    if(usingCapability){
      await S.F.updateDoc(focusRef(),{
        command:row,
        controllerPresence:{lastSeenAt:now(),device:deviceLabel(),page:'parent-controller'}
      });
    }else{
      if(!S.auth.currentUser)return;
      await S.F.setDoc(focusRef(),{command:row},{merge:true});
    }
  }catch(e){
    if(usingCapability)setView('revoked');
  }
}
function phaseRail(){
  if(!state)return'';
  return PHASES.map((p,i)=>{
    const st=state.phaseLog?.[p[0]]?.state||(state.phase===p[0]?'current':'future');
    const arrow=i<PHASES.length-1?'<span class="parent-phase-arrow">›</span>':'';
    const detail=state.phaseLog?.[p[0]];
    const title=st==='done'&&detail?.completedAt
      ?p[1]+' — completed '+new Date(detail.completedAt).toLocaleString('en-GB')+(detail.detail?' · '+detail.detail:'')
      :p[1];
    return '<button class="parent-phase-tile" type="button" data-phase="'+p[0]+'" data-state="'+st+'" title="'+esc(title)+'">'+p[2]+'</button>'+arrow;
  }).join('');
}
function controlButtons(items,attr,current){
  return items.map(x=>'<button type="button" data-'+attr+'="'+x[0]+'" class="'+(current===x[0]?'selected':'')+'">'+esc(x[1])+'</button>').join('');
}
function errorButtons(){
  return ERRORS.map(x=>'<button type="button" data-error="'+x[0]+'" class="'+(state?.currentError===x[0]?'selected':'')+'"><b>'+x[0]+'</b><small>'+esc(x[1])+'</small></button>').join('');
}
function suggestion(){
  if(!state?.currentOutcome)return state?.task?.kind==='question'
    ?'Let the child answer before helping. Move through the prompt ladder only if needed.'
    :'Discuss this one idea, then ask how it felt.';
  if(state.currentOutcome==='noConcept')return state.currentError==='Q'
    ?'Read the same wording aloud before explaining the maths.'
    :'Step back one layer and teach the missing idea.';
  if(state.currentOutcome==='prompted')return'Retest this later without the prompt; supported success is not yet retrieval.';
  if(state.currentOutcome==='hesitant')return'Try one varied example, then schedule retrieval rather than over-practising.';
  if(state.phase==='retrieve1'||state.phase==='retrieve2')return'If this was fluent and independent, preserve the next spaced check.';
  return'Use a different example or context before moving on.';
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
  q('#parentPairIdentity').textContent=usingCapability?'Paired to '+(state.learnerLabel||'Sai')+' · persistent controller':'Signed-in parent controller';
  q('#parentPhaseRail').innerHTML=phaseRail();
  q('#parentInstruction').textContent=state.task?.instruction||'';
  q('#parentPrompt').textContent=state.task?.prompt||'';
  q('#parentAnswer').textContent=state.task?.answer||'No answer stored for this task.';
  q('#parentConfidenceStatus').textContent=state.currentConfidence?'Child confidence: '+(CONFIDENCE[state.currentConfidence]||state.currentConfidence):'';
  q('#parentOutcomes').innerHTML=controlButtons(OUTCOMES,'outcome',state.currentOutcome);
  q('#parentPrompts').innerHTML=controlButtons(PROMPTS,'prompt',state.promptLevel||'independent');
  q('#parentErrors').innerHTML=errorButtons();
  q('#parentRecord').textContent=state.recordedCurrent?'Saved ✓':(state.task?.kind==='explanation'?'Mark phase complete':'Save response');
  q('#parentSuggestion').textContent=suggestion();
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
  const base=Number(state.timer?.elapsed||0);
  const started=Date.now();
  const draw=()=>{
    const value=base+(state.timer?.running?(Date.now()-started)/1000:0);
    el.textContent=value.toFixed(1)+'s';
  };
  draw();
  if(state.timer?.running)timerInterval=setInterval(draw,100);
}
async function refreshLiveState(){
  setConnection('Checking Sai’s Focus session…','Requesting the latest state from the child device.','loading');
  if(usingCapability){
    await command('request-state').catch(()=>{});
    await sendPresence();
  }
  // Reattach the listener too, so an iOS suspended listener cannot leave the
  // page visually stale.
  await subscribe().catch(()=>{});
}

async function init(){
  q('#parentSignIn').onclick=signIn;
  q('#parentSignOut').onclick=signOut;
  q('#parentRefresh').onclick=refreshLiveState;
  q('#parentTimer').onclick=()=>command('timer');
  q('#parentRecord').onclick=()=>command('record');
  q('#parentNext').onclick=()=>command('next');
  q('#saveParentNote').onclick=()=>command('parent-note',{text:q('#parentNote').value});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sendPresence()});

  try{
    const s=await sdk();
    if(usingCapability){
      setConnection('QR key recognised','Connecting to Sai’s controller…','loading');
      setView('waiting');
      await subscribeCapability();
      return;
    }
    await s.auth.authStateReady();
    s.Auth.onAuthStateChanged(s.auth,user=>{
      if(user?.uid===CLOUD.ownerUid)subscribeAuthenticated();else setView('login');
    });
    if(s.auth.currentUser?.uid===CLOUD.ownerUid)subscribeAuthenticated();else{setConnection('Not signed in','Sign in with the parent Firebase account.','idle');setView('login')}
  }catch{
    setConnection('Connection problem','Reload or check the network.','error');
    setView(usingCapability?'revoked':'login');
  }
}
init();
