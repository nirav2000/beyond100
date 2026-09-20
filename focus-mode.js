(()=> {
  const PREF_KEY='beyond100.sidebar.preference.v1';
  const FOCUS_KEY='beyond100.focus.state.v2';
  const EVIDENCE_KEY='beyond100.learning-evidence.v1';
  let focusOn=false,focusTarget=null,timerStarted=0,timerTick=null,lastOutcome='',lastError='',autoCollapsed=false;

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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
  const PHASES=[
    ['diagnose','Diagnose'],['teach','Teach'],['demonstrate','Demonstrate understanding'],
    ['practise','Practise'],['retrieve1','Retrieve'],['retrieve2','Retrieve again'],['apply','Apply in a new context']
  ];
  function phaseIcon(id){
    const icons={
      diagnose:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/><path d="M8 10.5h5M10.5 8v5"/></svg>',
      teach:'<svg viewBox="0 0 24 24"><path d="M4 5.5c3-1 5-.5 8 1v12c-3-1.5-5-2-8-1z"/><path d="M20 5.5c-3-1-5-.5-8 1v12c3-1.5 5-2 8-1z"/></svg>',
      demonstrate:'<svg viewBox="0 0 24 24"><path d="M5 18h14"/><path d="M7 15V7h10v8"/><path d="m9 11 2 2 4-4"/></svg>',
      practise:'<svg viewBox="0 0 24 24"><path d="m5 19 3.5-.8L19 7.7 16.3 5 5.8 15.5z"/><path d="m14.8 6.5 2.7 2.7"/></svg>',
      retrieve1:'<svg viewBox="0 0 24 24"><path d="M5 8a8 8 0 1 1 1 9"/><path d="M5 4v4h4"/><path d="M12 8v5l3 2"/></svg>',
      retrieve2:'<svg viewBox="0 0 24 24"><path d="M5 8a8 8 0 1 1 1 9"/><path d="M5 4v4h4"/><path d="M9 10h6M9 14h6"/></svg>',
      apply:'<svg viewBox="0 0 24 24"><path d="M4 12h11"/><path d="m12 7 5 5-5 5"/><path d="M17 5h3v14h-3"/></svg>'
    };return icons[id]||'';
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
      localStorage.setItem(PREF_KEY,collapsed?'collapsed':'expanded');applySidebar(collapsed,false);
    });
  }

  function applySidebar(collapsed,isAuto){
    autoCollapsed=!!isAuto;
    document.body.classList.toggle('sidebar-collapsed',collapsed);
    const b=q('#toggleSidebarCollapse');
    if(b){b.textContent=collapsed?'›':'‹';b.setAttribute('aria-label',collapsed?'Expand topics':'Collapse topics');b.title=collapsed?'Expand topics':'Collapse topics'}
  }

  function autoSidebar(){
    if(innerWidth<=980){applySidebar(false,true);return}
    if(focusOn){applySidebar(true,true);return}
    const pref=localStorage.getItem(PREF_KEY);
    if(pref==='collapsed'){applySidebar(true,false);return}
    if(pref==='expanded'){applySidebar(false,false);return}
    applySidebar(innerWidth<1280,true);
  }

  function installFocusButton(){
    const bar=q('.topbar'),nav=q('#openNav');
    if(!bar||q('#focusModeButton'))return;
    const b=document.createElement('button');
    b.id='focusModeButton';b.className='focus-mode-button';b.type='button';
    b.innerHTML='<span aria-hidden="true">◎</span><span>Focus</span>';
    b.title='Start a focused learning session';
    b.addEventListener('click',()=>focusOn?setFocus(false):setFocus(true,null));
    bar.insertBefore(b,nav||null);
  }

  function focusLabel(el){
    if(!el)return currentSectionLabel();
    return el.dataset.noteLabel||
      el.querySelector?.('h1,h2,h3,h4,strong,.stage-title strong,.question-prompt')?.textContent?.trim()||
      currentSectionLabel();
  }
  function currentSectionLabel(){
    return q('.content-section.active .section-heading h2')?.textContent?.trim()||
      q('#topicTitle')?.textContent?.trim()||'Learning session';
  }
  function topicLabel(){return q('#topicTitle')?.textContent?.trim()||'Beyond 100'}
  function yearLabel(el){
    return el?.querySelector?.('.year-pill strong,.badge')?.textContent?.trim()||
      q('.hero-card strong')?.textContent?.trim()||'';
  }

  function focusableBlocks(){
    return qa([
      '#placeValueContext .topic-context-kid',
      '#placeValueContext details',
      '.stage-card','.diagnostic-panel','.question-card.diagnostic',
      '.mastery-card','.threshold','.misconception','.question-card',
      '.breakdown-focus','.diagnostic-ladder','.mastery-dimensions-panel',
      '.learning-cycle','.half-term-panel','.evidence-log-panel',
      '.assessment-topic','.assessment-card'
    ].join(',')).filter(el=>!el.closest('.notes-dialog')&&!el.hidden);
  }

  function installFocusHereButtons(){
    focusableBlocks().forEach(el=>{
      if(el.dataset.focusPrepared)return;
      el.dataset.focusPrepared='1';
      const b=document.createElement('button');
      b.type='button';b.className='focus-here-button';b.textContent='Focus here';
      b.setAttribute('aria-label',`Focus on ${focusLabel(el)}`);
      b.addEventListener('click',e=>{e.stopPropagation();setFocus(true,el)});
      el.appendChild(b);
    });
  }

  function installWorkspace(){
    if(q('#focusWorkspace'))return;
    const el=document.createElement('div');el.id='focusWorkspace';el.className='focus-workspace';el.hidden=true;
    el.innerHTML=`
      <div class="focus-session-bar">
        <button type="button" id="focusExit" class="focus-session-exit" aria-label="Exit focus">×</button>
        <div class="focus-breadcrumb">
          <span id="focusTopic"></span>
          <strong id="focusScope"></strong>
          <small id="focusYear"></small>
        </div>
        <div class="focus-phase-picker" role="group" aria-label="Learning phase">
          <input type="hidden" id="focusPhase" value="diagnose">
          ${PHASES.map(([id,label])=>`<button type="button" class="focus-phase-tile ${id==='diagnose'?'selected':''}" data-focus-phase="${id}" data-tip="${esc(label)}" title="${esc(label)}" aria-label="${esc(label)}" aria-pressed="${id==='diagnose'?'true':'false'}">${phaseIcon(id)}</button>`).join('')}
        </div>
        <button type="button" id="focusParentToggle" class="focus-parent-toggle" aria-expanded="false">Parent controls</button>
      </div>
      <aside id="focusParentDrawer" class="focus-parent-drawer" hidden>
        <div class="focus-parent-head"><div><p class="eyebrow">PARENT VIEW</p><h3>Observe, record, decide</h3></div><button type="button" id="focusParentClose" aria-label="Close parent controls">×</button></div>
        <div class="focus-timer-row">
          <button type="button" id="focusTimerButton">Start timer</button>
          <strong id="focusTimer">0.0s</strong>
          <span>Response time</span>
        </div>
        <div class="focus-control-group"><span class="focus-control-label">Response</span><div class="focus-outcomes">${OUTCOMES.map(([id,label])=>`<button type="button" data-focus-outcome="${id}">${esc(label)}</button>`).join('')}</div></div>
        <div class="focus-control-group"><span class="focus-control-label">Why did it break down?</span><div class="focus-errors">${ERRORS.map(([id,label])=>`<button type="button" data-focus-error="${id}" title="${esc(label)}"><b>${id}</b><span>${esc(label)}</span></button>`).join('')}</div></div>
        <div class="focus-next-step"><span>Suggested next step</span><strong id="focusNextStep">Observe the response before deciding what to do next.</strong></div>
        <div class="focus-parent-actions"><button type="button" id="focusRecord">Record response</button><button type="button" id="focusAddNote">Add note</button></div>
        <div class="focus-session-stats" id="focusSessionStats"></div>
      </aside>
    `;
    document.body.appendChild(el);
    q('#focusExit',el).onclick=()=>setFocus(false);
    q('#focusParentToggle',el).onclick=()=>toggleParent(true);
    q('#focusParentClose',el).onclick=()=>toggleParent(false);
    q('#focusTimerButton',el).onclick=toggleTimer;
    q('#focusRecord',el).onclick=recordResponse;
    q('#focusAddNote',el).onclick=()=>window.dispatchEvent(new CustomEvent('beyond100-focus-note',{detail:{target:focusTarget}}));
    qa('[data-focus-outcome]',el).forEach(b=>b.onclick=()=>selectOutcome(b.dataset.focusOutcome));
    qa('[data-focus-error]',el).forEach(b=>b.onclick=()=>selectError(b.dataset.focusError));
    qa('[data-focus-phase]',el).forEach(b=>b.onclick=()=>selectPhase(b.dataset.focusPhase));
  }

  function selectPhase(id){
    const input=q('#focusPhase');if(input)input.value=id;
    qa('[data-focus-phase]').forEach(b=>{
      const on=b.dataset.focusPhase===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));
    });
    persistFocus();updateNextStep();
  }

  function toggleParent(open){
    const drawer=q('#focusParentDrawer'),button=q('#focusParentToggle');if(!drawer||!button)return;
    drawer.hidden=!open;button.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('focus-parent-open',open);
  }

  function selectOutcome(id){
    lastOutcome=id;qa('[data-focus-outcome]').forEach(b=>b.classList.toggle('selected',b.dataset.focusOutcome===id));updateNextStep();
  }
  function selectError(id){
    lastError=lastError===id?'':id;qa('[data-focus-error]').forEach(b=>b.classList.toggle('selected',b.dataset.focusError===lastError));updateNextStep();
  }

  function nextStepText(){
    const phase=q('#focusPhase')?.value||'diagnose';
    if(!lastOutcome)return phase==='teach'?'Teach the idea, then ask Sai to explain it back in his own words.':'Observe the response before deciding what to do next.';
    if(lastOutcome==='noConcept')return lastError==='Q'?'Simplify the wording without changing the maths. If performance improves, language load may be the bottleneck.':'Step back one layer, test the prerequisite, then teach the missing idea.';
    if(lastOutcome==='prompted')return 'Remove the prompt and test the same idea again later. Do not count prompted success as secure retrieval.';
    if(lastOutcome==='hesitant')return 'Try a varied example. If correct again, schedule retrieval rather than advancing immediately.';
    if(phase==='diagnose')return 'Probe explanation or move one layer harder to find the true edge of understanding.';
    if(phase==='retrieve1'||phase==='retrieve2')return 'Record the fluent retrieval and keep the next spaced check; do not reteach unnecessarily.';
    if(phase==='apply')return 'If the new-context answer is fluent and explained, this is evidence toward advancement.';
    return 'Try a different representation or context to test transfer before advancing.';
  }
  function updateNextStep(){const el=q('#focusNextStep');if(el)el.textContent=nextStepText()}

  function toggleTimer(){
    if(timerStarted){stopTimer();return}
    timerStarted=performance.now();q('#focusTimerButton').textContent='Stop timer';
    clearInterval(timerTick);timerTick=setInterval(()=>{
      const t=q('#focusTimer');if(t)t.textContent=((performance.now()-timerStarted)/1000).toFixed(1)+'s';
    },100);
  }
  function stopTimer(){
    if(!timerStarted)return parseFloat(q('#focusTimer')?.textContent)||0;
    const seconds=(performance.now()-timerStarted)/1000;timerStarted=0;clearInterval(timerTick);timerTick=null;
    q('#focusTimerButton').textContent='Restart timer';q('#focusTimer').textContent=seconds.toFixed(1)+'s';return seconds;
  }
  function resetRecorder(){
    timerStarted=0;clearInterval(timerTick);timerTick=null;lastOutcome='';lastError='';
    if(q('#focusTimer'))q('#focusTimer').textContent='0.0s';
    if(q('#focusTimerButton'))q('#focusTimerButton').textContent='Start timer';
    qa('[data-focus-outcome]').forEach(b=>b.classList.remove('selected'));
    qa('[data-focus-error]').forEach(b=>b.classList.remove('selected'));updateNextStep();
  }

  function evidenceState(){try{return JSON.parse(localStorage.getItem(EVIDENCE_KEY)||'{}')}catch{return{}}}
  function currentStats(){
    const events=evidenceState().events||[];
    const today=new Date();today.setHours(0,0,0,0);
    const rows=events.filter(e=>Date.parse(e.createdAt||e.updatedAt||0)>=today.getTime()&&['focus-response','diagnostic-response'].includes(e.kind));
    const counts={total:rows.length,fast:0,hesitant:0,prompted:0,noConcept:0};
    rows.forEach(e=>{if(counts[e.outcome]!==undefined)counts[e.outcome]++});
    return counts;
  }
  function renderStats(){
    const root=q('#focusSessionStats');if(!root)return;const s=currentStats();
    root.innerHTML=`<span><b>${s.total}</b> today</span><span><b>${s.fast}</b> fast</span><span><b>${s.hesitant}</b> hesitant</span><span><b>${s.prompted}</b> prompted</span><span><b>${s.noConcept}</b> no concept</span>`;
  }

  function recordResponse(){
    if(!lastOutcome){q('#focusRecord')?.classList.add('needs-selection');setTimeout(()=>q('#focusRecord')?.classList.remove('needs-selection'),700);return}
    const seconds=stopTimer();
    const detail={
      skill:focusLabel(focusTarget),
      prompt:focusTarget?.querySelector?.('.question-prompt')?.textContent?.trim()||focusTarget?.innerText?.trim().slice(0,500)||currentSectionLabel(),
      outcome:lastOutcome,errorCode:lastError||null,responseSeconds:seconds||null,
      phase:q('#focusPhase')?.value||'diagnose',
      anchorId:focusTarget?.dataset.noteAnchor||null,anchorLabel:focusTarget?.dataset.noteLabel||focusLabel(focusTarget),
      year:yearLabel(focusTarget),source:'focus-mode'
    };
    if(window.BEYOND100_EVIDENCE?.recordFocusResponse)window.BEYOND100_EVIDENCE.recordFocusResponse(detail);
    else window.dispatchEvent(new CustomEvent('beyond100-focus-response',{detail}));
    window.BEYOND100_NOTES_TOAST?.('Response recorded');
    renderStats();resetRecorder();
  }

  function updateWorkspace(){
    q('#focusTopic').textContent=topicLabel();
    q('#focusScope').textContent=focusLabel(focusTarget);
    q('#focusYear').textContent=yearLabel(focusTarget);
  }

  function clearScope(){
    qa('.focus-selected,.focus-context-kept,.focus-scope-muted').forEach(el=>el.classList.remove('focus-selected','focus-context-kept','focus-scope-muted'));
  }
  function applyScope(){
    clearScope();
    const section=q('.content-section.active');
    if(!focusTarget){section?.classList.add('focus-context-kept');return}
    focusTarget.classList.add('focus-selected');
    section?.classList.add('focus-context-kept');
    const heading=section?.querySelector('.section-heading');heading?.classList.add('focus-context-kept');
    const context=q('#placeValueContext');if(context&&section?.id==='progression')context.classList.add('focus-context-kept');
    [...section?.children||[]].forEach(child=>{
      if(child===focusTarget||child.contains(focusTarget)||child.classList.contains('section-heading'))return;
      child.classList.add('focus-scope-muted');
    });
    // For grids/lists, mute siblings but retain the chosen block and its container.
    const parent=focusTarget.parentElement;
    if(parent&&section?.contains(parent)){
      parent.classList.remove('focus-scope-muted');parent.classList.add('focus-context-kept');
      [...parent.children].forEach(sib=>{if(sib!==focusTarget)sib.classList.add('focus-scope-muted')});
    }
  }

  function setFocus(on,target=null){
    focusOn=!!on;
    if(focusOn&&target)focusTarget=target;
    if(focusOn&&!focusTarget){
      const active=q('.content-section.active');
      focusTarget=active?.querySelector('.stage-card.current,.question-card.diagnostic,.learning-cycle,.mastery-card,.misconception')||null;
    }
    document.body.classList.toggle('focus-mode',focusOn);
    const workspace=q('#focusWorkspace'),button=q('#focusModeButton');
    if(button){button.classList.toggle('active',focusOn);button.setAttribute('aria-pressed',String(focusOn));button.querySelector('span:last-child').textContent=focusOn?'Focused':'Focus'}
    if(focusOn){
      if(workspace)workspace.hidden=false;
      applySidebar(innerWidth>980,true);applyScope();updateWorkspace();renderStats();resetRecorder();
      setTimeout(()=>focusTarget?.scrollIntoView({behavior:'smooth',block:'center'}),80);
    }else{
      if(workspace)workspace.hidden=true;toggleParent(false);clearScope();focusTarget=null;resetRecorder();autoSidebar();
    }
    persistFocus();
  }

  function persistFocus(){
    try{localStorage.setItem(FOCUS_KEY,JSON.stringify({on:focusOn,phase:q('#focusPhase')?.value||'diagnose'}))}catch{}
  }

  function watch(){
    document.addEventListener('click',e=>{
      if(e.target.closest('.section-nav [data-section]')&&focusOn)setTimeout(()=>{focusTarget=null;applyScope();updateWorkspace()},80);
    });
    new MutationObserver(()=>installFocusHereButtons()).observe(q('#main')||document.body,{childList:true,subtree:true});
    window.addEventListener('beyond100-evidence-updated',renderStats);
  }

  function init(){
    installSidebarControl();installFocusButton();installWorkspace();installFocusHereButtons();autoSidebar();watch();
    addEventListener('resize',autoSidebar);
    try{const p=JSON.parse(localStorage.getItem(FOCUS_KEY)||'{}');if(p.phase)selectPhase(p.phase)}catch{}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();