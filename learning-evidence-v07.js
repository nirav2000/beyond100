const EVIDENCE_KEY='beyond100.learning-evidence.v1';
const APP_SESSION_KEY='beyond100.session.current.v1';
const CLOUD=window.BEYOND100_CLOUD;
const TOPIC=window.BEYOND100_DATA?.detailedTopics?.['Place Value & Number Structure'];

const OUTCOMES={
  fast:{label:'Correct + fast',short:'Fast',tone:'secure'},
  hesitant:{label:'Correct + hesitant',short:'Hesitant',tone:'watch'},
  prompted:{label:'Incorrect → understands after prompt',short:'Prompted',tone:'prompted'},
  noConcept:{label:'Incorrect / no concept',short:'No concept',tone:'fragile'}
};

const CYCLE=[
  {id:'diagnose',label:'Diagnose',evidence:true,help:'Find the current edge without teaching first.'},
  {id:'teach',label:'Teach',evidence:false,help:'Teach the missing idea, not merely the answer.'},
  {id:'demonstrate',label:'Demonstrate understanding',evidence:true,help:'Ask Sai to explain, represent or reconstruct the idea in his own way.'},
  {id:'practise',label:'Practise',evidence:false,help:'Build accuracy and fluency with varied examples.'},
  {id:'retrieve1',label:'Retrieve',evidence:true,help:'Bring it back later without a reminder.'},
  {id:'retrieve2',label:'Retrieve again',evidence:true,help:'Retrieve it again after a longer gap.'},
  {id:'apply',label:'Apply in a new context',evidence:true,help:'Use the idea in unfamiliar wording, representation or context.'},
  {id:'advance',label:'Advance',evidence:false,help:'Advance only after retrieval and transfer evidence are secure.'}
];

const LADDER=[
  {id:'A',level:'Y2',title:'Tens and ones',prompt:'47 = ? tens + ? ones',skill:'Tens and ones'},
  {id:'B',level:'Y3',title:'Hundreds',prompt:'735 = 700 + ___ + ___',skill:'Standard partitioning'},
  {id:'C',level:'Y3',title:'Flexible partitioning',prompt:'Give three different ways to partition 735.',skill:'Flexible partitioning'},
  {id:'D',level:'Y3–4',title:'Zero placeholder',prompt:'What does the zero mean in 407?',skill:'Zero as placeholder'},
  {id:'E',level:'Y4',title:'Thousands and words',prompt:'Write 6,042 in words.',skill:'Number words'},
  {id:'F',level:'Y5',title:'Larger numbers',prompt:'What is the value of the 7 in 372,416?',skill:'Digit value'},
  {id:'G',level:'Y5',title:'Transformations',prompt:'What happens to every digit when 4,306 is multiplied by 10?',skill:'Powers of ten'},
  {id:'H',level:'Y5+',title:'Reasoning and transfer',prompt:'Which is larger, 399,999 or 400,001? Explain without subtraction.',skill:'Compare and reason'}
];

const LANGUAGE_PROBES=[
  {pair:'1000',form:'short',label:'Direct calculation',prompt:'4,306 + 1,000 = ?',skill:'Add 1,000'},
  {pair:'1000',form:'verbal',label:'Same maths, more language',prompt:'A population of 4,306 increases by one thousand. What is the new population?',skill:'Add 1,000'},
  {pair:'partition',form:'short',label:'Direct instruction',prompt:'Partition 5,307.',skill:'Partition 5,307'},
  {pair:'partition',form:'verbal',label:'Explanation demand',prompt:'Explain how the digit 3 contributes to the value of 5,307.',skill:'Partition 5,307'}
];

const DIMENSIONS=[
  {id:'knowledge',title:'Knowledge',question:'Does he know the fact or rule?'},
  {id:'understanding',title:'Understanding',question:'Can he explain why it works?'},
  {id:'recall',title:'Recall',question:'Can he retrieve it without prompting?'},
  {id:'application',title:'Application',question:'Can he use it in an unfamiliar problem?'},
  {id:'retention',title:'Retention',question:'Can he still do it weeks later?'}
];

let state=loadState();
let sdkPromise=null,cloudSyncTimer=null,cloudReady=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const now=()=>new Date().toISOString();
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function blank(){return{schema:'beyond100-learning-evidence-v2',events:[],cycles:{},updatedAt:null}}
function loadState(){try{return{...blank(),...JSON.parse(localStorage.getItem(EVIDENCE_KEY)||'{}')}}catch{return blank()}}
function saveState(){if(state.events.length>600)state.events=state.events.slice(-600);state.schema='beyond100-learning-evidence-v2';state.updatedAt=now();localStorage.setItem(EVIDENCE_KEY,JSON.stringify(state));renderAll();scheduleCloudSync()}
function sessionId(){try{return JSON.parse(localStorage.getItem(APP_SESSION_KEY)||'{}').id||null}catch{return null}}
function isCorrect(o){return o==='fast'||o==='hesitant'}
function isFluent(o){return o==='fast'}
function addDays(value,days){const d=new Date(value);d.setDate(d.getDate()+days);return d.toISOString()}
function due(value){return value&&Date.now()>=Date.parse(value)}
function dayDiff(a,b){return a&&b?Math.abs(Date.parse(b)-Date.parse(a))/86400000:0}
function yearNo(y=''){const m=String(y).match(/\d+/);return m?Number(m[0]):99}
function fmt(value){if(!value)return'—';try{return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return'—'}}
function fmtDay(value){if(!value)return'—';try{return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(new Date(value))}catch{return'—'}}
function topicId(){return TOPIC?.id||'maths-place-value'}
function subject(){return TOPIC?.subject||'Maths'}
function outcomeLabel(o){return OUTCOMES[o]?.label||o||'Not recorded'}

