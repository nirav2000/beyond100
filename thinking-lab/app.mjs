import {TOPICS,TECHNIQUES,makeQuestion} from './engine.mjs';
import {createGuidedDiscovery,buildStoryboard} from './guided-discovery.mjs';
import {createInteractiveModels} from './interactive-models.mjs';
import {createExplanationCoach} from './explanation-coach.mjs';

const root=document.getElementById('thinkingLabRoot');
if(!root) throw Error('Missing Maths Thinking Lab mount');
const $=id=>document.getElementById(id);
const escapeText=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pref='beyond100.thinking-lab.v1.';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const config=new URLSearchParams(location.search);
const chooseTechnique=config.get('technique');
const chosen=TECHNIQUES.find(t=>t.id===chooseTechnique);
const sourceDol=config.get('source')==='dol';
const contextNum=Number(config.get('number'));
const validNum=Number.isSafeInteger(contextNum)&&contextNum>=2&&contextNum<=1024;
const CURRENT_VERSION=1;

let role='learner';
let saved=read(pref+'preferences',{});
let state={topic:chosen?.topic||saved.topic||'all',technique:chosen?.id||'all',level:[1,2,3].includes(saved.level)?saved.level:1,
 question:null,strategy:null,choice:null,hints:0,wrong:0,guidedReveals:0,manipInteractions:0,visual:false,view:0,started:0,firstAnswerMs:null,predictionChoice:null,done:false,revealed:false};
let histories={learner:loadHistory('learner'),parent:loadHistory('parent')};
let factorNumber=validNum?contextNum:36;
let factorVisible=sourceDol&&validNum;
let factorSelected=1;
let coach;
const guide=createGuidedDiscovery({
 onReveal:()=>{state.guidedReveals=(state.guidedReveals||0)+1;},
 onPrediction:({prediction})=>{
  const labels={bigger:'Yes — it gets bigger',same:'No — it stays the same',smaller:'Yes — it gets smaller'};
  state.choice=labels[prediction];state.predictionChoice=prediction;
  if(state.firstAnswerMs===null)state.firstAnswerMs=Math.round(performance.now()-state.started);
 },
 onFinish:({correct})=>{
  if(state.done)return;state.done=true;record(correct);
  text('tlStatus','Now try 729 + 21. Then describe what you changed and why it works.');
 },
 onApplication:()=>{
  coach?.setReady(true);
  text('tlStatus','Now explain your method and why the sum stayed unchanged.');
 }
});
const manip=createInteractiveModels({onInteraction:()=>{state.manipInteractions=(state.manipInteractions||0)+1;}});
coach=createExplanationCoach({onProgress:saveExplanation});

