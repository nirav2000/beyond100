(()=>{
  const CANDIDATES='[data-note-anchor],section,article,details,[class*="card"],[class*="panel"],[class*="block"],.brand,.sidebar,.sidebar-head,.subject-tabs,.topic-list,.topic-item';
  const IGNORE='[data-note-ignore="true"],.notes-dialog,.annotation-banner,.selection-note-button,.section-nav,footer,script,style';

  function slugify(value=''){
    return String(value).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
  }

  function directHeading(el){
    return el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > summary,:scope > header h1,:scope > header h2,:scope > header h3');
  }

  function sectionKey(el){
    const section=el.closest('.content-section,[id]');
    if(section?.id)return section.id;
    return 'page';
  }

  function autoAnchor(el,index){
    if(el.matches('.brand'))return 'page:brand';
    if(el.matches('.sidebar'))return 'page:topics-sidebar';
    if(el.matches('.subject-tabs'))return 'page:subject-tabs';
    if(el.matches('.topic-list'))return 'page:topic-list';
    if(el.classList.contains('topic-item'))return `catalogue:${slugify(el.dataset.topic||el.textContent)}`;
    if(el.id)return `element:${el.id}`;
    const heading=directHeading(el)?.textContent?.trim();
    if(heading)return `auto:${sectionKey(el)}:${slugify(heading)}`;
    const text=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,90);
    return `auto:${sectionKey(el)}:${slugify(text)||index}`;
  }

  function autoLabel(el){
    if(el.matches('.brand'))return 'Beyond 100 logo / brand';
    if(el.matches('.sidebar'))return 'Topics sidebar';
    if(el.matches('.subject-tabs'))return 'Subject tabs';
    if(el.matches('.topic-list'))return 'Topics list';
    if(el.classList.contains('topic-item'))return `Topic · ${(el.dataset.topic||el.textContent||'').trim()}`;
    const heading=directHeading(el)?.textContent?.trim();
    if(heading)return heading.slice(0,120);
    const aria=el.getAttribute('aria-label');
    if(aria)return aria.slice(0,120);
    return (el.textContent||'Page content').trim().replace(/\s+/g,' ').slice(0,120)||'Page content';
  }

  function useful(el){
    if(el.matches(IGNORE)||el.closest('.notes-dialog'))return false;
    if(el.dataset.noteIgnore==='true')return false;
    if(el.hidden)return false;
    const text=(el.textContent||'').trim();
    if(text.length<12 && !el.matches('details,[data-note-anchor]'))return false;
    return true;
  }

  function annotate(root=document){
    const scope=root===document?document:root;
    [...scope.querySelectorAll(CANDIDATES)].forEach((el,index)=>{
      if(!useful(el))return;
      // Layout-only wrappers can opt into annotating their children without becoming targets themselves.
      if(el.dataset.noteScope==='children')return;
      if(!el.dataset.noteAnchor)el.dataset.noteAnchor=autoAnchor(el,index);
      if(!el.dataset.noteLabel)el.dataset.noteLabel=autoLabel(el);
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;annotate(document)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>annotate(document));else annotate(document);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule);
  window.BEYOND100_AUTO_ANNOTATE=annotate;
})();
