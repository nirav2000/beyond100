import model from "./model.mjs";
import visuals from "./visuals.mjs";
(function mount(model,visuals,w){
 const {verbs:V,times:T,aspects:A,lessons:L,days:D,explanations,form,context,sentence,questions,mark,reviews,stats}=model;
 const {esc,chart,card,personal,stateCompare}=visuals;
 const d=w.document,$=id=>d.getElementById(id);
 if($("tenseLabDialog"))return;
 const preview=new URLSearchParams(w.location.search).has("version-preview"),storageKey="beyond100.tense-timeline.v1";
 const fresh=()=>({rows:[],completed:{},taught:{},pending:[],lastStage:0,lastVerb:"play"});
 function load(){try{const s=JSON.parse(w.localStorage.getItem(storageKey)||"{}");return {...fresh(),...s,rows:Array.isArray(s.rows)?s.rows:[],pending:Array.isArray(s.pending)?s.pending:[],completed:s.completed||{},taught:s.taught||{}}}catch{return fresh()}}
 let state=preview?fresh():load(),stage=L[state.lastStage]?state.lastStage:0,view="learn",verb=V[state.lastVerb]?state.lastVerb:"play",aspect=0,birth="",today="",quiz=null,focus=null,localOK=true,bridgeOK=false,flushing=false;
 function save(){if(preview)return;try{w.localStorage.setItem(storageKey,JSON.stringify(state));localOK=true}catch{localOK=false}}
 function flush(){
  if(preview||flushing||!w.BEYOND100_EVIDENCE?.recordFocusResponse)return;
  flushing=true;bridgeOK=true;
  try{while(state.pending.length){const item=state.pending[0];try{w.BEYOND100_EVIDENCE.recordFocusResponse(item);state.pending.shift();save()}catch{bridgeOK=false;break}}}finally{flushing=false}
 }
 function send(x){if(preview)return;state.pending.push({source:"tense-timeline",topicId:"english-tense-aspect",subject:"English",...x});save();flush()}
 function status(){return preview?"Historical preview · no evidence saved":!localOK?"Device storage unavailable · export before closing":state.pending.length?"Saved on device · shared evidence pending":bridgeOK?"Saved on device · answer evidence forwarded to Beyond100 · cloud sync follows existing sign-in":"Saved on device · shared evidence not yet ready"}
 
 const dlg=d.createElement("dialog");dlg.id="tenseLabDialog";dlg.setAttribute("aria-labelledby","tenseLabTitle");dlg.dataset.noteIgnore="true";
 dlg.innerHTML='<header class="tt-header"><div><div class="tt-kicker">Beyond 100 · English</div><h2 id="tenseLabTitle">Time, Tense &amp; Timeline</h2></div><button id="closeTenseLab" type="button">Close ×</button></header><div class="tt-shell"><div id="ttNav"></div><section id="ttContent" aria-label="Tense lesson"></section><p id="ttStatus" class="tt-muted" role="status"></p></div>';
 d.body.append(dlg);
 const root=$("ttContent");
 const supportedVerbs=["play","practise","walk","eat","read","write"];
 function explore(){
  const a=stage===5?aspect:stage-1,k=verb;
  return `<div class="tt-card"><div class="tt-kicker">Isolate the change</div><h3>${L[stage]}</h3><p>Keep <strong>I</strong> and <strong>${esc(V[k][4].trim()||"the same action")}</strong> fixed. Watch only the highlighted verb words.</p><div class="tt-controls"><label class="tt-field">Explore a verb<select id="ttVerb">${supportedVerbs.map(v=>`<option value="${v}"${k===v?" selected":""}>${V[v][0]+V[v][4]}</option>`).join("")}</select></label>${stage===5?`<label class="tt-field">Aspect<select id="ttAspect">${A.map((v,i)=>`<option value="${i}"${i===a?" selected":""}>${v}</option>`).join("")}</select></label>`:""}</div><div class="tt-grid">${T.map((_,t)=>card(k,t,a)).join("")}</div><p>${explanations[a]}</p>${k==="read"&&a===0?'<p class="tt-note"><strong>Same spelling, different sound:</strong> past read rhymes with red; present read rhymes with seed. Time clues distinguish the two written forms.</p>':""}<p class="tt-muted">Past / present / future tell us when. Aspect tells us how we view the event. The dotted line marks the time we are talking about; the green line marks now. These are illustrative timelines, not a rule that all events last the same length of time.</p>${stage===5?'<p class="tt-note"><strong>Grammar note:</strong> These are the twelve familiar classroom forms. English has past and present inflected tenses; “will” is an auxiliary expressing future time. Continuous and progressive are two names for the same aspect.</p>':""}</div>${a>0?`<div class="tt-card"><h4>Compare the same action</h4><div class="tt-compare">${card(k,0,0,"Simple past")}${card(k,0,a,"Past "+A[a].toLowerCase())}</div></div>`:""}${a===1?stateCompare():""}${stage===5?`<div class="tt-card"><h4>All twelve forms · one verb</h4><table class="tt-table"><thead><tr><th>Aspect</th>${T.map(t=>`<th>${t}</th>`).join("")}</tr></thead><tbody>${A.map((x,a)=>`<tr><th>${x}</th>${T.map((_,t)=>`<td>I <strong>${form(k,t,a)}</strong>${esc(V[k][4]+context(k,t,a))}.</td>`).join("")}</tr>`).join("")}</tbody></table><p class="tt-muted">Matching practice builds on your earlier Tense Matching Game, without timer pressure or multiplayer distraction.</p></div>`:""}`;
 }
 function nav(){$("ttNav").innerHTML=`<div class="tt-actions"><button type="button" data-action="learn"${view==="learn"?' class="tt-selected"':""}>Learn</button><button type="button" data-action="dashboard"${view==="dashboard"?' class="tt-selected"':""}>Progress &amp; reviews</button></div><nav class="tt-nav" aria-label="Lessons">${L.map((l,i)=>`<button type="button" data-stage="${i}"${i===stage&&view!=="dashboard"?' aria-current="step"':""}>${state.completed[i]?"✓ ":""}${i+1}. ${l}</button>`).join("")}</nav>`}
 function render(){
  nav();
  if(view==="learn")root.innerHTML=(stage===0?personal(birth,today):explore())+'<div class="tt-actions"><button type="button" class="tt-primary" data-action="start">Start practice</button><span class="tt-muted">One question at a time · hints tracked · no timer pressure</span></div>';
  else if(view==="quiz")renderQuiz();else if(view==="finish")finish();else dashboard();
  $("ttStatus").textContent=status();
 }
 function begin(s,mode="practice",day=0){
  if(mode==="review"&&!reviews(state.completed,state.rows).some(r=>r.stage===s&&r.day===day&&r.ready))return;
  stage=s;
  const k=mode==="review"?(state.completed[s]?.verb||"play"):verb;
  if(mode==="practice"&&!state.taught[s]){
   state.taught[s]=Date.now();save();
   send({externalId:"tense:teach:"+s+":"+state.taught[s],occurredAt:new Date(state.taught[s]).toISOString(),skill:"tense-timeline:"+s,anchorId:"tense:"+s,anchorLabel:L[s],prompt:"Studied "+L[s],phase:"teach",outcome:"completed",promptLevel:"explained"});
  }
  quiz={id:w.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random(),mode,day,key:k,items:questions(s,mode,day,k),i:0,choice:"",hints:0,done:false,start:Date.now(),rows:[]};
  view="quiz";render();$("ttPrompt")?.focus();
 }
 function renderQuiz(){
  const q=quiz.items[quiz.i],n=quiz.items.length,r=quiz.rows.at(-1),timeline=q.options&&q.options.length===3&&q.options.every(x=>T.includes(x));
  const drag=timeline&&!quiz.done&&quiz.mode==="practice";
  root.innerHTML=`<div class="tt-card"><div class="tt-kicker">${quiz.mode==="review"?"Day "+quiz.day+" recall · no teaching first":q.transfer?"Transfer · change the verb or context":"Practice"}</div><div class="tt-step">Question ${quiz.i+1} of ${n}</div><div class="tt-progress" role="progressbar" aria-label="Practice progress" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${quiz.i+(quiz.done?1:0)}"><i style="width:${Math.round(100*(quiz.i+(quiz.done?1:0))/n)}%"></i></div><h3 id="ttPrompt" tabindex="-1">${esc(q.prompt)}</h3>${drag?'<p class="tt-note" id="ttDragCard" draggable="true">Drag this event onto its time, or tap a time below.</p>':""}${q.options?`<div class="${timeline?"tt-grid":"tt-options"}" role="group" aria-label="Answer choices">${q.options.map((v,i)=>`<button type="button" data-choice="${i}" aria-pressed="${quiz.choice===v}" class="${timeline?"tt-timeline-target tt-"+v.toLowerCase():""}${quiz.choice===v?" tt-selected":""}"${quiz.done?" disabled":""}>${esc(v)}</button>`).join("")}</div>`:`<label class="tt-field">Your answer<input id="ttAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(quiz.choice)}"${quiz.done?" disabled":""}></label>`}${quiz.hints?`<p class="tt-note"><strong>Hint:</strong> ${esc(q.hint)}</p>`:""}${quiz.done?`${quiz.mode==="review"?'<p class="tt-feedback" role="status">Answer recorded. Results and corrections are shown after the review.</p>':`<div class="tt-feedback" data-good="${r.correct}" role="status"><strong>${r.correct?"Correct!":"Not quite. The answer is "+esc(q.answer)}</strong><p>${esc(q.reason||"Compare your answer with the correct time or verb pattern.")}</p>${q.key?chart(q.t,q.a):""}</div>`}<label class="tt-field">Explain why (optional · parent review)<textarea id="ttExplain" rows="2" placeholder="I chose this because…">${esc(r.explanation||"")}</textarea></label><div class="tt-actions tt-spacer"><button class="tt-primary" type="button" data-action="next">${quiz.i===n-1?"Finish":"Next question"}</button></div>`:`<div class="tt-actions tt-spacer"><button class="tt-primary" type="button" data-action="check"${quiz.choice.trim()?"":" disabled"}>Check answer</button><button type="button" data-action="hint"${quiz.hints?" disabled":""}>Hint</button></div>`}</div>`;
 }
 function check(){
  if(!quiz||quiz.done||!quiz.choice.trim())return;
  const q=quiz.items[quiz.i],r={id:quiz.id+":"+quiz.i,stage,mode:quiz.mode,day:quiz.day,questionId:q.id,verb:quiz.key,prompt:q.prompt,answer:quiz.choice,expected:q.answer,correct:mark(quiz.choice,q),hints:quiz.hints,transfer:!!q.transfer,at:Date.now(),durationMs:Date.now()-quiz.start,complete:false};
  quiz.rows.push(r);state.rows.push(r);quiz.done=true;save();
  send({externalId:"tense:"+r.id,occurredAt:new Date(r.at).toISOString(),skill:"tense-timeline:"+stage,anchorId:q.id,anchorLabel:L[stage],prompt:q.prompt,phase:quiz.mode==="review"?(quiz.day===1?"retrieve1":"retrieve2"):q.transfer?"apply":"demonstrate",outcome:r.correct?(r.durationMs>30000?"hesitant":"fast"):"noConcept",promptLevel:r.hints?"hint":"independent",responseSeconds:r.durationMs/1000,observations:["question:"+q.id,"first-answer:"+r.answer.slice(0,180),"correct-answer:"+r.expected,"review-day:"+r.day,"hint-count:"+r.hints]});
  renderQuiz();$("ttStatus").textContent=status();root.querySelector('[data-action="next"]')?.focus();
 }
 function next(){
  if(!quiz?.done)return;
  quiz.rows.at(-1).explanation=($("ttExplain")?.value||"").trim().slice(0,1000);save();
  if(quiz.i+1<quiz.items.length){quiz.i++;quiz.choice="";quiz.hints=0;quiz.done=false;quiz.start=Date.now();renderQuiz();$("ttPrompt")?.focus();return}
  quiz.rows.forEach(r=>r.complete=true);
  if(quiz.mode==="practice"&&!state.completed[stage])state.completed[stage]={at:Date.now(),verb:quiz.key};
  save();view="finish";render();
 }
 function metric(n,v){return `<div class="tt-metric"><span>${n}</span><b>${v===null?"—":v+"%"}</b><div class="tt-progress"><i style="width:${v??0}%"></i></div></div>`}
 const metrics=r=>'<div class="tt-dashboard">'+stats(r).map((v,i)=>metric(["Accuracy","Independent","Delayed recall","Transfer"][i],v)).join("")+"</div>";
 function finish(){root.innerHTML=`<div class="tt-card"><div class="tt-kicker">Session complete</div><h3>${L[stage]}</h3>${metrics(quiz.rows)}<p>${quiz.rows.filter(r=>r.correct).length} of ${quiz.rows.length} first answers correct. ${quiz.mode==="practice"?"Reviews become available after 1, 3 and 7 days.":"This is actual delayed retrieval evidence."}</p><div class="tt-actions"><button type="button" data-action="dashboard">Review progress</button>${stage<L.length-1&&quiz.mode==="practice"?`<button type="button" class="tt-primary" data-stage="${stage+1}">Next lesson</button>`:""}</div></div>`}
 function dashboard(){
  const rs=reviews(state.completed,state.rows);
  root.innerHTML=`<div class="tt-card"><div class="tt-kicker">Parent view · learning evidence</div><h3>Can I still do it independently?</h3>${metrics(state.rows)}<p class="tt-muted">${state.rows.length} first responses. Independent means correct without an in-question hint. Transfer uses a changed verb or context. Delayed recall is measured only by actual review answers. A dash means not yet tested.</p><div class="tt-dashboard">${D.map(day=>metric("Day "+day+" recall",stats(state.rows.filter(r=>r.mode==="review"&&r.day===day))[2])).join("")}</div></div><div class="tt-card"><h4>Spaced reviews</h4>${rs.length?rs.map(r=>`<div class="tt-review-row"><div><strong>${L[r.stage]} · Day ${r.day}</strong><p class="tt-muted">${r.done?"Completed":r.ready?"Ready now":"Due "+new Date(r.due).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})}</p></div><button type="button" data-review="${r.stage}:${r.day}"${r.ready?"":" disabled"}>${r.done?"Done":r.ready?"Start recall":"Not due yet"}</button></div>`).join(""):"<p>Finish a practice lesson to schedule delayed retrieval.</p>"}</div><div class="tt-card"><h4>Question history</h4><p class="tt-muted">Written explanations are saved on this device for parent review, not automatically marked. Answer evidence is also forwarded to the existing Beyond100 learning-evidence system.</p>${state.rows.length?`<table class="tt-table"><thead><tr><th>Question</th><th>First answer</th><th>Correct answer</th><th>Evidence</th></tr></thead><tbody>${state.rows.slice(-50).reverse().map(r=>`<tr><td>${esc(r.prompt)}${r.explanation?`<p class="tt-muted">Why: ${esc(r.explanation)}</p>`:""}</td><td>${esc(r.answer)}</td><td>${esc(r.expected)}</td><td>${r.correct?"Correct":"Incorrect"} · ${r.hints?"Hint used":"No hint"}${r.mode==="review"?" · Day "+r.day:""}</td></tr>`).join("")}</tbody></table>`:"<p>No attempts yet.</p>"}<div class="tt-actions tt-spacer"><button type="button" data-action="export">Export evidence JSON</button></div></div>`;
 }
 dlg.addEventListener("dragstart",e=>{if(e.target.id==="ttDragCard"&&quiz&&!quiz.done){e.dataTransfer?.setData("text/plain","tense-event");if(e.dataTransfer)e.dataTransfer.effectAllowed="move"}});
 dlg.addEventListener("dragover",e=>{if(e.target.closest?.(".tt-timeline-target")&&quiz&&!quiz.done)e.preventDefault()});
 dlg.addEventListener("drop",e=>{const b=e.target.closest?.(".tt-timeline-target");if(!b||!quiz||quiz.done||e.dataTransfer?.getData("text/plain")!=="tense-event")return;e.preventDefault();quiz.choice=quiz.items[quiz.i].options[+b.dataset.choice];renderQuiz();root.querySelector('[data-action="check"]')?.focus()});
 const leave=()=>view!=="quiz"||w.confirm("Leave this practice? Checked answers are saved. You can start a fresh practice later.");
 dlg.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.id==="closeTenseLab"){dlg.close();return}
  if(b.dataset.stage!==undefined){if(!leave())return;stage=+b.dataset.stage;state.lastStage=stage;view="learn";save();render();return}
  if(b.dataset.review){if(!leave())return;const [s,day]=b.dataset.review.split(":").map(Number);begin(s,"review",day);return}
  if(b.dataset.choice!==undefined&&view==="quiz"&&!quiz.done){quiz.choice=quiz.items[quiz.i].options[+b.dataset.choice];renderQuiz();root.querySelector('[data-choice="'+b.dataset.choice+'"]')?.focus();return}
  switch(b.dataset.action){
   case "dates":birth=$("ttBirth").value;today=$("ttToday").value;render();break;
   case "learn":if(leave()){view="learn";render()}break;
   case "dashboard":if(leave()){view="dashboard";render()}break;
   case "start":begin(stage);break;
   case "hint":if(!quiz.done){quiz.hints++;renderQuiz();root.querySelector('[data-action="check"]')?.focus()}break;
   case "check":check();break;
   case "next":next();break;
   case "export":{const a=d.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify({schema:"beyond100-tense-timeline-v1",rows:state.rows,completed:state.completed,taught:state.taught},null,2)],{type:"application/json"}));a.href=url;a.download="tense-timeline-evidence.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break}
  }
 });
 dlg.addEventListener("input",e=>{const el=e.target;if(el.id==="ttBirth")birth=el.value;if(el.id==="ttToday")today=el.value;if(el.id==="ttAnswer"&&!quiz.done){quiz.choice=el.value;root.querySelector('[data-action="check"]').disabled=!quiz.choice.trim()}if(el.id==="ttExplain"&&quiz?.done){quiz.rows.at(-1).explanation=el.value.slice(0,1000);save()}});
 dlg.addEventListener("change",e=>{if(e.target.id==="ttVerb"){verb=e.target.value;state.lastVerb=verb;save();render();$("ttVerb")?.focus()}if(e.target.id==="ttAspect"){aspect=+e.target.value;render();$("ttAspect")?.focus()}});
 dlg.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="ttAnswer"){e.preventDefault();check()}});
 dlg.addEventListener("close",()=>{birth="";today="";if($("ttBirth"))$("ttBirth").value="";if($("ttToday"))$("ttToday").value="";focus?.focus?.()});
 function open(){if(!dlg.open){focus=d.activeElement;flush();render();dlg.showModal();$("closeTenseLab").focus()}}
 w.BEYOND100_TENSE_OPEN=open;
 $("launchTenseLab")?.addEventListener("click",open);
 d.addEventListener("click",e=>{if(e.target.closest?.('[data-topic="Tense & Aspect"]')){e.preventDefault();e.stopPropagation();open()}},true);
 w.addEventListener("load",()=>{flush();$("ttStatus").textContent=status()},{once:true});
 w.addEventListener("beyond100-learning-evidence-saved",()=>{if(!flushing){flush();$("ttStatus").textContent=status()}});
 if(new URLSearchParams(w.location.search).get("tense")==="1")open();
})(model,visuals,window);
