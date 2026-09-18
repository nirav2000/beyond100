(()=> {
  const PREF_KEY='beyond100.sidebar.preference.v1';
  let focusOn=false;
  let focusItems=[];
  let focusIndex=0;
  let autoCollapsed=false;

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  function installSidebarControl(){
    const head=q('.sidebar-head');
    if(!head||q('#toggleSidebarCollapse'))return;
    const b=document.createElement('button');
    b.id='toggleSidebarCollapse';
    b.type='button';
    b.className='icon-button sidebar-collapse-button';
    b.setAttribute('aria-label','Collapse topics');
    b.title='Collapse topics';
    b.textContent='‹';
    head.appendChild(b);
    b.addEventListener('click',()=>{
      const collapsed=!document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem(PREF_KEY,collapsed?'collapsed':'expanded');
      applySidebar(collapsed,false);
    });
  }

  function applySidebar(collapsed,isAuto){
    autoCollapsed=!!isAuto;
    document.body.classList.toggle('sidebar-collapsed',collapsed);
    const b=q('#toggleSidebarCollapse');
    if(b){
      b.textContent=collapsed?'›':'‹';
      b.setAttribute('aria-label',collapsed?'Expand topics':'Collapse topics');
      b.title=collapsed?'Expand topics':'Collapse topics';
    }
  }

  function autoSidebar(){
    if(innerWidth<=980){applySidebar(false,true);return;}
    if(focusOn){applySidebar(true,true);return;}
    const pref=localStorage.getItem(PREF_KEY);
    if(pref==='collapsed'){applySidebar(true,false);return;}
    if(pref==='expanded'){applySidebar(false,false);return;}
    applySidebar(innerWidth<1280,true);
  }

  function installFocusButton(){
    const bar=q('.topbar'),nav=q('#openNav');
    if(!bar||q('#focusModeButton'))return;
    const b=document.createElement('button');
    b.id='focusModeButton';
    b.className='focus-mode-button';
    b.type='button';
    b.innerHTML='<span aria-hidden="true">◉</span><span>Focus</span>';
    b.title='Show one learning block at a time';
    b.addEventListener('click',()=>setFocus(!focusOn));
    bar.insertBefore(b,nav||null);
  }

  function installController(){
    if(q('#focusController'))return;
    const el=document.createElement('div');
    el.id='focusController';
    el.className='focus-controller';
    el.hidden=true;
    el.innerHTML='<button type="button" data-focus-prev aria-label="Previous">←</button><span data-focus-count></span><button type="button" data-focus-next aria-label="Next">Next →</button><button type="button" data-focus-done>Done</button>';
    document.body.appendChild(el);
    q('[data-focus-prev]',el).onclick=()=>move(-1);
    q('[data-focus-next]',el).onclick=()=>move(1);
    q('[data-focus-done]',el).onclick=()=>setFocus(false);
  }

  function candidates(){
    const active=q('.content-section.active');
    const selectors=[
      '#placeValueContext > .topic-context-kid',
      '#placeValueContext .topic-context-panels > details',
      '.stage-card',
      '.mastery-card',
      '.threshold',
      '.misconception',
      '.question-card',
      '.breakdown-focus',
      '.diagnostic-ladder',
      '.mastery-dimensions-panel',
      '.learning-cycle',
      '.half-term-panel',
      '.evidence-log-panel',
      '.assessment-topic',
      '.assessment-card'
    ];
    const context=qa('#placeValueContext > .topic-context-kid,#placeValueContext .topic-context-panels > details');
    const section=active?qa(selectors.slice(2).join(','),active):[];
    const includeContext=!active||active.id==='progression';
    const seen=new Set();
    return [...(includeContext?context:[]),...section].filter(el=>{
      if(seen.has(el)||el.hidden)return false;
      seen.add(el);
      return true;
    });
  }

  function refreshFocus(reset=false){
    if(!focusOn)return;
    const previous=focusItems[focusIndex];
    focusItems=candidates();
    if(reset)focusIndex=0;
    else if(previous){
      const idx=focusItems.indexOf(previous);
      focusIndex=idx>=0?idx:Math.min(focusIndex,Math.max(0,focusItems.length-1));
    }
    showCurrent(false);
  }

  function showCurrent(scroll=true){
    qa('.focus-target-hidden').forEach(el=>el.classList.remove('focus-target-hidden'));
    if(!focusOn)return;
    focusItems=candidates();
    if(!focusItems.length){
      q('#focusController').hidden=true;
      return;
    }
    focusIndex=Math.max(0,Math.min(focusIndex,focusItems.length-1));
    focusItems.forEach((el,i)=>el.classList.toggle('focus-target-hidden',i!==focusIndex));
    const current=focusItems[focusIndex];
    if(current.tagName==='DETAILS')current.open=true;
    const count=q('[data-focus-count]');
    if(count)count.textContent=`${focusIndex+1} / ${focusItems.length}`;
    q('[data-focus-prev]').disabled=focusIndex===0;
    q('[data-focus-next]').disabled=focusIndex===focusItems.length-1;
    q('#focusController').hidden=false;
    if(scroll)current.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function move(delta){
    if(!focusItems.length)return;
    focusIndex=Math.max(0,Math.min(focusItems.length-1,focusIndex+delta));
    showCurrent(true);
  }

  function setFocus(on){
    focusOn=!!on;
    document.body.classList.toggle('focus-mode',focusOn);
    const b=q('#focusModeButton');
    if(b){
      b.classList.toggle('active',focusOn);
      b.setAttribute('aria-pressed',String(focusOn));
      b.querySelector('span:last-child').textContent=focusOn?'Focused':'Focus';
    }
    if(focusOn){
      focusIndex=0;
      applySidebar(innerWidth>980,true);
      refreshFocus(true);
    }else{
      qa('.focus-target-hidden').forEach(el=>el.classList.remove('focus-target-hidden'));
      const controller=q('#focusController');if(controller)controller.hidden=true;
      autoSidebar();
    }
  }

  function watchSections(){
    document.addEventListener('click',e=>{
      if(e.target.closest('.section-nav [data-section]'))setTimeout(()=>refreshFocus(true),80);
      if(e.target.closest('[data-topic]')&&focusOn)setTimeout(()=>refreshFocus(true),80);
    });
    new MutationObserver(()=>{if(focusOn)setTimeout(()=>refreshFocus(false),40)}).observe(q('#main')||document.body,{childList:true,subtree:true});
  }

  function init(){
    installSidebarControl();
    installFocusButton();
    installController();
    autoSidebar();
    watchSections();
    addEventListener('resize',autoSidebar);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();