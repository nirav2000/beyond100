// Question breakdown model for the experimental Maths Thinking Lab explanation ladder.
// Every question word has its own set of smaller questions. No generated text is
// treated as a verified mathematical explanation.
export const COMMAND_WORDS=[
 {id:'Describe',meaning:'Tell what happened, in order.',need:'Describe the changes. A reason is not always required.'},
 {id:'How',meaning:'Show the method or how the maths works.',need:'Tell the steps in a sensible order.'},
 {id:'Why',meaning:'Give the reason.',need:'Answer WHY this particular thing happens, not just how.'},
 {id:'Explain',meaning:'Describe what happened AND give reasons.',need:'Include why you chose your method AND why it is mathematically valid.'},
 {id:'Justify',meaning:'Support your conclusion with mathematical reasons and evidence.',need:'State your claim, the reason it is true, and an equation, diagram or fact.'},
 {id:'Prove',meaning:'Show why it must always be true.',need:'Go beyond one example: use a general property, diagram or argument.'}
];
export const WHY_TARGETS=[
 {id:'easier',label:'Why is the NEW addition easier?'},
 {id:'unchanged',label:'Why does the total stay the same?'}
];
const step=(id,question,starter,hint,example)=>({id,question,starter,hint,example});
const e=step;
const F={
 Describe:{
  question:'Describe what changed when 729 + 21 became 730 + 20.',
  steps:[
   e('start','Which numbers did we start with?','We started with','Think of the two original addends.','729 and 21'),
   e('move','Where did the 1 move from and to?','Then I','One addend loses 1 and the other gains it.','moved 1 from 21 to 729'),
   e('after','What were the two new addends?','This made','Think about what 729 and 21 become.','730 and 20')
  ]},
 How:{
  question:'How can you make 729 + 21 easier to calculate?',
  steps:[
   e('aim','Which number did you want to make?','I wanted to make 729 into','What is 729 plus 1?','730'),
   e('move','How did you change the addends?','To do that, I','Where did the 1 come from?','moved 1 from 21 to 729, leaving 20'),
   e('answer','What calculation did you do next?','So I calculated','Add the two friendlier numbers.','730 + 20 = 750')
  ]},
 Why:{
  question:'Why is 730 + 20 easier than 729 + 21?',
  steps:[
   e('feature','What is special about 730 and 20?','The new numbers are friendlier because','Look at the ones digits and multiples of 10.','both are multiples of 10'),
   e('benefit','How does this help the addition?','This is useful because','Do we have to regroup in the ones column of 730 + 20?','I can add the tens directly without regrouping in this calculation'),
   e('result','What easy calculation can you do?','So I can calculate','What is 730 plus 20?','730 + 20 = 750')
  ]},
 Explain:{
  question:'Explain how 729 + 21 becomes easier AND why the total stays the same.',
  steps:[
   e('aim','Which number did you want to make?','I wanted to make 729 into','729 is only 1 away from what multiple of 10?','730'),
   e('benefit','WHY did you choose that number?','I chose it because','What is special about 730, and how does it help us add?','730 is a multiple of 10, so I can add the tens without regrouping in 730 + 20'),
   e('move','HOW did you change the addends?','To do that, I','Which addend gives away the 1? What is left?','moved 1 from 21 to 729, leaving 20'),
   e('unchanged','WHY did the total stay the same?','The sum stayed the same because','Did we add an extra 1 to the whole, or move an existing 1?','one addend gained 1 while the other lost 1'),
   e('result','What is your new calculation and answer?','Therefore,','Add 730 and 20.','729 + 21 = 730 + 20 = 750')
  ]},
 Justify:{
  question:'Justify why 729 + 21 and 730 + 20 have the same sum.',
  steps:[
   e('claim','What are you claiming?','I claim that','Do the expressions have the same value?','729 + 21 and 730 + 20 are equal'),
   e('rule','What mathematical rule supports that claim?','This is because','Think about increasing one addend and decreasing the other by the same amount.','one addend gained 1 while the other lost 1, preserving the sum'),
   e('evidence','What equation is evidence for the claim?','For example,','Calculate both totals or write an equality.','729 + 21 = 750 and 730 + 20 = 750')
  ]},
 Prove:{
  question:'Prove that transferring an equal amount between two addends preserves their sum.',
  steps:[
   e('general','Which change are you considering for ANY two addends?','Suppose','Instead of 729 and 21, use addends a and b and a transferred amount k.','one addend gains k while the other loses k'),
   e('rule','WHY must the total stay the same?','The sum stays unchanged because','Where does the amount taken away go?','nothing is added to or removed from the whole; the +k and -k cancel'),
   e('evidence','How could you show the general rule?','In symbols,','Express the two addends as a + b and balance the changes.','(a + k) + (b - k) = a + b')
  ]}
};
const WHY_UNCHANGED={
 question:'Why does moving 1 from 21 to 729 leave the sum unchanged?',
 steps:[
  e('gains','What happened to the two addends?','One addend','Describe the gain and loss.','gained 1 while the other lost 1'),
  e('reason','WHY does this keep the sum unchanged?','The total stays the same because','Are you adding a new counter, or moving one already present?','the 1 was transferred, not added to or removed from the whole'),
  e('evidence','Can you show this with an equation?','For example,','What do both additions equal?','729 + 21 = 730 + 20 = 750')
 ]};
