// Original mathematical manipulatives for Beyond 100.
// Fully local and touch-friendly; values are redrawn rather than manipulating arbitrary HTML.
export const MODEL_TYPES=['transfer','rectangle','tiles','fraction','angle','numberline'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const label=(x,y,s,size=17,fill='#edf7f4',anchor='middle')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+fill+'" text-anchor="'+anchor+'" font-family="system-ui,Arial,sans-serif">'+String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</text>';
const shape=(x,y,w,h,fill='#2a8f84',extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" rx="3" stroke="#b9e2d9" stroke-width="1.2" '+extra+'/>';
const line=(x1,y1,x2,y2,color='#abcfc8',width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
const handle=(x,y,action,title)=>'<circle cx="'+x+'" cy="'+y+'" r="16" fill="#ffcb73" stroke="#fff2d8" stroke-width="2" data-drag="'+action+'" tabindex="0" role="slider" aria-label="'+title+'" style="cursor:grab;touch-action:none"/>'+label(x,y+5,'↔',15,'#19383c').replace('<text ','<text pointer-events="none" ');
export function recommendedModel(question){
 const id=question?.id||'',kind=question?.diagram?.kind||'';
 if(['balance-add','friendly-ten'].includes(id))return 'transfer';
 if(['perimeter-invariant','area-scale','turn-shapes','near-square'].includes(id)||kind==='arrays'&&id!=='double-half')return 'rectangle';
 if(['double-half','equal-groups'].includes(id)||kind==='groups')return 'tiles';
 if(kind==='fractions')return 'fraction';
 if(kind==='angle'||kind==='turn')return 'angle';
 if(kind==='line'||id==='rounding-midpoint')return 'numberline';
 if(kind==='bar')return 'tiles';
 return 'transfer';
}
export function transferState(a,b,delta){
 a=Math.max(1,Math.round(a));b=Math.max(1,Math.round(b));
 delta=clamp(Math.round(delta),1-a,b-1);
 return {before:[a,b],after:[a+delta,b-delta],delta,sameTotal:a+b===a+delta+b-delta};
}
export function rectangleMeasures(width,height){
 const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
 return {width:w,height:h,area:w*h,perimeter:2*(w+h)};
}
export function rectangleEqualPerimeter(a,b,c,d){return rectangleMeasures(a,b).perimeter===rectangleMeasures(c,d).perimeter;}
export function suggestedCounters(question){
 const d=question?.diagram;
 if(d?.kind==='arrays'||d?.kind==='groups'){
  const n=d.pairs?.[0]?.reduce((a,b)=>a*b,1);
  if(Number.isInteger(n)&&n>=4&&n<=36)return {count:n,sameQuestion:true};
 }
 return {count:12,sameQuestion:false};
}
export function chooseFractionCuts(n,d,scale){return {num:n*scale,den:d*scale,equal:n/d===n*scale/(d*scale)};}
export const roundAngle=angle=>clamp(Math.round(angle/5)*5,5,175);

export function createInteractiveModels({onInteraction=()=>{}}={}){
 const anchor=document.querySelector('#tlStrategies'),content=document.querySelector('#thinkingLabRoot .tl-content');
 if(!anchor||!content)throw Error('Thinking Lab needs a practice panel');
 const host=document.createElement('section');host.id='tlManip';host.className='tl-manip';
 host.innerHTML='<div class="tl-manip-head"><div><span class="tl-guide-kicker">MOVE THE MATHEMATICS</span><h3>Drag, resize and rearrange</h3><p id="tlManipIntro">Try the idea with your own hands. Each shape changes the mathematics.</p></div><button type="button" class="tl-btn" id="tlManipToggle" aria-expanded="false" aria-controls="tlManipBody">Open interactive model</button></div>'+
 '<div id="tlManipBody" hidden><div class="tl-manip-toolbar" role="group" aria-label="Choose a hands-on model"></div>'+
 '<div class="tl-manip-canvas"><svg id="tlManipSvg" viewBox="0 0 680 300" role="group" aria-label="Interactive mathematics: drag the gold handle or a counter" tabindex="0" preserveAspectRatio="xMidYMid meet"><g id="tlManipLayer"></g></svg></div>'+
 '<p class="tl-manip-status" id="tlManipStatus" role="status" aria-live="polite"></p>'+
 '<div class="tl-manip-actions"><button id="tlManipMinus" type="button" class="tl-btn">−1</button><button id="tlManipPlus" type="button" class="tl-btn">+1</button><button id="tlManipMore" type="button" class="tl-btn">Change second dimension</button><button id="tlManipExplain" type="button" class="tl-btn">Reveal measurements</button><button id="tlManipReset" type="button" class="tl-btn">Reset shapes</button></div>'+
 '<p class="tl-caption">Drag the gold handle, move counters or use the buttons. Dragging works with a mouse, finger or stylus. The arrow keys also move the selected handle. Revealed measurements and hands-on support are logged separately from an independent prediction.</p></div>';
 const header=anchor.previousElementSibling;
 if(header?.classList.contains('tl-subhead'))header.before(host);else anchor.before(host);
 const el=id=>host.querySelector('#'+id);
 const svg=el('tlManipSvg'),layer=el('tlManipLayer');
 let currentQuestion=null,model='transfer',state={},opened=false,changed=false,interactionCount=0,drag=null;
 const status=message=>{el('tlManipStatus').textContent=message;};
 const interaction=type=>{
  interactionCount++;
  changed=true;
  onInteraction({model,type,interactions:interactionCount});
 };
 const resetState=()=>{
  const q=currentQuestion,d=q?.diagram||{};
  if(model==='transfer'){
   let [a,b]=d.kind==='balance'?d.pairs[0]:[28,17];
   state={a,b,delta:0,reveal:false};
  }else if(model==='rectangle'){
   const pair=d.kind==='arrays'?d.pairs?.[0]||[4,7]:[4,7];
   state={width:clamp(Math.round(pair[0]),2,22),height:clamp(Math.round(pair[1]),2,18),moveX:0,moveY:0,
     baseW:clamp(Math.round(pair[0]),2,22),baseH:clamp(Math.round(pair[1]),2,18),reveal:false};
  }else if(model==='tiles'){
   const info=suggestedCounters(q),n=info.count;
   const cols=n%6===0?6:n%4===0?4:n%3===0?3:Math.ceil(Math.sqrt(n));
   state={n,sameQuestion:info.sameQuestion,positions:Array.from({length:n},(_,i)=>({col:i%cols,row:Math.floor(i/cols)})),reveal:false};
  }else if(model==='fraction'){
   const [n,dn]=d.pairs?.[0]||[2,5];
   state={num:Math.max(1,Math.round(n)),den:Math.max(2,Math.round(dn)),reveal:false};
  }else if(model==='angle'){
   state={angle:clamp(Math.round(d.value||75),5,175),reveal:false};
  }else{
   const lo=d.lo??0,hi=d.hi??100,at=d.at??37;
   state={lo,hi,at,reveal:false};
  }
  drag=null;
  render();
 };
 const titleForModel=m=>({
  transfer:'Transfer 1',rectangle:'Resize rectangle',tiles:'Rearrange counters',
  fraction:'Split fraction bar',angle:'Rotate angle',numberline:'Move number-line point'
 })[m];
 const modelLinks=()=>{
  const common=[recommendedModel(currentQuestion)];
  for(const m of MODEL_TYPES)if(!common.includes(m))common.push(m);
  el('tlManipBody').querySelector('.tl-manip-toolbar').innerHTML=common.map(m=>'<button type="button" data-model="'+m+'" aria-pressed="'+(m===model)+'">'+titleForModel(m)+'</button>').join('');
 };
 const load=question=>{
  currentQuestion=question;model=recommendedModel(question);
  interactionCount=0;changed=false;
  opened=false;el('tlManipBody').hidden=true;
  el('tlManipToggle').setAttribute('aria-expanded','false');
  el('tlManipToggle').textContent='Open interactive model';
  el('tlManipIntro').textContent='Suggested: '+titleForModel(model)+'. Move the shape yourself before looking at the answer.';
  modelLinks();resetState();
 };
 const R=(s)=>Math.round(s*100)/100;
 const drawTransfer=()=>{
  const {a,b,delta}=state,{after:[c,d]}=transferState(a,b,delta),total=a+b;
  const x=100,w=480,y1=45,y2=165,unit=w/total,split1=x+a*unit,split2=x+c*unit;
  let o=label(30,86,'Before',15,'#b4d9d1','start');
  o+=shape(x,y1,a*unit,67,'#27887e')+shape(split1,y1,b*unit,67,'#b38752');
  o+=label(x+a*unit/2,y1+40,a)+label(split1+b*unit/2,y1+40,b);
  // Highlight the actual SOURCE side: right-to-left consumes B, reverse consumes A.
  const moved=Math.max(1,Math.abs(delta)),sourceX=delta<0?split1-moved*unit:split1;
  o+=shape(sourceX,y1,moved*unit,67,'#ffcc78','stroke="#fef6de" stroke-width="2"');
  o+=line(split1,y1-7,split1,y1+74,'#f4ca88',2,'stroke-dasharray="5 4"');
  o+=label(Math.min(580,Math.max(100,sourceX+moved*unit/2)),29,moved+' unit'+(moved===1?'':'s'),14,'#ffcc78');
  if(delta!==0){
    o+=label(30,207,'After',15,'#b4d9d1','start');
    o+=shape(x,y2,c*unit,67,'#27887e')+shape(split2,y2,d*unit,67,'#b38752');
    o+=label(x+c*unit/2,y2+39,c)+label(split2+d*unit/2,y2+39,d);
    const sx=Math.min(split1,split2),sw=Math.max(unit,Math.abs(delta)*unit);
    o+=shape(sx,y2,sw,67,'#ffcc78','stroke="#fef6de" stroke-width="2"');
    o+=label(340,151,(delta>0?'→ transfer '+delta+' from right to left':'transfer '+Math.abs(delta)+' from left to right ←'),14,'#ffcc78');
    o+=line(split1,y1+68,split2,y2-3,'#ffcc78',3);
  }else{
    o+=label(340,y2+41,'What might happen if one unit moves?',16,'#aecdc8');
  }
  o+=handle(delta===0?split1:split2,y2+34,'transfer','Drag the divider to move an exact number of units');
  if(state.reveal)o+=label(340,282,'Total before = '+total+'   |   Total after = '+total,16,'#f7c27c');
  else o+=label(340,282,'Drag the gold handle or press +1 to transfer one unit.',14,'#c6e9e0');
  status('Original: '+a+' + '+b+'. '+(delta===0?'Drag the handle or press +1 to transfer 1 unit.': 'Transferred '+Math.abs(delta)+' unit'+(Math.abs(delta)===1?'':'s')+'. New parts: '+c+' and '+d+'.')+' What do you notice about the whole?');
  return o;
 };
 function rectOutline(x,y,w,h,color){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3" fill="none" stroke="'+color+'" stroke-dasharray="7 5" stroke-width="1.8"/>';}
 const drawRectangle=()=>{
  const scale=Math.min(26,440/Math.max(state.baseW,state.width),158/Math.max(state.baseH,state.height)),
    x=100+(state.moveX||0),y=55+(state.moveY||0),baseX=100,baseY=55,
    W=state.width*scale,H=state.height*scale,BW=state.baseW*scale,BH=state.baseH*scale;
  let o=rectOutline(baseX,baseY,BW,BH,'#94b5b0');
  o+=shape(x,y,W,H,'#2b8c80');
  if(state.width<=22)for(let col=1;col<state.width;col++)o+=line(x+col*scale,y,x+col*scale,y+H,'#8dc8bd',.9,'pointer-events="none"');
  if(state.height<=18)for(let row=1;row<state.height;row++)o+=line(x,y+row*scale,x+W,y+row*scale,'#8dc8bd',.9,'pointer-events="none"');
  o+=shape(x,y,W,H,'transparent','data-drag="move" style="cursor:move;touch-action:none" stroke="none"');
  o+=label(x+W/2,y-14,state.width+' wide',17,'#f0c582');
  o+=label(Math.min(655,x+W+28),y+H/2,state.height+' high',17,'#f0c582');
  o+=handle(x+W,y+H/2,'width','Drag to change rectangle width');
  o+=handle(x+W/2,y+H,'height','Drag to change rectangle height');
  o+=handle(x+W,y+H,'corner','Drag the corner to resize both dimensions');
  o+=label(340,272,'Move the whole shape by dragging its interior. Resize using the handles.',14,'#c6e9e0');
  const m=rectangleMeasures(state.width,state.height),base=rectangleMeasures(state.baseW,state.baseH);
  if(state.reveal)o+=label(340,295,'Area '+m.area+' (was '+base.area+')   |   Perimeter '+m.perimeter+' (was '+base.perimeter+')',13,'#f7c27c');
  status('Rectangle '+m.width+' wide by '+m.height+' high. You can move, resize and compare with the dashed original. '+(state.reveal?'Area '+m.area+', perimeter '+m.perimeter+'.':'Predict what changes before revealing the measurements.'));
  return o;
 };
 const drawTiles=()=>{
  const step=38,x0=98,y0=38,positions=state.positions;
  let o='';
  for(let col=0;col<=12;col++)o+=line(x0+col*step,y0,x0+col*step,y0+6*step,'#42606a',.7);
  for(let row=0;row<=6;row++)o+=line(x0,y0+row*step,x0+12*step,y0+row*step,'#42606a',.7);
  positions.forEach((p,i)=>{
    let x=x0+p.col*step+2,y=y0+p.row*step+2;
    if(drag&&drag.id==='tile'&&drag.index===i){x=drag.currentX-17;y=drag.currentY-17;}
    o+=shape(x,y,34,34,drag&&drag.id==='tile'&&drag.index===i?'#f5c174':'#2f9b8d',
      'data-drag="tile" data-index="'+i+'" tabindex="0" role="button" aria-label="Move counter '+(i+1)+'" style="cursor:grab;touch-action:none"');
  });
  if(state.reveal)o+=label(340,290,'Count preserved: '+state.n+' counters even when the array shape changes.',14,'#f7c27c');
  else o+=label(340,290,'Drag any square to a new grid cell. Count the counters.',14,'#c6e9e0');
  status(state.n+' counters in the grid. Drag individual squares to rearrange them; none can be lost. '+(state.sameQuestion?'The counter count matches the current problem.':'This is a separate 12-counter example for practising the same idea.'));
  return o;
 };
 const drawFraction=()=>{
  const {num,den}=state,x=84,y=108,w=514,h=82,cell=w/den;
  let o=label(340,62,'One whole',20,'#f0c582');
  for(let j=0;j<den;j++)o+=shape(x+j*cell,y,cell,h,j<num?'#2a9286':'#2a5158');
  const bx=x+num*cell;
  o+=line(bx,y-10,bx,y+h+9,'#f1c579',3);
  o+=handle(bx,y-15,'shade','Drag the shaded fraction boundary');
  o+=label(340,234, num+' of '+den+' equal parts shaded',16);
  if(state.reveal)o+=label(340,263,'Fraction = '+num+'/'+den+'   |   Equivalent = '+(num*2)+'/'+(den*2),16,'#f0c582');
  status(num+' of '+den+' equal parts shaded. Drag the gold boundary to resize the shaded region. "Change second dimension" subdivides or joins equal pieces without changing the amount.');
  return o;
 };
 const drawAngle=()=>{
  const cx=315,cy=210,rad=-state.angle*Math.PI/180,rx=cx+122*Math.cos(rad),ry=cy+122*Math.sin(rad);
  let o=line(94,cy,550,cy,'#c1dfd8',4)+line(cx,cy,rx,ry,'#f2be74',5);
  o+='<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#fff"/>';
  o+='<circle cx="'+rx+'" cy="'+ry+'" r="17" fill="#ffcd73" stroke="#ffefcc" stroke-width="2" data-drag="angle" role="slider" aria-label="Rotate angle ray" style="cursor:grab;touch-action:none"/>';
  o+=label(cx,cy+37,'vertex',14,'#d4ebe6')+label(340,52,'Straight line = 180°',20,'#f0c582');
  if(state.reveal)o+=label(340,273,'One angle '+state.angle+'° + remaining '+(180-state.angle)+'° = 180°',17,'#f7c27c');
  else o+=label(340,273,'Rotate the ray, then predict the remaining angle.',15,'#c6e9e0');
  status('You have drawn a '+state.angle+'° angle. Drag the gold point to rotate the ray. '+(state.reveal?'The other angle is '+(180-state.angle)+'°.':'Try predicting its supplement.'));
  return o;
 };
 const drawNumberline=()=>{
  const {lo,hi,at}=state,x=84,y=151,w=510,mid=(lo+hi)/2,px=v=>x+w*(v-lo)/(hi-lo);
  let o=line(x,y,x+w,y,'#b9dbd4',4);
  for(const v of [lo,mid,hi]){
   o+=line(px(v),y-15,px(v),y+15,'#dcb276',3);
   o+=label(px(v),y+42,v===mid?'halfway':v,15,'#e3f3ee');
  }
  o+='<circle cx="'+px(at)+'" cy="'+y+'" r="17" fill="#ffcc7c" stroke="#fff0d9" stroke-width="2" data-drag="point" role="slider" aria-label="Move point on the number line" style="cursor:grab;touch-action:none"/>';
  o+=label(px(at),y-36,at,19,'#f0c582');
  if(state.reveal)o+=label(340,264,'Closest multiple: '+(at<mid?lo:hi),17,'#f7c27c');
  else o+=label(340,264,'Which end is closer? Drag across halfway to investigate.',15,'#c6e9e0');
  status('Point at '+at+', between '+lo+' and '+hi+'. Drag it across the midpoint. '+(state.reveal?'Nearest multiple: '+(at<mid?lo:hi)+'.':'Predict before showing which multiple is closer.'));
  return o;
 };
 const render=()=>{
  if(!currentQuestion)return;
  const drawer={transfer:drawTransfer,rectangle:drawRectangle,tiles:drawTiles,fraction:drawFraction,angle:drawAngle,numberline:drawNumberline}[model];
  layer.innerHTML='<rect width="680" height="300" fill="#132c32" rx="12"/>'+drawer();
  const tool=el('tlManipBody').querySelector('.tl-manip-toolbar');
  tool.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===model)));
  el('tlManipMore').textContent=model==='rectangle'?'Increase height by 1':model==='fraction'?'Split or join all parts':model==='tiles'?'Arrange as rows':model==='angle'?'Rotate 90°':model==='numberline'?'Jump to midpoint':'Move one unit from right';
  el('tlManipMinus').textContent=model==='fraction'?'−1 shaded':model==='rectangle'?'−1 width':'−1';
  el('tlManipPlus').textContent=model==='fraction'?'+1 shaded':model==='rectangle'?'+1 width':'+1';
  el('tlManipExplain').textContent=state.reveal?'Hide measurements':'Reveal measurements';
 };
 function change(delta){
  let updated=true;
  if(model==='transfer')state.delta=clamp(state.delta+delta,1-state.a,state.b-1);
  else if(model==='rectangle')state.width=clamp(state.width+delta,1,22);
  else if(model==='fraction')state.num=clamp(state.num+delta,0,state.den);
  else if(model==='angle')state.angle=roundAngle(state.angle+delta*5);
  else if(model==='numberline')state.at=clamp(state.at+delta*(state.hi-state.lo)/20,state.lo,state.hi);
  else updated=false;
  if(updated){interaction('button');render();}
 }
 const updateSecondary=()=>{
  if(model==='rectangle')state.height=clamp(state.height+1,1,18);
  else if(model==='fraction'){
   if(state.den*2<=36){state.num*=2;state.den*=2;}
   else if(state.den%2===0&&state.num%2===0){state.num/=2;state.den/=2;}
  }else if(model==='angle')state.angle=90;
  else if(model==='numberline')state.at=(state.lo+state.hi)/2;
  else if(model==='transfer')state.delta=clamp(state.delta+1,1-state.a,state.b-1);
  else if(model==='tiles'){
   // Arrange each counter in two even rows when possible, without changing the count.
   const cols=state.n%2===0?state.n/2:Math.ceil(state.n/3);
   state.positions=state.positions.map((_,i)=>({col:i%Math.min(12,cols),row:Math.floor(i/Math.min(12,cols))}));
  }
  interaction('secondary');render();
 };
 const point=e=>{
  const r=svg.getBoundingClientRect();
  return {x:(e.clientX-r.left)*680/r.width,y:(e.clientY-r.top)*300/r.height};
 };
 svg.addEventListener('pointerdown',e=>{
  const target=e.target.closest('[data-drag]');
  if(!target||!currentQuestion)return;
  e.preventDefault();const p=point(e),id=target.dataset.drag,index=Number(target.dataset.index);
  drag={id,index,fromX:p.x,fromY:p.y,origin:JSON.parse(JSON.stringify(state)),currentX:p.x,currentY:p.y,moved:false};
  svg.setPointerCapture(e.pointerId);
 });
 svg.addEventListener('pointermove',e=>{
  if(!drag||!svg.hasPointerCapture(e.pointerId))return;
  const p=point(e);
  if(Math.abs(p.x-drag.fromX)+Math.abs(p.y-drag.fromY)<2&&!drag.moved)return;
  drag.moved=true;drag.currentX=p.x;drag.currentY=p.y;
  if(drag.id==='transfer'){
   const baseline=drag.origin.delta;
   state.delta=clamp(baseline+Math.round((p.x-drag.fromX)/(480/(state.a+state.b))),1-state.a,state.b-1);
  }else if(drag.id==='width'||drag.id==='corner'){
   const cell=Math.min(26,440/Math.max(drag.origin.baseW,drag.origin.width),158/Math.max(drag.origin.baseH,drag.origin.height));
   state.width=clamp(drag.origin.width+Math.round((p.x-drag.fromX)/cell),1,22);
  }
  if(drag.id==='height'||drag.id==='corner'){
   const cell=Math.min(26,440/Math.max(drag.origin.baseW,drag.origin.width),158/Math.max(drag.origin.baseH,drag.origin.height));
   state.height=clamp(drag.origin.height+Math.round((p.y-drag.fromY)/cell),1,18);
  }
  if(drag.id==='move'){
   state.moveX=clamp(drag.origin.moveX+(p.x-drag.fromX),-80,110);
   state.moveY=clamp(drag.origin.moveY+(p.y-drag.fromY),-24,48);
  }
  if(drag.id==='shade'){
   state.num=clamp(Math.round((p.x-84)*state.den/514),0,state.den);
  }
  if(drag.id==='angle'){
   const v=Math.atan2(210-p.y,p.x-315)*180/Math.PI;
   state.angle=roundAngle(v);
  }
  if(drag.id==='point'){
   const f=clamp((p.x-84)/510,0,1);
   state.at=state.lo+Math.round(f*20)*(state.hi-state.lo)/20;
  }
  render();
 });
 const finish=e=>{
  if(!drag)return;
  if(drag.id==='tile'&&drag.moved){
   const x=Math.floor((drag.currentX-98)/38),y=Math.floor((drag.currentY-38)/38);
   if(x>=0&&x<12&&y>=0&&y<6){
    const i=drag.index,other=state.positions.findIndex((v,j)=>j!==i&&v.col===x&&v.row===y);
    const old=state.positions[i];state.positions[i]={col:x,row:y};
    if(other>=0)state.positions[other]=old;
   }
  }
  const moved=drag.moved;drag=null;
  if(moved)interaction('drag');
  render();
 };
 svg.addEventListener('pointerup',finish);
 svg.addEventListener('pointercancel',e=>{if(drag){drag=null;render();}});
 svg.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  const target=e.target.closest('[data-drag]');
  if(!target)return;
  e.preventDefault();
  if(target.dataset.drag==='tile'){
   const i=Number(target.dataset.index),pos=state.positions[i];if(!pos)return;
   const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
   const nx=clamp(pos.col+dx,0,11),ny=clamp(pos.row+dy,0,5);
   const other=state.positions.findIndex((v,j)=>j!==i&&v.col===nx&&v.row===ny);
   if(other>=0)state.positions[other]={...pos};state.positions[i]={col:nx,row:ny};interaction('keyboard');render();
  }else if(target.dataset.drag==='move'){
   state.moveX=clamp(state.moveX+(e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0),-80,110);
   state.moveY=clamp(state.moveY+(e.key==='ArrowUp'?-5:e.key==='ArrowDown'?5:0),-24,48);interaction('keyboard');render();
  }else if(target.dataset.drag==='height'){state.height=clamp(state.height+(e.key==='ArrowUp'?-1:1),1,18);interaction('keyboard');render();}
  else if(target.dataset.drag==='corner'){state.width=clamp(state.width+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0),1,22);state.height=clamp(state.height+(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0),1,18);interaction('keyboard');render();}
  else change(e.key==='ArrowLeft'||e.key==='ArrowDown'?-1:1);
 });
 el('tlManipToggle').addEventListener('click',()=>{
  if(!currentQuestion)return;
  opened=!opened;el('tlManipBody').hidden=!opened;
  el('tlManipToggle').setAttribute('aria-expanded',String(opened));
  el('tlManipToggle').textContent=opened?'Close interactive model':'Open interactive model';
  if(opened)interaction('opened');render();
 });
 el('tlManipBody').querySelector('.tl-manip-toolbar').addEventListener('click',e=>{
  const button=e.target.closest('[data-model]');if(!button)return;
  model=button.dataset.model;resetState();interaction('switch');render();
 });
 el('tlManipMinus').addEventListener('click',()=>change(-1));
 el('tlManipPlus').addEventListener('click',()=>change(1));
 el('tlManipMore').addEventListener('click',updateSecondary);
 el('tlManipExplain').addEventListener('click',()=>{state.reveal=!state.reveal;interaction('measure');render();});
 el('tlManipReset').addEventListener('click',()=>{resetState();render();});
 return {load,model:()=>model,interactions:()=>interactionCount,reset:resetState,isOpen:()=>opened};
}
