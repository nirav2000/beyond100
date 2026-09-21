(()=>{
  'use strict';

  const CLOUD=window.BEYOND100_CLOUD;
  const DATA=window.BEYOND100_DATA;
  const TOPIC=DATA?.detailedTopics?.['Place Value & Number Structure'];
  const SESSION_KEY='beyond100.focus.session.v3';
  const PREF_KEY='beyond100.sidebar.preference.v1';
  const CONTROLLER_CACHE='beyond100.parent-controller.v1';
  const CONTROLLER_COLLECTION='beyond100_parent_controllers';
  const PHASES=[
    {id:'diagnose',label:'Diagnose',help:'Find the first fragile layer before teaching.',icon:'⌕'},
    {id:'teach',label:'Teach',help:'Explain or model only what is missing.',icon:'▤'},
    {id:'demonstrate',label:'Demonstrate',help:'Ask Sai to show or explain the idea back.',icon:'▣'},
    {id:'practise',label:'Practise',help:'Build accuracy with a few varied examples.',icon:'✎'},
    {id:'retrieve1',label:'Retrieve',help:'Bring it back later without a reminder.',icon:'↶'},
    {id:'retrieve2',label:'Retrieve again',help:'Bring it back again after a longer gap.',icon:'↺'},
    {id:'apply',label:'Apply',help:'Use it in unfamiliar wording or context.',icon:'→'}
  ];
  const OUTCOMES=[
    ['fast','Correct + fast'],
    ['hesitant','Correct + hesitant'],
    ['prompted','Incorrect → understands after prompt'],
    ['noConcept','Incorrect / no concept']
  ];
  const ERRORS=[
    ['K','Knowledge'],['C','Concept'],['Q','Question interpretation'],['P','Procedure'],
    ['F','Fluency'],['R','Reasoning'],['A','Attention']
  ];
  const PROMPTS=[
    ['independent','Independent'],
    ['read','Read aloud'],
    ['clarify','Clarified wording'],
    ['hint','Hint'],
    ['explained','Explained']
  ];
  const CONFIDENCE=[
    ['gotit','😄','Got it'],
    ['sense','🙂','Makes sense'],
    ['half','🤔','Half sure'],
    ['lost','😕','Don’t understand']
  ];

  let focusOn=false;
  let focusTarget=null;
  let session=loadSession();
  let timerStart=0;
  let timerElapsed=0;
  let timerTick=null;
  let remoteSdkPromise=null;
  let unsubscribeRemote=null;
  let lastCommandId='';
  let syncTimer=null;
  let controllerToken='';
  let controllerPresence=null;
  let pairingDialog=null;

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const now=()=>new Date().toISOString();
  const phaseById=id=>PHASES.find(p=>p.id===id)||PHASES[0];
  const currentPhase=()=>phaseById(session?.phase||'diagnose');
  const currentTask=()=>session?.tasks?.[session.index||0]||null;

  function loadSession(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}
  }
  function saveSession(){
    if(!session)return;
    session.updatedAt=now();
    localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    scheduleRemoteSync();
  }
  function freshSession(mode,phase,tasks,meta={}){
    const log={};
    PHASES.forEach(p=>log[p.id]={state:'future',completedAt:null,detail:''});
    log[phase]={state:'current',completedAt:null,detail:''};
    return{
      id:crypto.randomUUID(),active:true,mode,phase,tasks,index:0,
      topic:TOPIC?.id||'maths-place-value',topicLabel:'Place Value & Number Structure',
      year:meta.year||'Y5',scope:meta.scope||'Place Value',startedAt:now(),updatedAt:now(),
      phaseLog:log,responses:[],confidence:[],promptLevel:'independent',
      currentOutcome:'',currentError:'',recordedCurrent:false,parentNote:''
    };
  }

  function stageYearFrom(el){
    return el?.querySelector?.('.year-pill strong,.badge')?.textContent?.trim()||
      q('.hero-card strong')?.textContent?.trim()||'Y5';
  }
  function stageFromYear(year){return TOPIC?.stages?.find(s=>s.year===year)||TOPIC?.stages?.find(s=>s.year==='Y5')||TOPIC?.stages?.[0]}
  function targetLabel(el){
    if(!el)return 'Place Value';
    return el.dataset.noteLabel||
      el.querySelector?.('h1,h2,h3,h4,strong,.question-prompt')?.textContent?.trim()||
      'Place Value';
  }
  function targetText(el){
    if(!el)return '';
    const clone=el.cloneNode(true);
    clone.querySelectorAll('button,.focus-here-button,.score-row,.response-recorder').forEach(x=>x.remove());
    return clone.innerText.trim().replace(/\n{3,}/g,'\n\n');
  }

  function chooseDiagnosticQuestions(year,count=6){
    const yearNum=Number(String(year).replace(/\D/g,''))||5;
    const qs=[...(TOPIC?.questions||[])].sort((a,b)=>{
      const ad=Math.abs((Number(String(a.year).replace(/\D/g,''))||99)-yearNum);
      const bd=Math.abs((Number(String(b.year).replace(/\D/g,''))||99)-yearNum);
      return ad-bd;
    });
    return qs.slice(0,count).map((x,i)=>({
      id:x.id||('diag-'+i),kind:'question',phase:'diagnose',prompt:x.prompt,answer:x.answer||'',
      skill:x.skill||'Place value',year:x.year||year,type:x.type||'short',
      instruction:'Read the question yourself first.'
    }));
  }
  function quickCheckTasks(stage){
    return (stage?.quickChecks||[]).map((prompt,i)=>({
      id:'quick-'+stage.year+'-'+i,kind:'question',phase:'diagnose',prompt,answer:'',
      skill:stage.label||'Place value',year:stage.year,type:'quick',
      instruction:'Read the question yourself first.'
    }));
  }
  function explanationTasks(el){
    const text=targetText(el);
    const parts=text.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>20).slice(0,5);
    return (parts.length?parts:[text||'Look at this idea together.']).map((prompt,i)=>({
      id:'explain-'+i,kind:'explanation',phase:'teach',prompt,answer:'',skill:targetLabel(el),
      year:stageYearFrom(el),type:'explanation',instruction:'Read or discuss just this part.'
    }));
  }
  function retrievalCandidates(){
    let evidence={};try{evidence=JSON.parse(localStorage.getItem('beyond100.learning-evidence.v1')||'{}')}catch{}
    const rows=[];
    Object.values(evidence.cycles||{}).forEach(c=>{
      const s=c.steps||{};
      if(s.practise&&!s.retrieve1){
        const due=Date.parse(s.practise.at||0)+86400000;
        if(Date.now()>=due)rows.push({skill:c.skill,phase:'retrieve1',due});
      }else if(s.retrieve1&&!s.retrieve2){
        const due=Date.parse(s.retrieve1.at||0)+3*86400000;
        if(Date.now()>=due)rows.push({skill:c.skill,phase:'retrieve2',due});
      }
    });
    return rows.sort((a,b)=>a.due-b.due);
  }
  function retrievalTask(row){
    const match=(TOPIC?.questions||[]).find(x=>x.skill===row.skill)||null;
    return{
      id:'retrieve-'+crypto.randomUUID(),kind:'question',phase:row.phase,
      prompt:match?.prompt||('Without looking back, show me what you remember about '+row.skill+'. Explain your thinking.'),
      answer:match?.answer||'',skill:row.skill,year:match?.year||'',
      type:'retrieval',instruction:'Try this cold. No reminder or hint first.'
    };
  }

  function installSidebarControl(){
    const head=q('.sidebar-head');
    if(!head||q('#toggleSidebarCollapse'))return;
    const b=document.createElement('button');
    b.id='toggleSidebarCollapse';b.type='button';b.className='icon-button sidebar-collapse-button';
    b.setAttribute('aria-label','Collapse topics');b.title='Collapse topics';b.textContent='‹';
    head.appendChild(b);
    b.addEventListener('click',()=>{
      const collapsed=!document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem(PREF_KEY,collapsed?'collapsed':'expanded');
      document.body.classList.toggle('sidebar-collapsed',collapsed);
      b.textContent=collapsed?'›':'‹';
    });
  }

  function installFocusButton(){
    const bar=q('.topbar'),nav=q('#openNav');
    if(!bar||q('#focusModeButton'))return;
    const b=document.createElement('button');
    b.id='focusModeButton';b.className='focus-mode-button';b.type='button';
    b.innerHTML='<span aria-hidden="true">◎</span><span>Focus</span>';
    b.title='Start a focused learning session';
    b.addEventListener('click',()=>focusOn?exitFocus():enterFocus(null));
    bar.insertBefore(b,nav||null);
  }

  function focusableBlocks(){
    return qa([
      '#placeValueContext .topic-context-kid','#placeValueContext details',
      '.stage-card','.question-card','.mastery-card','.threshold','.misconception',
      '.assessment-topic','.assessment-card'
    ].join(',')).filter(el=>!el.closest('.notes-dialog')&&!el.hidden);
  }
  function installFocusHereButtons(){
    focusableBlocks().forEach(el=>{
      if(el.dataset.focusV9Prepared)return;
      el.dataset.focusV9Prepared='1';
      const b=document.createElement('button');
      b.className='focus-here-button';b.type='button';b.textContent='Focus here';
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        enterFocus(el);
      });
      el.appendChild(b);
    });
  }

  function phaseMarkup(){
    return PHASES.map((p,i)=>{
      const state=session?.phaseLog?.[p.id]?.state||(p.id===session?.phase?'current':'future');
      const log=session?.phaseLog?.[p.id]||{};
      const title=state==='done'&&log.completedAt
        ? p.label+' — completed '+new Date(log.completedAt).toLocaleString('en-GB')+(log.detail?' · '+log.detail:'')
        : p.label+' — '+p.help;
      const arrow=i<PHASES.length-1?'<span class="focus-v9-phase-arrow" aria-hidden="true">›</span>':'';
      return '<button type="button" class="focus-v9-phase-tile" data-phase="'+p.id+'" data-state="'+state+'" title="'+esc(title)+'" aria-label="'+esc(title)+'">'+
        '<span class="focus-v9-phase-icon">'+p.icon+'</span>'+
        '<span class="focus-v9-phase-check">✓</span>'+
      '</button>'+arrow;
    }).join('');
  }

  function launcherMarkup(){
    const year=stageYearFrom(focusTarget);
    const stage=stageFromYear(year);
    const retrievals=retrievalCandidates();
    const continueButton=session?.tasks?.length
      ? '<button class="focus-v9-launch-card continue" data-launch="continue"><span>↺</span><strong>Continue last session</strong><small>'+esc(session.scope||'Place Value')+'</small></button>'
      : '';
    const quick=focusTarget?.matches?.('.stage-card')
      ? '<button class="focus-v9-launch-card" data-launch="quick"><span>⚡</span><strong>Quick check this stage</strong><small>One question at a time</small></button>'
      : '';
    const discuss=focusTarget
      ? '<button class="focus-v9-launch-card" data-launch="discuss"><span>◉</span><strong>Focus on this section</strong><small>'+esc(targetLabel(focusTarget))+'</small></button>'
      : '';
    const retrieval=retrievals.length
      ? '<button class="focus-v9-launch-card due" data-launch="retrieve"><span>⏱</span><strong>Retrieval due</strong><small>'+esc(retrievals[0].skill)+'</small></button>'
      : '<button class="focus-v9-launch-card muted" disabled><span>⏱</span><strong>No retrieval due</strong><small>It will appear here when due</small></button>';
    return '<div class="focus-v9-launcher">'+
      '<p class="eyebrow">FOCUS MODE</p>'+
      '<h1>What are we doing?</h1>'+
      '<p>Show Sai one small thing at a time. Parent controls stay out of the way until you need them.</p>'+
      '<div class="focus-v9-launch-grid">'+
        continueButton+
        '<button class="focus-v9-launch-card primary" data-launch="diagnostic"><span>⌕</span><strong>Run '+esc(year)+' diagnostic</strong><small>Question-by-question · child reads first</small></button>'+
        quick+retrieval+discuss+
      '</div>'+
      '<div class="focus-v9-launch-actions"><button data-launch="guide">How Focus works</button><button data-launch="phone">Use iPhone as parent controller</button></div>'+
    '</div>';
  }

  function confidenceMarkup(){
    return '<div class="focus-v9-confidence">'+
      '<div><strong>How did that feel?</strong><span>There is no right choice — tap what feels true.</span></div>'+
      '<div class="focus-v9-confidence-grid">'+CONFIDENCE.map(c=>
        '<button type="button" data-confidence="'+c[0]+'" class="'+(c[0]==='gotit'?'gotit':'')+'"><span>'+c[1]+'</span><strong>'+esc(c[2])+'</strong></button>'
      ).join('')+'</div>'+
    '</div>';
  }

  function taskMarkup(task){
    if(!task)return launcherMarkup();
    const number=(session.index||0)+1,total=session.tasks.length;
    const eyebrow=session.mode==='diagnostic'?'DIAGNOSTIC · QUESTION '+number+' OF '+total:currentPhase().label.toUpperCase();
    return '<article class="focus-v9-task" data-kind="'+esc(task.kind)+'">'+
      '<div class="focus-v9-task-meta"><span>'+esc(eyebrow)+'</span><span>'+esc(task.year||'')+(task.skill?' · '+esc(task.skill):'')+'</span></div>'+
      '<div class="focus-v9-instruction">'+esc(task.instruction||'')+'</div>'+
      '<div class="focus-v9-prompt">'+esc(task.prompt).replace(/\n/g,'<br>')+'</div>'+
      (task.kind==='explanation'?confidenceMarkup():(session.recordedCurrent?confidenceMarkup():''))+
    '</article>';
  }

  function taskForPhase(id,skill,year){
    const matching=(TOPIC?.questions||[]).filter(x=>!skill||x.skill===skill);
    const nearest=matching[0]||(TOPIC?.questions||[]).find(x=>x.year===year)||(TOPIC?.questions||[])[0];
    const reasoning=matching.find(x=>x.type==='reasoning')||(TOPIC?.questions||[]).find(x=>x.type==='reasoning')||nearest;
    if(id==='teach')return{id:'teach-'+crypto.randomUUID(),kind:'explanation',phase:id,prompt:'Work on one idea only: '+skill+'. Explain it in a different way or with a concrete example, then ask Sai to tell you what the idea means.',answer:'',skill,year,type:'explanation',instruction:'Parent explains; Sai only needs to focus on this one idea.'};
    if(id==='demonstrate')return{id:'demonstrate-'+crypto.randomUUID(),kind:'question',phase:id,prompt:'Explain '+skill+' in your own words and show one example that proves you understand it.',answer:'A clear explanation plus a valid example.',skill,year,type:'explain',instruction:'This is not memory of the parent’s words — explain it your own way.'};
    if(id==='practise')return{id:'practise-'+crypto.randomUUID(),kind:'question',phase:id,prompt:nearest?.prompt||('Try a new example using '+skill+'.'),answer:nearest?.answer||'',skill,year:nearest?.year||year,type:nearest?.type||'short',instruction:'Try this while the learning is still fresh.'};
    if(id==='retrieve1'||id==='retrieve2')return{id:id+'-'+crypto.randomUUID(),kind:'question',phase:id,prompt:nearest?.prompt||('Without looking back, show what you remember about '+skill+'.'),answer:nearest?.answer||'',skill,year:nearest?.year||year,type:'retrieval',instruction:id==='retrieve1'?'Try this later, cold, with no reminder first.':'Try this after another gap, again without a reminder.'};
    if(id==='apply')return{id:'apply-'+crypto.randomUUID(),kind:'question',phase:id,prompt:reasoning?.prompt||('Use '+skill+' in a new situation and explain why your method works.'),answer:reasoning?.answer||'',skill,year:reasoning?.year||year,type:'reasoning',instruction:'This should feel a little different from the practice examples.'};
    return{id:'diagnose-'+crypto.randomUUID(),kind:'question',phase:'diagnose',prompt:nearest?.prompt||('Show what you know about '+skill+'.'),answer:nearest?.answer||'',skill,year:nearest?.year||year,type:nearest?.type||'short',instruction:'Read it yourself first. No teaching before the first attempt.'};
  }

  function replaceTaskForPhase(id){
    if(!session)return;
    const current=currentTask();
    const skill=current?.skill||session.scope||'Place Value';
    const year=current?.year||session.year||'Y5';
    session.tasks=[taskForPhase(id,skill,year)];
    session.index=0;resetForTask();
  }

  function parentCompactMarkup(){
    const task=currentTask();
    const recorded=session?.recordedCurrent;
    return '<div class="focus-v9-dock-compact">'+
      '<button id="focusDockTimer" type="button" title="Start or stop response timer"><span>⏱</span><strong id="focusDockTime">0.0s</strong></button>'+
      '<span class="focus-v9-dock-state">'+(session?.currentOutcome?esc(OUTCOMES.find(x=>x[0]===session.currentOutcome)?.[1]||session.currentOutcome):(recorded?'Recorded':'Awaiting response'))+'</span>'+
      '<button id="focusDockExpand" type="button">Parent ▴</button>'+
    '</div>';
  }

  function parentExpandedMarkup(){
    const promptLevel=session?.promptLevel||'independent';
    return '<div class="focus-v9-parent-expanded">'+
      '<div class="focus-v9-parent-head"><div><p class="eyebrow">PARENT</p><h3>Observe · record · decide</h3></div><button id="focusDockCollapse" type="button" aria-label="Collapse parent controls">×</button></div>'+
      '<div class="focus-v9-parent-row timer"><button id="focusTimerButton" type="button">'+(timerStart?'Stop timer':'Start timer')+'</button><strong id="focusTimerValue">0.0s</strong><span>Auto-starts for each question</span></div>'+
      '<div class="focus-v9-parent-group"><span>Response</span><div class="focus-v9-outcomes">'+OUTCOMES.map(o=>'<button type="button" data-outcome="'+o[0]+'" class="'+(session?.currentOutcome===o[0]?'selected':'')+'">'+esc(o[1])+'</button>').join('')+'</div></div>'+
      '<div class="focus-v9-parent-group"><span>Prompt used</span><div class="focus-v9-prompts">'+PROMPTS.map(p=>'<button type="button" data-prompt="'+p[0]+'" class="'+(promptLevel===p[0]?'selected':'')+'">'+esc(p[1])+'</button>').join('')+'</div></div>'+
      '<div class="focus-v9-parent-group"><span>If it broke down, why?</span><div class="focus-v9-errors">'+ERRORS.map(e=>'<button type="button" data-error="'+e[0]+'" class="'+(session?.currentError===e[0]?'selected':'')+'" title="'+esc(e[1])+'"><b>'+e[0]+'</b><small>'+esc(e[1])+'</small></button>').join('')+'</div></div>'+
      (currentTask()?.answer?'<details class="focus-v9-parent-answer"><summary>Reveal answer</summary><p>'+esc(currentTask().answer)+'</p></details>':'')+
      '<div class="focus-v9-suggestion"><span>Suggested next step</span><strong>'+esc(suggestedNext())+'</strong></div>'+
      '<div class="focus-v9-parent-actions">'+
        '<button id="focusRecordResponse" type="button" class="primary">'+(session?.recordedCurrent?'Saved ✓':(currentTask()?.kind==='explanation'?'Mark phase complete':'Save response'))+'</button>'+
        '<button id="focusNextTask" type="button" '+(!session?.recordedCurrent&&currentTask()?.kind==='question'?'disabled':'')+'>'+nextTaskLabel()+'</button>'+
      '</div>'+
      '<div class="focus-v9-parent-subactions"><button id="focusAddNote" type="button">Add note</button><button id="focusPhoneControl" type="button">📱 Use iPhone</button><button id="focusGuide" type="button">? Guide</button></div>'+
      '<div class="focus-v9-parent-stats">'+statsMarkup()+'</div>'+
    '</div>';
  }

  function suggestedNext(){
    if(!session?.currentOutcome)return currentTask()?.kind==='question'
      ?'Let Sai answer before helping. If needed, move through the prompt ladder.'
      :'Discuss only this part, then ask Sai how it felt.';
    if(session.currentOutcome==='noConcept')return session.currentError==='Q'
      ?'Try reading the same wording aloud. If that fixes it, language processing may be the barrier.'
      :'Step back one layer and teach the missing idea rather than repeating the same question.';
    if(session.currentOutcome==='prompted')return'Count this as supported understanding, then retrieve the same idea later without the prompt.';
    if(session.currentOutcome==='hesitant')return'Try one varied example. If still correct, schedule retrieval rather than over-practising.';
    if(session.phase==='diagnose')return'Continue until you find the first layer where fluency or explanation becomes fragile.';
    if(session.phase==='retrieve1'||session.phase==='retrieve2')return'If this was fluent and independent, keep the next spaced check rather than reteaching.';
    return'Use a different example or representation before moving on.';
  }

  function statsMarkup(){
    const responses=session?.responses||[];
    const c={fast:0,hesitant:0,prompted:0,noConcept:0};
    responses.forEach(r=>{if(c[r.outcome]!==undefined)c[r.outcome]++});
    return '<span><b>'+responses.length+'</b> recorded</span>'+
      '<span><b>'+c.fast+'</b> fast</span><span><b>'+c.hesitant+'</b> hesitant</span>'+
      '<span><b>'+c.prompted+'</b> prompted</span><span><b>'+c.noConcept+'</b> no concept</span>';
  }
  function nextTaskLabel(){
    if(!session?.tasks?.length)return'Next';
    if(session.index>=session.tasks.length-1)return session.mode==='diagnostic'?'Finish diagnostic':'Finish';
    return'Next task →';
  }

  function render(){
    const overlay=q('#focusV9');
    if(!overlay)return;
    const task=session?.active?currentTask():null;
    overlay.hidden=!focusOn;
    document.body.classList.toggle('focus-mode',focusOn);
    if(!focusOn)return;

    q('#focusV9PhaseRail').innerHTML=session?.active&&session?.tasks?.length?phaseMarkup():'';
    q('#focusV9Child').innerHTML=task?taskMarkup(task):launcherMarkup();
    q('#focusV9Dock').innerHTML=session?.active&&session?.tasks?.length?parentCompactMarkup():'';

    bindLauncher();
    bindChildConfidence();
    bindPhaseRail();
    bindCompactDock();

    if(task&&task.kind==='question'&&!session.recordedCurrent&&!timerStart)startTimer();
    updateTimerDisplays();
    publishRemoteState();
  }

  function bindLauncher(){
    qa('[data-launch]',q('#focusV9Child')).forEach(b=>b.addEventListener('click',()=>{
      const action=b.dataset.launch;
      if(action==='continue'){
        session.active=true;focusOn=true;render();return;
      }
      if(action==='diagnostic'){
        const year=stageYearFrom(focusTarget);
        session=freshSession('diagnostic','diagnose',chooseDiagnosticQuestions(year,6),{year,scope:year+' diagnostic'});
        saveSession();render();return;
      }
      if(action==='quick'){
        const year=stageYearFrom(focusTarget),stage=stageFromYear(year);
        session=freshSession('diagnostic','diagnose',quickCheckTasks(stage),{year,scope:year+' quick check'});
        saveSession();render();return;
      }
      if(action==='retrieve'){
        const row=retrievalCandidates()[0];if(!row)return;
        session=freshSession('retrieval',row.phase,[retrievalTask(row)],{year:'',scope:row.skill});
        saveSession();render();return;
      }
      if(action==='discuss'){
        const year=stageYearFrom(focusTarget);
        session=freshSession('learning','teach',explanationTasks(focusTarget),{year,scope:targetLabel(focusTarget)});
        saveSession();render();return;
      }
      if(action==='guide'){window.BEYOND100_OPEN_GUIDE?.('focus');return}
      if(action==='phone'){shareParentController();return}
    }));
  }

  function bindChildConfidence(){
    qa('[data-confidence]',q('#focusV9Child')).forEach(b=>b.addEventListener('click',()=>{
      const value=b.dataset.confidence;
      qa('[data-confidence]',q('#focusV9Child')).forEach(x=>x.classList.toggle('selected',x===b));
      const task=currentTask();if(!task)return;
      const entry={id:crypto.randomUUID(),taskId:task.id,value,at:now(),phase:session.phase};
      session.confidence.push(entry);session.currentConfidence=value;saveSession();
      window.BEYOND100_EVIDENCE?.recordConfidence?.({
        skill:task.skill,prompt:task.prompt,confidence:value,phase:session.phase,taskId:task.id
      });
      window.BEYOND100_NOTES_TOAST?.('Thanks — '+(CONFIDENCE.find(x=>x[0]===value)?.[2]||value));
      publishRemoteState();
    }));
  }

  function bindPhaseRail(){
    qa('[data-phase]',q('#focusV9PhaseRail')).forEach(b=>b.addEventListener('click',()=>selectPhase(b.dataset.phase,true)));
  }

  function selectPhase(id,direct=false){
    if(!session)return;
    const old=session.phase;
    if(old===id)return;
    if(session.phaseLog?.[old]?.state==='current'&&(session.recordedCurrent||session.currentConfidence)){
      session.phaseLog[old].state='done';
      session.phaseLog[old].completedAt=now();
      session.phaseLog[old].detail=session.currentOutcome
        ? (OUTCOMES.find(x=>x[0]===session.currentOutcome)?.[1]||session.currentOutcome)
        : 'Completed';
    }else if(session.phaseLog?.[old]?.state==='current'){
      session.phaseLog[old].state='future';
    }
    session.phase=id;
    Object.keys(session.phaseLog||{}).forEach(k=>{
      if(session.phaseLog[k].state==='current')session.phaseLog[k].state='future';
    });
    if(session.phaseLog?.[id])session.phaseLog[id].state='current';
    replaceTaskForPhase(id);
    saveSession();render();
  }

  function markPhaseDone(detail=''){
    if(!session?.phaseLog?.[session.phase])return;
    const log=session.phaseLog[session.phase];
    log.state='done';log.completedAt=now();log.detail=detail;
  }

  function bindCompactDock(){
    q('#focusDockTimer')?.addEventListener('click',toggleTimer);
    q('#focusDockExpand')?.addEventListener('click',expandParent);
  }
  function expandParent(){
    const dock=q('#focusV9Dock');if(!dock)return;
    dock.classList.add('expanded');
    dock.innerHTML=parentExpandedMarkup();
    bindExpandedParent();
    updateTimerDisplays();
  }
  function collapseParent(){
    const dock=q('#focusV9Dock');if(!dock)return;
    dock.classList.remove('expanded');dock.innerHTML=parentCompactMarkup();bindCompactDock();updateTimerDisplays();
  }
  function bindExpandedParent(){
    q('#focusDockCollapse')?.addEventListener('click',collapseParent);
    q('#focusTimerButton')?.addEventListener('click',toggleTimer);
    qa('[data-outcome]',q('#focusV9Dock')).forEach(b=>b.addEventListener('click',()=>{
      session.currentOutcome=b.dataset.outcome;saveSession();expandParent();
    }));
    qa('[data-error]',q('#focusV9Dock')).forEach(b=>b.addEventListener('click',()=>{
      session.currentError=session.currentError===b.dataset.error?'':b.dataset.error;saveSession();expandParent();
    }));
    qa('[data-prompt]',q('#focusV9Dock')).forEach(b=>b.addEventListener('click',()=>{
      session.promptLevel=b.dataset.prompt;saveSession();expandParent();
    }));
    q('#focusRecordResponse')?.addEventListener('click',recordCurrentResponse);
    q('#focusNextTask')?.addEventListener('click',nextTask);
    q('#focusAddNote')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('beyond100-focus-note',{detail:{target:focusTarget}})));
    q('#focusPhoneControl')?.addEventListener('click',shareParentController);
    q('#focusGuide')?.addEventListener('click',()=>window.BEYOND100_OPEN_GUIDE?.('focus'));
  }

  function startTimer(){
    timerElapsed=0;timerStart=performance.now();
    clearInterval(timerTick);timerTick=setInterval(updateTimerDisplays,100);
  }
  function stopTimer(){
    if(timerStart){timerElapsed+=(performance.now()-timerStart)/1000;timerStart=0}
    clearInterval(timerTick);timerTick=null;updateTimerDisplays();return timerElapsed;
  }
  function toggleTimer(){
    timerStart?stopTimer():startTimer();
    publishRemoteState();
  }
  function elapsed(){
    return timerElapsed+(timerStart?(performance.now()-timerStart)/1000:0);
  }
  function updateTimerDisplays(){
    const value=elapsed().toFixed(1)+'s';
    const a=q('#focusDockTime'),b=q('#focusTimerValue');
    if(a)a.textContent=value;if(b)b.textContent=value;
    const btn=q('#focusTimerButton');if(btn)btn.textContent=timerStart?'Stop timer':'Start timer';
  }

  function recordCurrentResponse(){
    const task=currentTask();if(!task||!session||session.recordedCurrent)return;
    if(task.kind==='question'&&!session.currentOutcome){
      window.BEYOND100_NOTES_TOAST?.('Choose the response first.');
      return;
    }
    const seconds=stopTimer();
    const response={
      id:crypto.randomUUID(),taskId:task.id,taskIndex:session.index,prompt:task.prompt,skill:task.skill,
      year:task.year,type:task.type,phase:session.phase,outcome:session.currentOutcome||'observed',
      errorCode:session.currentError||null,promptLevel:session.promptLevel||'independent',
      responseSeconds:seconds||null,confidence:session.currentConfidence||null,createdAt:now()
    };
    session.responses.push(response);
    session.recordedCurrent=true;
    const label=OUTCOMES.find(x=>x[0]===response.outcome)?.[1]||response.outcome;
    if(session.mode!=='diagnostic')markPhaseDone(label);
    saveSession();
    if(task.kind==='question'){
      window.BEYOND100_EVIDENCE?.recordFocusResponse?.({
        skill:task.skill,prompt:task.prompt,outcome:response.outcome,errorCode:response.errorCode,
        responseSeconds:response.responseSeconds,phase:response.phase,year:task.year,
        promptLevel:response.promptLevel,confidence:response.confidence,source:'focus-v9'
      });
    }
    render();
    expandParent();
    window.BEYOND100_NOTES_TOAST?.('Response saved');
  }

  function resetForTask(){
    session.currentOutcome='';session.currentError='';session.currentConfidence='';
    session.promptLevel='independent';session.recordedCurrent=false;
    timerElapsed=0;timerStart=0;clearInterval(timerTick);timerTick=null;
  }
  function nextTask(){
    if(!session)return;
    if(session.index<session.tasks.length-1){
      session.index++;resetForTask();saveSession();render();return;
    }
    if(session.mode==='diagnostic'){
      markPhaseDone(session.responses.length+' responses');
      session.active=false;saveSession();
      showDiagnosticFinish();
      return;
    }
    markPhaseDone('Completed');session.active=false;saveSession();renderLauncherAfterFinish();
  }

  function showDiagnosticFinish(){
    focusOn=true;
    const child=q('#focusV9Child');
    const weak=session.responses.find(r=>['hesitant','prompted','noConcept'].includes(r.outcome));
    child.innerHTML='<div class="focus-v9-finish"><span>✓</span><h1>Diagnostic complete</h1><p>'+session.responses.length+' question-level responses recorded.</p>'+
      (weak?'<strong>First fragile response: '+esc(weak.skill)+' · '+esc(OUTCOMES.find(x=>x[0]===weak.outcome)?.[1]||weak.outcome)+'</strong>':'<strong>No fragile response in this set.</strong>')+
      '<div><button id="focusFinishTeach" class="primary">Teach the fragile point</button><button id="focusFinishExit">Exit Focus</button></div></div>';
    q('#focusFinishTeach')?.addEventListener('click',()=>{
      const targetSkill=weak?.skill||session.responses[0]?.skill||'Place Value';
      const task={id:'teach-'+crypto.randomUUID(),kind:'explanation',phase:'teach',
        prompt:'Talk through '+targetSkill+'. Ask Sai to explain it back in his own words before moving on.',
        answer:'',skill:targetSkill,year:weak?.year||session.year,type:'explanation',
        instruction:'Work on one idea only. Change the explanation if it does not land.'};
      session=freshSession('learning','teach',[task],{year:weak?.year||session.year,scope:targetSkill});
      saveSession();render();
    });
    q('#focusFinishExit')?.addEventListener('click',exitFocus);
    collapseParent();
  }
  function renderLauncherAfterFinish(){
    session=null;localStorage.removeItem(SESSION_KEY);render();
  }

  function enterFocus(target){
    focusTarget=target||null;focusOn=true;
    document.body.classList.add('focus-mode');
    const overlay=q('#focusV9');if(overlay)overlay.hidden=false;
    render();
    startRemoteBridge();
  }
  function exitFocus(){
    stopTimer();focusOn=false;
    if(session){session.active=false;saveSession()}
    document.body.classList.remove('focus-mode');
    const overlay=q('#focusV9');if(overlay)overlay.hidden=true;
    publishRemoteState();
  }

  function overlayMarkup(){
    return '<div id="focusV9" class="focus-v9" hidden>'+
      '<header class="focus-v9-top">'+
        '<button id="focusV9Exit" type="button" aria-label="Exit Focus">×</button>'+
        '<div class="focus-v9-title"><strong>Focus</strong><span id="focusV9Scope">Place Value</span></div>'+
        '<div id="focusV9PhaseRail" class="focus-v9-phase-rail"></div>'+
        '<button id="focusV9Guide" type="button" title="How Focus works">?</button>'+
      '</header>'+
      '<main id="focusV9Child" class="focus-v9-child"></main>'+
      '<aside id="focusV9Dock" class="focus-v9-dock"></aside>'+
    '</div>';
  }

  function installOverlay(){
    if(q('#focusV9'))return;
    document.body.insertAdjacentHTML('beforeend',overlayMarkup());
    q('#focusV9Exit').addEventListener('click',exitFocus);
    q('#focusV9Guide').addEventListener('click',()=>window.BEYOND100_OPEN_GUIDE?.('focus'));
  }

  function validControllerToken(value){
    return /^[A-Za-z0-9_-]{43}$/.test(String(value||''));
  }
  function randomControllerToken(){
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    let raw='';bytes.forEach(b=>raw+=String.fromCharCode(b));
    return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function cachedController(){
    try{
      const row=JSON.parse(localStorage.getItem(CONTROLLER_CACHE)||'null');
      return row&&validControllerToken(row.token)?row:null;
    }catch{return null}
  }
  function cacheController(token,learnerId){
    if(!validControllerToken(token))return;
    localStorage.setItem(CONTROLLER_CACHE,JSON.stringify({token,learnerId,active:true,updatedAt:now()}));
  }
  function clearControllerCache(){
    localStorage.removeItem(CONTROLLER_CACHE);
  }
  function controllerUrl(token){
    const url=new URL('parent.html',location.href);
    url.hash='control='+encodeURIComponent(token);
    return url.toString();
  }

  function ensurePairingDialog(){
    if(pairingDialog&&document.contains(pairingDialog))return pairingDialog;
    const d=document.createElement('dialog');
    d.id='parentPairingDialog';d.className='parent-pairing-dialog';d.dataset.noteIgnore='true';
    d.innerHTML='<div class="parent-pairing-shell">'+
      '<header><div><p class="eyebrow">PARENT CONTROLLER</p><h2>Open on another device</h2></div><button type="button" id="closeParentPairing" aria-label="Close">×</button></header>'+
      '<div class="parent-pairing-body">'+
        '<div id="parentPairQr" class="parent-pair-qr" aria-label="QR code for parent controller"></div>'+
        '<div class="parent-pair-copy">'+
          '<strong>Scan with the iPhone camera</strong>'+
          '<p>This controller belongs to <b id="parentPairLearner">Sai</b> and continues to work across future Focus sessions until you disconnect it.</p>'+
          '<label>Controller link<div><input id="parentPairUrl" readonly><button id="copyParentPair" type="button">Copy</button></div></label>'+
          '<div class="parent-pair-actions"><button id="shareParentPair" type="button" class="primary">Share link</button><button id="openParentPair" type="button">Open here</button></div>'+
          '<div id="parentPairStatus" class="parent-pair-status">Preparing controller…</div>'+
        '</div>'+
      '</div>'+
      '<footer><span>Persistent access · no extra login · revoke manually</span><button id="disconnectParentPair" type="button" class="danger">Disconnect controller</button></footer>'+
    '</div>';
    document.body.appendChild(d);pairingDialog=d;
    q('#closeParentPairing',d).onclick=()=>d.close();
    d.addEventListener('click',e=>{if(e.target===d)d.close()});
    q('#copyParentPair',d).onclick=async()=>{
      const url=q('#parentPairUrl',d).value;
      try{await navigator.clipboard.writeText(url);window.BEYOND100_NOTES_TOAST?.('Parent controller link copied')}
      catch{}
    };
    q('#shareParentPair',d).onclick=async()=>{
      const url=q('#parentPairUrl',d).value;
      if(!url)return;
      try{
        if(navigator.share)await navigator.share({title:'Beyond 100 parent controller',text:'Open the Beyond 100 parent controller',url});
        else{await navigator.clipboard.writeText(url);window.BEYOND100_NOTES_TOAST?.('Parent controller link copied')}
      }catch{}
    };
    q('#openParentPair',d).onclick=()=>{
      const url=q('#parentPairUrl',d).value;if(url)window.open(url,'_blank','noopener');
    };
    q('#disconnectParentPair',d).onclick=async()=>{
      if(!controllerToken)return;
      if(!confirm('Disconnect this parent-controller key? Devices using the existing QR/link will stop working.'))return;
      await revokeControllerCapability();
      d.close();
      window.BEYOND100_NOTES_TOAST?.('Parent controller disconnected');
    };
    return d;
  }

  function renderPairing(token,error=''){
    const d=ensurePairingDialog();
    const learner=CLOUD.learnerLabel||CLOUD.learner?.label||'Sai';
    q('#parentPairLearner',d).textContent=learner;
    const url=validControllerToken(token)?controllerUrl(token):new URL('parent.html',location.href).toString();
    q('#parentPairUrl',d).value=url;
    const qr=q('#parentPairQr',d);qr.innerHTML='';
    if(validControllerToken(token)&&window.QRCode){
      new QRCode(qr,{text:url,width:214,height:214,correctLevel:QRCode.CorrectLevel.M});
    }else{
      qr.innerHTML='<div class="parent-pair-qr-fallback">QR unavailable</div>';
    }
    const status=q('#parentPairStatus',d);
    if(error){
      status.dataset.state='error';status.textContent=error;
    }else{
      const seen=controllerPresence?.lastSeenAt?Date.parse(controllerPresence.lastSeenAt):0;
      const connected=seen&&Date.now()-seen<90000;
      status.dataset.state=connected?'connected':'ready';
      status.textContent=connected?'● Parent controller connected':'Ready · this key does not expire automatically';
    }
  }

  async function shareParentController(){
    const d=ensurePairingDialog();
    if(!d.open)d.showModal();
    q('#parentPairStatus',d).textContent='Preparing persistent controller…';
    try{
      const S=await remoteSdk();await S.auth.authStateReady();
      if(!S.auth.currentUser||S.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Sign in to Firebase on this device first.');
      if(window.BEYOND100_RESOLVE_LEARNER)await window.BEYOND100_RESOLVE_LEARNER().catch(()=>{});
      const token=await ensureControllerCapability(S);
      renderPairing(token);
    }catch(e){
      // The authenticated controller remains available as a fallback until the
      // capability Firestore rule has been deployed.
      renderPairing('',(e?.message||'Could not create the controller key.')+' You can still open the controller and sign in.');
    }
  }

  function remoteState(){
    if(!session)return{active:false,learnerId:CLOUD.learnerId||CLOUD.legacyLearnerId,updatedAt:now()};
    const task=currentTask();
    return{
      active:focusOn&&!!session.active,sessionId:session.id,mode:session.mode,phase:session.phase,
      phaseLog:session.phaseLog,index:session.index,total:session.tasks.length,
      topicLabel:session.topicLabel,year:session.year,scope:session.scope,
      learnerId:CLOUD.learnerId||CLOUD.legacyLearnerId,learnerLabel:CLOUD.learnerLabel||CLOUD.learner?.label||'Sai',
      task:task?{id:task.id,kind:task.kind,prompt:task.prompt,answer:task.answer,skill:task.skill,year:task.year,instruction:task.instruction}:null,
      promptLevel:session.promptLevel,currentOutcome:session.currentOutcome,currentError:session.currentError,
      recordedCurrent:session.recordedCurrent,currentConfidence:session.currentConfidence||null,
      stats:session.responses,startedAt:session.startedAt,updatedAt:now(),
      timer:{running:!!timerStart,elapsed:elapsed(),startedAt:timerStart?now():null}
    };
  }

  async function remoteSdk(){
    if(remoteSdkPromise)return remoteSdkPromise;
    remoteSdkPromise=(async()=>{
      const[A,Auth,F]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
      ]);
      const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);
      return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)};
    })();
    return remoteSdkPromise;
  }

  function controllerIndexRef(S){
    return S.F.doc(S.db,...(CLOUD.firestoreBase||CLOUD.legacyFirestoreBase),'beyond100-parent-controller');
  }
  function capabilityRef(S,token=controllerToken){
    if(!validControllerToken(token))throw new Error('Parent controller key is not available.');
    return S.F.doc(S.db,CONTROLLER_COLLECTION,token);
  }

  async function ensureControllerCapability(S){
    if(validControllerToken(controllerToken))return controllerToken;
    const local=cachedController();
    const index=await S.F.getDoc(controllerIndexRef(S));
    const data=index.exists()?index.data():null;
    let token=validControllerToken(data?.token)&&data?.active!==false?data.token:'';
    if(!token&&local&&data?.active!==false&&local.learnerId===(CLOUD.learnerId||CLOUD.legacyLearnerId))token=local.token;

    if(token){
      try{
        const cap=await S.F.getDoc(capabilityRef(S,token));
        if(cap.exists()&&cap.data()?.active===true){
          controllerToken=token;cacheController(token,CLOUD.learnerId||CLOUD.legacyLearnerId);return token;
        }
      }catch{}
    }

    token=randomControllerToken();
    const learnerId=CLOUD.learnerId||CLOUD.legacyLearnerId;
    const learnerLabel=CLOUD.learnerLabel||CLOUD.learner?.label||'Sai';
    const created=now();
    await S.F.setDoc(capabilityRef(S,token),{
      app:'beyond100',kind:'parent-controller-capability',controllerVersion:1,active:true,
      ownerUid:CLOUD.ownerUid,learnerId,learnerLabel,createdAt:created,updatedAt:created,
      revokedAt:null,state:remoteState(),command:null,commandAck:null,controllerPresence:null
    });
    await S.F.setDoc(controllerIndexRef(S),{
      app:'beyond100',kind:'parent-controller-index',active:true,token,learnerId,learnerLabel,
      createdAt:created,updatedAt:created
    },{merge:true});
    controllerToken=token;cacheController(token,learnerId);return token;
  }

  async function revokeControllerCapability(){
    const S=await remoteSdk();await S.auth.authStateReady();
    if(!S.auth.currentUser||S.auth.currentUser.uid!==CLOUD.ownerUid)throw new Error('Parent Firebase sign-in required.');
    if(!validControllerToken(controllerToken)){
      const index=await S.F.getDoc(controllerIndexRef(S));
      const token=index.exists()?index.data()?.token:'';
      if(validControllerToken(token))controllerToken=token;
    }
    if(validControllerToken(controllerToken)){
      await S.F.setDoc(capabilityRef(S),{active:false,revokedAt:now(),updatedAt:now(),state:{active:false,updatedAt:now()}},{merge:true});
    }
    await S.F.setDoc(controllerIndexRef(S),{active:false,token:null,updatedAt:now(),revokedAt:now()},{merge:true});
    controllerToken='';controllerPresence=null;clearControllerCache();
    unsubscribeRemote?.();unsubscribeRemote=null;
  }

  async function startRemoteBridge(){
    try{
      const S=await remoteSdk();await S.auth.authStateReady();
      if(!S.auth.currentUser||S.auth.currentUser.uid!==CLOUD.ownerUid)return;
      if(window.BEYOND100_RESOLVE_LEARNER)await window.BEYOND100_RESOLVE_LEARNER().catch(()=>{});
      const token=await ensureControllerCapability(S);
      unsubscribeRemote?.();
      unsubscribeRemote=S.F.onSnapshot(capabilityRef(S,token),snap=>{
        const data=snap.data()||{};
        controllerPresence=data.controllerPresence||null;
        if(pairingDialog?.open)renderPairing(token);
        const cmd=data.command;
        if(!cmd?.id||cmd.id===lastCommandId)return;
        lastCommandId=cmd.id;applyRemoteCommand(cmd).catch(()=>{});
      });
      await publishRemoteState();
    }catch{}
  }

  function scheduleRemoteSync(){
    clearTimeout(syncTimer);syncTimer=setTimeout(()=>publishRemoteState(),250);
  }

  async function publishRemoteState(){
    try{
      const S=await remoteSdk();await S.auth.authStateReady();
      if(!S.auth.currentUser||S.auth.currentUser.uid!==CLOUD.ownerUid)return;
      if(!validControllerToken(controllerToken))await ensureControllerCapability(S);
      await S.F.setDoc(capabilityRef(S),{
        app:'beyond100',kind:'parent-controller-capability',controllerVersion:1,active:true,
        ownerUid:CLOUD.ownerUid,learnerId:CLOUD.learnerId||CLOUD.legacyLearnerId,
        learnerLabel:CLOUD.learnerLabel||CLOUD.learner?.label||'Sai',
        updatedAt:now(),state:remoteState(),commandAck:lastCommandId||null
      },{merge:true});
    }catch{}
  }

  async function applyRemoteCommand(cmd){
    const action=cmd.action,p=cmd.payload||{};
    if(action==='set-phase'){selectPhase(p.phase,true);return}
    if(action==='set-outcome'&&session){session.currentOutcome=p.outcome||'';saveSession();render();return}
    if(action==='set-error'&&session){session.currentError=p.error||'';saveSession();render();return}
    if(action==='set-prompt'&&session){session.promptLevel=p.prompt||'independent';saveSession();render();return}
    if(action==='record'){recordCurrentResponse();return}
    if(action==='next'){nextTask();return}
    if(action==='timer'){toggleTimer();return}
    if(action==='confidence'){
      const fake=q('[data-confidence="'+CSS.escape(p.value||'')+'"]',q('#focusV9Child'));fake?.click();return
    }
    if(action==='parent-note'&&session){session.parentNote=p.text||'';saveSession();return}
  }

  function watch(){
    new MutationObserver(()=>installFocusHereButtons()).observe(q('#main')||document.body,{childList:true,subtree:true});
    window.addEventListener('beyond100-learner-resolved',()=>startRemoteBridge());
    window.addEventListener('beyond100-firebase-auth',e=>{if(e.detail?.signedIn)startRemoteBridge()});
  }

  function init(){
    installSidebarControl();installFocusButton();installOverlay();installFocusHereButtons();watch();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();