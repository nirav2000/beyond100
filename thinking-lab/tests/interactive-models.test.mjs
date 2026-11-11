import test from 'node:test';
import assert from 'node:assert/strict';
import {TECHNIQUES,makeQuestion,seeded} from '../engine.mjs';
import {MODEL_TYPES,recommendedModel,transferState,rectangleMeasures,rectangleEqualPerimeter,suggestedCounters,chooseFractionCuts,roundAngle} from '../interactive-models.mjs';

test('all 20 techniques have a suitable manipulable math model',()=>{
 const allowed=new Set(MODEL_TYPES);
 for(const t of TECHNIQUES){
  const q=makeQuestion({technique:t.id,rng:seeded(23),level:1});
  assert.ok(allowed.has(recommendedModel(q)),q.id);
 }
});
test('exact compensation preserves totals for any transfer within the two parts',()=>{
 for(let a=2;a<=64;a+=3)for(let b=2;b<=64;b+=3)for(let d=-a+1;d<b;d++){
  const x=transferState(a,b,d);
  assert.deepEqual(x.before,[a,b]);
  assert.equal(x.after[0],a+d);
  assert.equal(x.after[1],b-d);
  assert.ok(x.sameTotal);
  assert.equal(x.after[0]+x.after[1],a+b);
 }
});
test('foundation keep-the-total always starts with a one-unit transfer',()=>{
 for(let seed=1;seed<=600;seed++){
  const q=makeQuestion({technique:'balance-add',rng:seeded(seed),level:1});
  const [[a,b],[c,d]]=q.diagram.pairs;
  assert.equal(c-a,1);
  assert.equal(b-d,1);
  assert.equal(a+b,c+d);
 }
});
test('resizing rectangles updates area/perimeter but translating does not',()=>{
 for(let w=1;w<=22;w++)for(let h=1;h<=18;h++){
  const m=rectangleMeasures(w,h);
  assert.equal(m.area,w*h);
  assert.equal(m.perimeter,2*(w+h));
  assert.equal(rectangleEqualPerimeter(w,h,w+1,h-1),h>1);
 }
});
test('equal fractions, tiles and angles preserve their mathematical invariants',()=>{
 for(let den=2;den<=15;den++)for(let num=1;num<den;num++)for(const k of [2,3,4]){
  const x=chooseFractionCuts(num,den,k);
  assert.equal(x.num, num*k);
  assert.equal(x.den,den*k);
  assert.ok(x.equal);
 }
 for(const a of [-90,-1,0,1,11,50,91,145,176,1000]){
  const x=roundAngle(a);assert.ok(x>=5&&x<=175);assert.equal(x%5,0);
 }
 for(const id of ['double-half','equal-groups']){
  const q=makeQuestion({technique:id,rng:seeded(3),level:1});
  const counters=suggestedCounters(q);
  assert.ok(counters.count>=4&&counters.count<=36);
 }
});
