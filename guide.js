(()=>{
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const sections=[
    {
      id:'purpose',title:'What Beyond 100 is trying to do',
      html:'<p><strong>Beyond 100 is a parent-guided diagnostic and learning system.</strong> Its job is to find exactly what the learner understands, the first layer where confidence or explanation breaks down, why it breaks down, and whether new learning is retained later.</p><div class="guide-callout">Find the first weak layer → understand why → teach only what is missing → demonstrate understanding → practise → retrieve later → retrieve again → apply somewhere unfamiliar.</div>'
    },
    {
      id:'focus',title:'What Focus mode is for',
      html:'<p>Focus mode should show the child <strong>one small thing to think about</strong> while keeping parent controls available but out of the child’s way. It is not meant to show the whole syllabus card or a worksheet of questions at once.</p><p>The child sees one explanation, example or question. The parent can time, classify the response, record prompting, add a note and decide what happens next.</p>'
    },
    {
      id:'workflow',title:'The natural Focus workflow',
      html:'<ol class="guide-steps"><li><b>Show one question or task.</b><span>No teaching first during diagnosis.</span></li><li><b>Let the child attempt it.</b><span>By default the child reads the question independently.</span></li><li><b>Record question-level evidence.</b><span>Correct + fast, hesitant, prompted, or no concept.</span></li><li><b>If it breaks down, classify why.</b><span>K knowledge · C concept · Q wording · P procedure · F fluency · R reasoning · A attention.</span></li><li><b>Use the prompt ladder only as needed.</b><span>Independent → read aloud → clarify wording → hint → explain.</span></li><li><b>Teach only the missing idea.</b><span>Then ask the learner to demonstrate the idea back.</span></li><li><b>Practise briefly.</b><span>Use varied examples, not endless repetition.</span></li><li><b>Retrieve later.</b><span>Return after a gap and without a reminder.</span></li><li><b>Retrieve again and apply.</b><span>Only then treat the learning as secure.</span></li></ol>'
    },
    {
      id:'diagnostic',title:'How to run a diagnostic',
      html:'<p><strong>Record each question separately.</strong> Do not give one overall result for a six-question diagnostic. Different questions may reveal different weaknesses.</p><p>Ask the child to read the question themselves first. If they cannot answer, use the prompt ladder in order. If simply reading the exact wording aloud fixes the problem, that is different evidence from having to explain the mathematics.</p><p>The response timer auto-starts when each diagnostic question appears. Save the response before moving to the next question.</p>'
    },
    {
      id:'confidence',title:'Child confidence faces',
      html:'<p>The confidence faces are a self-report, not a score. They help compare how secure the learner <em>feels</em> with what they can actually demonstrate.</p><div class="guide-confidence"><span>😄 <b>Got it</b></span><span>🙂 <b>Makes sense</b></span><span>🤔 <b>Half sure</b></span><span>😕 <b>Don’t understand</b></span></div><p>“Got it” is deliberately presented as a normal, comfortable choice rather than a boast or a test answer.</p>'
    },
    {
      id:'phases',title:'What the learning phases mean',
      html:'<dl class="guide-dl"><dt>Diagnose</dt><dd>Find the first fragile layer before teaching.</dd><dt>Teach</dt><dd>Explain or model only what is missing.</dd><dt>Demonstrate</dt><dd>Ask the learner to show or explain the idea back.</dd><dt>Practise</dt><dd>Build accuracy with a few varied examples.</dd><dt>Retrieve</dt><dd>Bring it back later without a reminder.</dd><dt>Retrieve again</dt><dd>Test it again after another gap.</dd><dt>Apply</dt><dd>Use it in unfamiliar wording or context.</dd></dl><p>A completed phase gets a tick and completion time. The glowing phase is the current one. Pale phases are still ahead.</p>'
    },
    {
      id:'parent',title:'Parent controls',
      html:'<dl class="guide-dl"><dt>Timer</dt><dd>Captures hesitation as well as correctness.</dd><dt>Response</dt><dd>Fast / hesitant / prompted / no concept.</dd><dt>Prompt used</dt><dd>Records how much support was needed.</dd><dt>K/C/Q/P/F/R/A</dt><dd>Records the likely reason an answer broke down.</dd><dt>Suggested next step</dt><dd>A cue for what to do next; it is not a score.</dd><dt>Add note</dt><dd>Capture a contextual observation against the current area.</dd></dl>'
    },
    {
      id:'remote',title:'Use another device for parent controls',
      html:'<p>From Focus, choose <strong>Use iPhone</strong>. Beyond 100 shows a QR code plus Share and Copy Link controls. Scan the QR or open the link on the second device; no additional Firebase login is required.</p><p>The controller key is paired to Sai’s Beyond 100 learner profile rather than to one Focus session, so the same QR/link works again in future sessions. It has no automatic expiry. It stops working only when you choose <strong>Disconnect controller</strong> in the app, which revokes the old key and requires a new QR/link.</p><p>Keep the controller link private: anyone who has it can use the parent Focus controls until it is revoked.</p>'
    },
    {
      id:'sections',title:'What the main app sections are for',
      html:'<dl class="guide-dl"><dt>Progression</dt><dd>See how a topic develops from earlier foundations through later years.</dd><dt>Diagnose</dt><dd>Cold questions designed to find the first fragile layer.</dd><dt>Mastery</dt><dd>What secure understanding looks like beyond getting a worksheet right.</dd><dt>Misconceptions</dt><dd>Deliberate probes for hidden or brittle understanding.</dd><dt>Questions</dt><dd>A bank of direct, explanation and reasoning prompts.</dd><dt>Assessment evidence</dt><dd>Sai’s actual work, kept separate from the curriculum expectation.</dd><dt>Evidence plan</dt><dd>Longitudinal evidence: retention, prompting, fluency, language load and patterns over time.</dd></dl>'
    }
  ];

  function renderDialog(){
    if(q('#beyondGuide'))return q('#beyondGuide');
    const d=document.createElement('dialog');
    d.id='beyondGuide';d.className='guide-dialog';d.dataset.noteIgnore='true';
    d.innerHTML='<div class="guide-shell">'+
      '<header class="guide-head"><div><p class="eyebrow">BEYOND 100</p><h2>How the app works</h2></div><button id="closeBeyondGuide" type="button" aria-label="Close guide">×</button></header>'+
      '<div class="guide-layout"><nav class="guide-nav">'+sections.map((s,i)=>'<button type="button" data-guide-target="'+s.id+'" class="'+(i===0?'active':'')+'">'+esc(s.title)+'</button>').join('')+'</nav>'+
      '<main class="guide-content">'+sections.map(s=>'<section id="guide-'+s.id+'" data-guide-section><h3>'+esc(s.title)+'</h3>'+s.html+'</section>').join('')+'</main></div>'+
    '</div>';
    document.body.appendChild(d);
    q('#closeBeyondGuide',d).addEventListener('click',()=>d.close());
    d.addEventListener('click',e=>{if(e.target===d)d.close()});
    q('.guide-nav',d).addEventListener('click',e=>{
      const b=e.target.closest('[data-guide-target]');if(!b)return;
      q('.guide-nav .active',d)?.classList.remove('active');b.classList.add('active');
      q('#guide-'+CSS.escape(b.dataset.guideTarget),d)?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    return d;
  }

  function openGuide(section='purpose'){
    const d=renderDialog();
    if(!d.open)d.showModal();
    setTimeout(()=>{
      const target=q('#guide-'+CSS.escape(section),d);
      target?.scrollIntoView({block:'start'});
      qaSafe('.guide-nav button',d).forEach(b=>b.classList.toggle('active',b.dataset.guideTarget===section));
    },30);
  }
  function qaSafe(s,r=document){return Array.from(r.querySelectorAll(s))}

  function installButton(){
    const bar=q('.topbar'),nav=q('#openNav');if(!bar||q('#openGuideButton'))return;
    const b=document.createElement('button');
    b.id='openGuideButton';b.type='button';b.className='guide-top-button';b.title='How Beyond 100 works';
    b.innerHTML='<span>?</span><span>Guide</span>';
    b.addEventListener('click',()=>openGuide('purpose'));
    bar.insertBefore(b,nav||null);
  }

  window.BEYOND100_OPEN_GUIDE=openGuide;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installButton);else installButton();
})();