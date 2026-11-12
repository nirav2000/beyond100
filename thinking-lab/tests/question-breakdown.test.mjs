import test from 'node:test';
import assert from 'node:assert/strict';
import {TECHNIQUES,makeQuestion,seeded} from '../engine.mjs';
import {modelFor} from '../explanation-coach.mjs';
import {COMMAND_WORDS,WHY_TARGETS,questionBreakdown,combineBreakdown} from '../question-breakdown-data.mjs';

const q=()=>makeQuestion({technique:'balance-add',rng:seeded(7),level:2});
const get=word=>questionBreakdown(q(),word,'easier',modelFor(q()));

test('all six command words request different appropriate subquestions',()=>{
 assert.deepEqual(COMMAND_WORDS.map(x=>x.id),['Describe','How','Why','Explain','Justify','Prove']);
 const sizes=Object.fromEntries(COMMAND_WORDS.map(({id})=>[id,get(id).steps.length]));
 assert.deepEqual(sizes,{Describe:3,How:3,Why:3,Explain:5,Justify:3,Prove:3});
 assert.match(get('Explain').steps[1].question,/WHY.*choose/i);
 assert.match(get('Explain').steps[3].question,/WHY.*total.*same/i);
 assert.match(get('Justify').question,/justify/i);
 assert.match(get('Prove').question,/prove/i);
 assert.match(get('Prove').formal,/\(a \+ k\) \+ \(b - k\) = a \+ b/);
});
test('why easier and why unchanged ask for distinct reasons',()=>{
 assert.deepEqual(WHY_TARGETS.map(t=>t.id),['easier','unchanged']);
 const easier=questionBreakdown(q(),'Why','easier'),unchanged=questionBreakdown(q(),'Why','unchanged');
 assert.match(easier.question,/easier/);
 assert.match(easier.steps[0].question,/730 and 20/);
 assert.match(easier.formal,/multiples of 10/);
 assert.match(unchanged.question,/unchanged|stay the same/);
 assert.match(unchanged.steps[0].question,/two addends/);
 assert.match(unchanged.formal,/compensation/i);
 assert.notDeepEqual(easier.steps,unchanged.steps);
});
test('explaining compensation includes why choose a multiple of 10 and why total is conserved',()=>{
 const lesson=get('Explain');
 assert.match(lesson.plain,/multiple of 10/i);
 assert.match(lesson.plain,/moved 1/i);
 assert.match(lesson.plain,/total stayed the same/i);
 assert.match(lesson.formal,/compensation/i);
 assert.match(lesson.formal,/multiple of 10/i);
 assert.match(lesson.formal,/without regrouping/i);
 assert.match(lesson.formal,/preserve the sum/i);
 assert.ok(!lesson.formal.includes('all multiples of 10 avoid regrouping'));
});
test('combines five answers into a complete editable draft without revealing models',()=>{
 const lesson=get('Explain');
 const answers={aim:'730',benefit:'730 is a multiple of 10 so the tens can be added without regrouping',
  move:'moved 1 from 21 to 729 leaving 20',unchanged:'one addend gained 1 and the other lost 1',
  result:'729 + 21 = 730 + 20 = 750'};
 const draft=combineBreakdown(lesson,answers);
 assert.equal(draft.complete,true);
 assert.deepEqual(draft.missing,[]);
 assert.match(draft.text,/because 730 is a multiple of 10/i);
 assert.match(draft.text,/sum stayed the same because one addend gained 1/i);
 assert.match(draft.text,/729 \+ 21 = 730 \+ 20 = 750/);
 assert.doesNotMatch(draft.text,/undefined|\[|\bNaN\b/);
});
test('incomplete drafts retain blank prompts rather than inventing a reason',()=>{
 const lesson=get('Explain');
 const draft=combineBreakdown(lesson,{aim:'730'});
 assert.equal(draft.complete,false);
 assert.equal(draft.missing.length,4);
 assert.match(draft.text,/\[why that number helps\]/);
 assert.match(draft.text,/\[why it stays equal\]/);
});
test('all maths techniques and all six question words have usable scaffold prompts',()=>{
 for(const technique of TECHNIQUES){
  const question=makeQuestion({technique:technique.id,level:2,rng:seeded(technique.id.length+42)});
  const model=modelFor(question,0,2);
  for(const {id} of COMMAND_WORDS){
   const lesson=questionBreakdown(question,id,'easier',model);
   assert.ok(lesson.question?.length>9,technique.id+':'+id);
   assert.ok(lesson.steps.length>=3,technique.id+':'+id);
   assert.ok(lesson.steps.every(s=>s.id&&s.question?.length>8&&s.hint&&s.example),technique.id+':'+id);
   const composed=combineBreakdown(lesson,Object.fromEntries(lesson.steps.map(s=>[s.id,'my idea'])));
   assert.equal(composed.complete,true,technique.id+':'+id);
   assert.doesNotMatch(composed.text,/undefined|NaN/);
   if(!['balance-add'].includes(question.id))assert.equal(lesson.isComp,false);
  }
 }
});
