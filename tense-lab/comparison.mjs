import model from "./model.mjs";
import visuals from "./visuals.mjs";
const comparison=(function comparison(model,visuals){
 const {verbs:V,times:T,aspects:A,form,context}=model,{esc}=visuals;
 const names=["The event or habit","In the middle of doing it","Looking back at something earlier","How long I had been doing it"];
 const colours=["#64748b","#b96a12","#7952bf","#7952bf"];
 const plain=[
  ["What did I do?","What do I do regularly?","What will I do?"],
  ["What was I doing then?","What am I doing now?","What will I be doing then?"],
  ["What had I already done by then?","What have I done up to now?","What will I have done by then?"],
  ["What had I been doing up to then?","What have I been doing up to now?","What will I have been doing up to then?"]
 ];
 const label=(k,t,a)=>`I <strong style="color:${colours[a]}">${esc(form(k,t,a))}</strong>${esc(V[k][4]+context(k,t,a))}.`;
 function mini(t,a){
  const x=[95,168,241][t],now=168,c=colours[a],start=x-56;
  let shape=a===0?(t===1?[45,86,127,168,209,250,291].map(p=>`<circle cx="${p}" cy="36" r="4" fill="${c}"/>`).join(""):`<rect x="${x-36}" y="29" width="36" height="14" rx="6" fill="${c}"/>`):a===1?`<rect x="${x-39}" y="28" width="78" height="16" rx="8" fill="${c}" opacity=".72"/>`:a===2?`<rect x="${start}" y="29" width="30" height="14" rx="5" fill="${c}"/><path d="M${x} 25 Q${x-26} 2 ${start+15} 24 l1 -6 m-1 6 l6 -2" stroke="${c}" stroke-width="1.7" fill="none"/>`:`<rect x="${start}" y="28" width="56" height="16" rx="8" fill="${c}" opacity=".72"/>`;
  return `<svg viewBox="0 0 336 63" role="img" aria-label="${esc(T[t]+" "+names[a])}"><path d="M12 36 H324 l-6 -4 m6 4 l-6 4" stroke="#a3afc0" fill="none"/>${shape}<path d="M${now} 19 V51" stroke="#16834b" stroke-dasharray="3 3"/><text x="${now}" y="59" text-anchor="middle" font-size="10" font-weight="700" fill="#16834b">Now</text>${a>0&&t!==1?`<path d="M${x} 12 V49" stroke="${c}" stroke-dasharray="3 2"/><text x="${x}" y="10" text-anchor="middle" font-size="10" font-weight="700" fill="${c}">Then</text>`:""}</svg>`;
 }
 function rows(k,t,terms,advanced=false){
  return `<div class="tt-compact-rows">${[0,1,2,...(advanced?[3]:[])].map(a=>`<article class="tt-compact-row" data-aspect-row="${a}"><div><div class="tt-meaning">${esc(plain[a][t])}</div><p class="tt-compare-sentence">${label(k,t,a)}</p>${terms?`<div class="tt-grammar-name">${A[a]}</div>`:""}</div><div class="tt-compact-chart">${mini(t,a)}</div></article>`).join("")}</div>`;
 }
 function panel(k,t,terms,advanced=false){
  return `<div class="tt-card" id="ttComparePanel"><div class="tt-kicker">Same words · different ways of looking at time</div><h3>Compare the same action</h3><p class="tt-muted">Choose a time. Only the verb words change.</p><div class="tt-actions tt-time-picker" role="group" aria-label="Time for comparison">${T.map((v,i)=>`<button type="button" class="tt-${v.toLowerCase()}${t===i?" tt-selected":""}" data-compare-time="${i}" aria-pressed="${t===i}">${v}</button>`).join("")}</div><div id="ttCompareRows" aria-live="polite">${rows(k,t,terms,advanced)}</div><p class="tt-muted">The bars show examples, not fixed lengths of time.</p></div>`;
 }
 function clock(minute){const h=Math.floor(minute/60),m=minute%60;return `${h}${m?":"+String(m).padStart(2,"0"):""} pm`}
 function moment(minute){
  return minute<240?"before":minute<300?"during":"after";
 }
 function momentSentence(k,minute){
  const m=moment(minute),v=V[k],at=clock(minute);
  return m==="before"?{sentence:`At ${at}, I had not started ${v[3]}${v[4]}.`,meaning:"The action had not started.",type:"Before the event"}:m==="during"?{sentence:`At ${at}, I ${form(k,0,1)}${v[4]}.`,meaning:"I was in the middle of doing it.",type:"Past continuous"}:{sentence:`By ${at}, I ${form(k,0,2)}${v[4]}.`,meaning:"In this example, I had already finished.",type:"Past perfect"};
 }
 function momentDiagram(minute,k,state=false){
  const x=m=>18+(m-180)/240*304,at=x(minute),left=x(240),right=x(300),now=x(420),ink=state?"#64748b":"#b96a12",m=moment(minute),caption=state?"Being busy · a state":`${V[k][3]}${V[k][4]} · an activity`;
  return `<svg viewBox="0 0 340 86" role="img" aria-label="${esc(caption)}, 4 pm to 5 pm, looking at ${clock(minute)}, now 7 pm"><path d="M18 42 H330 l-6 -4 m6 4 l-6 4" stroke="#a3afc0" fill="none"/><rect x="${left}" y="34" width="${right-left}" height="16" rx="7" fill="${ink}" opacity=".75"/><path d="M${now} 24 V57" stroke="#16834b" stroke-dasharray="3 2"/><text x="${now}" y="19" text-anchor="end" font-size="10" fill="#16834b" font-weight="700">Now</text><path d="M${at} 18 V57" stroke="#365b91" stroke-width="2"/><circle cx="${at}" cy="42" r="4" fill="#365b91"/><text x="${Math.max(28,Math.min(307,at))}" y="12" text-anchor="middle" font-size="10" fill="#365b91" font-weight="700">${clock(minute)}</text>${[180,240,300,360,420].map(p=>`<text x="${x(p)}" y="70" text-anchor="${p===180?"start":p===420?"end":"middle"}" font-size="10" fill="#64748b">${p/60} pm</text>`).join("")}</svg>`;
 }
 function momentContent(k,minute,terms){
  const result=momentSentence(k,minute);
  return `<div class="tt-moment-grid"><article><div class="tt-meaning">What was true from 4 to 5 pm?</div><p class="tt-compare-sentence">I <strong style="color:#64748b">was</strong> busy.</p>${momentDiagram(minute,k,true)}<p class="tt-muted">Being busy lasted an hour. That does not make the sentence continuous.${terms?" · Simple past":""}</p></article><article><div class="tt-meaning">What was I doing? Had I finished?</div><p class="tt-compare-sentence">${esc(result.sentence)}</p>${momentDiagram(minute,k)}<p class="tt-muted">${esc(result.meaning)}${terms?" · "+result.type:""}</p></article></div>`;
 }
 function momentPanel(k,minute,terms){
  return `<div class="tt-card" id="ttMomentPanel"><div class="tt-kicker">Move the moment you are looking at</div><h3>Understanding the difference visually</h3><p>Imagine I started ${esc(V[k][3]+V[k][4])} at 4 pm and finished at 5 pm. It is now 7 pm.</p><label class="tt-field" for="ttMoment">Which earlier moment are we talking about? <output id="ttMomentTime" for="ttMoment">${clock(minute)}</output></label><input type="range" id="ttMoment" min="180" max="360" step="15" value="${minute}" aria-label="Earlier moment in time" aria-valuetext="${clock(minute)}"><div class="tt-actions"><button type="button" data-moment="210">Before · 3:30 pm</button><button type="button" data-moment="270">During · 4:30 pm</button><button type="button" data-moment="330">After · 5:30 pm</button></div><div id="ttMomentResult" aria-live="polite">${momentContent(k,minute,terms)}</div><p class="tt-muted">The two bars last the same length of time. The activity sentence changes depending on when we look at it. “Was busy” describes what was true, not an activity in progress.</p></div>`;
 }
 function verbGuide(k,t,terms){
  const v=V[k],be=["was","am","will be"][t],have=["had","have","will have"][t];
  return `<div class="tt-card" id="ttVerbGuide"><div class="tt-kicker">Build the words</div><h3>Why do the verb words change?</h3><p>To say I am in the middle of doing something, I use the <strong>-ing</strong> word. To look back at something earlier, I use a different form with <strong>have</strong>, <strong>has</strong> or <strong>had</strong>.</p><div class="tt-word-grid">${[["Start with",v[0]],["Past",v[1]],["Doing it",v[3]],["With have / had",v[2]]].map(([a,b],i)=>`<div class="tt-word-tile"><span>${a}</span><strong>${b}</strong>${terms&&i===3?'<small>Past participle</small>':""}</div>`).join("")}</div><div class="tt-formula"><span class="tt-formula-cont">${be}</span><span>+</span><span class="tt-formula-cont">${v[3]}</span><span>→ In progress</span></div><div class="tt-formula"><span class="tt-formula-perfect">${have}</span><span>+</span><span class="tt-formula-perfect">${v[2]}</span><span>→ Looking back</span></div><details><summary>Why not “was written”?</summary><p>I <strong>was writing</strong> a sentence. I was doing it.</p><p>I <strong>had written</strong> a sentence. I had already done it.</p><p>The sentence <strong>was written</strong> by me. The sentence is what the action happened to.</p><p>“Was written” is not wrong. It answers a different question. ${terms?"This is called the passive voice.":"We can learn its grammar name later."}</p></details></div>`;
 }
 return {panel,rows,momentPanel,momentContent,momentSentence,moment,clock,verbGuide,mini};
})(model,visuals);
export default comparison;
