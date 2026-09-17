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
let state=loadState();
let sdkPromise=null,cloudSyncTimer=null,cloudReady=false;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const now=()=>new Date().toISOString();
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function emptyState(){return{schema:'beyond100-learning-evidence-v1',events:[],cycles:{},updatedAt:null}}
function loadState(){try{return{...emptyState(),...JSON.parse(localStorage.getItem(EVIDENCE_KEY)||'{}')}}catch{return emptyState()}}
function trimState(){if(state.events.length>500)state.events=[...state.events].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt||0)-Date.parse(a.updatedAt||a.createdAt||0)).slice(0,500)}
function saveState(){trimState();state.updatedAt=now();localStorage.setItem(EVIDENCE_KEY,JSON.stringify(state));renderAll();scheduleCloudSync()}
function sessionId(){try{return JSON.parse(localStorage.getItem(APP_SESSION_KEY)||'{}').id||null}catch{return null}}
function topicId(){return TOPIC?.id||'maths-place-value'}
function subject(){return TOPIC?.subject||'Maths'}
function wordCount(text=''){return String(text).trim().split(/\s+/).filter(Boolean).length}
function yearNumber(y=''){const n=Number(String(y).replace(/\D/g,''));return Number.isFinite(n)?n:99}
function dayDiff(a,b){return Math.abs(Date.parse(b)-Date.parse(a))/86400000}
function formatWhen(value){if(!value)return'—';try{return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return'—'}}
function formatDay(value){if(!value)return'—';try{return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(new Date(value))}catch{return'—'}}
function addDays(value,days){const d=new Date(value);d.setDate(d.getDate()+days);return d.toISOString()}
function isCorrect(outcome){return outcome==='fast'||outcome==='hesitant'}
function isFluent(outcome){return outcome==='fast'}

function mount(){
  mountEvidenceSection();
  updateDiagnosticCopy();
  bindDiagnosticLifecycle();
  enhanceDiagnosticCards();
  renderAll();
  startCloud().catch(()=>setCloudStatus('Saved locally · Firebase evidence sync unavailable','error'));
}