const COMP_MODELS={
 Describe:{plain:'We began with 729 and 21. I took 1 from 21 and put it with 729. The two numbers became 730 and 20.',formal:'One addend increased from 729 to 730 while the other decreased from 21 to 20.'},
 How:{plain:'I took 1 from 21 and gave it to 729 to make 730, leaving 20. Then I added 730 + 20 to get 750.',formal:'I used compensation, transferring 1 between the addends so I could calculate 730 + 20 = 750.'},
 Why:{plain:'730 + 20 is easier because both numbers end in 0. The ones are already zero, so I can add the tens directly without regrouping in this sum.',formal:'730 and 20 are multiples of 10. Their ones digits are zero, so this addition involves adding the tens with no regrouping.'},
 Explain:{plain:'I wanted to make 729 into 730 because 730 is a multiple of 10 and that makes the addition easier. I moved 1 from 21 to 729, leaving 20. The total stayed the same because I moved 1 rather than adding a new 1. So 730 + 20 = 750.',formal:'I used compensation to increase the addend 729 by 1 to make 730, a multiple of 10. This makes 730 + 20 easy to add without regrouping. I decreased the other addend by 1. Equal opposite changes preserve the sum: 729 + 21 = 730 + 20 = 750.'},
 Justify:{plain:'The two additions both make 750. That makes sense because I moved 1 from one number to the other, so nothing was added or lost.',formal:'The expressions are equivalent: increasing one addend by 1 and decreasing the other by 1 preserves their sum. Both 729 + 21 and 730 + 20 equal 750.'},
 Prove:{plain:'If I move some counters from one group to the other, the number of counters altogether cannot change. This will work whichever two groups I start with, as long as I can make the transfer.',formal:'For any addends a and b and transferable amount k, (a + k) + (b - k) = a + b, because +k and -k cancel. The sum is invariant.'}
};
const GENERIC={
 Describe:['What did you notice at the start?','What changed or happened?','What was the result?'],
 How:['What result are you trying to find?','What method or change did you use?','What did you calculate or conclude?'],
 Why:['What result or pattern are you explaining?','What mathematical fact makes it true?','What evidence supports that reason?'],
 Explain:['What did you notice or change?','WHY was this a helpful step?','WHY does your result follow mathematically?','What calculation, diagram or fact supports it?'],
 Justify:['What is your claim?','What rule or mathematical reason supports it?','What evidence can you show?'],
 Prove:['What statement do you want to prove in general?','What rule must make it true for all relevant cases?','Can you show a general argument, not just one example?']
};
const GENERIC_START={
 Describe:['I noticed','Then','This gave'],
 How:['I wanted to find','To do this, I','So I found'],
 Why:['I am explaining','This is true because','For example,'],
 Explain:['I noticed','This was useful because','The result works because','For example,'],
 Justify:['I claim that','This is true because','For example,'],
 Prove:['The general claim is','It must be true because','To show this,']
};
const clean=(str)=>String(str??'').trim().replace(/^[,. ]+|[. ]+$/g,'');
const sentence=(str)=>{const x=clean(str);return x?(x.match(/[.!?]$/)?x:x+'.'):'';};
const get=(answers,id)=>clean(answers?.[id]||'');
export function questionBreakdown(question,word='Explain',whyFocus='easier',models={}){
 const key=COMMAND_WORDS.some(w=>w.id===word)?word:'Explain';
 const isComp=['balance-add','friendly-ten'].includes(question.id);
 if(isComp&&question.id==='balance-add'){
  const use=key==='Why'&&whyFocus==='unchanged'?WHY_UNCHANGED:F[key];
  const title=key==='Why'&&whyFocus==='unchanged'?'Why does the sum stay the same?':use.question;
  const m=key==='Why'&&whyFocus==='unchanged'?
   {plain:'The sum stays the same because one addend gained 1 and the other lost 1. We only moved the 1; the total still equals 750.',
    formal:'Compensation increases one addend and decreases another by the same amount, keeping the sum invariant: 729 + 21 = 730 + 20 = 750.'}:COMP_MODELS[key];
  return {word:key,whyFocus,question:title,steps:use.steps,plain:m.plain,formal:m.formal,
   words:['addend','sum','compensation','multiple','increase','decrease','equivalent','invariant'],
   isComp:true,isExtension:key==='Prove'};
 }
 // Keep other techniques honest: no fabricated numeric examples or misplaced
 // "why did you choose a multiple of ten?" questions.
 const starts=GENERIC_START[key],prompts=GENERIC[key];
 const steps=prompts.map((prompt,i)=>step('part'+i,prompt,starts[i],
  i===0?(models.method||question.prompt):i===1?(models.why||'Which maths rule helps?'):(models.evidence||question.explain),
  i===0?(models.method||question.prompt):i===1?(models.why||question.explain):question.explain));
 return {word:key,whyFocus,question:question.prompt,steps,
  plain:models.plain||question.explain,formal:models.formal||question.explain,
  words:models.words||['strategy','evidence'],isComp:false,isExtension:key==='Prove'};
}
export function combineBreakdown(lesson,answers={}){
 const missing=lesson.steps.filter(s=>!get(answers,s.id)).map(s=>s.id);
 const clause=(id,label)=>get(answers,id)||'['+label+']';
 let sentences=[];
 if(lesson.isComp){
  switch(lesson.word){
   case 'Describe': sentences=[
     'We started with '+clause('start','starting numbers')+'.',
     'Then I '+clause('move','the transfer')+'.',
     'This made '+clause('after','new addends')+'.'];break;
   case 'How': sentences=[
     'I wanted to make 729 into '+clause('aim','friendly number')+'.',
     'To do that, I '+clause('move','the move')+'.',
     'So I calculated '+clause('answer','calculation')+'.'];break;
   case 'Why':
    sentences=lesson.whyFocus==='unchanged'?[
     'One addend '+clause('gains','changes')+'.',
     'The total stays the same because '+clause('reason','reason')+'.',
     'For example, '+clause('evidence','equation')+'.']:[
     'The new numbers are friendlier because '+clause('feature','special feature')+'.',
     'This is useful because '+clause('benefit','why this helps')+'.',
     'So I can calculate '+clause('result','calculation')+'.'];
    break;
   case 'Explain': sentences=[
     'I wanted to make 729 into '+clause('aim','friendly number')+' because '+clause('benefit','why that number helps')+'.',
     'To do that, I '+clause('move','how it changed')+'.',
     'The sum stayed the same because '+clause('unchanged','why it stays equal')+'.',
     'Therefore, '+clause('result','the calculation')+'.'];break;
   case 'Justify': sentences=[
     'I claim that '+clause('claim','your claim')+'.',
     'This is because '+clause('rule','the maths rule')+'.',
     'For example, '+clause('evidence','evidence')+'.'];break;
   case 'Prove': sentences=[
     'Suppose '+clause('general','general change')+'.',
     'The sum stays unchanged because '+clause('rule','general reason')+'.',
     'In symbols, '+clause('evidence','general equation')+'.'];break;
  }
 }else sentences=lesson.steps.map(s=>s.starter+' '+clause(s.id,'your answer'));
 return {text:sentences.map(s=>sentence(s)).join('\n\n'),missing,complete:missing.length===0};
}
