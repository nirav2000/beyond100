(() => {
  const manifest = window.BEYOND100_RELEASES;
  const releases = manifest.releases;
  const repo = manifest.repository;
  const STORE_KEY = 'beyond100.version-decisions.v1';
  let decisions = loadDecisions();
  const $ = id => document.getElementById(id);

  function loadDecisions(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveDecisions(){
    localStorage.setItem(STORE_KEY, JSON.stringify(decisions));
    renderDecisionSummary();
  }
  function esc(s=''){
    return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function release(version){ return releases.find(r=>r.version===version) || releases[0]; }
  function sourceUrl(r){ return `https://github.com/${repo}/tree/${encodeURIComponent(r.ref)}`; }
  function rawBase(r){ return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(r.ref)}/`; }
  function optionList(selected){ return releases.map(r=>`<option value="${esc(r.version)}" ${r.version===selected?'selected':''}>v${esc(r.version)} · ${esc(r.title)}</option>`).join(''); }

  function renderReleases(){
    $('releaseGrid').innerHTML = releases.map((r,i)=>`
      <article class="release-card ${r.status==='current'?'current':''}">
        <div class="release-meta"><span class="release-version">v${esc(r.version)}</span><span class="release-date">${esc(r.date)}</span></div>
        <h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p>
        <div class="area-tags">${r.areas.map(a=>`<span>${esc(a.title)}</span>`).join('')}</div>
        <div class="release-actions">
          ${i<releases.length-1?`<button class="primary" data-compare="${esc(r.version)}" data-with="${esc(releases[i+1].version)}">Compare</button>`:''}
          <button data-review="${esc(r.version)}">Review changes</button>
          <a href="${sourceUrl(r)}" target="_blank" rel="noopener">Source</a>
        </div>
      </article>`).join('');
    document.querySelectorAll('[data-compare]').forEach(b=>b.onclick=()=>{
      $('leftVersion').value=b.dataset.with;$('rightVersion').value=b.dataset.compare;loadComparison();$('compare').scrollIntoView({behavior:'smooth'});
    });
    document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{
      $('decisionVersion').value=b.dataset.review;renderDecisions();document.querySelector('.decision-section').scrollIntoView({behavior:'smooth'});
    });
  }

  function initControls(){
    $('currentPill').textContent=`Current · v${manifest.currentVersion}`;
    $('leftVersion').innerHTML=optionList(releases[1]?.version||releases[0].version);
    $('rightVersion').innerHTML=optionList(releases[0].version);
    $('decisionVersion').innerHTML=optionList(releases[0].version);
    $('loadCompare').onclick=loadComparison;
    $('swapVersions').onclick=()=>{const a=$('leftVersion').value;$('leftVersion').value=$('rightVersion').value;$('rightVersion').value=a;loadComparison();};
    $('decisionVersion').onchange=renderDecisions;
    $('copyBrief').onclick=copyBrief;
    $('exportDecisions').onclick=exportDecisions;
  }

  async function loadComparison(){
    const left=release($('leftVersion').value),right=release($('rightVersion').value);
    await Promise.all([loadPreview(left,'left'),loadPreview(right,'right')]);
  }

  async function loadPreview(r,side){
    const frame=$(side+'Frame'),title=$(side+'Title'),status=$(side+'Status'),source=$(side+'Source');
    title.textContent=`v${r.version} · ${r.title}`;source.href=sourceUrl(r);status.textContent='Loading working snapshot…';
    frame.removeAttribute('src');frame.srcdoc='<div style="font-family:system-ui;padding:30px;color:#666">Loading version…</div>';
    try{
      if(r.status==='current' && r.ref==='main'){
        frame.removeAttribute('srcdoc');frame.src='./?version-preview=1';status.textContent='Live current version';return;
      }
      const html=await buildSnapshot(r);frame.removeAttribute('src');frame.srcdoc=html;status.textContent='Frozen Git snapshot';
    }catch(e){
      frame.srcdoc=`<div style="font-family:system-ui;padding:30px"><h2>Preview unavailable</h2><p>${esc(e.message||'Could not load this snapshot.')}</p><p><a href="${sourceUrl(r)}" target="_blank">Open its source on GitHub</a></p></div>`;status.textContent='Could not reconstruct preview';
    }
  }

  async function buildSnapshot(r){
    const base=rawBase(r),html=await fetchText(base+'index.html');
    const doc=new DOMParser().parseFromString(html,'text/html');
    const baseEl=doc.createElement('base');baseEl.href=base;doc.head.prepend(baseEl);
    const styleLinks=[...doc.querySelectorAll('link[rel="stylesheet"][href]')].filter(x=>!/^https?:/i.test(x.getAttribute('href')));
    for(const link of styleLinks){
      const href=link.getAttribute('href').split('?')[0];
      const style=doc.createElement('style');style.textContent=await fetchText(base+href);link.replaceWith(style);
    }
    const scripts=[...doc.querySelectorAll('script[src]')].filter(x=>!/^https?:/i.test(x.getAttribute('src')));
    for(const old of scripts){
      const src=old.getAttribute('src').split('?')[0];
      const script=doc.createElement('script');
      if(old.type)script.type=old.type;
      let code=await fetchText(base+src);
      code=code.replace(/<\/script/gi,'<\\/script');
      script.textContent=code;old.replaceWith(script);
    }
    const guard=doc.createElement('script');
    guard.textContent=`window.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&a.href&&a.href.indexOf('github.com')<0){e.preventDefault();}});`;
    doc.body.appendChild(guard);
    return '<!doctype html>'+doc.documentElement.outerHTML;
  }
  async function fetchText(url){
    const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw Error(`Could not load ${url.split('/').pop()} (${r.status})`);return r.text();
  }

  function decisionKey(version,areaId){return `${version}:${areaId}`;}
  function renderDecisions(){
    const r=release($('decisionVersion').value);
    $('decisionList').innerHTML=r.areas.map(a=>{
      const d=decisions[decisionKey(r.version,a.id)]||{};
      return `<article class="decision-card" data-area="${esc(a.id)}">
        <div class="decision-card-head"><div><span class="kind">${esc(a.kind)}</span><h3>${esc(a.title)}</h3></div><span class="saved-mark">${d.updatedAt?'saved':''}</span></div>
        <p>${esc(a.summary)}</p>
        <div class="decision-actions">
          ${['keep','revert','rework','unsure'].map(c=>`<button data-choice="${c}" class="${d.choice===c?'active':''}">${c[0].toUpperCase()+c.slice(1)}</button>`).join('')}
        </div>
        <textarea placeholder="Optional detail: what exactly do you like, dislike or want changed?">${esc(d.note||'')}</textarea>
      </article>`;
    }).join('');
    document.querySelectorAll('.decision-card').forEach(card=>{
      const areaId=card.dataset.area,key=decisionKey(r.version,areaId);
      card.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
        const prior=decisions[key]||{};decisions[key]={...prior,choice:b.dataset.choice,updatedAt:new Date().toISOString()};saveDecisions();renderDecisions();
      });
      let timer;card.querySelector('textarea').oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>{const prior=decisions[key]||{};decisions[key]={...prior,note:e.target.value.trim(),updatedAt:new Date().toISOString()};saveDecisions();card.querySelector('.saved-mark').textContent='saved';},350)};
    });
    renderDecisionSummary();
  }
  function renderDecisionSummary(){
    const r=release($('decisionVersion')?.value||releases[0].version);const ds=r.areas.map(a=>decisions[decisionKey(r.version,a.id)]||{});
    const counts={keep:0,revert:0,rework:0,unsure:0,undecided:0};ds.forEach(d=>counts[d.choice||'undecided']++);
    $('decisionSummary').textContent=`v${r.version}: ${counts.keep} keep · ${counts.revert} revert · ${counts.rework} rework · ${counts.unsure} unsure · ${counts.undecided} undecided.`;
  }

  function developmentBrief(){
    const r=release($('decisionVersion').value),previous=releases[releases.indexOf(r)+1];
    const rows=r.areas.map(a=>({area:a,decision:decisions[decisionKey(r.version,a.id)]||{}}));
    const lines=[
      `Beyond 100 development brief`,
      `Reviewing: v${r.version} · ${r.title}${previous?` against v${previous.version}`:''}`,
      `Generated: ${new Date().toLocaleString('en-GB')}`,
      '',
      ...rows.flatMap(({area,decision})=>[
        `${(decision.choice||'UNDECIDED').toUpperCase()} — ${area.title}`,
        `Change: ${area.summary}`,
        decision.note?`Detail: ${decision.note}`:null,
        ''
      ].filter(Boolean)),
      'Implementation rule:',
      'Preserve all areas marked KEEP. Restore the previous behaviour/design only for areas marked REVERT. Improve only the specified aspect for REWORK. Do not make irreversible choices for UNSURE/UNDECIDED areas without preserving the current implementation.'
    ];
    return lines.join('\n');
  }
  async function copyBrief(){
    const text=developmentBrief();
    try{await navigator.clipboard.writeText(text);const b=$('copyBrief'),old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,1400)}catch{download(text,'beyond100-development-brief.txt','text/plain')}
  }
  function exportDecisions(){download(JSON.stringify({app:'beyond100',exportedAt:new Date().toISOString(),currentVersion:manifest.currentVersion,decisions},null,2),'beyond100-version-decisions.json','application/json')}
  function download(text,name,type){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

  renderReleases();initControls();renderDecisions();loadComparison();
})();