function mountEvidenceSection(){
  const nav=$('.section-nav'),assess=$('#assessments');
  if(!nav||!assess)return;
  if(!nav.querySelector('[data-section="evidence-plan"]')){
    const b=document.createElement('button');b.dataset.section='evidence-plan';b.textContent='Evidence plan';
    const before=nav.querySelector('[data-section="assessments"]');nav.insertBefore(b,before||null);
    b.addEventListener('click',()=>activateSection('evidence-plan'));
  }
  if($('#evidence-plan'))return;
  const section=document.createElement('section');section.className='content-section';section.id='evidence-plan';
  section.innerHTML=`
    <div class="section-heading"><div><p class="eyebrow">BEFORE THE HALF-TERM MEETING</p><h2>Turn impressions into a learning profile</h2></div><p>Build repeated evidence that distinguishes a one-off error from a stable pattern: what is secure, what is fragile, what is forgotten, what needs prompting and what transfers to unfamiliar questions.</p></div>
    <div class="breakdown-focus" data-note-anchor="evidence:first-breakdown" data-note-label="First breakdown layer">
      <p class="eyebrow">THE QUESTION WE ARE TRYING TO ANSWER</p>
      <blockquote>“What I want to find is the first layer at which his confidence or explanation breaks down.”</blockquote>
      <div id="firstBreakdownResult" class="breakdown-result"></div>
    </div>
    <div class="learning-cycle" data-note-anchor="evidence:learning-cycle" data-note-label="Learning evidence cycle">
      <div class="cycle-head"><div><p class="eyebrow">EVIDENCE CYCLE</p><h3>Do not advance on one successful attempt</h3><p>Diagnose → teach → demonstrate understanding → practise → retrieve → retrieve again → apply in a new context → only then advance.</p></div><span id="evidenceCloudStatus" class="evidence-cloud">Saved locally</span></div>
      <div class="response-legend">
        ${Object.entries(OUTCOMES).map(([id,o])=>`<span data-tone="${o.tone}"><b>${esc(o.label)}</b></span>`).join('')}
      </div>
      <div class="cycle-controls"><label>Skill<select id="cycleSkill"></select></label><label>Outcome for evidence steps<select id="cycleOutcome">${Object.entries(OUTCOMES).map(([id,o])=>`<option value="${id}">${esc(o.label)}</option>`).join('')}</select></label></div>
      <div id="cycleSteps" class="cycle-steps"></div>
      <div id="retentionPlan" class="retention-plan"></div>
    </div>
    <div class="half-term-panel" data-note-anchor="evidence:half-term-plan" data-note-label="Half-term evidence plan">
      <div class="half-term-head"><div><p class="eyebrow">WHAT TO ESTABLISH BEFORE HALF TERM</p><h3>Evidence checklist</h3></div><div class="half-term-actions"><div id="evidenceTotals" class="evidence-totals"></div><button id="copyMeetingBrief" class="secondary" type="button">Copy meeting brief</button></div></div>
      <div id="halfTermTargets" class="half-term-grid"></div>
      <div id="patternSignals" class="pattern-signals"></div>
    </div>
    <div class="evidence-log-panel"><div class="half-term-head"><div><p class="eyebrow">RECENT EVIDENCE</p><h3>What has actually been recorded</h3></div><button id="clearEvidence" class="secondary" type="button">Clear local evidence</button></div><div id="evidenceLog" class="evidence-log"></div></div>`;
  assess.insertAdjacentElement('beforebegin',section);
  populateSkillSelect();
  $('#cycleSkill')?.addEventListener('change',renderCycle);
  $('#cycleOutcome')?.addEventListener('change',renderCycle);
  $('#cycleSteps')?.addEventListener('click',e=>{const b=e.target.closest('[data-cycle-step]');if(b&&!b.disabled)recordCycleStep(b.dataset.cycleStep)});
  $('#copyMeetingBrief')?.addEventListener('click',copyMeetingBrief);
  $('#clearEvidence')?.addEventListener('click',()=>{
    if(!confirm('Clear the learning evidence saved on this device? Notes and assessment evidence are not affected.'))return;
    state=emptyState();saveState();
  });
}

