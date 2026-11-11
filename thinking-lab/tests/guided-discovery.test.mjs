import test from 'node:test';
import assert from 'node:assert/strict';
import {makeQuestion,seeded} from '../engine.mjs';
import {GUIDED_IDS,buildStoryboard,listStoryboards} from '../guided-discovery.mjs';

test('ten documented guided techniques have exactly two visual models and five stops',()=>{
 const ids=listStoryboards();
 assert.deepEqual(new Set(ids),new Set(GUIDED_IDS));
 assert.equal(ids.length,10);
 for(const id of ids){
  const q=makeQuestion({technique:id,level:2,rng:seeded(13)});
  const board=buildStoryboard(q);
  assert.ok(board);
  assert.equal(board.steps.length,5);
  assert.equal(board.views.length,2);
  assert.ok(board.steps.every(x=>x.pause?.length>15&&x.reveal?.length>15),id);
 }
 assert.equal(buildStoryboard(makeQuestion({technique:'odd-even',rng:seeded(7)})),null);
});

test('each randomised storyboard has nonempty, finite, well-formed visual source',()=>{
 let checked=0;
 for(const id of GUIDED_IDS)for(let level=1;level<=3;level++)for(let seed=1;seed<=45;seed++){
  const question=makeQuestion({technique:id,level,rng:seeded(seed*131+level)});
  const board=buildStoryboard(question);
  for(let stage=0;stage<5;stage++)for(let view=0;view<2;view++){
   const picture=board.image(stage,view);
   assert.match(picture,/^<svg /);
   assert.match(picture,/<\/svg>$/);
   assert.doesNotMatch(picture,/NaN|Infinity|undefined/);
   assert.ok(picture.length>150,id+' '+stage+' '+view);
   checked++;
  }
 }
 assert.equal(checked,13500);
});

test('key mathematical representations describe the generated quantities',()=>{
 for(let seed=1;seed<=100;seed++){
  const rand=seeded(seed*29);
  const square=makeQuestion({technique:'near-square',rng:rand,level:2});
  const [[a,b],[n]]=square.diagram.pairs;
  assert.equal(n*n-a*b,(n-a)**2);
  assert.match(buildStoryboard(square).image(4,1),new RegExp('The square has '+((n-a)**2)+' more'));
  const p=makeQuestion({technique:'perimeter-invariant',rng:rand,level:2});
  const [[w,h],[ww,hh]]=p.diagram.pairs;
  assert.equal(2*(w+h),2*(ww+hh));
  assert.notEqual(w*h,ww*hh);
  const f=makeQuestion({technique:'fraction-equivalence',rng:rand,level:2});
  const [[u,v],[x,y]]=f.diagram.pairs;
  assert.equal(u*y,v*x);
 }
});
