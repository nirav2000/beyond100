// Experimental, learner-controlled question breakdown.
// Mounted alongside (not replacing) the existing explanation coach, with
// an A/B switch. It deliberately never auto-marks prose as good reasoning.
import {questionBreakdown,combineBreakdown,COMMAND_WORDS,WHY_TARGETS} from './question-breakdown-data.mjs';
import {modelFor,checkTransfer,MATHS_WORDS} from './explanation-coach.mjs';

export function createQuestionBreakdownCoach({legacyCoach,onProgress=()=>{},initialMode='existing'}={}){
 const old=document.getElementById('tlExplainCoach');
 if(!old||!legacyCoach)throw Error('The experiment needs the current explanation coach');
 const chooser=document.createElement('section');
 chooser.id='tlQbSwitcher';chooser.className='tl-qb-switcher';
 chooser.innerHTML='<div><strong>Compare explanation methods</strong><p>Both use the same maths experiment. Try each way of explaining it.</p></div>'+
  '<div class="tl-qb-switch-buttons" role="group" aria-label="Compare the current and experimental explanation methods">'+
  '<button type="button" id="tlQbOld" aria-pressed="true">Current way</button>'+
  '<button type="button" id="tlQbNew" aria-pressed="false">New: break the question down</button></div>'+
  '<p class="tl-qb-note">Experimental branch only. Switching views does not overwrite an existing answer.</p>';
 old.before(chooser);
 const section=document.createElement('section');
 section.id='tlQbCoach';section.className='tl-qb-coach';
 old.after(section);
 section.innerHTML='<div class="tl-qb-top"><span class="tl-guide-kicker">EXPERIMENT · EXPLAIN YOUR THINKING</span>'+
  '<h3>Understand the question. Build the answer.</h3><p>First have a go, then use small questions if you need help. We will join your ideas into a fuller explanation.</p></div>'+
  '<div class="tl-qb-selectors"><label for="tlQbCommand">Question word<select id="tlQbCommand"></select></label>'+
  '<label for="tlQbWhyTarget" id="tlQbWhyWrap" hidden>Which "why"?<select id="tlQbWhyTarget"></select></label></div>'+
  '<div class="tl-qb-definition"><strong id="tlQbMeaning"></strong><p id="tlQbNeed"></p></div>'+
  '<div class="tl-qb-question"><span>YOUR QUESTION</span><h4 id="tlQbQuestion"></h4></div>'+
  '<p id="tlQbGate" class="tl-explain-gate" hidden>First complete the practical activity and the 729 + 21 calculation. Then explain it in your own words.</p>'+
  '<div id="tlQbWork"><div id="tlQbFirstBlock"><h4>1 · Have your own go</h4><label for="tlQbFirst">What would you say before seeing any help?</label>'+
  '<textarea id="tlQbFirst" rows="3" placeholder="I would ... because ..."></textarea>'+
  '<div class="tl-qb-actions"><button type="button" class="tl-btn primary" id="tlQbBreak">Break my question into smaller steps</button>'+
  '<button type="button" class="tl-btn" id="tlQbStuck">I am stuck — guide me</button></div>'+
  '<p id="tlQbFirstMessage" class="tl-caption" role="status" aria-live="polite"></p></div>'+
  '<div id="tlQbSteps" hidden><h4>2 · One small question at a time</h4>'+
  '<p class="tl-qb-progress" id="tlQbCounter"></p><div class="tl-qb-step"><label for="tlQbStepAnswer" id="tlQbStepQuestion"></label>'+
  '<p class="tl-qb-starter" id="tlQbStepStarter"></p><textarea id="tlQbStepAnswer" rows="2" placeholder="Finish this thought in your own words..."></textarea>'+
  '<div class="tl-qb-actions"><button type="button" class="tl-btn" id="tlQbHint">A small hint</button>'+
  '<button type="button" class="tl-btn" id="tlQbExample">Show an example for this step</button></div>'+
  '<p id="tlQbStepHelp" class="tl-qb-step-help" hidden></p></div>'+
  '<div class="tl-qb-actions"><button type="button" class="tl-btn" id="tlQbPrev">Previous</button>'+
  '<button type="button" class="tl-btn primary" id="tlQbNext">Next small question</button>'+
  '<button type="button" class="tl-btn" id="tlQbSkip">Skip this one — I need help</button></div>'+
  '<p id="tlQbStepsMessage" class="tl-caption" role="status" aria-live="polite"></p></div>'+
  '<div id="tlQbBuild" hidden><h4>3 · Join your answers</h4><p>Look at the small ideas you have collected. The next box joins them with words like <strong>because</strong> and <strong>therefore</strong>.</p>'+
  '<p>The joining words <strong>because</strong>, <strong>so</strong> and <strong>therefore</strong> help show your reasoning, not just list steps.</p>'+
  '<div id="tlQbIdeas" class="tl-qb-ideas" aria-label="Your small answers"></div>'+ 
  '<div class="tl-qb-actions"><button type="button" class="tl-btn" id="tlQbRebuild">Rebuild from my small answers</button>'+
  '<button type="button" class="tl-btn" id="tlQbBack">Edit my small answers</button></div>'+
  '<label for="tlQbCombined">Your combined answer — edit it so it sounds natural</label>'+
  '<textarea id="tlQbCombined" rows="6"></textarea><p id="tlQbMissing" class="tl-caption"></p>'+
  '<button type="button" class="tl-btn primary" id="tlQbCompare">Compare with two example answers</button>'+
  '<p id="tlQbBuildMessage" class="tl-caption" role="status" aria-live="polite"></p></div>'+
  '<div id="tlQbModels" hidden><h4>4 · Compare and improve</h4>'+
  '<div class="tl-qb-two-models"><div><strong>Everyday language</strong><p id="tlQbPlain"></p></div>'+
  '<div><strong>Mathematical language</strong><p id="tlQbFormal"></p></div></div>'+
  '<p>Both can be correct. Can you make YOUR answer more precise without copying?</p>'+
  '<div id="tlQbTerms" class="tl-explain-vocab" role="group" aria-label="Mathematical vocabulary"></div>'+
  '<p id="tlQbTermDefinition" class="tl-caption" aria-live="polite"></p>'+
  '<label for="tlQbImproved">Your improved explanation</label><textarea id="tlQbImproved" rows="5"></textarea>'+
  '<fieldset class="tl-qb-checks"><legend>Self-check</legend>'+
  '<label><input type="checkbox" data-qbcheck="change">I explained the change or method.</label>'+
  '<label><input type="checkbox" data-qbcheck="purpose">I said WHY that choice helps (if the question asks).</label>'+
  '<label><input type="checkbox" data-qbcheck="valid">I explained WHY the result is true.</label>'+
  '<label><input type="checkbox" data-qbcheck="evidence">I used relevant mathematical evidence.</label></fieldset>'+
  '<button type="button" class="tl-btn primary" id="tlQbSave">Save my improved explanation</button>'+
  '<p id="tlQbSaveMessage" class="tl-caption" role="status" aria-live="polite"></p></div>'+
  '<div id="tlQbTransfer" hidden><h4>5 · Can you do it with different numbers?</h4><p id="tlQbTransferPrompt"></p>'+
  '<div id="tlQbTransferControls" class="tl-explain-transfer-fields"></div>'+
  '<label for="tlQbTransferWhy">Why does your answer work?</label><textarea id="tlQbTransferWhy" rows="3"></textarea>'+
  '<button type="button" class="tl-btn primary" id="tlQbCheckTransfer">Check my new calculation</button>'+
  '<p id="tlQbTransferMessage" class="tl-caption" role="status" aria-live="polite"></p>'+
  '<p class="tl-caption">The calculation is checked automatically. Your mathematical reasoning is saved for a parent to assess.</p></div></div>';
 const $=id=>section.querySelector('#'+id);
 let question=null,model=null,lesson=null,mode='existing',role='learner',level=2,ready=false,entry=null,at=0,firstLocked=false;
 let chosenWord='Explain',whyFocus='easier',stepHelpType=null;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const notice=kind=>{if(!entry)return;entry.updatedAt=new Date().toISOString();onProgress({kind,profile:role,record:clone(entry)});};
 const chooserOld=chooser.querySelector('#tlQbOld'),chooserNew=chooser.querySelector('#tlQbNew');
 function setMode(value){
  mode=value==='guided'?'guided':'existing';
  old.hidden=mode==='guided';section.hidden=mode!=='guided';
  chooserOld.setAttribute('aria-pressed',String(mode==='existing'));
  chooserNew.setAttribute('aria-pressed',String(mode==='guided'));
  chooserNew.classList.toggle('selected',mode==='guided');
  chooserOld.classList.toggle('selected',mode==='existing');
 }
 chooserOld.addEventListener('click',()=>setMode('existing'));
 chooserNew.addEventListener('click',()=>setMode('guided'));
 function setReady(value){
  ready=Boolean(value);legacyCoach.setReady(value);
  $('tlQbGate').hidden=ready;
  $('tlQbWork').hidden=!ready;
 }
 function freshWord(word='Explain',focus='easier'){
  chosenWord=word;whyFocus=focus;lesson=questionBreakdown(question,word,focus,model);
  at=0;firstLocked=false;stepHelpType=null;
  entry={id:'qb-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),
   createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
   approach:'guided-breakdown',technique:question.id,topic:question.topic,skill:question.skill,prompt:lesson.question,
   word,whyFocus:focus,independentAnswer:'',firstDescribe:'',firstWhy:'',firstEvidence:'',independentStart:false,
   supportBeforeFirstDraft:false,helpUsed:false,modelSeen:false,improved:'',checklist:{},
   scaffold:{answers:{},hints:[],examples:[],skipped:[],assembled:'',edited:'',stepCount:lesson.steps.length},
   transfer:{kind:model.transfer.kind,first:null,second:null,choice:null,why:'',correct:null,checks:0}};
  const meaning=COMMAND_WORDS.find(x=>x.id===chosenWord);
  $('tlQbMeaning').textContent=meaning.meaning;
  $('tlQbNeed').textContent=meaning.need+(word==='Prove'?' This is an extension challenge: try counters or diagrams before using letters.':'');
  $('tlQbQuestion').textContent=lesson.question;
  $('tlQbCommand').value=word;$('tlQbWhyWrap').hidden=word!=='Why'||!lesson.isComp;$('tlQbWhyTarget').value=focus;
  for(const id of ['tlQbFirst','tlQbStepAnswer','tlQbCombined','tlQbImproved','tlQbTransferWhy'])$(id).value='';
  for(const id of ['tlQbFirstMessage','tlQbStepsMessage','tlQbBuildMessage','tlQbSaveMessage','tlQbTransferMessage','tlQbTermDefinition','tlQbMissing'])$(id).textContent='';
  for(const id of ['tlQbSteps','tlQbBuild','tlQbModels','tlQbTransfer'])$(id).hidden=true;
  $('tlQbFirstBlock').hidden=false;$('tlQbFirst').readOnly=false;
  section.querySelectorAll('input[data-qbcheck]').forEach(n=>n.checked=false);
  $('tlQbPlain').textContent=lesson.plain;$('tlQbFormal').textContent=lesson.formal;
  const terms=$('tlQbTerms');terms.replaceChildren();
  lesson.words.forEach(word=>{
   const b=document.createElement('button');b.type='button';b.className='tl-btn tl-explain-word';b.textContent=word;
   b.addEventListener('click',()=>{$('tlQbTermDefinition').textContent=word+': '+(MATHS_WORDS[word]||'Look for this term in the model explanation.');});
   terms.appendChild(b);
  });
  renderTransfer();
 }
 function lockInitial(help=false){
  if(!entry||firstLocked||!ready)return;
  const value=$('tlQbFirst').value.trim();
  if(!help&&value.length<8){
   $('tlQbFirstMessage').textContent='Have a go in your own words, or choose "I am stuck" for help.';return;
  }
  entry.independentAnswer=value.slice(0,2000);entry.firstDescribe=entry.independentAnswer;
  entry.independentStart=!!value&&!help;entry.supportBeforeFirstDraft=help&&!value;entry.helpUsed=help;
  firstLocked=true;$('tlQbFirst').readOnly=true;$('tlQbSteps').hidden=false;
  $('tlQbFirstMessage').textContent=help?'You can learn from the steps now. This attempt is marked as supported.':'Your first answer is saved. Now try breaking the question into smaller parts.';
  showStep();notice(help?'guided-help':'independent-draft');
 }
 function showStep(){
  const s=lesson.steps[at];
  $('tlQbCounter').textContent='Small question '+(at+1)+' of '+lesson.steps.length;
  $('tlQbStepQuestion').textContent=s.question;
  $('tlQbStepStarter').textContent='Sentence starter: '+s.starter+' ...';
  $('tlQbStepAnswer').value=entry.scaffold.answers[s.id]||'';
  $('tlQbPrev').disabled=at===0;
  $('tlQbNext').textContent=at===lesson.steps.length-1?'Build my full answer':'Next small question';
  $('tlQbStepHelp').hidden=true;$('tlQbStepHelp').textContent='';
  $('tlQbStepsMessage').textContent='';
  stepHelpType=null;
 }
 function makeCombined(){
  if(!entry)return;
  const result=combineBreakdown(lesson,entry.scaffold.answers);
  $('tlQbBuild').hidden=false;
  const ideas=$('tlQbIdeas');ideas.replaceChildren();
  lesson.steps.forEach((item,i)=>{
   const row=document.createElement('div');row.className='tl-qb-idea';
   const caption=document.createElement('strong');caption.textContent=(i+1)+'. '+item.question;
   const answer=document.createElement('p');answer.textContent=entry.scaffold.answers[item.id]?.trim()||'Not answered yet';
   row.append(caption,answer);ideas.appendChild(row);
  });
  $('tlQbCombined').value=result.text;
  entry.scaffold.assembled=result.text;entry.scaffold.edited=result.text;
  $('tlQbMissing').textContent=result.complete?'All the small questions are represented. Improve the flow if it sounds repetitive.':
   'Still missing: '+result.missing.length+' small answer(s). Fill in the square brackets or go back to the steps.';
  notice('assembled');
 }
 function renderTransfer(){
  const t=model.transfer,host=$('tlQbTransferControls');host.replaceChildren();
  $('tlQbTransferPrompt').textContent=t.prompt;
  if(t.kind==='addends'){
   for(const [id,label] of [['tlQbNewA','New first addend'],['tlQbNewB','New second addend']]){
    const wrap=document.createElement('label');wrap.htmlFor=id;wrap.textContent=label;
    const input=document.createElement('input');input.id=id;input.type='number';input.min='0';input.step='1';input.inputMode='numeric';
    wrap.appendChild(input);host.appendChild(wrap);
   }
  }else{
   const div=document.createElement('div');div.className='tl-options';
   t.question.options.forEach(option=>{
    const b=document.createElement('button');b.type='button';b.className='tl-option';b.dataset.choice=option;b.textContent=option;div.appendChild(b);
   });
   div.addEventListener('click',event=>{
    const target=event.target.closest('button[data-choice]');if(!target)return;
    entry.transfer.choice=target.dataset.choice;
    div.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===target));
    notice('transfer-choice');
   });host.appendChild(div);
  }
 }
 function load(q,options={}){
  legacyCoach.load(q,options);
  question=q;role=options.profile||'learner';level=options.level||2;
  model=modelFor(q,0,level);
  freshWord(chosenWord,whyFocus);
  setReady(q.id!=='balance-add');
 }
 COMMAND_WORDS.forEach(w=>{
  const option=document.createElement('option');option.value=w.id;option.textContent=w.id; $('tlQbCommand').appendChild(option);
 });
 WHY_TARGETS.forEach(t=>{
  const option=document.createElement('option');option.value=t.id;option.textContent=t.label;$('tlQbWhyTarget').appendChild(option);
 });
 $('tlQbCommand').addEventListener('change',e=>{if(!question)return;freshWord(e.target.value,whyFocus);});
 $('tlQbWhyTarget').addEventListener('change',e=>{if(!question)return;freshWord('Why',e.target.value);});
 $('tlQbFirst').addEventListener('input',()=>{
  if(!entry||firstLocked)return;
  entry.independentAnswer=$('tlQbFirst').value.slice(0,2000);
  entry.firstDescribe=entry.independentAnswer;
  notice('first-draft');
 });
 $('tlQbBreak').addEventListener('click',()=>lockInitial(false));
 $('tlQbStuck').addEventListener('click',()=>lockInitial(true));
 $('tlQbStepAnswer').addEventListener('input',()=>{
  if(!entry)return;
  const s=lesson.steps[at];entry.scaffold.answers[s.id]=$('tlQbStepAnswer').value.slice(0,1000);
  if(s.id==='unchanged'||s.id==='rule'||s.id==='reason'||s.id==='benefit'){
   entry.firstWhy=entry.scaffold.answers[s.id];
  }
  if(s.id==='evidence'||s.id==='result')entry.firstEvidence=entry.scaffold.answers[s.id];
  notice('step-draft');
 });
 $('tlQbHint').addEventListener('click',()=>{
  const s=lesson.steps[at];$('tlQbStepHelp').textContent='Hint: '+s.hint;
  $('tlQbStepHelp').hidden=false;stepHelpType='hint';
  if(!entry.scaffold.hints.includes(s.id))entry.scaffold.hints.push(s.id);
  entry.helpUsed=true;notice('step-hint');
 });
 $('tlQbExample').addEventListener('click',()=>{
  const s=lesson.steps[at];$('tlQbStepHelp').textContent='Example: '+s.example;
  $('tlQbStepHelp').hidden=false;stepHelpType='example';
  if(!entry.scaffold.examples.includes(s.id))entry.scaffold.examples.push(s.id);
  entry.helpUsed=true;entry.modelSeen=true;notice('step-example');
 });
 $('tlQbPrev').addEventListener('click',()=>{if(at===0)return;at--;showStep();});
 $('tlQbNext').addEventListener('click',()=>{
  const s=lesson.steps[at];
  if(!(entry.scaffold.answers[s.id]||'').trim()){
   $('tlQbStepsMessage').textContent='Try a few words, use a hint, or choose "Skip this one".';return;
  }
  if(at===lesson.steps.length-1){$('tlQbSteps').hidden=true;makeCombined();}else{at++;showStep();}
 });
 $('tlQbSkip').addEventListener('click',()=>{
  const s=lesson.steps[at];entry.helpUsed=true;
  if(!entry.scaffold.skipped.includes(s.id))entry.scaffold.skipped.push(s.id);
  notice('skipped-step');
  if(at===lesson.steps.length-1){$('tlQbSteps').hidden=true;makeCombined();}else{at++;showStep();}
 });
 $('tlQbRebuild').addEventListener('click',()=>makeCombined());
 $('tlQbBack').addEventListener('click',()=>{$('tlQbBuild').hidden=true;$('tlQbSteps').hidden=false;at=0;showStep();});
 $('tlQbCombined').addEventListener('input',()=>{entry.scaffold.edited=$('tlQbCombined').value.slice(0,2500);notice('combined-edit');});
 $('tlQbCompare').addEventListener('click',()=>{
  const answer=$('tlQbCombined').value.trim();
  if(answer.length<35||/\[[^\]]+\]/.test(answer)){
   $('tlQbBuildMessage').textContent='Finish the missing parts in square brackets and check your full explanation before comparing.';return;
  }
  entry.scaffold.edited=answer.slice(0,2500);
  entry.modelSeen=true;$('tlQbModels').hidden=false;
  $('tlQbImproved').value=answer;
  $('tlQbBuildMessage').textContent='Your combined answer is saved. The examples are to compare, not to copy.';
  notice('compare-models');
 });
 $('tlQbImproved').addEventListener('input',()=>{
  if(!entry)return;entry.improvedDraft=$('tlQbImproved').value.slice(0,2500);
  notice('improved-draft');
 });
 $('tlQbSave').addEventListener('click',()=>{
  const text=$('tlQbImproved').value.trim();
  if(text.length<35||text===entry.scaffold.edited.trim()||text===lesson.formal.trim()||text===lesson.plain.trim()){
   $('tlQbSaveMessage').textContent='Improve your own wording; do not simply copy the combined answer or the model.';return;
  }
  entry.improved=text.slice(0,2500);
  entry.checklist={};
  section.querySelectorAll('input[data-qbcheck]').forEach(c=>entry.checklist[c.dataset.qbcheck]=c.checked);
  $('tlQbTransfer').hidden=false;
  $('tlQbSaveMessage').textContent='Saved. Now apply this thinking to a different calculation.';
  notice('improved');
 });
 $('tlQbTransferWhy').addEventListener('input',()=>{if(!entry)return;entry.transfer.why=$('tlQbTransferWhy').value.slice(0,1600);notice('transfer-draft');});
 $('tlQbCheckTransfer').addEventListener('click',()=>{
  if(!entry||!entry.improved)return;
  const reason=$('tlQbTransferWhy').value.trim();
  if(reason.length<8){$('tlQbTransferMessage').textContent='Tell us WHY your new calculation works as well.';return;}
  const t=model.transfer;
  let result;
  if(t.kind==='addends'){
   const a=$('tlQbNewA').value,b=$('tlQbNewB').value;
   const n=x=>/^\d+$/.test(x)?Number(x):null;
   const first=n(a),second=n(b);entry.transfer.first=first;entry.transfer.second=second;
   result=checkTransfer(t,first,second);
  }else{
   const correct=entry.transfer.choice===t.question.answer;
   result={correct,reason:correct?'Correct calculation.':'Try the relationship again: '+t.hint};
  }
  entry.transfer.why=reason.slice(0,1600);entry.transfer.correct=result.correct;entry.transfer.checks++;
  $('tlQbTransferMessage').textContent=result.reason+(result.correct?' Your written reason still needs human review.':'');
  notice('transfer-check');
 });
 const wanted=initialMode==='guided'?'guided':'existing';
 setMode(wanted);
 return {load,setReady,setMode,getMode:()=>mode,
  renderReview:records=>legacyCoach.renderReview(records),
  snapshot:()=>mode==='guided'?entry?clone(entry):null:legacyCoach.snapshot(),
  // Parent assessment still uses the existing, shared review panel.
  activeSection:()=>mode==='guided'?section:old};
}