function mount(){
  mountSection();
  changeDiagnosticCopy();
  bindDiagnostic();
  enhanceDiagnosticCards();
  renderAll();
  startCloud().catch(()=>setCloud('Saved locally · Firebase evidence sync unavailable','error'));
}

function mountSection(){
  const nav=$('.section-nav'),assess=$('#assessments');if(!nav||!assess)return;
  if(!nav.querySelector('[data-section="evidence-plan"]')){
    const b=document.createElement('button');b.dataset.section='evidence-plan';b.textContent='Evidence plan';
    nav.insertBefore(b,nav.querySelector('[data-section="assessments"]')||null);
    b.addEventListener('click',()=>activate('evidence-plan'));
  }
  if($('#evidence-plan'))return;
  const section=document.createElement('section');section.id='evidence-plan';section.className='content-section';
  section.innerHTML=`
    <div class="section-heading"><div><p class="eyebrow">BEFORE THE HALF-TERM MEETING</p><h2>Turn impressions into a learning profile</h2></div><p>Collect repeated evidence that separates a one-off error from a stable pattern: what is secure, what is fragile, what is forgotten, what needs prompting, and what transfers.</p></div>

    <div class="breakdown-focus" data-note-anchor="evidence:first-breakdown" data-note-label="First breakdown layer">
      <p class="eyebrow">THE QUESTION WE ARE TRYING TO ANSWER</p>
      <blockquote>“What I want to find is the first layer at which his confidence or explanation breaks down.”</blockquote>
      <div id="firstBreakdownResult" class="breakdown-result"></div>
    </div>

    <div class="diagnostic-ladder" data-note-anchor="evidence:place-value-ladder" data-note-label="Place value diagnostic ladder">
      <div class="ladder-head"><div><p class="eyebrow">PLACE VALUE FIRST</p><h3>Go backwards before going forwards</h3><p>Move rapidly from basic place-value structure to reasoning. Record the first layer that becomes hesitant, prompt-dependent or conceptually insecure.</p></div></div>
      <div id="diagnosticLadder" class="diagnostic-ladder-grid"></div>
    </div>

    <div class="mastery-dimensions-panel" data-note-anchor="evidence:five-dimensions" data-note-label="Five mastery dimensions">
      <div class="dimension-head"><div><p class="eyebrow">FIVE SEPARATE QUESTIONS</p><h3>“Got it today” is not mastery</h3><p>Track knowledge, understanding, recall, application and retention separately.</p></div></div>
      <div id="masteryDimensions" class="mastery-dimensions"></div>
    </div>

    <div class="learning-cycle" data-note-anchor="evidence:learning-cycle" data-note-label="Learning evidence cycle">
      <div class="cycle-head"><div><p class="eyebrow">EVIDENCE CYCLE</p><h3>Do not advance on one successful attempt</h3><p>Diagnose → teach → demonstrate understanding → practise → retrieve → retrieve again → apply in a new context → only then advance.</p></div><span id="evidenceCloudStatus" class="evidence-cloud">Saved locally</span></div>
      <div class="response-legend">${Object.values(OUTCOMES).map(o=>`<span data-tone="${o.tone}"><b>${esc(o.label)}</b></span>`).join('')}</div>
      <div class="cycle-controls"><label>Skill<select id="cycleSkill"></select></label><label>Outcome for evidence steps<select id="cycleOutcome">${Object.entries(OUTCOMES).map(([id,o])=>`<option value="${id}">${esc(o.label)}</option>`).join('')}</select></label></div>
      <div id="cycleSteps" class="cycle-steps"></div>
      <div id="retentionPlan" class="retention-plan"></div>
      <div id="retentionChecks" class="retention-checks"></div>
    </div>

    <div class="diagnostic-ladder" data-note-anchor="evidence:language-load" data-note-label="Language-load comparison">
      <div class="ladder-head"><div><p class="eyebrow">QUESTION PROCESSING OR MATHEMATICS?</p><h3>Hold the maths steady and change the language</h3><p>Compare mathematically similar questions with different verbal demands. A consistent drop on the wordier form is useful evidence to take to the SENDCo discussion.</p></div></div>
      <div id="languageProbes" class="diagnostic-ladder-grid"></div>
    </div>

    <div class="half-term-panel" data-note-anchor="evidence:half-term-plan" data-note-label="Half-term evidence plan">
      <div class="half-term-head"><div><p class="eyebrow">WHAT TO ESTABLISH BEFORE HALF TERM</p><h3>Evidence checklist</h3></div><div class="half-term-actions"><div id="evidenceTotals" class="evidence-totals"></div><button id="copyMeetingBrief" class="secondary" type="button">Copy meeting brief</button></div></div>
      <div id="halfTermTargets" class="half-term-grid"></div>
      <div id="patternSignals" class="pattern-signals"></div>
    </div>

    <div class="half-term-panel" data-note-anchor="evidence:may-success" data-note-label="Eight-month success measures">
      <div class="half-term-head"><div><p class="eyebrow">LONGER-TERM SUCCESS</p><h3>Measure what we can actually observe</h3><p>The aim is stronger foundations, retention, fluency, reasoning, transfer and independence — not chasing a single assessment score.</p></div></div>
      <div id="mayGoals" class="meeting-goals"></div>
    </div>

    <div class="evidence-log-panel"><div class="half-term-head"><div><p class="eyebrow">RECENT EVIDENCE</p><h3>What has actually been recorded</h3></div><button id="clearEvidence" class="secondary" type="button">Clear local evidence</button></div><div id="evidenceLog" class="evidence-log"></div></div>`;
  assess.insertAdjacentElement('beforebegin',section);
  populateSkills();
  $('#cycleSkill')?.addEventListener('change',renderCycle);
  $('#cycleOutcome')?.addEventListener('change',renderCycle);
  $('#cycleSteps')?.addEventListener('click',e=>{const b=e.target.closest('[data-cycle-step]');if(b&&!b.disabled)recordCycleStep(b.dataset.cycleStep)});
  $('#retentionChecks')?.addEventListener('click',e=>{const b=e.target.closest('[data-retention]');if(b&&!b.disabled)recordRetention(b.dataset.retention)});
  $('#diagnosticLadder')?.addEventListener('click',handleLadderClick);
  $('#languageProbes')?.addEventListener('click',handleLanguageClick);
  $('#copyMeetingBrief')?.addEventListener('click',copyMeetingBrief);
  $('#clearEvidence')?.addEventListener('click',()=>{if(confirm('Clear the learning evidence saved on this device? Notes and assessment evidence are not affected.')){state=blank();saveState()}});
}