function activateSection(id){
  $$('.content-section').forEach(s=>s.classList.toggle('active',s.id===id));
  $$('.section-nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  $('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'});
}
function updateDiagnosticCopy(){
  const p=$('#diagnose .section-heading>p');if(p)p.textContent='Start below the expected level and move upward. The aim is to find the first layer at which confidence, fluency or explanation breaks down — then separate knowledge, concept, question interpretation, procedure, fluency, reasoning and attention.';
}
function populateSkillSelect(){
  const el=$('#cycleSkill');if(!el||el.options.length)return;
  const skills=[...new Set((TOPIC?.questions||[]).map(q=>q.skill).filter(Boolean))].sort();
  if(!skills.length)skills.push('General place value understanding');
  el.innerHTML=skills.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

function bindDiagnosticLifecycle(){
  const build=$('#buildDiagnostic');if(build&&!build.dataset.evidenceBound){build.dataset.evidenceBound='1';build.addEventListener('click',()=>{const root=$('#diagnosticSet');if(root)root.dataset.evidenceSession=crypto.randomUUID();setTimeout(enhanceDiagnosticCards,0)})}
  const root=$('#diagnosticSet');if(root&&!root.dataset.evidenceObserved){root.dataset.evidenceObserved='1';new MutationObserver(enhanceDiagnosticCards).observe(root,{childList:true,subtree:true})}
}
function enhanceDiagnosticCards(){
  $$('#diagnosticSet .question-card.diagnostic').forEach(card=>{
    if(card.dataset.evidenceEnhanced)return;card.dataset.evidenceEnhanced='1';
    const row=card.querySelector('.score-row');if(!row)return;
    const box=document.createElement('div');box.className='response-recorder';
    box.innerHTML=`<div class="response-recorder-head"><strong>Response evidence</strong><div><button type="button" class="start-response-timer">Start timer</button><span class="response-time">Not timed</span></div></div><div class="response-outcomes">${Object.entries(OUTCOMES).map(([id,o])=>`<button type="button" data-outcome="${id}" data-tone="${o.tone}">${esc(o.label)}</button>`).join('')}</div><p class="response-recorded"></p>`;
    row.insertAdjacentElement('beforebegin',box);
    box.querySelector('.start-response-timer').addEventListener('click',()=>startCardTimer(card));
    box.querySelectorAll('[data-outcome]').forEach(b=>b.addEventListener('click',()=>recordDiagnostic(card,b.dataset.outcome)));
    row.addEventListener('click',e=>{const b=e.target.closest('.score-btn');if(!b)return;setTimeout(()=>recordErrorCode(card,b.textContent.trim()),0)});
  });
}
function startCardTimer(card){
  card.dataset.responseStarted=String(Date.now());
  const el=card.querySelector('.response-time');if(el)el.textContent='Timing…';
  const b=card.querySelector('.start-response-timer');if(b)b.textContent='Restart timer';
}
function questionMeta(card){
  const qid=card.dataset.qid||crypto.randomUUID();
  const source=(TOPIC?.questions||[]).find(q=>q.id===qid)||{};
  return{questionId:qid,year:source.year||card.querySelector('.badge')?.textContent?.trim()||'',skill:source.skill||'Unclassified',prompt:source.prompt||card.querySelector('.question-prompt')?.textContent?.trim()||'',questionType:source.type||''}
}
function recordDiagnostic(card,outcome){
  const meta=questionMeta(card),started=Number(card.dataset.responseStarted||0);const seconds=started?Math.max(.1,(Date.now()-started)/1000):null;
  const existingId=card.dataset.evidenceEventId;let event=existingId?state.events.find(x=>x.id===existingId):null;
  if(!event){event={id:crypto.randomUUID(),kind:'diagnostic-response',app:'beyond100',topicId:topicId(),subject:subject(),diagnosticSession:$('#diagnosticSet')?.dataset.evidenceSession||null,sessionId:sessionId(),createdAt:now()};state.events.push(event);card.dataset.evidenceEventId=event.id}
  Object.assign(event,meta,{outcome,responseSeconds:seconds,promptWords:wordCount(meta.prompt),updatedAt:now()});
  const selected=card.querySelector('.score-btn.selected');if(selected)event.errorCode=normaliseErrorCode(selected.textContent);
  if(card.dataset.pendingErrorCode)event.errorCode=card.dataset.pendingErrorCode;
  const cycle=ensureCycle(meta.skill);cycle.steps.diagnose={outcome,at:event.updatedAt,sourceEventId:event.id};cycle.updatedAt=event.updatedAt;
  card.querySelectorAll('[data-outcome]').forEach(b=>b.classList.toggle('selected',b.dataset.outcome===outcome));
  const label=card.querySelector('.response-recorded');if(label)label.textContent=`Recorded: ${OUTCOMES[outcome].label}${seconds?` · ${seconds.toFixed(1)}s`:''}`;
  const time=card.querySelector('.response-time');if(time)time.textContent=seconds?`${seconds.toFixed(1)}s`:'Not timed';
  card.dataset.responseStarted='';saveState();
}
function normaliseErrorCode(text=''){
  if(text.startsWith('✓'))return'Secure';
  const m=text.match(/^([KCQPFRA])\b/);return m?m[1]:text.slice(0,20);
}
function recordErrorCode(card,text){
  const code=normaliseErrorCode(text);card.dataset.pendingErrorCode=code;
  const id=card.dataset.evidenceEventId;if(!id)return;const event=state.events.find(x=>x.id===id);if(!event)return;event.errorCode=code;event.updatedAt=now();saveState();
}

function ensureCycle(skill){if(!state.cycles[skill])state.cycles[skill]={skill,steps:{},retentionDue:{},updatedAt:null};return state.cycles[skill]}
function selectedSkill(){return $('#cycleSkill')?.value||''}
function recordCycleStep(stepId){
  const skill=selectedSkill();if(!skill)return;const cycle=ensureCycle(skill),def=CYCLE.find(x=>x.id===stepId);if(!def)return;
  if(!stepAvailable(cycle,stepId))return;
  const outcome=def.evidence?($('#cycleOutcome')?.value||'fast'):'completed';const at=now();cycle.steps[stepId]={outcome,at};cycle.updatedAt=at;
  if(stepId==='advance'){
    const base=cycle.steps.practise?.at||at;cycle.retentionDue={d14:addDays(base,14),d30:addDays(base,30),d60:addDays(base,60)};
  }
  state.events.push({id:crypto.randomUUID(),kind:'cycle-step',app:'beyond100',topicId:topicId(),subject:subject(),skill,step:stepId,outcome,sessionId:sessionId(),createdAt:at,updatedAt:at});
  saveState();
}
function stepAvailable(cycle,id){
  const s=cycle.steps;
  if(id==='diagnose')return true;
  if(id==='teach')return!!s.diagnose;
  if(id==='demonstrate')return!!s.teach;
  if(id==='practise')return!!s.demonstrate&&isCorrect(s.demonstrate.outcome);
  if(id==='retrieve1')return!!s.practise;
  if(id==='retrieve2')return!!s.retrieve1;
  if(id==='apply')return!!s.retrieve2;
  if(id==='advance')return advanceReady(cycle);
  return false;
}
function advanceReady(cycle){const s=cycle.steps;return isFluent(s.retrieve1?.outcome)&&isFluent(s.retrieve2?.outcome)&&isFluent(s.apply?.outcome)&&isCorrect(s.demonstrate?.outcome)}
function dueFor(cycle,id){
  const s=cycle.steps,base=s.practise?.at;
  if(id==='retrieve1'&&base)return addDays(base,1);
  if(id==='retrieve2'&&base)return addDays(base,3);
  if(id==='apply'&&base)return addDays(base,7);
  return null;
}
function renderCycle(){
  const root=$('#cycleSteps');if(!root)return;const skill=selectedSkill(),cycle=ensureCycle(skill);
  root.innerHTML=CYCLE.map((step,i)=>{
    const rec=cycle.steps[step.id],available=stepAvailable(cycle,step.id),due=dueFor(cycle,step.id),outcome=rec?.outcome;
    const status=rec?(outcome==='completed'?'Done':OUTCOMES[outcome]?.short||outcome):(available?'Record':'Locked');
    const tone=rec&&OUTCOMES[outcome]?OUTCOMES[outcome].tone:(rec?'secure':'');
    return `<article class="cycle-step ${rec?'is-recorded':''}" data-tone="${tone}"><span class="cycle-number">${i+1}</span><div><strong>${esc(step.label)}</strong><p>${esc(step.help)}</p>${due&&!rec?`<small>Suggested: ${formatDay(due)}</small>`:''}${rec?`<small>${formatWhen(rec.at)}</small>`:''}</div><button type="button" data-cycle-step="${step.id}" ${available?'':'disabled'}>${esc(status)}</button></article>`;
  }).join('');
  const retention=$('#retentionPlan');if(retention){const r=cycle.retentionDue||{};retention.innerHTML=cycle.steps.advance?`<strong>Longer retention checks</strong><span>D14 · ${formatDay(r.d14)}</span><span>D30 · ${formatDay(r.d30)}</span><span>D60 · ${formatDay(r.d60)}</span>`:`<strong>Advance gate</strong><span>Two retrievals and the new-context application must be correct + fast before Advance unlocks.</span>`}
}

function latestDiagnostics(){
  const map=new Map();state.events.filter(e=>e.kind==='diagnostic-response').forEach(e=>{const key=e.questionId||e.id,old=map.get(key);if(!old||Date.parse(e.updatedAt||e.createdAt)>Date.parse(old.updatedAt||old.createdAt))map.set(key,e)});return[...map.values()]
}
function renderBreakdown(){
  const root=$('#firstBreakdownResult');if(!root)return;const rows=latestDiagnostics().sort((a,b)=>yearNumber(a.year)-yearNumber(b.year)||Date.parse(a.createdAt)-Date.parse(b.createdAt));
  if(!rows.length){root.innerHTML='<strong>No diagnostic evidence recorded yet.</strong><span>Start below the expected level and record response quality as you move upward.</span>';return}
  const grouped=new Map();rows.forEach(e=>{if(!grouped.has(e.year))grouped.set(e.year,[]);grouped.get(e.year).push(e)});
  const years=[...grouped.keys()].sort((a,b)=>yearNumber(a)-yearNumber(b));
  const fragileYear=years.find(y=>grouped.get(y).some(e=>e.outcome!=='fast'));
  if(!fragileYear){const highest=years.at(-1);root.innerHTML=`<strong>No breakdown yet in the assessed questions.</strong><span>${esc(highest||'')} is currently the highest sampled layer. Move upward or make the explanation/transfer demand harder.</span>`;return}
  const fragile=grouped.get(fragileYear).find(e=>e.outcome!=='fast');
  const lowerYears=years.filter(y=>yearNumber(y)<yearNumber(fragileYear));
  const lowerSecure=lowerYears.length>0&&lowerYears.every(y=>grouped.get(y).length>=2&&grouped.get(y).every(e=>e.outcome==='fast'));
  root.innerHTML=`<strong>First observed fragile layer: ${esc(fragile.year)} · ${esc(fragile.skill)}</strong><span>${esc(OUTCOMES[fragile.outcome]?.label||fragile.outcome)}${fragile.responseSeconds?` · ${fragile.responseSeconds.toFixed(1)}s`:''}. ${lowerSecure?'Lower sampled layers have at least two fluent responses each.':'Keep sampling the layers below it before treating this as the confirmed first breakdown.'}</span>`;
}

function analysisData(){
  const diag=latestDiagnostics(),timed=diag.filter(e=>Number.isFinite(e.responseSeconds));
  const subjects=new Set(state.events.map(e=>e.subject).filter(Boolean));
  const categories=new Set(diag.map(e=>e.outcome));
  const errors={};diag.forEach(e=>{if(e.errorCode&&e.errorCode!=='Secure')errors[e.errorCode]=(errors[e.errorCode]||0)+1});
  const recurring=Math.max(0,...Object.values(errors));
  const cycles=Object.values(state.cycles);
  const recallCycle=cycles.find(c=>c.steps?.demonstrate&&(c.steps?.retrieve1||c.steps?.retrieve2));
  const prompted=diag.filter(e=>e.outcome==='prompted'||e.outcome==='noConcept');
  const promptRecovery=prompted.some(p=>state.events.some(e=>e.skill===p.skill&&e.kind==='cycle-step'&&['retrieve1','retrieve2','apply'].includes(e.step)&&isCorrect(e.outcome)&&Date.parse(e.createdAt)>Date.parse(p.createdAt)));
  const spaced=cycles.some(c=>c.steps?.retrieve1&&c.steps?.retrieve2&&dayDiff(c.steps.retrieve1.at,c.steps.retrieve2.at)>=1);
  const short=diag.filter(e=>(e.promptWords||0)<=10),long=diag.filter(e=>(e.promptWords||0)>10);
  const failRate=arr=>arr.length?arr.filter(e=>!isCorrect(e.outcome)).length/arr.length:null;
  const shortFail=failRate(short),longFail=failRate(long);
  return{diag,timed,subjects,categories,errors,recurring,cycles,recallCycle,prompted,promptRecovery,spaced,short,long,shortFail,longFail};
}
function targetData(){
  const a=analysisData();
  return[
    {title:'Secure vs fragile topics',progress:Math.min(1,a.diag.length/8)*(a.categories.has('fast')&&[...a.categories].some(x=>x!=='fast')?1:.75),detail:`${a.diag.length} diagnostic responses across ${new Set(a.diag.map(e=>e.skill)).size} skills. Build enough examples to separate secure from fragile rather than one-off mistakes.`},
    {title:'Recurring error pattern',progress:Math.min(1,a.recurring/2),detail:a.recurring>=2?`A repeated error cause is appearing (${Object.entries(a.errors).sort((x,y)=>y[1]-x[1])[0]?.[0]} ×${a.recurring}).`:'Record the dominant K/C/Q/P/F/R/A cause when an answer is not secure; a repeated cause is more useful than a list of wrong answers.'},
    {title:'Recall vs conceptual understanding',progress:a.recallCycle?1:(a.cycles.some(c=>c.steps?.demonstrate)?.5:0),detail:a.recallCycle?'At least one skill now has immediate understanding plus later retrieval evidence.':'Record “demonstrate understanding” and later retrieve the same skill without reteaching.'},
    {title:'Response time and hesitation',progress:Math.min(1,a.timed.length/5),detail:`${a.timed.length} timed diagnostic responses. Keep “correct + fast” separate from “correct + hesitant”.`},
    {title:'Effect of prompting',progress:a.promptRecovery?1:(a.prompted.length?.5:0),detail:a.promptRecovery?'A prompted/incorrect response has later been retrieved correctly, showing what changed after support.':a.prompted.length?'Prompt-dependent responses are recorded; now retest them later without the prompt.':'Record when he understands only after a prompt, then revisit the same skill later.'},
    {title:'Forgetting over time',progress:a.spaced?1:(a.cycles.some(c=>c.steps?.retrieve1&&c.steps?.retrieve2)?.6:0),detail:a.spaced?'Two retrievals at least a day apart are recorded for a skill. Continue D14/D30/D60 checks after Advance.':'Use the two retrieval stages on different days; same-session repetition cannot establish retention.'},
    {title:'Effect of longer verbal wording',progress:(a.short.length>=3&&a.long.length>=3)?1:Math.min(.8,(a.short.length+a.long.length)/8),detail:(a.short.length>=3&&a.long.length>=3)?`Short-question non-secure rate ${Math.round((a.shortFail||0)*100)}%; longer-question non-secure rate ${Math.round((a.longFail||0)*100)}%. Keep collecting before treating the difference as stable.`:`Need at least 3 shorter and 3 longer diagnostic questions. Current: ${a.short.length} short / ${a.long.length} longer.`},
    {title:'Cross-subject pattern',progress:Math.min(1,a.subjects.size/2),detail:a.subjects.size>=2?`Evidence now spans ${[...a.subjects].join(', ')}.`:'This cannot be established from Place Value alone. Use the same evidence model as detailed English and Science topics are added.'}
  ]
}
function patternSignals(){
  const a=analysisData(),signals=[];
  const topError=Object.entries(a.errors).sort((x,y)=>y[1]-x[1])[0];
  if(topError?.[1]>=2){const names={K:'knowledge gaps',C:'conceptual understanding',Q:'question interpretation / phrasing',P:'procedure',F:'fluency / speed',R:'reasoning / strategy',A:'attention / careless slips'};signals.push(`Repeated ${names[topError[0]]||topError[0]} signal (${topError[0]} ×${topError[1]}).`)}
  if(a.short.length>=3&&a.long.length>=3&&a.longFail!==null&&a.shortFail!==null&&a.longFail-a.shortFail>=.25)signals.push('Performance currently deteriorates on longer verbal questions; investigate language load separately from the maths concept.');
  const retentionDrops=a.cycles.filter(c=>isCorrect(c.steps?.demonstrate?.outcome)&&((c.steps?.retrieve1&&!isCorrect(c.steps.retrieve1.outcome))||(c.steps?.retrieve2&&!isCorrect(c.steps.retrieve2.outcome))));
  if(retentionDrops.length)signals.push(`${retentionDrops.length} skill${retentionDrops.length===1?'':'s'} understood immediately but later retrieval weakened — possible retention rather than teaching failure.`);
  const promptDependent=a.prompted.filter(p=>!state.events.some(e=>e.skill===p.skill&&e.kind==='cycle-step'&&['retrieve1','retrieve2','apply'].includes(e.step)&&isCorrect(e.outcome)&&Date.parse(e.createdAt)>Date.parse(p.createdAt)));
  if(promptDependent.length)signals.push(`${promptDependent.length} diagnostic response${promptDependent.length===1?' is':'s are'} still prompt-dependent without later independent retrieval evidence.`);
  if(!signals.length)signals.push('No stable pattern signal yet. Keep collecting repeated responses before drawing conclusions from individual errors.');
  return signals;
}
function renderHalfTerm(){
  const root=$('#halfTermTargets');if(!root)return;const items=targetData();root.innerHTML=items.map(x=>{const status=x.progress>=.99?'Evidence ready':x.progress>=.45?'Building':'Need evidence';return `<article class="evidence-target" data-status="${status==='Evidence ready'?'ready':status==='Building'?'building':'need'}"><div><strong>${esc(x.title)}</strong><span>${status}</span></div><p>${esc(x.detail)}</p><div class="evidence-meter"><i style="width:${Math.round(Math.min(1,x.progress)*100)}%"></i></div></article>`}).join('');
  const diag=latestDiagnostics();const totals=$('#evidenceTotals');if(totals)totals.innerHTML=`<span><b>${diag.length}</b> diagnostic</span><span><b>${state.events.filter(e=>e.kind==='cycle-step').length}</b> cycle records</span><span><b>${Object.keys(state.cycles).length}</b> skills tracked</span>`;
  const signals=$('#patternSignals');if(signals){const list=patternSignals();signals.innerHTML=`<strong>Emerging pattern signals</strong><ul>${list.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
}
function renderLog(){
  const root=$('#evidenceLog');if(!root)return;const recent=[...state.events].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt)-Date.parse(a.updatedAt||a.createdAt)).slice(0,12);
  root.innerHTML=recent.length?recent.map(e=>`<article><div><strong>${esc(e.skill||e.questionId||'Evidence')}</strong><span>${formatWhen(e.updatedAt||e.createdAt)}</span></div><p>${e.kind==='diagnostic-response'?`${esc(e.year)} · ${esc(OUTCOMES[e.outcome]?.label||e.outcome)}${e.responseSeconds?` · ${e.responseSeconds.toFixed(1)}s`:''}${e.errorCode?` · ${esc(e.errorCode)}`:''}`:`${esc(CYCLE.find(x=>x.id===e.step)?.label||e.step)} · ${esc(e.outcome==='completed'?'completed':OUTCOMES[e.outcome]?.label||e.outcome)}`}</p></article>`).join(''):'<div class="notes-empty">No learning evidence recorded yet.</div>';
}
function renderAll(){renderCycle();renderBreakdown();renderHalfTerm();renderLog()}

function meetingBrief(){
  const targets=targetData(),signals=patternSignals(),diag=latestDiagnostics();
  const lines=[
    'Beyond 100 · half-term learning evidence brief',
    `Generated: ${new Date().toLocaleString('en-GB')}`,
    `Topic currently sampled: ${TOPIC?.subject||'Maths'} · Place Value & Number Structure`,
    '',
    'Guiding question:',
    'What is the first layer at which his confidence or explanation breaks down?',
    '',
    'Response evidence:',
    `Diagnostic responses: ${diag.length}`,
    `Skills with cycle data: ${Object.keys(state.cycles).length}`,
    '',
    'What to establish before half term:',
    ...targets.map(x=>`- ${x.title}: ${x.progress>=.99?'evidence ready':x.progress>=.45?'building':'need evidence'} — ${x.detail}`),
    '',
    'Emerging pattern signals:',
    ...signals.map(x=>`- ${x}`),
    '',
    'Mastery cycle:',
    'Diagnose → teach → demonstrate understanding → practise → retrieve → retrieve again → apply in a new context → only then advance.',
    '',
    'Response categories:',
    ...Object.values(OUTCOMES).map(o=>`- ${o.label}`)
  ];
  return lines.join('\n');
}
async function copyMeetingBrief(){
  const b=$('#copyMeetingBrief');try{await navigator.clipboard.writeText(meetingBrief());if(b){const old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,1400)}}catch{if(b)b.textContent='Copy failed'}
}

function mergeStates(local,remote){
  if(!remote)return local;const merged={...emptyState(),...local};const events=new Map();[...(remote.events||[]),...(local.events||[])].forEach(e=>{const old=events.get(e.id);if(!old||Date.parse(e.updatedAt||e.createdAt||0)>=Date.parse(old.updatedAt||old.createdAt||0))events.set(e.id,e)});merged.events=[...events.values()];merged.cycles={...(remote.cycles||{})};
  Object.entries(local.cycles||{}).forEach(([skill,c])=>{const base=merged.cycles[skill]||{skill,steps:{},retentionDue:{}};base.steps={...(base.steps||{})};Object.entries(c.steps||{}).forEach(([step,val])=>{const old=base.steps[step];if(!old||Date.parse(val.at||0)>=Date.parse(old.at||0))base.steps[step]=val});base.retentionDue={...(base.retentionDue||{}),...(c.retentionDue||{})};base.updatedAt=[base.updatedAt,c.updatedAt].filter(Boolean).sort().at(-1)||null;merged.cycles[skill]=base});merged.updatedAt=[local.updatedAt,remote.updatedAt].filter(Boolean).sort().at(-1)||now();return merged;
}
async function sdk(){if(sdkPromise)return sdkPromise;sdkPromise=(async()=>{const[A,Auth,F]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);const app=A.getApps()[0]||A.initializeApp(CLOUD.firebase);return{Auth,F,auth:Auth.getAuth(app),db:F.getFirestore(app)}})();return sdkPromise}
function evidenceRef(S){return S.F.doc(S.db,...CLOUD.firestoreBase,'beyond100-learning-evidence')}
async function startCloud(){const S=await sdk();await S.auth.authStateReady();S.Auth.onAuthStateChanged(S.auth,async user=>{cloudReady=!!user&&user.uid===CLOUD.ownerUid;if(!cloudReady){setCloudStatus('Saved locally · sign in to Firebase to sync','local');return}try{setCloudStatus('Syncing learning evidence…','syncing');const snap=await S.F.getDoc(evidenceRef(S));if(snap.exists()&&snap.data()?.payload){state=mergeStates(state,snap.data().payload);localStorage.setItem(EVIDENCE_KEY,JSON.stringify(state));renderAll()}await syncCloud()}catch{setCloudStatus('Saved locally · evidence sync failed','error')}})}
function scheduleCloudSync(){clearTimeout(cloudSyncTimer);if(cloudReady)cloudSyncTimer=setTimeout(()=>syncCloud().catch(()=>setCloudStatus('Saved locally · evidence sync failed','error')),700)}
async function syncCloud(){if(!cloudReady)return;const S=await sdk(),user=S.auth.currentUser;if(!user||user.uid!==CLOUD.ownerUid)return;setCloudStatus('Syncing learning evidence…','syncing');await S.F.setDoc(evidenceRef(S),{app:'beyond100',kind:'learning-evidence',schema:state.schema,updatedAt:state.updatedAt||now(),payload:state},{merge:true});setCloudStatus('Learning evidence synced to Firebase','connected')}
function setCloudStatus(text,stateName='local'){const el=$('#evidenceCloudStatus');if(el){el.textContent=text;el.dataset.state=stateName}}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