function loadHistory(r){const x=read(pref+'history.'+r,[]);return Array.isArray(x)?x.slice(-400):[]}
function storeHistory(r){write(pref+'history.'+r,histories[r])}
function explanationHistory(r){const rows=read(pref+'explanations.'+r,[]);return Array.isArray(rows)?rows:[]}
function saveExplanation({profile,record}){
 const r=profile==='parent'?'parent':'learner',item={...record,exerciseId:state.exerciseId};
 const rows=explanationHistory(r),ix=rows.findIndex(row=>row.id===item.id);
 if(ix===-1)rows.push(item);else rows[ix]=item;
 write(pref+'explanations.'+r,rows.slice(-150));
 const attempt=histories[r].findLast(row=>row.exerciseId===state.exerciseId);
 if(attempt){
  attempt.explanationProvided=Boolean(item.firstWhy.trim());
  attempt.explanation=item.firstWhy.slice(0,500);
  attempt.explanationRevised=Boolean(item.improved);
  attempt.explanationTransferCorrect=item.transfer?.correct;
  attempt.explanationIndependentStart=item.independentStart;
  attempt.explanationHelpUsed=item.helpUsed;
  storeHistory(r);
 }
 if(r==='learner')coach?.renderReview(explanationHistory('learner'));
}
function text(id,s){const n=$(id);if(n)n.textContent=String(s??'')}
function show(id,on){$(id).hidden=!on}
function stat(){const rows=histories[role],first=rows.filter(e=>e.correct&&e.wrong===0).length,ind=rows.filter(e=>e.correct&&!e.assisted).length;
 text('tlCompleted',rows.length);text('tlAcc',rows.length?Math.round(100*first/rows.length)+'%':'-');
 text('tlIndependent',ind);text('tlReview',new Set(rows.slice(-50).filter(e=>!e.correct||e.assisted||e.durationMs>30000).map(e=>e.technique)).size);
 text('tlRecordNote',role==='parent'?'Parent practice stays separate from Sai’s learning record.':'Learner practice is sent to Beyond 100 learning evidence when the app is ready.');
}
function randStrategies(q){let opts=TECHNIQUES.map(t=>t.strategy).filter(x=>x!==q.strategy);opts=[...new Set(opts)];
 // Simple bounded, unbiased sampling without the unstable sort(random) idiom.
 for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}
 let items=[q.strategy,...opts.slice(0,2)];
 for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
 return items;
}
const SVG_NS='http://www.w3.org/2000/svg';
const svg=(body,w=620,h=228)=>'<svg xmlns="'+SVG_NS+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Mathematical visual comparison"><rect width="'+w+'" height="'+h+'" fill="#13272e" rx="12"/>'+body+'</svg>';
const rect=(x,y,w,h,fill='#297c77')=>'<rect x="'+x+'" y="'+y+'" width="'+Math.max(0,w)+'" height="'+Math.max(0,h)+'" rx="3" fill="'+fill+'" stroke="#a1d2c8" stroke-width="1.1"/>';
const tx=(x,y,v,size=16,color='#ebf8f4')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="'+color+'" font-size="'+size+'" font-family="Arial,sans-serif">'+escapeText(v)+'</text>';
const ln=(x1,y1,x2,y2,color='#b6dfd8',thick=2)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+thick+'"/>';
function arrayDiagram(a,b,offset=0){
 const cw=Math.min(23,255/a,142/b),x0=25+offset*300+(264-cw*a)/2,y0=47+(142-cw*b)/2;
 let out=rect(x0,y0,cw*a,cw*b,'#277a73');
 // Grid lines are bounded even for large challenge numbers.
 if(a<=35)for(let c=1;c<a;c++)out+=ln(x0+c*cw,y0,x0+c*cw,y0+cw*b,'#76beb2',.6);
 if(b<=35)for(let r=1;r<b;r++)out+=ln(x0,y0+r*cw,x0+cw*a,y0+r*cw,'#76beb2',.6);
 return out+tx(160+offset*300,211,a+' x '+b);
}
function renderDiagram(q,view=0){
 const d=q.diagram,kind=d.kind;
 const storyboard=buildStoryboard(q);
 if(storyboard)return storyboard.image(2,view);
 if(kind==='arrays'){
  let o='';
  d.pairs.forEach(([a,b],i)=>o+='<g opacity="'+(i===view?1:.28)+'">'+arrayDiagram(a,b,i)+'</g>');
  return svg(o);
 }
 if(kind==='balance'){
  const pairs=d.pairs||[];
  let o='';
  pairs.forEach(([a,b],i)=>{
   o+='<g opacity="'+(i===view?1:.27)+'">';
   const total=a+b,x=45,y=50+i*98,one=520*a/total;
   o+=rect(x,y,one,52,'#277f7a')+rect(x+one,y,520-one,52,'#a77d46');
   o+=tx(x+one/2,y+32,a,Math.max(12,Math.min(18,one/3)));
   o+=tx(x+one+(520-one)/2,y+32,b,Math.max(12,Math.min(18,(520-one)/3)));o+='</g>';
  });return svg(o);
 }
 if(kind==='difference'){
  const pairs=d.pairs,lo=Math.min(...pairs.map(p=>p[0]))-4,hi=Math.max(...pairs.map(p=>p[1]))+4;
  let o='';pairs.forEach(([a,b],i)=>{
    o+='<g opacity="'+(i===view?1:.27)+'">';
    const y=55+i*105,at=v=>55+510*(v-lo)/(hi-lo);
    o+=ln(55,y,565,y,'#678d91',3)+ln(at(a),y,at(b),y,'#e2b474',9)+tx(at(a),y-17,a)+tx(at(b),y-17,b);o+='</g>';
  });return svg(o);
 }
 if(kind==='fractions'){
  let o='';
  d.pairs.forEach(([a,b],i)=>{
   o+='<g opacity="'+(i===view?1:.28)+'">';
   const y=24+i*107,c=540/b;
   for(let j=0;j<b;j++)o+=rect(40+j*c,y,c,53,j<a?'#369d8d':'#2c5058');
   o+=tx(310,y+77,a+'/'+b+' of the same whole',15);o+='</g>';
  });return svg(o);
 }
 if(kind==='groups'){
  let o='';d.pairs.forEach(([g,each],i)=>{
   o+='<g opacity="'+(i===view?1:.28)+'">';
   const y=35+i*105,cw=Math.min(47,520/g);
   for(let k=0;k<g;k++)o+=rect(52+k*cw,y,cw-4,42,i?'#aa8859':'#28847a');
   o+=tx(310,y+71,g+' groups x '+each+' in each',16);o+='</g>';
  });return svg(o);
 }
 if(kind==='angle'){
  const a=view?180-d.value:d.value,cx=310,cy=170,r=102,rad=-a*Math.PI/180;
  const x=cx+r*Math.cos(rad),y=cy+r*Math.sin(rad);
  const o=ln(80,cy,540,cy)+ln(cx,cy,x,y,'#e8bb78',5)+tx(cx+65*Math.cos(rad/2),cy+60*Math.sin(rad/2)-15,a+'°',17)+tx(310,213,view?'Other angle':'Given angle',15);
  return svg(o);
 }
 if(kind==='turn'){
  let o='',n=d.value,cx=310,cy=111,r=80;
  o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#235d60" stroke="#a7d4cc" stroke-width="3"/>';
  for(let j=0;j<n;j++){const a=j*2*Math.PI/n;o+=ln(cx,cy,cx+Math.cos(a)*r,cy+Math.sin(a)*r)}
  o+=tx(cx,215,n+' angles = one complete turn',15);return svg(o);
 }
 if(kind==='bar'){
  let o='',sum=d.parts.reduce((a,b)=>a+b,0),x=50;
  d.parts.forEach((v,i)=>{const w=520*v/sum;o+=rect(x,77,w,64,i?'#b48956':'#278b7c')+tx(x+w/2,114,d.labels[i],Math.max(11,Math.min(17,w/9)));x+=w});
  return svg(o+tx(310,193,'One whole = '+sum+' equal units',15));
 }
 if(kind==='line'){
  const at=x=>45+530*(x-d.lo)/(d.hi-d.lo),mid=(d.lo+d.hi)/2;
  let o=ln(45,105,575,105,'#d0e7df',4);
  for(const x of [d.lo,mid,d.hi])o+=ln(at(x),91,at(x),119,'#d0e7df',3)+tx(at(x),151,x,17);
  o+=ln(at(d.at),50,at(d.at),109,'#e9ae61',4)+tx(at(d.at),38,d.at,19);
  return svg(o+tx(310,203,'Which side of the midpoint?',15));
 }
 if(kind==='place'){
  const v=d.value,digits=(v.toFixed(1)).split('.');
  const o=['Tens','Ones','Tenths'].map((label,i)=>rect(52+i*185,49,164,52,'#27515d')+tx(134+i*185,83,label)+rect(52+i*185,110,164,57,'#358980')+tx(134+i*185,146,i===0?'0':i===1?digits[0]:digits[1],24)).join('');
  return svg(o+tx(310,206,'Every place to the left is worth ten times as much',14));
 }
 if(kind==='pairs'){
  let o='';
  d.pairs.forEach(([v],i)=>{const y=50+i*95;for(let j=0;j<Math.min(6,Math.floor(v/2));j++)o+=rect(52+j*63,y,22,22)+rect(78+j*63,y,22,22);
  o+=rect(530,y,22,22,'#e6b578')+tx(310,y+48,v+' = pairs plus 1 spare',14)});
  return svg(o);
 }
 if(kind==='units')return svg(rect(45,44,530,59)+tx(310,79,d.value+' metres')+rect(45,132,530,59,'#b18552')+tx(310,168,(Number(d.value)*100)+' centimetres'));
 return svg(tx(310,125,'Look for the structure',18));
}
function renderCoach(){
 const q=state.question;
 show('tlParent',role==='parent'&&!!q);
 if(!q)return;
 text('tlCoachTitle',q.name);
 text('tlCoachPrompt',q.ask);
 text('tlCoachTrap',q.trap);
 text('tlCoachSkill',q.skill);
 text('tlCoachProof',q.explain);
}
function next(same=false){
 const rows=histories[role],weak=rows.slice(-50).filter(r=>!r.correct||r.assisted||r.durationMs>30000).map(r=>r.technique);
 const topic=state.topic,technique=same&&state.question?state.question.id:state.technique;
 const question=makeQuestion({topic,technique,level:state.level,weak});
 state={...state,question,exerciseId:Date.now()+'-'+Math.random().toString(36).slice(2,9),strategy:null,choice:null,hints:0,wrong:0,guidedReveals:0,manipInteractions:0,visual:false,view:0,started:performance.now(),firstAnswerMs:null,done:false,revealed:false};
 text('tlTag',TOPICS.find(t=>t[0]===question.topic)?.[1]||question.topic);
 text('tlMethod',question.name);text('tlPrompt',question.prompt);text('tlHintText','');
 text('tlTopicSkill',question.skill);text('tlFeedback','');
 show('tlFeedback',false);show('tlSolution',false);show('tlVisual',false);show('tlHintText',false);
 $('tlShow').textContent='Show diagram';$('tlHint').textContent='Hint 1 of 2';$('tlHint').disabled=false;
 $('tlCheck').disabled=true;$('tlCheck').textContent='Check prediction';
 $('tlReveal').disabled=false; text('tlStatus','Look for a relationship first.');
 $('tlStrategies').innerHTML=randStrategies(question).map(s=>'<button type="button" class="tl-option" data-strategy="'+escapeText(s)+'">'+escapeText(s)+'</button>').join('');
 $('tlChoices').innerHTML=question.options.map(o=>'<button type="button" class="tl-option" data-choice="'+escapeText(o)+'">'+escapeText(o)+'</button>').join('');
 // The compensation experiment has its own child-friendly prediction controls.
 // Don't ask the same question again in the generic test panel.
 const isComp=question.id==='balance-add';
 for(const id of ['tlStrategies','tlChoices','tlCheck','tlReveal'])$(id).hidden=isComp;
 $('tlStrategies').previousElementSibling.hidden=isComp;
 $('tlChoices').previousElementSibling.hidden=isComp;
 $('tlViewA').setAttribute('aria-pressed','true');$('tlViewB').setAttribute('aria-pressed','false');
 renderCoach();
 guide.load(question);
 manip.load(question);
 coach.load(question,{profile:role,level:state.level});
}
function displayVisual(){
 const q=state.question;
 $('tlDiagram').innerHTML=renderDiagram(q,state.view);
 const storyboard=buildStoryboard(q);
 $('tlViewA').textContent=storyboard?storyboard.views[0]:'Diagram A';
 $('tlViewB').textContent=storyboard?storyboard.views[1]:'Diagram B';
 $('tlViewA').disabled=!storyboard&&((!['arrays','fractions','angle','balance','difference','groups'].includes(q.diagram.kind))||(q.diagram.kind!=='angle'&&(!q.diagram.pairs||q.diagram.pairs.length<2)));
 $('tlViewB').disabled=$('tlViewA').disabled;
 $('tlVisual').hidden=!state.visual;
 $('tlShow').textContent=state.visual?'Hide diagram':'Show diagram';
}
function feedback(ok,message){const n=$('tlFeedback');n.textContent=message;n.classList.toggle('good',ok);n.hidden=false}
function record(correct){
 const q=state.question,ms=Math.round(performance.now()-state.started);
 const assisted=state.hints>0||state.wrong>0||state.guidedReveals>0||state.visual||state.manipInteractions>0;
 const why=$('tlWhy').value.trim();
 const row={at:new Date().toISOString(),technique:q.id,skill:q.skill,topic:q.topic,prompt:q.prompt,correct,
    assisted,visual:state.visual||state.guidedReveals>0||state.manipInteractions>0,hints:state.hints,wrong:state.wrong,guidedReveals:state.guidedReveals,manipInteractions:state.manipInteractions,
    strategy:state.strategy,firstAnswerMs:state.firstAnswerMs,predictionChoice:state.predictionChoice,durationMs:ms,
    explanationProvided:Boolean(why),explanation:why.slice(0,500)};
 histories[role].push(row);histories[role]=histories[role].slice(-400);storeHistory(role);stat();
 if(role!=='learner')return;
 try{
  const evidence=window.BEYOND100_EVIDENCE;
  if(evidence?.recordFocusResponse){
   evidence.recordFocusResponse({
     source:'maths-thinking-lab',skill:q.skill,anchorId:'thinking:'+q.id,
     anchorLabel:q.name,prompt:q.prompt,phase:'practise',
     promptLevel:assisted?'prompted':state.visual?'diagram':'independent',
     outcome:correct?(assisted?'prompted':ms>30000?'hesitant':'fast'):'noConcept',
     responseSeconds:ms/1000,errorCode:null,
     observations:['technique:'+q.id,'strategy:'+(state.strategy||'not-selected'),
      'visual:'+state.visual,'hints:'+state.hints,'wrong:'+state.wrong,'guided-reveals:'+state.guidedReveals,'interactive-model-events:'+state.manipInteractions,
      'reason-provided:'+Boolean(why)]
   });text('tlStatus','Recorded in Beyond 100 learning evidence.');
  }else{text('tlStatus','Saved on this device. Beyond 100 evidence is not ready.');}
 }catch(e){console.warn('Maths Thinking Lab evidence deferred',e);text('tlStatus','Saved on this device; evidence sync unavailable.');}
}
function complete(good){
 if(state.done)return;
 state.done=true;state.revealed=!good;
 const q=state.question;
 record(good);
 feedback(good,good?'Correct. Now explain why this relationship works.':'The model answer is revealed. This will be marked for review, not as an independent success.');
 show('tlSolution',true);text('tlSolutionText',q.explain);
 $('tlChoices').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.dataset.choice===q.answer)b.classList.add('correct')});
 $('tlCheck').disabled=true;$('tlReveal').disabled=true;
}
function factors(n){
 const pairs=[];for(let d=1;d*d<=n;d++)if(n%d===0)pairs.push([d,n/d]);
 return pairs;
}
function showFactorExplorer(){
 show('tlFactor',factorVisible);
 if(!factorVisible)return;
 const n=factorNumber,pairs=factors(n),limit=Math.floor(Math.sqrt(n));
 text('tlFactorIntro','Explore all factor pairs of '+n+'. Check divisors from 1 to '+limit+', because every pair has a member at or below the square root.');
 $('tlFactorTest').innerHTML=Array.from({length:limit},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('');
 factorSelected=Math.max(1,Math.min(factorSelected,limit));$('tlFactorTest').value=String(factorSelected);
 const valid=n%factorSelected===0;
 text('tlFactorResult',valid?'Yes: '+factorSelected+' x '+n/factorSelected+' = '+n+'.':'No: '+n+' divided into '+factorSelected+' equal groups leaves remainder '+n%factorSelected+'.');
 let o='';
 if(valid){
  const cols=n/factorSelected,rows=factorSelected;
  const cell=Math.min(22,520/cols,140/rows),wide=cols*cell,high=rows*cell;
  const x=310-wide/2,y=31+(146-Math.max(10,high))/2;
  o+=rect(x,y,wide,Math.max(10,high),'#339e90');
  if(cols<=32)for(let c=1;c<cols;c++)o+=ln(x+c*cell,y,x+c*cell,y+Math.max(10,high),'#8ed0c4',.7);
  if(rows<=32&&high>=10)for(let r=1;r<rows;r++)o+=ln(x,y+r*cell,x+wide,y+r*cell,'#8ed0c4',.7);
  o+=tx(310,210,rows+' rows x '+cols+' columns',16);
 }else{
  o+=tx(310,103,n+' divided by '+factorSelected,20);
  o+=tx(310,142,'Remainder '+n%factorSelected+' : not a complete rectangle',16,'#f2be85');
 }
 $('tlFactorPicture').innerHTML=svg(o);
 text('tlFactorList','Factor pairs: '+pairs.map(p=>p[0]+' x '+p[1]).join(' · '));
}
function buildPrintableQuestions(){
 const arr=Array.from({length:6},()=>makeQuestion({topic:state.topic,technique:state.technique,level:state.level}));
 const safe=s=>escapeText(s);
 const html='<h1>Beyond 100 · Maths Thinking Lab</h1><p>Printable practice | Name: ________________________ Date: __________</p>'+
 '<p>Make a prediction without doing the calculation first. Explain what stays the same or what changes.</p>'+
 arr.map((q,i)=>'<section><h3>'+(i+1)+'. '+safe(q.name)+'</h3><p>'+safe(q.prompt)+'</p>'+
 '<p>Circle one: '+q.options.map(safe).join(' / ')+'</p><div class="writing">Reason: __________________________________________________________</div>'+
 '<div class="writing">_____________________________________________________________________</div></section>').join('')+
 '<div class="answers"><h2>Parent answer key</h2><p>Ask for the mathematical reason, not just the answer.</p>'+
 arr.map((q,i)=>'<p><strong>'+(i+1)+'. '+safe(q.answer)+'</strong> — '+safe(q.explain)+'</p>').join('')+'</div>';
 $('tlPrint').innerHTML=html;
}
function printPractice(){buildPrintableQuestions();window.print();}
function swapRole(r){
 role=r;for(const v of ['learner','parent'])$('tlRole'+v).setAttribute('aria-pressed',String(v===r));
 stat();next();
}
$('tlTopic').innerHTML=TOPICS.map(([id,name])=>'<option value="'+id+'">'+escapeText(name)+'</option>').join('');
function options(){
 $('tlTopic').value=state.topic;
 const available=TECHNIQUES.filter(t=>state.topic==='all'||t.topic===state.topic);
 if(state.technique!=='all'&&!available.some(t=>t.id===state.technique))state.technique='all';
 $('tlTechnique').innerHTML='<option value="all">Mixed (surprise me)</option>'+available.map(t=>'<option value="'+t.id+'">'+escapeText(t.name)+'</option>').join('');
 $('tlTechnique').value=state.technique;$('tlLevel').value=String(state.level);
}
$('tlTopic').addEventListener('change',e=>{state.topic=e.target.value;state.technique='all';options();savePrefs();next()});
$('tlTechnique').addEventListener('change',e=>{state.technique=e.target.value;savePrefs();next()});
$('tlLevel').addEventListener('change',e=>{state.level=Number(e.target.value);savePrefs();next()});
function savePrefs(){write(pref+'preferences',{topic:state.topic,technique:state.technique,level:state.level})}
$('tlRolelearner').addEventListener('click',()=>swapRole('learner'));
$('tlRoleparent').addEventListener('click',()=>swapRole('parent'));
$('tlStrategies').addEventListener('click',e=>{
 const button=e.target.closest('[data-strategy]');if(!button||state.done)return;
 state.strategy=button.dataset.strategy;$('tlStrategies').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===button));
});
$('tlChoices').addEventListener('click',e=>{
 const button=e.target.closest('[data-choice]');if(!button||state.done)return;
 state.choice=button.dataset.choice;
 if(state.firstAnswerMs==null)state.firstAnswerMs=Math.round(performance.now()-state.started);
 $('tlChoices').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===button));
 text('tlStatus','Prediction chosen, but not checked yet. You can still change your mind.');
 $('tlCheck').disabled=false;
});
$('tlShow').addEventListener('click',()=>{state.visual=!state.visual;displayVisual()});
for(const [id,v] of [['tlViewA',0],['tlViewB',1]])$(id).addEventListener('click',()=>{
 state.view=v;for(const [button,n] of [['tlViewA',0],['tlViewB',1]])$(button).setAttribute('aria-pressed',String(v===n));displayVisual();
});
$('tlHint').addEventListener('click',()=>{
 if(state.done||state.hints>=2)return;state.hints++;
 text('tlHintText',state.question.hints[state.hints-1]);show('tlHintText',true);
 $('tlHint').textContent='Hint '+Math.min(state.hints+1,2)+' of 2';$('tlHint').disabled=state.hints>=2;
});
$('tlCheck').addEventListener('click',()=>{
 if(state.done||state.choice===null)return;
 if(state.choice!==state.question.answer){
  state.wrong++;feedback(false,'Not yet. Which quantity changes? Which stays the same? Try another representation.');return;
 }
 complete(true);
});
$('tlReveal').addEventListener('click',()=>complete(false));
$('tlSame').addEventListener('click',()=>next(true));
$('tlNext').addEventListener('click',()=>next());
$('tlFactorOpen').addEventListener('click',()=>{factorVisible=!factorVisible;factorSelected=1;showFactorExplorer()});
$('tlFactorTest').addEventListener('change',e=>{factorSelected=Number(e.target.value);showFactorExplorer()});
$('tlPrintButton').addEventListener('click',printPractice);
$('tlParentExample').addEventListener('click',()=>{state.visual=true;displayVisual();show('tlSolution',true);text('tlSolutionText',state.question.explain)});
window.addEventListener('beforeprint',()=>{if(!$('tlPrint').innerHTML.trim())buildPrintableQuestions()});
window.addEventListener('afterprint',()=>{$('tlPrint').innerHTML=''});
window.BEYOND100_THINKING_LAB={openTechnique:(id)=>{const item=TECHNIQUES.find(t=>t.id===id);if(!item)return false;state.topic=item.topic;state.technique=item.id;options();next();document.querySelector('[data-section="thinking-lab"]')?.click();return true},skills:TECHNIQUES.map(t=>t.skill)};
stat();options();next();showFactorExplorer();
if(config.get('lab')==='1'||location.hash==='#thinking-lab'){
 const open=()=>{document.querySelector('.section-nav button[data-section="thinking-lab"]')?.click();if(sourceDol&&validNum)requestAnimationFrame(()=>document.getElementById('tlFactor')?.scrollIntoView({behavior:'smooth',block:'start'}));};
 if(document.readyState==='complete')open();else window.addEventListener('load',open,{once:true});
}
