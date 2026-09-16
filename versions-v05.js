(() => {
  const manifest=window.BEYOND100_RELEASES,releases=manifest.releases,repo=manifest.repository;
  const DECISION_KEY='beyond100.version-decisions.v1',NOTE_KEY='beyond100.version-comparison-notes.v1';
  let decisions=load(DECISION_KEY,{}),comparisonNotes=load(NOTE_KEY,[]);
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function load(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
  function saveDecisions(){localStorage.setItem(DECISION_KEY,JSON.stringify(decisions));renderDecisionSummary()}
  function saveNotes(){localStorage.setItem(NOTE_KEY,JSON.stringify(comparisonNotes));renderComparisonNotes()}
  const release=v=>releases.find(r=>r.version===v)||releases[0];
  const sourceUrl=r=>`https://github.com/${repo}/tree/${encodeURIComponent(r.ref)}`;
  const rawBase=r=>`https://raw.githubusercontent.com/${repo}/${encodeURIComponent(r.ref)}/`;
  const optionList=selected=>releases.map(r=>`<option value="${esc(r.version)}" ${r.version===selected?'selected':''}>v${esc(r.version)} · ${esc(r.title)}</option>`).join('');
  const pairVersions=()=>[$('leftVersion').value,$('rightVersion').value];
  const samePair=(note,a,b)=>new Set(note.versions||[]).size===new Set([a,b]).size&&(note.versions||[]).includes(a)&&(note.versions||[]).includes(b);

  function renderReleases(){
    $('releaseGrid').innerHTML=releases.map((r,i)=>`<article class="release-card ${r.status==='current'?'current':''}"><div class="release-meta"><span class="release-version">v${esc(r.version)}</span><span class="release-date">${esc(r.date)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><div class="area-tags">${r.areas.map(a=>`<span>${esc(a.title)}</span>`).join('')}</div><div class="release-actions">${i<releases.length-1?`<button class="primary" data-compare="${esc(r.version)}" data-with="${esc(releases[i+1].version)}">Compare</button>`:''}<button data-review="${esc(r.version)}">Review changes</button><a href="${sourceUrl(r)}" target="_blank" rel="noopener">Source</a></div></article>`).join('');
    document.querySelectorAll('[data-compare]').forEach(b=>b.onclick=()=>{$('leftVersion').value=b.dataset.with;$('rightVersion').value=b.dataset.compare;loadComparison();$('compare').scrollIntoView({behavior:'smooth'})});
    document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{$('decisionVersion').value=b.dataset.review;renderDecisions();document.querySelector('.decision-section').scrollIntoView({behavior:'smooth'})});
  }
  function initControls(){
    $('currentPill').textContent=`Current · v${manifest.currentVersion}`;
    $('leftVersion').innerHTML=optionList(releases[1]?.version||releases[0].version);$('rightVersion').innerHTML=optionList(releases[0].version);$('decisionVersion').innerHTML=optionList(releases[0].version);
    $('loadCompare').onclick=loadComparison;$('swapVersions').onclick=()=>{const a=$('leftVersion').value;$('leftVersion').value=$('rightVersion').value;$('rightVersion').value=a;loadComparison()};
    $('leftVersion').onchange=refreshPairUi;$('rightVersion').onchange=refreshPairUi;$('decisionVersion').onchange=renderDecisions;$('copyBrief').onclick=copyBrief;$('exportDecisions').onclick=exportDecisions;$('addComparisonNote').onclick=addComparisonNote;
    refreshPairUi();
  }
  function refreshPairUi(){
    const [l,r]=pairVersions(),focus=$('comparisonNoteFocus');if(focus)focus.innerHTML=`<option value="general">Both / general</option><option value="${esc(l)}">v${esc(l)}</option><option value="${esc(r)}">v${esc(r)}</option>`;renderComparisonNotes();
  }
  async function loadComparison(){const left=release($('leftVersion').value),right=release($('rightVersion').value);refreshPairUi();await Promise.all([loadPreview(left,'left'),loadPreview(right,'right')])}
  async function loadPreview(r,side){
    const frame=$(side+'Frame'),title=$(side+'Title'),status=$(side+'Status'),source=$(side+'Source');title.textContent=`v${r.version} · ${r.title}`;source.href=sourceUrl(r);status.textContent='Loading working snapshot…';frame.removeAttribute('src');frame.srcdoc='<div style="font-family:system-ui;padding:30px;color:#666">Loading version…</div>';
    try{if(r.status==='current'&&r.ref==='main'){frame.removeAttribute('srcdoc');frame.src='./?version-preview=1';status.textContent='Live current version';return}const html=await buildSnapshot(r);frame.removeAttribute('src');frame.srcdoc=html;status.textContent='Frozen Git snapshot'}catch(e){frame.srcdoc=`<div style="font-family:system-ui;padding:30px"><h2>Preview unavailable</h2><p>${esc(e.message||'Could not load this snapshot.')}</p><p><a href="${sourceUrl(r)}" target="_blank">Open its source on GitHub</a></p></div>`;status.textContent='Could not reconstruct preview'}
  }
  function bridgeCode(){return `(()=>{let applying=false,last=-1;const ratio=()=>{const d=document.documentElement,m=Math.max(0,d.scrollHeight-innerHeight);return m?Math.max(0,Math.min(1,scrollY/m)):0};let f=0;addEventListener('scroll',()=>{cancelAnimationFrame(f);f=requestAnimationFrame(()=>{if(applying)return;const r=ratio();if(Math.abs(r-last)<.001)return;last=r;parent.postMessage({type:'beyond100-preview-scroll',ratio:r},'*')})},{passive:true});addEventListener('message',e=>{const m=e.data;if(!m||m.type!=='beyond100-set-scroll'||typeof m.ratio!=='number')return;const d=document.documentElement,max=Math.max(0,d.scrollHeight-innerHeight);applying=true;scrollTo(0,max*Math.max(0,Math.min(1,m.ratio)));last=m.ratio;setTimeout(()=>applying=false,70)});parent.postMessage({type:'beyond100-preview-ready'},'*')})();`}
  async function buildSnapshot(r){
    const base=rawBase(r),html=await fetchText(base+'index.html'),doc=new DOMParser().parseFromString(html,'text/html'),baseEl=doc.createElement('base');baseEl.href=base;doc.head.prepend(baseEl);
    const styles=[...doc.querySelectorAll('link[rel="stylesheet"][href]')].filter(x=>!/^https?:/i.test(x.getAttribute('href')));for(const link of styles){const href=link.getAttribute('href').split('?')[0],style=doc.createElement('style');style.textContent=await fetchText(base+href);link.replaceWith(style)}
    const scripts=[...doc.querySelectorAll('script[src]')].filter(x=>!/^https?:/i.test(x.getAttribute('src')));for(const old of scripts){const src=old.getAttribute('src').split('?')[0],script=doc.createElement('script');if(old.type)script.type=old.type;let code=await fetchText(base+src);code=code.replace(/<\/script/gi,'<\\/script');script.textContent=code;old.replaceWith(script)}
    const guard=doc.createElement('script');guard.textContent=`window.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&a.href&&a.href.indexOf('github.com')<0){e.preventDefault();}});${bridgeCode()}`;doc.body.appendChild(guard);return '<!doctype html>'+doc.documentElement.outerHTML;
  }
  async function fetchText(url){const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw Error(`Could not load ${url.split('/').pop()} (${r.status})`);return r.text()}

  addEventListener('message',e=>{
    if(!$('syncScroll')?.checked||e.data?.type!=='beyond100-preview-scroll'||typeof e.data.ratio!=='number')return;
    const left=$('leftFrame'),right=$('rightFrame');let target=null;if(e.source===left.contentWindow)target=right;else if(e.source===right.contentWindow)target=left;if(target?.contentWindow)target.contentWindow.postMessage({type:'beyond100-set-scroll',ratio:e.data.ratio},'*');
  });

  function addComparisonNote(){
    const text=$('comparisonNoteText').value.trim();if(!text)return;$('comparisonNoteText').value='';const [left,right]=pairVersions();comparisonNotes.push({id:crypto.randomUUID(),versions:[left,right],focus:$('comparisonNoteFocus').value,text,createdAt:new Date().toISOString()});saveNotes();
  }
  function renderComparisonNotes(){
    const list=$('comparisonNoteList');if(!list)return;const [l,r]=pairVersions(),notes=comparisonNotes.filter(n=>samePair(n,l,r)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    list.innerHTML=notes.length?notes.map(n=>`<article class="comparison-note" data-id="${esc(n.id)}"><div class="comparison-note-top"><span>${n.focus==='general'?'Both versions':`v${esc(n.focus)}`} · ${new Date(n.createdAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span><button type="button" data-remove-note="${esc(n.id)}">Remove</button></div><p>${esc(n.text)}</p></article>`).join(''):'<div class="comparison-note" style="color:#70766f;font-size:12px">No notes for this pair yet. Add anything you want changed while the two versions are in front of you.</div>';
    list.querySelectorAll('[data-remove-note]').forEach(b=>b.onclick=()=>{comparisonNotes=comparisonNotes.filter(n=>n.id!==b.dataset.removeNote);saveNotes()});
  }

  const decisionKey=(v,a)=>`${v}:${a}`;
  function renderDecisions(){
    const r=release($('decisionVersion').value);$('decisionList').innerHTML=r.areas.map(a=>{const d=decisions[decisionKey(r.version,a.id)]||{};return `<article class="decision-card" data-area="${esc(a.id)}"><div class="decision-card-head"><div><span class="kind">${esc(a.kind)}</span><h3>${esc(a.title)}</h3></div><span class="saved-mark">${d.updatedAt?'saved':''}</span></div><p>${esc(a.summary)}</p><div class="decision-actions">${['keep','revert','rework','unsure'].map(c=>`<button data-choice="${c}" class="${d.choice===c?'active':''}">${c[0].toUpperCase()+c.slice(1)}</button>`).join('')}</div><textarea placeholder="What exactly do you like, dislike or want changed?">${esc(d.note||'')}</textarea></article>`}).join('');
    document.querySelectorAll('.decision-card').forEach(card=>{const areaId=card.dataset.area,key=decisionKey(r.version,areaId);card.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{decisions[key]={...(decisions[key]||{}),choice:b.dataset.choice,updatedAt:new Date().toISOString()};saveDecisions();renderDecisions()});let timer;card.querySelector('textarea').oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>{decisions[key]={...(decisions[key]||{}),note:e.target.value.trim(),updatedAt:new Date().toISOString()};saveDecisions();card.querySelector('.saved-mark').textContent='saved'},350)}});renderDecisionSummary();
  }
  function renderDecisionSummary(){const r=release($('decisionVersion')?.value||releases[0].version),ds=r.areas.map(a=>decisions[decisionKey(r.version,a.id)]||{}),counts={keep:0,revert:0,rework:0,unsure:0,undecided:0};ds.forEach(d=>counts[d.choice||'undecided']++);$('decisionSummary').textContent=`v${r.version}: ${counts.keep} keep · ${counts.revert} revert · ${counts.rework} rework · ${counts.unsure} unsure · ${counts.undecided} undecided.`}
  function developmentBrief(){
    const r=release($('decisionVersion').value),previous=releases[releases.indexOf(r)+1],rows=r.areas.map(a=>({area:a,decision:decisions[decisionKey(r.version,a.id)]||{}})),notes=comparisonNotes.filter(n=>(n.versions||[]).includes(r.version));
    return [`Beyond 100 development brief`,`Reviewing: v${r.version} · ${r.title}${previous?` against v${previous.version}`:''}`,`Generated: ${new Date().toLocaleString('en-GB')}`,'',...rows.flatMap(({area,decision})=>[`${(decision.choice||'UNDECIDED').toUpperCase()} — ${area.title}`,`Change: ${area.summary}`,decision.note?`Detail: ${decision.note}`:null,''].filter(Boolean)),notes.length?'FREE-FORM COMPARISON NOTES':null,...notes.flatMap(n=>[`v${n.versions.join(' ↔ v')} · ${n.focus==='general'?'both':`focus v${n.focus}`}`,n.text,'']), 'Implementation rule:','Preserve all areas marked KEEP. Restore previous behaviour/design only for REVERT. Improve only the specified aspect for REWORK. Treat free-form comparison notes as explicit change requests unless they conflict with a KEEP decision.'].filter(Boolean).join('\n');
  }
  async function copyBrief(){const text=developmentBrief();try{await navigator.clipboard.writeText(text);const b=$('copyBrief'),old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,1400)}catch{download(text,'beyond100-development-brief.txt','text/plain')}}
  function exportDecisions(){download(JSON.stringify({app:'beyond100',exportedAt:new Date().toISOString(),currentVersion:manifest.currentVersion,decisions,comparisonNotes},null,2),'beyond100-version-review.json','application/json')}
  function download(text,name,type){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

  renderReleases();initControls();renderDecisions();loadComparison();
})();