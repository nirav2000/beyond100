import grammar from "./grammar.mjs";
import view from "./grammar-view.mjs";
export default function mountWorkshop({root,w,record,complete,rows,completions,save,notify}){
 const state={mode:"explore",verb:"study",person:"I",time:0,aspect:3,modal:"",terms:true,practiceVerb:"play",level:0,quiz:null,screen:"setup"};
 const days=[1,3,7],DAY=86400000,now=()=>Date.now();
 const modes=[["explore","Explore"],["analyse","Analyse"],["build","Construct"],["progress","Progress"]];
 const key=(mode,level,verb)=>[mode,level,verb].join("|");
 function reviews(){
  return Object.entries(completions()).filter(([k,v])=>["analyse","build"].includes(v.mode)&&grammar.verbs[v.verb]&&[0,1,2].includes(v.level)&&Number.isFinite(v.at)).flatMap(([k,v])=>days.map(day=>{
   const done=rows().some(r=>r.grammarKey===k&&r.mode==="review"&&r.day===day&&r.complete);
   return {...v,key:k,day,due:v.at+day*DAY,done,ready:!done&&now()>=v.at+day*DAY};
  })).sort((a,b)=>a.due-b.due);
 }
 function leave(){return !state.quiz||state.screen!=="quiz"||w.confirm("Leave this practice? Checked first answers are saved.")}
 function render(){
  root.innerHTML=`<div class="gw" id="gwRoot" data-theme="${state.dark?"dark":"light"}"><div class="gw-toolbar"><div><div class="tt-kicker">Grammar workshop</div><p class="gw-subheading">Understand · identify · construct</p></div><button type="button" data-gw="theme" aria-pressed="${!!state.dark}">${state.dark?"Light":"Dark"} mode</button></div><div class="gw-mode-tabs" role="group" aria-label="Grammar workshop mode">${modes.map(([m,l])=>`<button type="button" data-gw-mode="${m}" aria-pressed="${state.mode===m}" class="${state.mode===m?"gw-active":""}">${l}</button>`).join("")}</div><div id="gwBody">${state.mode==="explore"?view.explorer(state):state.mode==="progress"?view.progress(rows(),reviews()):state.screen==="quiz"?view.question(state.quiz.items[state.quiz.index],state.quiz):state.screen==="finish"?view.finish(state.quiz):view.setup(state.mode,state,Boolean(completions()[key(state.mode,state.level,state.practiceVerb)]))}</div></div>`;
  notify();
 }
 function chooseMode(mode){
  if(!modes.some(([m])=>m===mode)||!leave())return;
  state.mode=mode;state.screen="setup";state.quiz=null;render();
 }
 function start(review=null){
  const mode=review?.mode||state.mode,level=review?.level??state.level,k=review?.verb||state.practiceVerb,day=review?.day||0;
  if(!["analyse","build"].includes(mode)||!grammar.verbs[k])return;
  if(review&&!reviews().some(x=>x.key===review.key&&x.day===day&&x.ready))return;
  const variant=day||Object.values(completions()).filter(x=>x.mode===mode&&x.verb===k).length;
  let items=grammar[mode](k,level,variant);
  if(day&&mode==="build")items=items.map(q=>({...q,display:"Action: "+grammar.verbs[k][0]+grammar.verbs[k][4],question:"Write a complete sentence using "+q.person+", "+grammar.times[q.t].toLowerCase()+" time and "+grammar.aspects[q.a].toLowerCase()+".",prompt:"Independent recall: "+grammar.verbs[k][0]+grammar.verbs[k][4]+" · "+q.person+" · "+grammar.times[q.t]+" · "+grammar.aspects[q.a]}));
  if(!day){
   const novel=k==="write"?"eat":"write";
   if(mode==="build"){
    const q=grammar.build(novel,level,variant).at(-1);
    items.push({...q,id:q.id+"-transfer",display:"New action: "+grammar.verbs[novel][0]+grammar.verbs[novel][4],question:"Write a complete sentence using "+q.person+", "+grammar.times[q.t].toLowerCase()+" time and "+grammar.aspects[q.a].toLowerCase()+".",prompt:"Changed action: "+grammar.verbs[novel][0]+grammar.verbs[novel][4]+" · "+q.person+" · "+grammar.times[q.t]+" · "+grammar.aspects[q.a],transfer:true});
   }else{
    items.push(...grammar.analyse(novel,level,variant).slice(0,2).map(q=>({...q,id:q.id+"-transfer",key:novel,transfer:true})));
   }
  }
  state.mode=mode;state.level=level;state.practiceVerb=k;state.screen="quiz";
  state.quiz={id:w.crypto?.randomUUID?.()||String(now())+"-"+Math.random(),mode,level,key:key(mode,level,k),verb:k,reviewDay:day,items,index:0,choice:"",hints:0,done:false,started:now(),rows:[]};render();root.querySelector("#gwQuestion")?.focus();
 }
 function check(){
  const s=state.quiz;if(!s||state.screen!=="quiz"||s.done||!s.choice.trim())return;
  const q=s.items[s.index],r={id:s.id+":"+s.index,stage:"grammar-"+s.mode,grammarMode:s.mode,grammarKey:s.key,level:s.level,dimension:q.dimension,mode:s.reviewDay?"review":"practice",day:s.reviewDay,questionId:q.id,verb:q.key||s.verb,prompt:q.prompt,answer:s.choice,expected:q.answer,correct:grammar.mark(s.choice,q),hints:s.hints,transfer:!!q.transfer,at:now(),durationMs:now()-s.started,complete:false};
  s.rows.push(r);s.done=true;record(r);render();root.querySelector('[data-gw="next"]')?.focus();
 }
 function next(){
  const s=state.quiz;if(!s?.done)return;
  if(s.index+1<s.items.length){s.index++;s.choice="";s.hints=0;s.done=false;s.started=now();render();root.querySelector("#gwQuestion")?.focus();return}
  s.rows.forEach(r=>r.complete=true);
  if(!s.reviewDay)complete(s.key,{mode:s.mode,level:s.level,verb:s.verb,at:now()});
  save();state.screen="finish";render();
 }
 function click(e){
  if(!root.querySelector("#gwRoot")||!e.target.closest("#gwRoot"))return false;
  const b=e.target.closest("button");if(!b)return false;
  if(b.dataset.gwMode){chooseMode(b.dataset.gwMode);return true}
  if(b.dataset.gwTime!==undefined){if(!state.modal){state.time=+b.dataset.gwTime;render();root.querySelector('[data-gw-time="'+state.time+'"]')?.focus()}return true}
  if(b.dataset.gwAspect!==undefined){state.aspect=+b.dataset.gwAspect;render();root.querySelector('[data-gw-aspect="'+state.aspect+'"]')?.focus();return true}
  if(b.dataset.gwReview){const [k,day]=b.dataset.gwReview.split(":");const r=reviews().find(x=>x.key===k&&x.day===+day&&x.ready);if(r&&leave())start(r);return true}
  if(b.dataset.gwChoice!==undefined){const s=state.quiz;if(s&&!s.done){s.choice=s.items[s.index].options[+b.dataset.gwChoice];render();root.querySelector('[data-gw-choice="'+b.dataset.gwChoice+'"]')?.focus()}return true}
  switch(b.dataset.gw){
   case "theme":state.dark=!state.dark;render();root.querySelector('[data-gw="theme"]')?.focus();return true;
   case "terms":state.terms=!state.terms;render();root.querySelector('[data-gw="terms"]')?.focus();return true;
   case "start":start();return true;
   case "check":check();return true;
   case "next":next();return true;
   case "hint":if(state.quiz&&!state.quiz.done&&!state.quiz.reviewDay){state.quiz.hints++;render();root.querySelector("#gwAnswer")?.focus()}return true;
   case "progress":chooseMode("progress");return true;
   case "again":state.screen="setup";state.quiz=null;render();return true;
  }
  return false;
 }
 function change(e){
  const el=e.target,fields={gwVerb:"verb",gwPerson:"person",gwModal:"modal",gwPracticeVerb:"practiceVerb",gwLevel:"level"};
  if(!fields[el.id])return false;
  state[fields[el.id]]=el.id==="gwLevel"?+el.value:el.value;render();root.querySelector("#"+el.id)?.focus();return true;
 }
 function input(e){if(e.target.id!=="gwAnswer"||!state.quiz||state.quiz.done)return false;state.quiz.choice=e.target.value;root.querySelector('[data-gw="check"]').disabled=!state.quiz.choice.trim();return true}
 function keydown(e){if(e.key==="Enter"&&e.target.id==="gwAnswer"){e.preventDefault();check();return true}return false}
 return {render,click,change,input,keydown,leave,openMode:mode=>{if(modes.some(([m])=>m===mode)){state.mode=mode;state.screen="setup";state.quiz=null}}};
};
