// Maths Thinking Lab: learner-led mathematical explanations and vocabulary.
// No answer-text auto-marking: a calculation may be correct without sound reasoning.
import {makeQuestion} from './engine.mjs';

export const QUESTION_WORDS=[
 ['Describe','Say what happened or what you did.','Give the steps or changes.'],
 ['Explain','Say what happened AND why.','Include a mathematical reason; show a fact, equation or diagram if useful.'],
 ['Why?','Tell me the reason.','Find the rule or relationship that makes it work.'],
 ['How?','Tell me how you worked it out or how it works.','Read the whole question: sometimes it asks for steps, sometimes for a reason.'],
 ['Justify','Give reasons and evidence for your answer.','Use a fact, diagram, equation or logical argument.'],
 ['Prove','Show why it MUST be true.','Test examples, but do not treat a single example as proof of a general rule.']
];
export const MATHS_WORDS={
 strategy:'A method you choose to solve a problem.',
 addend:'A number being added. Both numbers in 729 + 21 are addends.',
 sum:'The answer to an addition; also called the total.',
 compensation:'Increase one addend and decrease the other by the same amount to keep the sum unchanged.',
 increase:'Make a number or quantity larger.',
 decrease:'Make a number or quantity smaller.',
 transfer:'Move an amount from one addend or part to another.',
 equivalent:'Two expressions that have the same value.',
 invariant:'Something that stays unchanged.',
 multiple:'A whole-number multiple is made by multiplying a whole number by an integer.',
 factor:'A number being multiplied.',
 product:'The answer to a multiplication.',
 difference:'The answer to a subtraction.',
 fraction:'A number describing equal parts of a whole.',
 numerator:'How many of the equal parts are counted.',
 denominator:'The number of equal parts making one whole.',
 perimeter:'The distance around the outside of a shape.',
 area:'The space inside a flat shape.',
 midpoint:'The number or point exactly halfway between two others.',
 'place value':'What a digit is worth because of its position.',
 ratio:'A comparison between quantities.',
 whole:'All the parts together.',
 evidence:'A calculation, diagram or mathematical fact that supports a claim.'
};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const expr=p=>p.join(' + ');
const mul=p=>p.join(' × ');

