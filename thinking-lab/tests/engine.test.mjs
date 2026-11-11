import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,TECHNIQUES,makeQuestion,seeded} from '../engine.mjs';

test('every thinking technique has a canonical skill and a valid question at all levels',()=>{
 assert.equal(TECHNIQUES.length,20);
 const ids=new Set();
 for(const t of TECHNIQUES){
  assert.ok(!ids.has(t.id),t.id);
  ids.add(t.id);
  assert.match(t.skill,/^[a-z][a-z0-9.-]+$/);
  assert.ok(t.ask.length>20&&t.trap.length>20);
  for(let level=1;level<=3;level++)for(let seed=1;seed<=200;seed++){
   const q=makeQuestion({technique:t.id,level,rng:seeded(seed*819+level)});
   assert.equal(q.id,t.id);
   assert.ok(q.options.includes(q.answer));
   assert.equal(q.options.filter(x=>x===q.answer).length,1);
   assert.equal(q.options.length,new Set(q.options).size);
   assert.ok(q.hints.length>=2);
   assert.ok(q.diagram.kind);
   assert.doesNotMatch(q.prompt+q.explain,/undefined|NaN|Infinity/);
  }
 }
 for(const topic of TOPICS.filter(t=>t[0]!=='all'))assert.ok(TECHNIQUES.some(t=>t.topic===topic[0]),topic[0]);
});
test('the mathematical relationships are preserved by the generators',()=>{
 for(let seed=1;seed<=250;seed++)for(let level=1;level<=3;level++){
  const rnd=seeded(seed*113+level);
  const q=id=>makeQuestion({technique:id,level,rng:rnd});
  let a=q('balance-add');assert.equal(a.answer,'Equal');
  a=q('balance-sub');assert.equal(a.answer,'Equal');
  a=q('double-half');assert.equal(a.answer,'Equal');
  a=q('fraction-equivalence');assert.equal(a.answer,'Equal');
  a=q('perimeter-invariant');assert.equal(a.answer,'Perimeter only');
  a=q('area-scale');assert.equal(a.answer,'Doubles');
  a=q('angle-at-point');assert.equal(a.answer,'360 degrees');
  a=q('angle-straight');assert.ok(['Acute','Obtuse'].includes(a.answer));
  a=q('rounding-midpoint');assert.ok(a.options.includes(a.answer));
  a=q('units');assert.equal(a.answer,'They are equal');
  a=q('odd-even');assert.equal(a.answer,'Even');
 }
});
