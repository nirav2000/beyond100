import test from 'node:test';
import assert from 'node:assert/strict';
import {TECHNIQUES,makeQuestion,seeded} from '../engine.mjs';
import {QUESTION_WORDS,MATHS_WORDS,modelFor,checkTransfer} from '../explanation-coach.mjs';

test('command words distinguish doing, reasons, evidence and proof',()=>{
 const entries=new Map(QUESTION_WORDS.map(([w,s,d])=>[w,s+' '+d]));
 for(const word of ['Describe','Explain','Why?','How?','Justify','Prove'])assert.ok(entries.has(word));
 assert.match(entries.get('Explain'),/why/i);
 assert.match(entries.get('Justify'),/evidence/i);
 assert.match(entries.get('Prove'),/must|always|every/i);
 assert.notEqual(entries.get('Describe'),entries.get('Explain'));
 for(const term of ['strategy','addend','sum','compensation','increase','decrease','transfer','equivalent','invariant'])
  assert.ok(MATHS_WORDS[term],term);
});
test('every technique has two child-friendly model explanations and relevant vocabulary',()=>{
 for(const t of TECHNIQUES)for(const level of [1,2,3]){
  const q=makeQuestion({technique:t.id,level,rng:seeded(level*19+7)});
  const m=modelFor(q,0,level);
  assert.ok(m.method.length>15,t.id+': method');
  assert.ok(m.why.length>15,t.id+': why');
  assert.ok(m.plain.length>15,t.id+': plain');
  assert.ok(m.formal.length>15,t.id+': formal');
  assert.ok(m.evidence.includes('equation'),t.id+': evidence');
  assert.ok(m.words.length>=3,t.id+': vocabulary');
  assert.ok(m.words.every(word=>MATHS_WORDS[word]),t.id+': undefined term');
  assert.ok(m.transfer?.prompt,t.id+': new question');
  assert.doesNotMatch(m.plain+m.formal,/undefined|NaN|Infinity/);
 }
});
test('the addition model first makes the example concrete and then names compensation',()=>{
 const q=makeQuestion({technique:'balance-add',rng:seeded(4)});
 const model=modelFor(q);
 assert.match(model.plain,/729.*730.*21.*20.*750/);
 assert.match(model.formal,/compensation/i);
 assert.match(model.formal,/addend/i);
 assert.match(model.formal,/increase/i);
 assert.match(model.formal,/decrease/i);
 assert.match(model.formal,/sum/i);
});
test('two-way friendly-number transfers preserve the whole and reject incorrect rearrangements',()=>{
 const t1=modelFor(makeQuestion({technique:'balance-add'}),0).transfer;
 assert.deepEqual(t1.original,[38,197]);
 assert.equal(checkTransfer(t1,35,200).correct,true,'left-to-right transfer');
 assert.equal(checkTransfer(t1,40,195).correct,true,'an alternative correct friendly-ten transfer');
 assert.equal(checkTransfer(t1,38,197).correct,false,'unchanged expression is not a transfer');
 assert.equal(checkTransfer(t1,35,201).correct,false,'sum changed');
 assert.equal(checkTransfer(t1,34,201).correct,false,'sum unchanged but not easier');
 assert.equal(checkTransfer(t1,undefined,200).correct,false);
 const t2=modelFor(makeQuestion({technique:'balance-add'}),1).transfer;
 assert.deepEqual(t2.original,[48,27]);
 assert.equal(checkTransfer(t2,50,25).correct,true,'right-to-left transfer');
 const t3=modelFor(makeQuestion({technique:'balance-add'}),2).transfer;
 assert.deepEqual(t3.original,[47,53]);
 assert.equal(checkTransfer(t3,50,50).correct,true,'make a double');
});
test('non-addition transfer tasks repeat the same technique with fresh question data',()=>{
 const q=makeQuestion({technique:'double-half',rng:seeded(120)});
 const transfer=modelFor(q).transfer;
 assert.equal(transfer.kind,'choice');
 assert.equal(transfer.question.id,'double-half');
 assert.ok(transfer.question.options.includes(transfer.question.answer));
});