export function modelFor(q,sequence=0,level=2){
 const pairs=q.diagram?.pairs||[],a=pairs[0]||[0,0],b=pairs[1]||[0,0];
 const standard={
  'balance-add':{
   method:'In 729 + 21, which addend did you make friendlier? Where did you get the 1?',
   why:'Why does the sum stay the same when you move 1 between the addends?',
   plain:'729 is 1 away from 730. I took that 1 from 21, leaving 20. So 729 + 21 becomes 730 + 20, and both give 750.',
   formal:'I used compensation. I increased the addend 729 by 1 and decreased the addend 21 by 1. The changes balance, so the sum remains unchanged: 729 + 21 = 730 + 20 = 750.',
   words:['strategy','addend','compensation','increase','decrease','sum','invariant']},
  'friendly-ten':{
   method:'Which addend was close to a multiple of 10, and how much did you transfer?',
   why:'Why is your new addition worth the same as the original?',
   plain:'I took '+(b[0]-a[0])+' from '+a[1]+' and gave it to '+a[0]+'. That makes '+expr(b)+', which is easier.',
   formal:'I used compensation: one addend increased and the other decreased by '+(b[0]-a[0])+'. The equivalent sums are '+expr(a)+' = '+expr(b)+'.',
   words:['addend','compensation','multiple','equivalent','sum']},
  'balance-sub':{
   method:'How did both numbers move on the number line?',
   why:'Why did their distance apart stay the same?',
   plain:'I moved both numbers by '+(b[0]-a[0])+'. They are still the same distance apart.',
   formal:'Increasing both numbers by '+(b[0]-a[0])+' leaves their difference invariant: '+a[1]+' − '+a[0]+' = '+b[1]+' − '+b[0]+'.',
   words:['difference','increase','invariant','equivalent']},
  'double-half':{
   method:'What did you do to each factor?',
   why:'Why is the total number of squares the same?',
   plain:'I made half as many rows and twice as many in each. There are still the same squares.',
   formal:'I halved one factor and doubled the other. Their product is invariant: '+mul(a)+' = '+mul(b)+'.',
   words:['factor','product','invariant','equivalent']},
  'near-square':{
   method:'What square is between these two factors?',
   why:'Why is their product smaller than the square?',
   plain:'The two numbers are equally far from '+b[0]+'. Their product is '+((b[0]-a[0])**2)+' less than '+b[0]+' squared.',
   formal:'The difference of two squares shows '+mul(a)+' = '+b[0]+'² − '+(b[0]-a[0])+'².',
   words:['factor','product','difference','evidence']},
  'equal-groups':{
   method:'How did the number and size of groups change?',
   why:'Why was the total number of counters unchanged?',
   plain:'I made more groups, but each group got smaller. I still had the same counters.',
   formal:'Doubling the number of groups and halving the number in each preserves the product: '+mul(a)+' = '+mul(b)+'.',
   words:['factor','product','whole','invariant']},
  'fraction-equivalence':{
   method:'How did the pieces change?',
   why:'Why is the shaded amount still the same?',
   plain:'I cut every piece into smaller equal pieces. I did not add or remove any shaded part.',
   formal:'Multiplying numerator and denominator by the same non-zero factor makes equivalent fractions: '+a[0]+'/'+a[1]+' = '+b[0]+'/'+b[1]+'.',
   words:['fraction','numerator','denominator','equivalent']},
  'fraction-compare':{
   method:'How did you make the fractions easier to compare?',
   why:'Why can you compare them fairly?',
   plain:'I compared pieces of the same size, then checked which has more shaded pieces.',
   formal:'Use a common denominator, then compare the numerators of '+a[0]+'/'+a[1]+' and '+b[0]+'/'+b[1]+'.',
   words:['fraction','denominator','numerator','evidence']},
  'perimeter-invariant':{
   method:'What happened to each side length?',
   why:'Why did the distance around the rectangle stay the same?',
   plain:'One side got longer and another got shorter. The distance around stayed the same, but the space inside changed.',
   formal:'Perimeter is twice the sum of adjacent sides. Their sum is invariant, although the product giving area changes.',
   words:['perimeter','area','sum','invariant']},
  'area-scale':{
   method:'What changed in the rectangle?',
   why:'Why did the area double?',
   plain:'The new rectangle is two copies of the old one joined together, so it takes up twice as much space.',
   formal:'Doubling one dimension while holding the other fixed doubles the area: '+mul(a)+' becomes '+mul(b)+'.',
   words:['area','factor','product','evidence']},
  'angle-straight':{
   method:'Which angle fact did you use?',
   why:'Why must the other angle have the value you found?',
   plain:'The two angles make a straight line, which always has 180 degrees altogether.',
   formal:'Adjacent angles on a straight line sum to 180°, so the missing angle is 180° − '+q.diagram.value+'°.',
   words:['sum','difference','evidence']},
  'angle-at-point':{
   method:'What shape or turn do all the angles form?',
   why:'Why is the total always 360 degrees?',
   plain:'All the angles fit around one complete turn, and that turn is always 360 degrees.',
   formal:'Angles about a point have an invariant sum of 360°, regardless of how the turn is split.',
   words:['sum','whole','invariant']},
  'word-ratio':{
   method:'How did you organise the equal parts?',
   why:'Why does your answer represent Ben’s share?',
   plain:'Ben has one part and Asha has the other equal parts. I counted every part to find Ben’s share.',
   formal:'The ratio represented by the bar model is '+(q.diagram.parts||[]).join(':')+'. Ben’s fraction of the whole is '+q.answer+'.',
   words:['ratio','fraction','whole','evidence']},
  'word-change':{
   method:'Which quantities are the parts and the whole?',
   why:'Why does your equation describe the story?',
   plain:'The whole at the start is the pencils left plus the pencils taken away.',
   formal:'The part–whole equation is starting quantity = remaining quantity + removed quantity. Adding the parts reconstructs the whole.',
   words:['addend','sum','whole','evidence']},
  'rounding-midpoint':{
   method:'Where did you put the halfway point?',
   why:'Why does this tell you which multiple is closer?',
   plain:'I found the halfway point and checked on which side of it the number lies.',
   formal:'The midpoint is '+((q.diagram.lo+q.diagram.hi)/2)+'. Comparing the number with this benchmark identifies its nearest multiple.',
   words:['midpoint','multiple','difference','evidence']},
  'place-shift':{
   method:'What happened to each digit’s value?',
   why:'Why does multiplying by 10 have this effect?',
   plain:'Each digit moves to the next place, where it is worth ten times more.',
   formal:'Base-ten place values differ by a factor of 10, so multiplication by 10 multiplies each digit’s place value by 10.',
   words:['place value','factor','product']},
  'odd-even':{
   method:'What happened to the spare counters?',
   why:'Why will this work for any two odd numbers?',
   plain:'Each odd number has one extra counter. The two extras make a pair, so the total is even.',
   formal:'Odd numbers are 2n + 1 and 2m + 1. Their sum is 2(n + m + 1), a multiple of 2.',
   words:['sum','multiple','evidence']},
  'turn-shapes':{
   method:'What changed when the rectangle turned?',
   why:'Why is its size unchanged?',
   plain:'I only turned the rectangle. I did not stretch it or cut anything off.',
   formal:'A rotation preserves lengths, area and perimeter, so only the orientation changes.',
   words:['area','perimeter','invariant']},
  'units':{
   method:'What did you change when converting metres to centimetres?',
   why:'Why did the real length stay the same?',
   plain:'I changed the units, not the length. One metre is 100 centimetres.',
   formal:'Multiplying a measurement in metres by 100 gives its equivalent centimetre value without changing the physical length.',
   words:['equivalent','factor','invariant']},
  'fraction-of-whole':{
   method:'Which numbers count all the equal pieces and the shaded ones?',
   why:'Why is that the fraction of the whole?',
   plain:'The bottom number counts all the equal pieces. The top number counts the shaded pieces.',
   formal:'The denominator counts the equal parts in the whole and the numerator counts those selected: '+q.answer+'.',
   words:['fraction','denominator','numerator','whole']}
 };
 const m=standard[q.id]||{method:'What did you do?',why:'Why does this work?',plain:q.explain,formal:'The mathematical reason is: '+q.explain,words:['strategy','evidence']};
 const examples=[[38,197],[48,27],[47,53]];
 let transfer;
 if(q.id==='balance-add'||q.id==='friendly-ten'){
  const original=examples[sequence%examples.length];
  transfer={kind:'addends',original,prompt:'Make '+expr(original)+' easier. Move some from one addend to the other. Write BOTH new addends without changing the sum.',hint:'Make a nearby multiple of 10 or 100, or try making a double.'};
 }else{
  let another=makeQuestion({technique:q.id,level});
  for(let i=0;i<5&&another.prompt===q.prompt;i++)another=makeQuestion({technique:q.id,level});
  transfer={kind:'choice',question:another,prompt:another.prompt,hint:'Try the same relationship with these new numbers.'};
 }
 return {...m,transfer,evidence:'Which equation, diagram or mathematical fact supports your answer? (You can leave this blank at first.)'};
}

