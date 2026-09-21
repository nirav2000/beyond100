(()=>{
  'use strict';
  const EVIDENCE_KEY='beyond100.learning-evidence.v1';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const OUTCOME_LABELS={fast:'Correct + fast',hesitant:'Correct + hesitant',prompted:'Understands after prompt',noConcept:'Incorrect / no concept'};
  const OUTCOME_TONES={fast:'#24916a',hesitant:'#d9942d',prompted:'#6b78d6',noConcept:'#c65c52'};
  const CONFIDENCE_LABELS={gotit:'Got it',sense:'Makes sense',half:'Half sure',lost:'Don’t understand'};
  const ERROR_LABELS={K:'Knowledge',C:'Concept',Q:'Question interpretation',P:'Procedure',F:'Fluency',R:'Reasoning',A:'Attention'};
  const PROMPT_LABELS={independent:'Independent',read:'Read aloud',clarify:'Clarified wording',hint:'Hint',explained:'Explained'};
  let dialog=null;
  let range='all';

  function state(){
    if(window.BEYOND100_EVIDENCE?.getState){
      try{return window.BEYOND100_EVIDENCE.getState()}catch{}
    }
    try{return JSON.parse(localStorage.getItem(EVIDENCE_KEY)||'{}')}catch{return{}}
  }
  function allResponses(){
    return (state().events||[]).filter(e=>e.kind==='focus-response'||e.kind==='diagnostic-response');
  }
  function filteredResponses(){
    const rows=allResponses();
    if(range==='all')return rows;
    const days=Number(range),cut=Date.now()-days*86400000;
    return rows.filter(e=>Date.parse(e.createdAt||e.updatedAt||0)>=cut);
  }
  function confidenceEvents(){
    let rows=(state().events||[]).filter(e=>e.kind==='confidence-response');
    if(range!=='all'){
      const cut=Date.now()-Number(range)*86400000;
      rows=rows.filter(e=>Date.parse(e.createdAt||e.updatedAt||0)>=cut);
    }
    return rows;
  }
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const mean=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
  function fmtSeconds(v){return Number.isFinite(v)?(v<10?v.toFixed(1):Math.round(v))+'s':'—'}
  function countBy(rows,key,values=[]){
    const out={};values.forEach(x=>out[x]=0);
    rows.forEach(r=>{const k=typeof key==='function'?key(r):r[key];if(k!=null)out[k]=(out[k]||0)+1});
    return out;
  }

  function installButton(){
    const bar=q('.topbar'),nav=q('#openNav');if(!bar||q('#openDashboardButton'))return;
    const b=document.createElement('button');
    b.id='openDashboardButton';b.type='button';b.className='dashboard-top-button';
    b.title='Learning statistics dashboard';
    b.innerHTML='<span aria-hidden="true">▥</span><span>Stats</span>';
    b.addEventListener('click',openDashboard);
    bar.insertBefore(b,nav||null);
  }

  function ensureDialog(){
    if(dialog&&document.contains(dialog))return dialog;
    const d=document.createElement('dialog');
    d.id='learningDashboard';d.className='dashboard-dialog';d.dataset.noteIgnore='true';
    d.innerHTML='<div class="dashboard-shell">'+
      '<header class="dashboard-head">'+
        '<div><p class="eyebrow">BEYOND 100 · LEARNING EVIDENCE</p><h2>Sai’s learning dashboard</h2><span>What the recorded evidence says over time</span></div>'+
        '<div class="dashboard-head-actions"><div class="dashboard-range"><button data-range="7">7d</button><button data-range="30">30d</button><button data-range="all" class="active">All</button></div><button id="closeDashboard" type="button" aria-label="Close dashboard">×</button></div>'+
      '</header>'+
      '<main id="dashboardBody" class="dashboard-body"></main>'+
      '<footer class="dashboard-foot">Source: Focus question-level evidence and Evidence plan. When Firebase is signed in, the evidence store is merged with the cloud copy.</footer>'+
    '</div>';
    document.body.appendChild(d);dialog=d;
    q('#closeDashboard',d).onclick=()=>d.close();
    d.addEventListener('click',e=>{if(e.target===d)d.close()});
    qa('[data-range]',d).forEach(b=>b.onclick=()=>{
      range=b.dataset.range;
      qa('[data-range]',d).forEach(x=>x.classList.toggle('active',x===b));
      render();
    });
    return d;
  }
  function openDashboard(){
    const d=ensureDialog();render();if(!d.open)d.showModal();
  }

  function kpi(icon,label,value,detail,tone){
    return '<article class="dashboard-kpi" data-tone="'+tone+'"><span class="dashboard-kpi-icon">'+icon+'</span><div><b>'+esc(value)+'</b><strong>'+esc(label)+'</strong><small>'+esc(detail)+'</small></div></article>';
  }
  function barRows(counts,labels,total,tone='mixed'){
    const entries=Object.entries(labels).map(([id,label])=>[id,label,counts[id]||0]).sort((a,b)=>b[2]-a[2]);
    if(!entries.some(x=>x[2]))return'<div class="dashboard-empty">No evidence in this range yet.</div>';
    return entries.map(([id,label,count],i)=>{
      const width=Math.max(count?6:0,pct(count,total));
      return '<div class="dashboard-bar-row" data-tone="'+tone+'" data-index="'+(i%7)+'">'+
        '<div><span>'+esc(label)+'</span><b>'+count+'</b></div>'+
        '<div class="dashboard-bar-track"><i style="width:'+width+'%"></i></div>'+
      '</div>';
    }).join('');
  }

  function donut(counts,total){
    const ids=['fast','hesitant','prompted','noConcept'];
    if(!total)return'<div class="dashboard-empty">No responses yet.</div>';
    let offset=0;const stops=[];
    ids.forEach(id=>{
      const p=(counts[id]||0)/total*100;
      const start=offset,end=offset+p;
      stops.push(OUTCOME_TONES[id]+' '+start+'% '+end+'%');
      offset=end;
    });
    const legend=ids.map(id=>'<span><i style="background:'+OUTCOME_TONES[id]+'"></i><b>'+(counts[id]||0)+'</b>'+esc(OUTCOME_LABELS[id])+'</span>').join('');
    return '<div class="dashboard-donut-wrap"><div class="dashboard-donut" style="background:conic-gradient('+stops.join(',')+')"><div><b>'+total+'</b><span>responses</span></div></div><div class="dashboard-donut-legend">'+legend+'</div></div>';
  }

  function activityChart(rows){
    const days=14,points=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);
      const next=new Date(d);next.setDate(next.getDate()+1);
      const count=rows.filter(r=>{const t=Date.parse(r.createdAt||r.updatedAt||0);return t>=d.getTime()&&t<next.getTime()}).length;
      points.push({date:d,count});
    }
    const max=Math.max(1,...points.map(p=>p.count));
    const w=620,h=180,pad=24;
    const coords=points.map((p,i)=>{
      const x=pad+i*(w-pad*2)/(points.length-1);
      const y=h-pad-(p.count/max)*(h-pad*2);
      return [x,y];
    });
    const poly=coords.map(p=>p.join(',')).join(' ');
    const area=pad+','+(h-pad)+' '+poly+' '+(w-pad)+','+(h-pad);
    const labels=points.filter((_,i)=>i%3===0||i===points.length-1).map((p,i)=>{
      const idx=points.indexOf(p),x=pad+idx*(w-pad*2)/(points.length-1);
      return '<text x="'+x+'" y="'+(h-5)+'" text-anchor="middle">'+p.date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+'</text>';
    }).join('');
    return '<svg class="dashboard-activity-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Responses over the last 14 days">'+
      '<line x1="'+pad+'" y1="'+(h-pad)+'" x2="'+(w-pad)+'" y2="'+(h-pad)+'"></line>'+
      '<polygon points="'+area+'" class="area"></polygon><polyline points="'+poly+'" class="line"></polyline>'+
      coords.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3"><title>'+points[i].count+' responses · '+points[i].date.toLocaleDateString('en-GB')+'</title></circle>').join('')+
      labels+
    '</svg>';
  }

  function skillTable(rows){
    const map={};
    rows.forEach(r=>{
      const key=r.skill||'Other';
      const x=map[key]||(map[key]={skill:key,n:0,fast:0,hesitant:0,prompted:0,noConcept:0,times:[]});
      x.n++;if(x[r.outcome]!==undefined)x[r.outcome]++;if(Number.isFinite(r.responseSeconds))x.times.push(r.responseSeconds);
    });
    const list=Object.values(map).sort((a,b)=>b.n-a.n).slice(0,10);
    if(!list.length)return'<div class="dashboard-empty">No skill evidence yet.</div>';
    return '<div class="dashboard-skill-table"><div class="head"><span>Skill</span><span>Attempts</span><span>Fast</span><span>Avg time</span><span>Support</span></div>'+
      list.map(x=>'<div class="row"><strong>'+esc(x.skill)+'</strong><span>'+x.n+'</span><span>'+pct(x.fast,x.n)+'%</span><span>'+fmtSeconds(mean(x.times))+'</span><span>'+pct(x.prompted+x.noConcept,x.n)+'%</span></div>').join('')+
    '</div>';
  }

  function phaseSummary(){
    const cycles=Object.values(state().cycles||{});
    const ids=['diagnose','teach','demonstrate','practise','retrieve1','retrieve2','apply'];
    const labels={diagnose:'Diagnose',teach:'Teach',demonstrate:'Demonstrate',practise:'Practise',retrieve1:'Retrieve',retrieve2:'Retrieve again',apply:'Apply'};
    const counts={};ids.forEach(id=>counts[id]=0);
    cycles.forEach(c=>ids.forEach(id=>{if(c.steps?.[id])counts[id]++}));
    const max=Math.max(1,...ids.map(id=>counts[id]));
    return '<div class="dashboard-phase-grid">'+ids.map((id,i)=>'<div><span>'+esc(labels[id])+'</span><b>'+counts[id]+'</b><i style="height:'+Math.max(counts[id]?12:2,Math.round(counts[id]/max*100))+'%"></i></div>').join('')+'</div>';
  }

  function render(){
    const root=q('#dashboardBody');if(!root)return;
    const rows=filteredResponses(),confidence=confidenceEvents(),total=rows.length;
    const outcome=countBy(rows,'outcome',['fast','hesitant','prompted','noConcept']);
    const prompt=countBy(rows,r=>r.promptLevel||'independent',Object.keys(PROMPT_LABELS));
    const errors=countBy(rows,'errorCode',Object.keys(ERROR_LABELS));
    const conf=countBy(confidence,'confidence',Object.keys(CONFIDENCE_LABELS));
    const times=rows.map(r=>r.responseSeconds).filter(Number.isFinite);
    const independent=rows.filter(r=>(r.promptLevel||'independent')==='independent').length;
    const fastIndependent=rows.filter(r=>r.outcome==='fast'&&(r.promptLevel||'independent')==='independent').length;
    const supported=rows.filter(r=>(r.promptLevel||'independent')!=='independent'||r.outcome==='prompted').length;

    root.innerHTML=
      '<section class="dashboard-kpis">'+
        kpi('◎','Responses',String(total),range==='all'?'all recorded evidence':'selected period','blue')+
        kpi('⚡','Fast + independent',pct(fastIndependent,total)+'%',fastIndependent+' responses','green')+
        kpi('◷','Average response time',fmtSeconds(mean(times)),times.length+' timed responses','teal')+
        kpi('↗','Prompt-free',pct(independent,total)+'%',supported+' needed some support','violet')+
        kpi('☺','Confidence “Got it”',pct(conf.gotit||0,confidence.length)+'%',confidence.length+' confidence checks','amber')+
      '</section>'+
      '<section class="dashboard-grid">'+
        '<article class="dashboard-card wide"><header><div><h3>Learning activity</h3><span>Question-level evidence · last 14 days</span></div></header>'+activityChart(allResponses())+'</article>'+
        '<article class="dashboard-card"><header><div><h3>Response quality</h3><span>Correctness + fluency</span></div></header>'+donut(outcome,total)+'</article>'+
        '<article class="dashboard-card"><header><div><h3>Prompt support</h3><span>How much help was needed</span></div></header>'+barRows(prompt,PROMPT_LABELS,total,'prompt')+'</article>'+
        '<article class="dashboard-card"><header><div><h3>Where answers break down</h3><span>K/C/Q/P/F/R/A classifications</span></div></header>'+barRows(errors,ERROR_LABELS,total,'error')+'</article>'+
        '<article class="dashboard-card"><header><div><h3>Child confidence</h3><span>Self-report, separate from performance</span></div></header>'+barRows(conf,CONFIDENCE_LABELS,confidence.length,'confidence')+'</article>'+
        '<article class="dashboard-card wide"><header><div><h3>Learning-cycle evidence</h3><span>Number of skills with evidence at each stage</span></div></header>'+phaseSummary()+'</article>'+
        '<article class="dashboard-card full"><header><div><h3>Skills at a glance</h3><span>Attempts, fluency, speed and support</span></div></header>'+skillTable(rows)+'</article>'+
      '</section>';
  }

  window.BEYOND100_OPEN_DASHBOARD=openDashboard;
  window.addEventListener('beyond100-evidence-updated',()=>{if(dialog?.open)render()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installButton);else installButton();
})();