function activate(id){$$('.content-section').forEach(s=>s.classList.toggle('active',s.id===id));$$('.section-nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===id));$('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'})}
function changeDiagnosticCopy(){const p=$('#diagnose .section-heading>p');if(p)p.textContent='Start below the expected level and move upward. Find the first layer at which confidence, fluency or explanation breaks down, then classify whether the issue is knowledge, concept, question interpretation, procedure, fluency, reasoning or attention.'}

function populateSkills(){const el=$('#cycleSkill');if(!el)return;const skills=[...new Set([...(TOPIC?.questions||[]).map(q=>q.skill),...LADDER.map(x=>x.skill)].filter(Boolean))].sort();el.innerHTML=skills.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
function ensureCycle(skill){if(!state.cycles[skill])state.cycles[skill]={skill,steps:{},retentionDue:{},retentionChecks:{},updatedAt:null};state.cycles[skill].retentionChecks ||= {};return state.cycles[skill]}
function selectedSkill(){return $('#cycleSkill')?.value||''}

function bindDiagnostic(){const root=$('#diagnosticSet');if(root&&!root.dataset.evidenceObserved){root.dataset.evidenceObserved='1';new MutationObserver(enhanceDiagnosticCards).observe(root,{childList:true,subtree:true})};const build=$('#buildDiagnostic');if(build&&!build.dataset.evidenceBound){build.dataset.evidenceBound='1';build.addEventListener('click',()=>{if(root)root.dataset.evidenceSession=crypto.randomUUID();setTimeout(enhanceDiagnosticCards,0)})}}
function enhanceDiagnosticCards(){
  $$('#diagnosticSet .question-card.diagnostic').forEach(card=>{
    if(card.dataset.evidenceEnhanced)return;card.dataset.evidenceEnhanced='1';const score=card.querySelector('.score-row');if(!score)return;
    const box=document.createElement('div');box.className='response-recorder';
    box.innerHTML=`<div class="response-recorder-head"><strong>Response evidence</strong><div><button type="button" class="start-response-timer">Start timer</button><span class="response-time">Not timed</span></div></div><div class="response-outcomes">${Object.entries(OUTCOMES).map(([id,o])=>`<button type="button" data-outcome="${id}" data-tone="${o.tone}">${esc(o.label)}</button>`).join('')}</div><p class="response-recorded"></p>`;
    score.insertAdjacentElement('beforebegin',box);
    box.querySelector('.start-response-timer').onclick=()=>{card.dataset.responseStarted=String(Date.now());box.querySelector('.response-time').textContent='Timing…'};
    box.querySelectorAll('[data-outcome]').forEach(b=>b.onclick=()=>recordDiagnostic(card,b.dataset.outcome));
    score.addEventListener('click',e=>{const b=e.target.closest('.score-btn');if(b)recordError(card,b.textContent.trim())});
  });
}
function questionMeta(card){const qid=card.dataset.qid||crypto.randomUUID(),q=(TOPIC?.questions||[]).find(x=>x.id===qid)||{};return{questionId:qid,year:q.year||card.querySelector('.badge')?.textContent?.trim()||'',skill:q.skill||'Unclassified',prompt:q.prompt||card.querySelector('.question-prompt')?.textContent?.trim()||'',questionType:q.type||''}}
function recordDiagnostic(card,outcome){
  const m=questionMeta(card),started=Number(card.dataset.responseStarted||0),seconds=started?Math.max(.1,(Date.now()-started)/1000):null,at=now();let ev=card.dataset.evidenceEventId?state.events.find(x=>x.id===card.dataset.evidenceEventId):null;
  if(!ev){ev={id:crypto.randomUUID(),kind:'diagnostic-response',app:'beyond100',topicId:topicId(),subject:subject(),diagnosticSession:$('#diagnosticSet')?.dataset.evidenceSession||null,sessionId:sessionId(),createdAt:at};state.events.push(ev);card.dataset.evidenceEventId=ev.id}
  Object.assign(ev,m,{outcome,responseSeconds:seconds,promptWords:m.prompt.split(/\s+/).filter(Boolean).length,updatedAt:at});if(card.dataset.pendingErrorCode)ev.errorCode=card.dataset.pendingErrorCode;
  const c=ensureCycle(m.skill);c.steps.diagnose={outcome,at,sourceEventId:ev.id};c.updatedAt=at;
  card.querySelectorAll('[data-outcome]').forEach(b=>b.classList.toggle('selected',b.dataset.outcome===outcome));card.querySelector('.response-recorded').textContent=`Recorded: ${outcomeLabel(outcome)}${seconds?` · ${seconds.toFixed(1)}s`:''}`;card.querySelector('.response-time').textContent=seconds?`${seconds.toFixed(1)}s`:'Not timed';card.dataset.responseStarted='';saveState();
}
function recordError(card,text){const code=text.startsWith('✓')?'Secure':(text.match(/^([KCQPFRA])\b/)?.[1]||text.slice(0,20));card.dataset.pendingErrorCode=code;const ev=state.events.find(x=>x.id===card.dataset.evidenceEventId);if(ev){ev.errorCode=code;ev.updatedAt=now();saveState()}}

function stepAvailable(c,id){const s=c.steps;if(id==='diagnose')return true;if(id==='teach')return!!s.diagnose;if(id==='demonstrate')return!!s.teach;if(id==='practise')return!!s.demonstrate&&isCorrect(s.demonstrate.outcome);if(id==='retrieve1')return!!s.practise;if(id==='retrieve2')return!!s.retrieve1;if(id==='apply')return!!s.retrieve2;if(id==='advance')return isCorrect(s.demonstrate?.outcome)&&isFluent(s.retrieve1?.outcome)&&isFluent(s.retrieve2?.outcome)&&isFluent(s.apply?.outcome);return false}
function dueFor(c,id){const base=c.steps.practise?.at;if(!base)return null;if(id==='retrieve1')return addDays(base,1);if(id==='retrieve2')return addDays(base,3);if(id==='apply')return addDays(base,7);return null}
function recordCycleStep(id){const skill=selectedSkill(),c=ensureCycle(skill);if(!stepAvailable(c,id))return;const def=CYCLE.find(x=>x.id===id),outcome=def.evidence?($('#cycleOutcome')?.value||'fast'):'completed',at=now();c.steps[id]={outcome,at};c.updatedAt=at;if(id==='advance')c.retentionDue={d14:addDays(at,14),d30:addDays(at,30),d60:addDays(at,60)};state.events.push({id:crypto.randomUUID(),kind:'cycle-step',topicId:topicId(),subject:subject(),skill,step:id,outcome,sessionId:sessionId(),createdAt:at,updatedAt:at});saveState()}
function recordRetention(key){const skill=selectedSkill(),c=ensureCycle(skill),when=c.retentionDue?.[key];if(!when||!due(when))return;const outcome=$('#cycleOutcome')?.value||'fast',at=now();c.retentionChecks[key]={outcome,at,dueAt:when};c.updatedAt=at;state.events.push({id:crypto.randomUUID(),kind:'retention-check',topicId:topicId(),subject:subject(),skill,retention:key,outcome,sessionId:sessionId(),createdAt:at,updatedAt:at});saveState()}

function dimensionStatus(c,id){
  const s=c.steps,r=c.retentionChecks||{};
  const toStatus=o=>!o?{label:'No evidence',tone:''}:o==='fast'?{label:'Secure / fluent',tone:'secure'}:o==='hesitant'?{label:'Correct but hesitant',tone:'watch'}:o==='prompted'?{label:'Prompt-dependent',tone:'prompted'}:{label:'Not secure',tone:'fragile'};
  if(id==='knowledge')return toStatus(s.diagnose?.outcome);
  if(id==='understanding')return toStatus(s.demonstrate?.outcome);
  if(id==='recall')return toStatus(s.retrieve2?.outcome||s.retrieve1?.outcome);
  if(id==='application')return toStatus(s.apply?.outcome);
  if(id==='retention')return toStatus(r.d60?.outcome||r.d30?.outcome||r.d14?.outcome);
  return{label:'No evidence',tone:''};
}
function renderDimensions(){const root=$('#masteryDimensions');if(!root)return;const c=ensureCycle(selectedSkill());root.innerHTML=DIMENSIONS.map(d=>{const s=dimensionStatus(c,d.id);return `<article class="mastery-dimension"><h4>${esc(d.title)}</h4><p>${esc(d.question)}</p><span class="dimension-status" data-tone="${s.tone}">${esc(s.label)}</span></article>`}).join('')}
function renderCycle(){const root=$('#cycleSteps');if(!root)return;const c=ensureCycle(selectedSkill());root.innerHTML=CYCLE.map((step,i)=>{const rec=c.steps[step.id],available=stepAvailable(c,step.id),suggested=dueFor(c,step.id),label=rec?(rec.outcome==='completed'?'Done':OUTCOMES[rec.outcome]?.short||rec.outcome):(available?'Record':'Locked');return `<article class="cycle-step ${rec?'is-recorded':''}" data-tone="${rec&&OUTCOMES[rec.outcome]?OUTCOMES[rec.outcome].tone:''}"><span class="cycle-number">${i+1}</span><div><strong>${esc(step.label)}</strong><p>${esc(step.help)}</p>${suggested&&!rec?`<small>Suggested: ${fmtDay(suggested)}</small>`:''}${rec?`<small>${fmt(rec.at)}</small>`:''}</div><button type="button" data-cycle-step="${step.id}" ${available?'':'disabled'}>${esc(label)}</button></article>`}).join('');
  const p=$('#retentionPlan');if(p)p.innerHTML=c.steps.advance?`<strong>Longer retention checks</strong><span>After Advance: D14, D30 and D60. The 30-day result feeds the ≥90% retention goal.</span>`:`<strong>Advance gate</strong><span>Demonstrate understanding, then retrieve twice and apply in a new context. Both retrievals and transfer must be correct + fast.</span>`;
  const checks=$('#retentionChecks');if(checks){checks.innerHTML=['d14','d30','d60'].map(k=>{const rec=c.retentionChecks?.[k],when=c.retentionDue?.[k],ready=when&&due(when),label=rec?outcomeLabel(rec.outcome):when?(ready?'Record now':`Due ${fmtDay(when)}`):'Unlock after Advance';return `<article class="retention-check"><strong>${k.toUpperCase()}</strong><span>${when?fmtDay(when):'Not scheduled'}</span><button type="button" data-retention="${k}" ${ready?'':'disabled'}>${esc(label)}</button></article>`}).join('')}
  renderDimensions();
}

function handleLadderClick(e){const timer=e.target.closest('[data-ladder-timer]');if(timer){const card=timer.closest('.ladder-stage');card.dataset.started=String(Date.now());timer.textContent='Timing…';return}const b=e.target.closest('[data-ladder-outcome]');if(!b)return;const card=b.closest('.ladder-stage'),stage=LADDER.find(x=>x.id===card.dataset.stage);if(!stage)return;const started=Number(card.dataset.started||0),seconds=started?Math.max(.1,(Date.now()-started)/1000):null,at=now(),outcome=b.dataset.ladderOutcome;state.events.push({id:crypto.randomUUID(),kind:'ladder-response',topicId:topicId(),subject:subject(),stage:stage.id,year:stage.level,skill:stage.skill,prompt:stage.prompt,outcome,responseSeconds:seconds,sessionId:sessionId(),createdAt:at,updatedAt:at});const c=ensureCycle(stage.skill);c.steps.diagnose={outcome,at};c.updatedAt=at;card.dataset.started='';saveState()}
function renderLadder(){const root=$('#diagnosticLadder');if(!root)return;const latest={};state.events.filter(x=>x.kind==='ladder-response').forEach(x=>{if(!latest[x.stage]||Date.parse(x.updatedAt)>Date.parse(latest[x.stage].updatedAt))latest[x.stage]=x});root.innerHTML=LADDER.map(x=>{const rec=latest[x.id];return `<article class="ladder-stage" data-stage="${x.id}"><header><strong>Stage ${x.id} · ${esc(x.title)}</strong><span>${esc(x.level)}</span></header><p>${esc(x.prompt)}</p><button type="button" data-ladder-timer="1">${rec?.responseSeconds?`Last ${rec.responseSeconds.toFixed(1)}s`:'Start timer'}</button><div class="ladder-outcomes">${Object.entries(OUTCOMES).map(([id,o])=>`<button type="button" data-ladder-outcome="${id}" class="${rec?.outcome===id?'selected':''}">${esc(o.short)}</button>`).join('')}</div></article>`}).join('')}

function handleLanguageClick(e){const timer=e.target.closest('[data-language-timer]');if(timer){const card=timer.closest('.ladder-stage');card.dataset.started=String(Date.now());timer.textContent='Timing…';return}const b=e.target.closest('[data-language-outcome]');if(!b)return;const card=b.closest('.ladder-stage'),idx=Number(card.dataset.index),p=LANGUAGE_PROBES[idx];if(!p)return;const started=Number(card.dataset.started||0),seconds=started?Math.max(.1,(Date.now()-started)/1000):null,at=now();state.events.push({id:crypto.randomUUID(),kind:'language-probe',topicId:topicId(),subject:subject(),pair:p.pair,form:p.form,skill:p.skill,prompt:p.prompt,outcome:b.dataset.languageOutcome,responseSeconds:seconds,sessionId:sessionId(),createdAt:at,updatedAt:at});card.dataset.started='';saveState()}
function renderLanguage(){const root=$('#languageProbes');if(!root)return;root.innerHTML=LANGUAGE_PROBES.map((p,i)=>{const rec=[...state.events].reverse().find(x=>x.kind==='language-probe'&&x.pair===p.pair&&x.form===p.form);return `<article class="ladder-stage" data-index="${i}"><header><strong>${esc(p.label)}</strong><span>${esc(p.form)}</span></header><p>${esc(p.prompt)}</p><button type="button" data-language-timer="1">${rec?.responseSeconds?`Last ${rec.responseSeconds.toFixed(1)}s`:'Start timer'}</button><div class="ladder-outcomes">${Object.entries(OUTCOMES).map(([id,o])=>`<button type="button" data-language-outcome="${id}" class="${rec?.outcome===id?'selected':''}">${esc(o.short)}</button>`).join('')}</div></article>`}).join('')}

function firstBreakdown(){const ladder=state.events.filter(x=>x.kind==='ladder-response');const latest={};ladder.forEach(x=>{if(!latest[x.stage]||Date.parse(x.updatedAt)>Date.parse(latest[x.stage].updatedAt))latest[x.stage]=x});for(const stage of LADDER){const r=latest[stage.id];if(!r)return{kind:'missing',stage};if(r.outcome!=='fast')return{kind:'fragile',stage,response:r}}return{kind:'above'}}
function renderBreakdown(){const root=$('#firstBreakdownResult');if(!root)return;const b=firstBreakdown();if(b.kind==='missing'){root.innerHTML=`<strong>Next layer to test: Stage ${b.stage.id} · ${esc(b.stage.title)}</strong><span>Test rapidly from the bottom upward. A missing lower layer means we cannot yet call a later difficulty the “first” breakdown.</span>`;return}if(b.kind==='fragile'){root.innerHTML=`<strong>First observed fragile layer: Stage ${b.stage.id} · ${esc(b.stage.title)}</strong><span>${esc(outcomeLabel(b.response.outcome))}${b.response.responseSeconds?` · ${b.response.responseSeconds.toFixed(1)}s`:''}. Re-test on another day before treating this as a stable boundary.</span>`;return}root.innerHTML='<strong>No fragile layer found through Stage H.</strong><span>Increase the reasoning, transfer or language demand rather than assuming the topic is finished.</span>'}

function languageSignal(){const latest={};state.events.filter(x=>x.kind==='language-probe').forEach(x=>{const k=`${x.pair}:${x.form}`;if(!latest[k]||Date.parse(x.updatedAt)>Date.parse(latest[k].updatedAt))latest[k]=x});const pairs=[...new Set(LANGUAGE_PROBES.map(x=>x.pair))],signals=[];for(const pair of pairs){const a=latest[`${pair}:short`],b=latest[`${pair}:verbal`];if(!a||!b)continue;const rank={fast:0,hesitant:1,prompted:2,noConcept:3};if((rank[b.outcome]??0)>(rank[a.outcome]??0))signals.push(`On ${pair}, the wordier form was weaker (${outcomeLabel(a.outcome)} → ${outcomeLabel(b.outcome)}).`);else if(a.responseSeconds&&b.responseSeconds&&b.responseSeconds>a.responseSeconds*1.5)signals.push(`On ${pair}, accuracy was similar but the wordier form took much longer (${a.responseSeconds.toFixed(1)}s → ${b.responseSeconds.toFixed(1)}s).`)}return signals}
function analysis(){const diag=state.events.filter(x=>x.kind==='diagnostic-response'||x.kind==='ladder-response'),timed=diag.filter(x=>Number.isFinite(x.responseSeconds)),errors={};diag.forEach(x=>{if(x.errorCode&&x.errorCode!=='Secure')errors[x.errorCode]=(errors[x.errorCode]||0)+1});const cycles=Object.values(state.cycles),subjects=new Set(state.events.map(x=>x.subject).filter(Boolean));return{diag,timed,errors,cycles,subjects,language:languageSignal()}}
function halfTermTargets(){const a=analysis(),outcomes=new Set(a.diag.map(x=>x.outcome)),topError=Object.entries(a.errors).sort((x,y)=>y[1]-x[1])[0],prompted=a.diag.filter(x=>x.outcome==='prompted'||x.outcome==='noConcept'),promptRecovered=prompted.some(p=>state.events.some(e=>e.skill===p.skill&&['retrieve1','retrieve2','apply'].includes(e.step)&&isCorrect(e.outcome)&&Date.parse(e.createdAt)>Date.parse(p.createdAt))),spaced=a.cycles.some(c=>c.steps?.retrieve1&&c.steps?.retrieve2&&dayDiff(c.steps.retrieve1.at,c.steps.retrieve2.at)>=1),conceptRecall=a.cycles.some(c=>c.steps?.demonstrate&&(c.steps?.retrieve1||c.steps?.retrieve2));return[
  ['Secure vs fragile maths areas',Math.min(1,a.diag.length/8)*(outcomes.has('fast')&&[...outcomes].some(x=>x!=='fast')?1:.75),`${a.diag.length} recorded diagnostic/ladder responses across ${new Set(a.diag.map(x=>x.skill)).size} skills.`],
  ['Recurring error types',topError?.[1]>=2?1:topError?.[1]?0.5:0,topError?.[1]>=2?`${topError[0]} has recurred ${topError[1]} times.`:'Keep using K/C/Q/P/F/R/A when an answer is not secure.'],
  ['Recall vs conceptual understanding',conceptRecall?1:a.cycles.some(c=>c.steps?.demonstrate)?0.5:0,conceptRecall?'At least one skill has both immediate understanding and later retrieval evidence.':'Pair “demonstrate understanding” with later no-prompt retrieval.'],
  ['Response time / hesitation',Math.min(1,a.timed.length/5),`${a.timed.length} timed responses recorded.`],
  ['Effect of prompting',promptRecovered?1:prompted.length?0.5:0,promptRecovered?'At least one prompt-dependent response has later been retrieved independently.':prompted.length?'Prompt-dependent responses exist; re-test later without the prompt.':'Record “understands after prompt” separately from immediate correctness.'],
  ['Forgetting over time',spaced?1:a.cycles.some(c=>c.steps?.retrieve1&&c.steps?.retrieve2)?0.6:0,spaced?'At least one skill has retrieval evidence on different days.':'Use D1 / D3 / D7, then D14 / D30 / D60.'],
  ['Effect of longer verbal wording',a.language.length?1:state.events.some(x=>x.kind==='language-probe')?0.5:0,a.language[0]||'Complete both forms in each language-load pair.'],
  ['Cross-subject pattern',Math.min(1,a.subjects.size/2),a.subjects.size>=2?`Evidence spans ${[...a.subjects].join(', ')}.`:'Keep the same evidence categories when detailed English and Science diagnostics are added.']
]}
function patternSignals(){const a=analysis(),s=[...a.language],top=Object.entries(a.errors).sort((x,y)=>y[1]-x[1])[0];if(top?.[1]>=2)s.push(`Repeated ${top[0]} error code (${top[1]} occurrences).`);const drops=a.cycles.filter(c=>isCorrect(c.steps?.demonstrate?.outcome)&&((c.steps.retrieve1&&!isCorrect(c.steps.retrieve1.outcome))||(c.steps.retrieve2&&!isCorrect(c.steps.retrieve2.outcome))));if(drops.length)s.push(`${drops.length} skill${drops.length===1?'':'s'} looked understood immediately but weakened at retrieval.`);if(!s.length)s.push('No stable pattern yet. Keep collecting repeated observations before drawing a conclusion from individual mistakes.');return s}

function renderHalfTerm(){const root=$('#halfTermTargets');if(!root)return;const t=halfTermTargets();root.innerHTML=t.map(([title,p,detail])=>{const status=p>=.99?'Evidence ready':p>=.45?'Building':'Need evidence';return `<article class="evidence-target" data-status="${status==='Evidence ready'?'ready':status==='Building'?'building':'need'}"><div><strong>${esc(title)}</strong><span>${status}</span></div><p>${esc(detail)}</p><div class="evidence-meter"><i style="width:${Math.round(Math.min(1,p)*100)}%"></i></div></article>`}).join('');const total=$('#evidenceTotals');if(total)total.innerHTML=`<span><b>${analysis().diag.length}</b> responses</span><span><b>${state.events.filter(x=>x.kind==='cycle-step').length}</b> cycle records</span><span><b>${Object.keys(state.cycles).length}</b> skills</span>`;const ps=$('#patternSignals');if(ps)ps.innerHTML=`<strong>Emerging pattern signals</strong><ul>${patternSignals().map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}

function mayGoals(){const cycles=Object.values(state.cycles),ladderLatest={};state.events.filter(x=>x.kind==='ladder-response').forEach(x=>{if(!ladderLatest[x.stage]||Date.parse(x.updatedAt)>Date.parse(ladderLatest[x.stage].updatedAt))ladderLatest[x.stage]=x});const foundation=LADDER.filter(x=>['A','B','C','D','E'].includes(x.id)).every(x=>ladderLatest[x.id]?.outcome==='fast');const y5=LADDER.filter(x=>['F','G','H'].includes(x.id)).every(x=>isCorrect(ladderLatest[x.id]?.outcome));const d30=cycles.map(c=>c.retentionChecks?.d30).filter(Boolean),d30Rate=d30.length?d30.filter(x=>isCorrect(x.outcome)).length/d30.length:null;const explain=cycles.filter(c=>isCorrect(c.steps?.demonstrate?.outcome)).length,apply=cycles.filter(c=>isCorrect(c.steps?.apply?.outcome)).length;const promptEvents=state.events.filter(x=>x.outcome==='prompted');const timed=analysis().timed.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));let speed=null;if(timed.length>=6){const n=Math.floor(timed.length/2),first=timed.slice(0,n).reduce((s,x)=>s+x.responseSeconds,0)/n,last=timed.slice(-n).reduce((s,x)=>s+x.responseSeconds,0)/n;speed={first,last}}return[
  ['Foundations',foundation?'On track':'Building',foundation?'Stages A–E currently fluent.':'Aim for essentially no significant Y1–4 place-value gaps.'],
  ['Current curriculum',y5?'On track':'Building',y5?'Stages F–H are currently correct.':'Make Year 5 concepts secure rather than temporarily learnt.'],
  ['30-day retention',d30Rate===null?'No D30 data':`${Math.round(d30Rate*100)}%`,d30Rate===null?'The target from the plan is ≥90% of mastered concepts still accessible after 30 days.':'Target ≥90%.'],
  ['Fluency',analysis().timed.length>=5?'Measuring':'Need timings','Core number facts and place-value transformations should become increasingly automatic.'],
  ['Reasoning / explanation',explain?`${explain} skill${explain===1?'':'s'}`:'Need evidence','Track whether he can explain why, not merely perform the procedure.'],
  ['Transfer',apply?`${apply} skill${apply===1?'':'s'}`:'Need evidence','Look for success when a familiar concept appears in an unfamiliar-looking problem.'],
  ['Independence',promptEvents.length?`${promptEvents.length} prompted record${promptEvents.length===1?'':'s'}`:'No prompt dependence recorded','Over time we want substantially fewer prompts.'],
  ['Speed without accuracy loss',speed?`${speed.first.toFixed(1)}s → ${speed.last.toFixed(1)}s`:'Need ≥6 timings',speed?'Compare with accuracy before treating faster as better.':'Record response time while preserving the four outcome categories.']
]}
function renderMayGoals(){const root=$('#mayGoals');if(root)root.innerHTML=mayGoals().map(([title,status,detail])=>`<article class="meeting-goal"><strong>${esc(title)} · ${esc(status)}</strong><p>${esc(detail)}</p></article>`).join('')}
function renderLog(){const root=$('#evidenceLog');if(!root)return;const rows=[...state.events].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt)-Date.parse(a.updatedAt||a.createdAt)).slice(0,14);root.innerHTML=rows.length?rows.map(e=>`<article><div><strong>${esc(e.skill||e.stage||e.questionId||'Evidence')}</strong><span>${fmt(e.updatedAt||e.createdAt)}</span></div><p>${esc(e.kind)} · ${esc(outcomeLabel(e.outcome))}${e.responseSeconds?` · ${e.responseSeconds.toFixed(1)}s`:''}${e.errorCode?` · ${esc(e.errorCode)}`:''}</p></article>`).join(''):'<div class="notes-empty">No learning evidence recorded yet.</div>'}
function renderAll(){renderLadder();renderLanguage();renderCycle();renderBreakdown();renderHalfTerm();renderMayGoals();renderLog()}

function meetingBrief(){return['Beyond 100 · half-term learning evidence brief',`Generated: ${new Date().toLocaleString('en-GB')}`,'','Guiding question:','What is the first layer at which his confidence or explanation breaks down?','','Evidence cycle:','Diagnose → teach → demonstrate understanding → practise → retrieve → retrieve again → apply in a new context → only then advance.','','Response categories:',...Object.values(OUTCOMES).map(o=>`- ${o.label}`),'','Five dimensions:',...DIMENSIONS.map(d=>`- ${d.title}: ${d.question}`),'','Before-half-term evidence:',...halfTermTargets().map(([t,p,d])=>`- ${t}: ${p>=.99?'evidence ready':p>=.45?'building':'need evidence'} — ${d}`),'','Emerging signals:',...patternSignals().map(x=>`- ${x}`),'','Longer-term measures:',...mayGoals().map(([t,s,d])=>`- ${t}: ${s} — ${d}`)].join('\n')}
async function copyMeetingBrief(){const b=$('#copyMeetingBrief');try{await navigator.clipboard.writeText(meetingBrief());const old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,1400)}catch{if(b)b.textContent='Copy failed'}}

function merge(local,remote){if(!remote)return local;const out={...blank(),...remote,...local},events=new Map();[...(remote.events||[]),...(local.events||[])].forEach(e=>{const old=events.get(e.id);if(!old||Date.parse(e.updatedAt||e.createdAt||0)>=Date.parse(old.updatedAt||old.createdAt||0))events.set(e.id,e)});out.events=[...events.values()];out.cycles={...(remote.cycles||{})};for(const [skill,c] of Object.entries(local.cycles||{})){const base=out.cycles[skill]||{skill,steps:{},retentionDue:{},retentionChecks:{}};base.steps={...(base.steps||{}),...(c.steps||{})};base.retentionDue={...(base.retentionDue||{}),...(c.retentionDue||{})};base.retentionChecks={...(base.retentionChecks||{}),...(c.retentionChecks||{})};base.updatedAt=[base.updatedAt,c.updatedAt].filter(Boolean).sort().at(-1)||null;out.cycles[skill]=base}return out}
async function sdk(){if(sdkPromise)return sdkPromise;sdkPromise=(async()=>{const[A,Auth,F]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)}})();return sdkPromise}
function ref(S){return S.F.doc(S.db,...CLOUD.firestoreBase,'beyond100-learning-evidence')}
async function startCloud(){const S=await sdk();await S.auth.authStateReady();S.Auth.onAuthStateChanged(S.auth,async user=>{cloudReady=!!user&&user.uid===CLOUD.ownerUid;if(!cloudReady){setCloud('Saved locally · sign in to Firebase to sync','local');return}try{setCloud('Syncing learning evidence…','syncing');const snap=await S.F.getDoc(ref(S));if(snap.exists()&&snap.data()?.payload){state=merge(state,snap.data().payload);localStorage.setItem(EVIDENCE_KEY,JSON.stringify(state));renderAll()}await syncCloud()}catch{setCloud('Saved locally · evidence sync failed','error')}})}
function scheduleCloudSync(){clearTimeout(cloudSyncTimer);if(cloudReady)cloudSyncTimer=setTimeout(()=>syncCloud().catch(()=>setCloud('Saved locally · evidence sync failed','error')),700)}
async function syncCloud(){if(!cloudReady)return;const S=await sdk(),u=S.auth.currentUser;if(!u||u.uid!==CLOUD.ownerUid)return;setCloud('Syncing learning evidence…','syncing');await S.F.setDoc(ref(S),{app:'beyond100',kind:'learning-evidence',schema:state.schema,updatedAt:state.updatedAt||now(),payload:state},{merge:true});setCloud('Learning evidence synced to Firebase','connected')}
function setCloud(text,status='local'){const el=$('#evidenceCloudStatus');if(el){el.textContent=text;el.dataset.state=status}}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();


function recordFocusResponse(detail={}){
  const at=now(),skill=detail.skill||'Focused learning',phase=detail.phase||'diagnose';
  const event={
    id:crypto.randomUUID(),kind:'focus-response',app:'beyond100',topicId:topicId(),subject:subject(),
    skill,prompt:detail.prompt||'',outcome:detail.outcome||'noConcept',errorCode:detail.errorCode||null,
    responseSeconds:Number.isFinite(detail.responseSeconds)?detail.responseSeconds:null,phase,
    promptLevel:detail.promptLevel||'independent',observations:[...(detail.observations||[])],confidence:detail.confidence||null,
    anchorId:detail.anchorId||null,anchorLabel:detail.anchorLabel||'',year:detail.year||'',
    source:detail.source||'focus-mode',sessionId:sessionId(),createdAt:at,updatedAt:at
  };
  state.events.push(event);
  const c=ensureCycle(skill);
  if(phase==='teach'||phase==='practise')c.steps[phase]={outcome:'completed',at,sourceEventId:event.id};
  else if(['diagnose','demonstrate','retrieve1','retrieve2','apply'].includes(phase))c.steps[phase]={outcome:event.outcome,at,sourceEventId:event.id};
  c.updatedAt=at;saveState();
  window.dispatchEvent(new CustomEvent('beyond100-evidence-updated',{detail:{event}}));
  return event;
}
function recordConfidence(detail={}){
  const at=now();
  const event={
    id:crypto.randomUUID(),kind:'confidence-response',app:'beyond100',topicId:topicId(),subject:subject(),
    skill:detail.skill||'Focused learning',prompt:detail.prompt||'',confidence:detail.confidence||null,
    phase:detail.phase||'',taskId:detail.taskId||null,source:'focus-v9',sessionId:sessionId(),
    createdAt:at,updatedAt:at
  };
  state.events.push(event);saveState();
  window.dispatchEvent(new CustomEvent('beyond100-evidence-updated',{detail:{event}}));
  return event;
}
window.BEYOND100_EVIDENCE={recordFocusResponse,recordConfidence,getState:()=>JSON.parse(JSON.stringify(state)),outcomes:OUTCOMES,cycle:CYCLE};
window.addEventListener('beyond100-focus-response',e=>recordFocusResponse(e.detail||{}));
