import {compensationDiagram,friendlyExample} from './compensation-visual.mjs';
// One child-led experiment: predict, physically move 1, compare, then apply it.
const predictions=[['bigger','Yes — it gets bigger'],['same','No — it stays the same'],['smaller','Yes — it gets smaller']];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function createCompensationExperiment({container,onSupport=()=>{},onFinish=()=>{}}={}){
 if(!container)throw Error('Missing experiment host');
 container.classList.add('tl-comp-experiment');
 container.innerHTML='<h3>Will moving 1 change the total?</h3>'+
 '<p>Take <strong>1</strong> from the brown part and give it to the green part. What do you think happens to the <strong>total</strong>?</p>'+
 '<div class="tl-comp-choices" role="group" aria-label="Predict what happens to the total">'+predictions.map(([id,label])=>'<button type="button" data-pred="'+id+'" aria-pressed="false">'+escape(label)+'</button>').join('')+'</div>'+
 '<p id="tlCompPrompt" class="tl-comp-prompt" aria-live="polite">Choose your prediction first. No answer is shown yet.</p>'+
 '<div id="tlCompPicture" class="tl-comp-picture"></div>'+
 '<div class="tl-comp-view" role="group" aria-label="See two different models"><button type="button" id="tlCompBars" aria-pressed="true">Bars</button><button type="button" id="tlCompCards" aria-pressed="false">Number cards</button></div>'+
 '<div class="tl-comp-buttons"><button type="button" class="tl-btn primary" id="tlCompAdvance" disabled>Show the 1 to move</button><button type="button" class="tl-btn" id="tlCompMove" hidden>Move the 1</button><button type="button" class="tl-btn" id="tlCompReset">Try again</button></div>'+
 '<div class="tl-comp-result" id="tlCompResult" aria-live="polite" hidden></div>'+
 '<section id="tlCompUse" class="tl-comp-use" hidden><h3>When is this useful?</h3><p><strong>729 + 21</strong> looks awkward. But 729 is just 1 away from 730. Which new sum would be easiest without changing the total?</p>'+
 '<div class="tl-comp-choices" id="tlCompUseChoices" role="group" aria-label="Pick an easier equivalent sum">'+
 '<button type="button" data-use="0" aria-pressed="false">730 + 20</button><button type="button" data-use="1" aria-pressed="false">729 + 20</button><button type="button" data-use="2" aria-pressed="false">730 + 21</button></div>'+
 '<button type="button" class="tl-btn primary" id="tlCompCheckUse" disabled>Check my idea</button><div id="tlCompUsePicture" class="tl-comp-picture"></div><div id="tlCompUseResult" aria-live="polite" class="tl-comp-result" hidden></div>'+
 '<button type="button" class="tl-btn" id="tlCompNewPair" hidden>Try new numbers</button><p id="tlCompPair" aria-live="polite"></p></section>';
 const $=id=>container.querySelector('#'+id);
 let a=25,b=25,phase=0,view='bars',prediction=null,application=null,finished=false,reveals=0,drag=null;
 const event=kind=>{reveals++;onSupport({kind,phase,technique:'balance-add'})};
 const render=()=>{
  $('tlCompPicture').innerHTML=compensationDiagram({a,b,k:1,phase,view});
  $('tlCompBars').setAttribute('aria-pressed',String(view==='bars'));
  $('tlCompCards').setAttribute('aria-pressed',String(view==='cards'));
 };
 const message=s=>{$('tlCompPrompt').textContent=s;};
 function reset(){
  phase=0;view='bars';prediction=null;application=null;finished=false;reveals=0;drag=null;
  container.querySelectorAll('[data-pred],[data-use]').forEach(n=>n.setAttribute('aria-pressed','false'));
  $('tlCompAdvance').disabled=true;$('tlCompAdvance').hidden=false;$('tlCompAdvance').textContent='Show the 1 to move';
  $('tlCompMove').hidden=true;$('tlCompResult').hidden=true;$('tlCompUse').hidden=true;$('tlCompUseResult').hidden=true;
  $('tlCompCheckUse').disabled=true;$('tlCompNewPair').hidden=true;
  message('Choose your prediction first. No answer is shown yet.');
  render();
 }
 function showUnit(){
  if(!prediction||phase!==0)return;
  phase=1;event('show-one');
  $('tlCompAdvance').textContent='Move the 1';
  $('tlCompMove').hidden=false;
  message('The purple piece is exactly 1. Drag it towards the green part, or press “Move the 1”.');
  render();
 }
 function moveOne(kind='button'){
  if(phase!==1)return;
  phase=2;event(kind);
  $('tlCompAdvance').textContent='Compare the totals';$('tlCompMove').hidden=true;
  message((a+1)+' is 1 bigger; '+(b-1)+' is 1 smaller. Has the total changed?');
  render();
 }
 function compare(){
  if(phase!==2)return;
  phase=3;event('total-reveal');
  $('tlCompAdvance').textContent='Try bigger numbers';
  const good=prediction==='same';
  $('tlCompResult').hidden=false;
  $('tlCompResult').innerHTML='<strong>'+(good?'Your prediction was right!':'Now you can see what happened.')+'</strong>'+
  '<p>'+a+' + '+b+' = '+(a+b)+'. And '+(a+1)+' + '+(b-1)+' = '+(a+b)+'. Nothing was added or taken away from the WHOLE. We simply moved one part.</p>';
  message('The brackets show the same length: the total stays the same.');
  render();
  if(!finished){finished=true;onFinish({correct:good,prediction,model:'compensation',reveals});}
 }
 function useIt(){
  if(phase!==3)return;
  phase=4;event('transfer-to-large-numbers');
  $('tlCompAdvance').hidden=true;$('tlCompUse').hidden=false;
  $('tlCompUsePicture').innerHTML=compensationDiagram({a:729,b:21,k:1,phase:1,view:'cards'});
  message('Now use moving 1 to make a tricky addition easier.');
 }
 function checkUse(){
  if(phase!==4||application===null)return;
  $('tlCompUseResult').hidden=false;
  if(application===0){
   const {sum}=friendlyExample(729,21);
   $('tlCompUseResult').innerHTML='<strong>Yes! 730 + 20 is easier.</strong><p>729 needs <strong>1</strong> to reach 730. We take it from 21, leaving 20. So 729 + 21 = 730 + 20 = <strong>'+sum+'</strong>.</p>';
   $('tlCompUsePicture').innerHTML=compensationDiagram({a:729,b:21,k:1,phase:3,view:'cards'});
   $('tlCompNewPair').hidden=false;event('apply-large');
  }else $('tlCompUseResult').innerHTML='<strong>Almost. Think about the 9 in 729.</strong><p>What would make 729 into 730? Remember: if one number gains 1, the other must lose 1.</p>';
 }
 container.querySelector('.tl-comp-choices').addEventListener('click',e=>{
  const button=e.target.closest('[data-pred]');if(!button||phase>0)return;
  prediction=button.dataset.pred;container.querySelectorAll('[data-pred]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));
  $('tlCompAdvance').disabled=false;
  message('Good. Now test your idea. We haven’t checked it yet.');
 });
 $('tlCompAdvance').addEventListener('click',()=>{if(phase===0)showUnit();else if(phase===1)moveOne();else if(phase===2)compare();else if(phase===3)useIt()});
 $('tlCompMove').addEventListener('click',()=>moveOne());
 $('tlCompReset').addEventListener('click',reset);
 $('tlCompBars').addEventListener('click',()=>{view='bars';render()});
 $('tlCompCards').addEventListener('click',()=>{view='cards';render()});
 $('tlCompUseChoices').addEventListener('click',e=>{
  const button=e.target.closest('[data-use]');if(!button)return;
  application=Number(button.dataset.use);
  container.querySelectorAll('[data-use]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));
  $('tlCompCheckUse').disabled=false;
 });
 $('tlCompCheckUse').addEventListener('click',checkUse);
 $('tlCompNewPair').addEventListener('click',()=>{
  const a2=100+10*Math.floor(Math.random()*75)+9,b2=11+10*Math.floor(Math.random()*6);
  $('tlCompPair').textContent='Try '+a2+' + '+b2+'. Moving 1 gives '+(a2+1)+' + '+(b2-1)+'. How does that help?';
 });
 $('tlCompPicture').addEventListener('pointerdown',e=>{
  const tile=e.target.closest('[data-drag-compensation]');
  if(phase!==1||!tile)return;
  drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY};
  e.target.closest('svg')?.setPointerCapture(e.pointerId);e.preventDefault();
 });
 $('tlCompPicture').addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  const distance=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);drag=null;
  if(distance>13)moveOne('drag-one');
 });
 $('tlCompPicture').addEventListener('pointercancel',()=>{drag=null;});
 $('tlCompPicture').addEventListener('keydown',e=>{
  if(phase===1&&(e.key==='Enter'||e.key===' '||e.key==='ArrowDown')&&e.target.closest('[data-drag-compensation]')){e.preventDefault();moveOne('keyboard-one');}
 });
 function load(q){
  const pair=q?.diagram?.pairs?.[0]||[25,25];
  a=pair[0];b=pair[1];if(b<=1)b=21;
  reset();
 }
 reset();
 return {load,phase:()=>phase,reveals:()=>reveals,prediction:()=>prediction};
}
