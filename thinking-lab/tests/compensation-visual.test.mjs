import test from 'node:test';
import assert from 'node:assert/strict';
import {makeQuestion,seeded} from '../engine.mjs';
import {compensationDiagram,compensationEquals,friendlyExample} from '../compensation-visual.mjs';

test('a moved unit is conserved and appears at the correct step',()=>{
 for(let level=1;level<=3;level++)for(let seed=1;seed<=300;seed++){
  const q=makeQuestion({technique:'balance-add',level,rng:seeded(seed*21+level)});
  const [[a,b],[c,d]]=q.diagram.pairs;
  assert.equal(c,a+1);assert.equal(d,b-1);assert.ok(compensationEquals(a,b,1));
  assert.equal(q.answer,'No — it stays the same');
  assert.match(q.prompt,/move 1/);
  const initial=compensationDiagram({a,b,phase:0});
  const highlighted=compensationDiagram({a,b,phase:1});
  const moved=compensationDiagram({a,b,phase:2});
  const proven=compensationDiagram({a,b,phase:3});
  assert.doesNotMatch(initial,/After/);
  assert.doesNotMatch(initial,/tl-moving-one/);
  assert.match(highlighted,/tl-moving-one/);
  assert.match(highlighted,/data-drag-compensation/);
  assert.doesNotMatch(highlighted,/After:/);
  assert.match(moved,/After/);
  assert.match(proven,new RegExp('After: '+(a+b)+' altogether'));
  assert.doesNotMatch(proven,/undefined|NaN|Infinity/);
 }
});
test('total brackets face IN towards the bars, labels do not duplicate',()=>{
 const image=compensationDiagram({a:25,b:25,phase:3,view:'bars'});
 assert.match(image,/x1="112" y1="82" x2="112" y2="92"/);
 assert.match(image,/x1="112" y1="292" x2="112" y2="282"/);
 assert.match(image,/Before: 50 altogether/);
 assert.match(image,/After: 50 altogether/);
 const cards=compensationDiagram({a:729,b:21,phase:3,view:'cards'});
 assert.match(cards,/Still 750 in total/);
 assert.equal(cards.match(/This 1 comes from the brown part/g)?.length||0,0,'No caption overlapping total bracket');
 assert.match(cards,/730/);
 assert.match(cards,/20/);
});
test('729 + 21 becomes 730 + 20 without changing the total',()=>{
 const x=friendlyExample(729,21);
 assert.deepEqual(x.before,[729,21]);
 assert.deepEqual(x.after,[730,20]);
 assert.equal(x.sum,750);
 assert.equal(x.isCorrect,true);
});