export function checkTransfer(t,first,second){
 if(t?.kind!=='addends'||!Number.isSafeInteger(first)||!Number.isSafeInteger(second)||first<0||second<0)return {correct:false,reason:'Enter two whole numbers.'};
 const [a,b]=t.original;
 if(first+second!==a+b)return {correct:false,reason:'The total changed. Give exactly as much as you take.'};
 if(first===a&&second===b)return {correct:false,reason:'The sum is right, but nothing moved. Can you make it friendlier?'};
 if(Math.abs(first-a)>20)return {correct:false,reason:'You kept the sum. Try moving only a small amount to make a nearby friendly number.'};
 if(first%10!==0&&second%10!==0&&first!==second)return {correct:false,reason:'The sum is right! Now try making a multiple of 10 or a double.'};
 return {correct:true,reason:'Yes. You changed both addends by opposite amounts and kept the sum unchanged.'};
}

export function createExplanationCoach({onProgress=()=>{}}={}){
 const original=document.getElementById('tlWhy'),content=document.querySelector('#thinkingLabRoot .tl-content');
 if(!original||!content)throw Error('Explanation coach needs an existing Thinking Lab explanation field');
 const oldHeading=original.previousElementSibling;
 const section=document.createElement('section');section.id='tlExplainCoach';section.className='tl-explain-coach';
 oldHeading.before(section);oldHeading.remove();original.remove();
 section.innerHTML='<div class="tl-explain-head"><span class="tl-guide-kicker">EXPLAIN YOUR THINKING</span><h3>What did you do? Why did it work?</h3>'+
  '<p>Explain in your own words first. You can compare two examples afterwards.</p></div>'+
  '<details class="tl-explain-words"><summary>What do describe, explain, why, how, justify and prove mean?</summary><div id="tlExplainWordList"></div>'+
  '<p>Maths evidence can be an equation, a diagram or a mathematical fact. One example does not usually prove a rule for every number.</p></details>'+
  '<p id="tlExplainGate" class="tl-explain-gate" hidden>First complete the experiment and try the 729 + 21 challenge. Then explain your thinking here.</p>'+
  '<div id="tlExplainAttempt"><h4>1. Have your own go</h4><label for="tlExplainMethod" id="tlExplainMethodLabel"></label>'+
  '<textarea id="tlExplainMethod" rows="2" placeholder="First, I noticed..."></textarea>'+
  '<label for="tlExplainWhy" id="tlExplainWhyLabel"></label><textarea id="tlExplainWhy" rows="2" placeholder="This works because..."></textarea>'+
  '<label for="tlExplainEvidence" id="tlExplainEvidenceLabel"></label><textarea id="tlExplainEvidence" rows="2" placeholder="For example,..."></textarea>'+
  '<div class="tl-actions"><button type="button" class="tl-btn primary" id="tlExplainCompare">Compare my explanation</button>'+
  '<button type="button" class="tl-btn" id="tlExplainHelp">I’m stuck — show an example</button></div>'+
  '<p class="tl-caption" id="tlExplainAttemptMessage" role="status" aria-live="polite"></p></div>'+
  '<div id="tlExplainModels" hidden><h4>2. Compare your explanation</h4><div class="tl-explain-versions">'+
  '<div><strong>Everyday words</strong><p id="tlExplainPlain"></p></div><div><strong>Mathematical words</strong><p id="tlExplainFormal"></p></div></div>'+
  '<h4>3. Make your explanation even better</h4><p>Keep your original idea, then make the reason clearer. Try two mathematical words.</p>'+
  '<div class="tl-explain-vocab" id="tlExplainVocab" role="group" aria-label="Explore mathematical vocabulary"></div>'+
  '<p class="tl-caption" id="tlExplainDefinition" aria-live="polite"></p>'+
  '<label for="tlExplainRevision">Your improved explanation</label><textarea id="tlExplainRevision" rows="3" placeholder="I used the strategy... because..."></textarea>'+
  '<fieldset class="tl-explain-checklist"><legend>Check your explanation</legend>'+
  '<label><input type="checkbox" data-check="described">I said what changed or stayed the same.</label>'+
  '<label><input type="checkbox" data-check="reason">I explained WHY, not only HOW.</label>'+
  '<label><input type="checkbox" data-check="evidence">I used a calculation, diagram or maths fact as evidence.</label></fieldset>'+
  '<button type="button" class="tl-btn primary" id="tlExplainImprove">Save my improved explanation</button>'+
  '<p id="tlExplainRevisionMessage" class="tl-caption" aria-live="polite"></p></div>'+
  '<div id="tlExplainTransfer" hidden><h4>4. Can you do it with new numbers?</h4><p id="tlExplainTransferPrompt"></p>'+
  '<div id="tlExplainTransferAnswer" class="tl-explain-transfer-fields"></div>'+
  '<label for="tlExplainTransferWhy">Why does your answer work?</label><textarea id="tlExplainTransferWhy" rows="2" placeholder="Because..."></textarea>'+
  '<button type="button" class="tl-btn primary" id="tlExplainTransferCheck">Check my new calculation</button>'+
  '<p id="tlExplainTransferResult" class="tl-caption" role="status" aria-live="polite"></p>'+
  '<p class="tl-caption">We check your calculation automatically, not the quality of your written reason. A parent can review your explanation.</p></div>';
 const $=id=>section.querySelector('#'+id);
 const glossary=$('tlExplainWordList');
 for(const [word,simple,detail] of QUESTION_WORDS){
  const row=document.createElement('div');row.className='tl-explain-definition';
  const strong=document.createElement('strong');strong.textContent=word;
  const span=document.createElement('span');span.textContent=simple+' '+detail;
  row.append(strong,span);glossary.appendChild(row);
 }
 let entry=null,lesson=null,ready=true,sequence=0,profile='learner';
 const notify=kind=>{if(!entry)return;entry.updatedAt=new Date().toISOString();onProgress({kind,profile,record:structuredClone(entry)});};
 const setReady=allowed=>{ready=!!allowed;$('tlExplainGate').hidden=ready;$('tlExplainAttempt').hidden=!ready;};
 const captureFirst=()=>{
  if(!entry||entry.modelSeen)return;
  entry.firstDescribe=$('tlExplainMethod').value.slice(0,1400);
  entry.firstWhy=$('tlExplainWhy').value.slice(0,1400);
  entry.firstEvidence=$('tlExplainEvidence').value.slice(0,1400);
  if(entry.firstDescribe.trim()&&entry.firstWhy.trim()&&!entry.supportBeforeFirstDraft)entry.independentStart=true;
  notify('draft');
 };
 const showModels=(help=false)=>{
  if(!entry||!ready)return;
  captureFirst();
  if(!help&&(entry.firstDescribe.trim().length<6||entry.firstWhy.trim().length<6)){
   $('tlExplainAttemptMessage').textContent='Try BOTH questions: what did you do, and WHY did it work?';return;
  }
  if(help&&(!entry.firstDescribe.trim()||!entry.firstWhy.trim()))entry.supportBeforeFirstDraft=true;
  entry.modelSeen=true;if(help)entry.helpUsed=true;
  for(const id of ['tlExplainMethod','tlExplainWhy','tlExplainEvidence'])$(id).readOnly=true;
  $('tlExplainModels').hidden=false;
  $('tlExplainAttemptMessage').textContent=help?'Use these examples as help, then write your own improved answer.':'Your first answer is saved. Now compare both versions.';
  notify(help?'help':'compare');
 };
 const renderTransfer=()=>{
  const holder=$('tlExplainTransferAnswer');holder.replaceChildren();
  const t=lesson.transfer;$('tlExplainTransferPrompt').textContent=t.prompt;
  if(t.kind==='addends'){
   for(const [id,label] of [['tlExplainFirst','New first addend'],['tlExplainSecond','New second addend']]){
    const wrapper=document.createElement('label');wrapper.htmlFor=id;wrapper.textContent=label;
    const input=document.createElement('input');input.type='number';input.id=id;input.inputMode='numeric';input.min='0';input.step='1';
    wrapper.appendChild(input);holder.appendChild(wrapper);
   }
  }else{
   const group=document.createElement('div');group.className='tl-options';
   for(const choice of t.question.options){
    const b=document.createElement('button');b.type='button';b.className='tl-option';b.textContent=choice;b.dataset.choice=choice;group.appendChild(b);
   }
   group.addEventListener('click',event=>{
    const b=event.target.closest('button[data-choice]');if(!b)return;
    entry.transfer.choice=b.dataset.choice;
    group.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button===b));
    notify('transfer-choice');
   });
   holder.appendChild(group);
  }
 };
 const load=(q,options={})=>{
  profile=options.profile||'learner';
  lesson=modelFor(q,sequence++,options.level||2);
  entry={id:'explanation-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),
   technique:q.id,skill:q.skill,topic:q.topic,prompt:q.prompt,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
   firstDescribe:'',firstWhy:'',firstEvidence:'',improved:'',modelSeen:false,helpUsed:false,independentStart:false,supportBeforeFirstDraft:false,
   checklist:{},transfer:{kind:lesson.transfer.kind,choice:null,first:null,second:null,why:'',correct:null,checks:0}};
  $('tlExplainMethodLabel').textContent='Describe: '+lesson.method;
  $('tlExplainWhyLabel').textContent='Explain WHY: '+lesson.why;
  $('tlExplainEvidenceLabel').textContent='Show evidence: '+lesson.evidence;
  $('tlExplainPlain').textContent=lesson.plain;$('tlExplainFormal').textContent=lesson.formal;
  for(const id of ['tlExplainMethod','tlExplainWhy','tlExplainEvidence','tlExplainRevision','tlExplainTransferWhy']){
   $(id).value='';$(id).readOnly=false;
  }
  for(const id of ['tlExplainAttemptMessage','tlExplainRevisionMessage','tlExplainTransferResult','tlExplainDefinition'])$(id).textContent='';
  section.querySelectorAll('[data-check]').forEach(input=>input.checked=false);
  const vocab=$('tlExplainVocab');vocab.replaceChildren();
  lesson.words.forEach(word=>{
   const button=document.createElement('button');button.type='button';button.className='tl-btn tl-explain-word';button.textContent=word;
   button.addEventListener('click',()=>{$('tlExplainDefinition').textContent=word+': '+MATHS_WORDS[word];});
   vocab.appendChild(button);
  });
  $('tlExplainModels').hidden=true;$('tlExplainTransfer').hidden=true;renderTransfer();
  setReady(q.id!=='balance-add');
 };
 ['tlExplainMethod','tlExplainWhy','tlExplainEvidence'].forEach(id=>$(id).addEventListener('input',captureFirst));
 $('tlExplainCompare').addEventListener('click',()=>showModels(false));
 $('tlExplainHelp').addEventListener('click',()=>showModels(true));
 $('tlExplainImprove').addEventListener('click',()=>{
  if(!entry||!entry.modelSeen)return;
  const answer=$('tlExplainRevision').value.trim();
  if(answer.length<18){$('tlExplainRevisionMessage').textContent='Write at least one full sentence that tells us WHY.';return;}
  if(answer===entry.firstDescribe.trim()||answer===entry.firstWhy.trim()||answer===lesson.formal.trim()){
   $('tlExplainRevisionMessage').textContent='Make this your OWN explanation instead of copying it unchanged.';return;
  }
  entry.improved=answer.slice(0,1600);entry.checklist={};
  section.querySelectorAll('[data-check]').forEach(input=>{entry.checklist[input.dataset.check]=input.checked;});
  $('tlExplainRevisionMessage').textContent='Saved. Try another example without looking at the model.';
  $('tlExplainTransfer').hidden=false;notify('improved');
 });
 $('tlExplainTransferWhy').addEventListener('input',()=>{if(!entry)return;entry.transfer.why=$('tlExplainTransferWhy').value.slice(0,1400);notify('transfer-draft');});
 $('tlExplainTransferCheck').addEventListener('click',()=>{
  if(!entry||!entry.improved)return;
  const t=lesson.transfer,reason=$('tlExplainTransferWhy').value.trim();
  if(reason.length<8){$('tlExplainTransferResult').textContent='Also write WHY your answer works.';return;}
  let result;
  if(t.kind==='addends'){
   const x=$('tlExplainFirst').value,y=$('tlExplainSecond').value;
   const first=/^\d+$/.test(x)?Number(x):null,second=/^\d+$/.test(y)?Number(y):null;
   entry.transfer.first=first;entry.transfer.second=second;
   result=checkTransfer(t,first,second);
  }else{
   result={correct:entry.transfer.choice===t.question.answer,reason:entry.transfer.choice===t.question.answer?
    'Correct. Your written explanation is saved for your parent to review.':t.hint};
  }
  entry.transfer.why=reason.slice(0,1400);entry.transfer.correct=result.correct;entry.transfer.checks++;
  $('tlExplainTransferResult').textContent=result.reason+(result.correct?' Your written explanation still needs a reasoning check.':' Try again.');
  notify('transfer-check');
 });
 const parent=document.getElementById('tlParent');
 const review=document.createElement('section');review.className='tl-explain-parent';review.id='tlExplainParentReview';
 review.innerHTML='<h4>Sai’s explanation review</h4><p>Compare his first words with his improved version. A tick for the calculation does not mean the reasoning has been marked.</p><div id="tlExplainParentRows"></div>';
 if(parent)parent.appendChild(review);
 const renderReview=records=>{
  const host=review.querySelector('#tlExplainParentRows');host.replaceChildren();
  if(!records?.length){host.textContent='No explanations recorded on this device yet.';return;}
  records.slice(-10).reverse().forEach(r=>{
   const details=document.createElement('details');details.className='tl-explain-review-item';
   const summary=document.createElement('summary');
   summary.textContent=(r.technique||'Thinking')+' · '+new Date(r.createdAt).toLocaleDateString('en-GB')+
    ' · '+(r.improved?'Revised':'First draft')+
    (r.transfer?.correct===true?' · New calculation correct':'');
   details.appendChild(summary);
   for(const [label,value] of [['First description',r.firstDescribe],['First reason',r.firstWhy],
    ['Supporting evidence',r.firstEvidence],['Improved answer',r.improved],['New example: reason',r.transfer?.why]]){
    if(!value)continue;
    const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=label+': ';
    p.append(strong,document.createTextNode(value));details.appendChild(p);
   }
   const status=document.createElement('p');status.textContent=
    'Independent first draft: '+(r.independentStart&&!r.supportBeforeFirstDraft?'Yes':'Not established')+
    ' · Model/help seen: '+(r.modelSeen?'Yes':'No')+
    ' · New calculation: '+(r.transfer?.correct===null?'Not checked':r.transfer?.correct?'Correct':'Needs work');
   details.appendChild(status);host.appendChild(details);
  });
 };
 return {load,setReady,renderReview,snapshot:()=>entry?structuredClone(entry):null};
}
