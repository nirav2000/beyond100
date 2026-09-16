(() => {
  const data=window.BEYOND100_ASSESSMENTS;if(!data)return;
  const root=document.querySelector('#assessmentRoot');if(!root)return;
  const source=data.source;
  let filter='all',activePage=2;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pageMeta=n=>source.pages.find(p=>p.page===Number(n));
  const imageUrl=n=>`assets/assessments/orley-summer-2026/page-${Number(n)}.jpg`;

  function sourceCard(){return `<article class="assessment-source assessment-source-card" data-note-anchor="assessment:source" data-note-label="Assessment source · ${esc(source.title)}">
    <div><p class="eyebrow">UPLOADED WORK SAMPLE</p><h3>${esc(source.title)}</h3><p>${esc(source.subtitle)} · ${esc(source.period)}</p><p class="assessment-note">${esc(source.note)}</p></div>
    <div class="assessment-source-badges"><span>${esc(source.learner)}</span><span>Year 4 → Year 5</span><span>${source.pages.length} scanned pages</span></div>
  </article>`}
  function pageMap(){return `<div class="assessment-page-map">${source.pages.map(p=>`<article class="assessment-page-card" data-note-anchor="assessment:page:${p.page}" data-note-label="Assessment page ${p.page} · ${esc(p.label)}"><span class="assessment-page-number">${p.page}</span><div><strong>${esc(p.label)}</strong><span>${esc(p.topics.join(' · '))}</span></div><button type="button" data-open-page="${p.page}">View</button></article>`).join('')}</div>`}
  function topicOptions(){return `<option value="all">All assessment topics</option>${data.topics.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}`}
  function topicCard(t){
    return `<article class="assessment-topic-card ${esc(t.tone||'')}" data-assessment-id="${esc(t.id)}" data-note-anchor="assessment:topic:${esc(t.id)}" data-note-label="Assessment · ${esc(t.title)}">
      <header class="assessment-card-head"><div><span class="assessment-kicker">${esc(t.yearContext)}</span><h3>${esc(t.title)}</h3></div><span class="assessment-status">${esc(t.status)}</span></header>
      <div class="assessment-card-body"><div>
        <section class="assessment-panel"><h4>What this work shows</h4><ul>${t.evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
        <div class="assessment-judgement"><strong>My assessment</strong><p>${esc(t.assessment)}</p></div>
        <div class="assessment-error-tags" style="margin-top:10px">${(t.likelyErrors||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      </div><div>
        <section class="assessment-panel"><h4>Test next</h4><ol>${t.nextChecks.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>
        <div class="assessment-page-links">${t.pages.map(p=>`<button type="button" data-open-page="${p}">View page ${p}</button>`).join('')}</div>
      </div></div>
    </article>`
  }
  function render(){
    const shown=filter==='all'?data.topics:data.topics.filter(t=>t.id===filter);
    root.innerHTML=`${sourceCard()}<div class="assessment-toolbar"><label>Topic <select id="assessmentTopicFilter">${topicOptions()}</select></label><span class="muted">Use the scanned page alongside the interpretation; the assessment text is deliberately separated from the source evidence.</span></div><div class="section-heading" style="margin-top:24px"><div><p class="eyebrow">SOURCE PAGES</p><h2>Work and answer-key pages</h2></div><p>Open any page full-screen. Page numbers remain attached to every topic assessment so you can jump back to the actual work quickly.</p></div>${pageMap()}<div class="section-heading" style="margin-top:28px"><div><p class="eyebrow">BY TOPIC</p><h2>What the work suggests</h2></div><p>These are working judgements, not standardised scores. Each topic includes the evidence, my interpretation and the next cold checks I would use to confirm or overturn it.</p></div><div class="assessment-topic-list">${shown.map(topicCard).join('')}</div>`;
    const sel=document.querySelector('#assessmentTopicFilter');if(sel){sel.value=filter;sel.onchange=()=>{filter=sel.value;render();}}
    root.querySelectorAll('[data-open-page]').forEach(b=>b.onclick=()=>openPage(Number(b.dataset.openPage)));
    window.dispatchEvent(new CustomEvent('beyond100-assessment-rendered'));
  }
  function ensureDialog(){
    let d=document.querySelector('#assessmentDialog');if(d)return d;
    d=document.createElement('dialog');d.id='assessmentDialog';d.className='assessment-dialog';d.innerHTML=`<header class="assessment-dialog-head"><div><strong id="assessmentDialogTitle">Assessment page</strong><span id="assessmentDialogLabel"></span></div><button type="button" id="closeAssessmentDialog" aria-label="Close">×</button></header><div class="assessment-image-wrap"><img id="assessmentDialogImage" alt="Scanned assessment page"></div><div class="assessment-dialog-nav"><button type="button" id="assessmentPrev">← Previous</button><span id="assessmentPageCount"></span><button type="button" id="assessmentNext">Next →</button></div>`;document.body.appendChild(d);
    d.querySelector('#closeAssessmentDialog').onclick=()=>d.close();d.addEventListener('cancel',()=>d.close());d.querySelector('#assessmentPrev').onclick=()=>openPage(Math.max(1,activePage-1));d.querySelector('#assessmentNext').onclick=()=>openPage(Math.min(source.pages.length,activePage+1));return d;
  }
  function openPage(n){
    activePage=Math.min(source.pages.length,Math.max(1,n));const d=ensureDialog(),m=pageMeta(activePage);d.querySelector('#assessmentDialogTitle').textContent=`Assessment page ${activePage}`;d.querySelector('#assessmentDialogLabel').textContent=m?.label||'';d.querySelector('#assessmentDialogImage').src=imageUrl(activePage);d.querySelector('#assessmentDialogImage').alt=`${source.title}, page ${activePage}: ${m?.label||''}`;d.querySelector('#assessmentPageCount').textContent=`${activePage} / ${source.pages.length}`;d.querySelector('#assessmentPrev').disabled=activePage===1;d.querySelector('#assessmentNext').disabled=activePage===source.pages.length;if(!d.open)d.showModal();
  }
  render();
})();