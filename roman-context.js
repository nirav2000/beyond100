const ROMAN_CONTEXT_ID='romanNumeralContext';

function romanContextMarkup(){
  return `
  <div class="topic-context-kid" data-note-anchor="context:roman:writing-system" data-note-label="Roman numerals as a writing system">
    <p class="eyebrow">THE BIG IDEA</p>
    <h2>Roman numerals are a writing system, not an arithmetic expression</h2>
    <p>To write a number, build each part using the allowed Roman forms. For <strong>19</strong>, split it into <strong>10 + 9</strong>. Ten is <strong>X</strong> and nine is <strong>IX</strong>, so 19 is <strong>XIX</strong>. <strong>IXX</strong> is not valid just because you can invent the calculation 20 − 1.</p>
    <div class="kid-example" aria-label="Roman numeral place construction">
      <span><b>1,994</b><small>split by place</small></span><span><b>M</b><small>1,000</small></span><span><b>CM</b><small>900</small></span><span><b>XC</b><small>90</small></span><span><b>IV</b><small>4</small></span>
    </div>
    <p class="muted">Default method: split into thousands | hundreds | tens | ones, write the standard Roman form for each non-zero part, then join them.</p>
  </div>
  <div class="topic-context-panels">
    <details open><summary>The seven symbols</summary><p><strong>I=1, V=5, X=10, L=50, C=100, D=500, M=1,000.</strong> A useful pattern is 1,5,10,50,100,500,1000: the values alternate ×5, ×2, ×5, ×2…</p></details>
    <details><summary>The definitive construction rules</summary><ul>
      <li><strong>Normally descend:</strong> larger symbols come before smaller ones and their values add.</li>
      <li><strong>Repeat only I, X, C, M</strong>, and no more than three times consecutively in the standard school convention.</li>
      <li><strong>Never repeat V, L or D.</strong></li>
      <li><strong>Subtraction is restricted to six pairs:</strong> IV, IX, XL, XC, CD, CM.</li>
      <li>Build each decimal place separately: 49 = 40 + 9 = XL + IX = <strong>XLIX</strong>, not IL.</li>
    </ul></details>
    <details><summary>Trap questions worth discussing</summary><p>Why are <strong>IIV, IIX, IXX, XXL, IL and IC</strong> invalid? The aim is not to memorise that they are wrong, but to identify the exact construction rule each one violates.</p></details>
    <details><summary>Number, numeral and digit</summary><p>A <strong>number</strong> is a value. A <strong>numeral</strong> is a way of writing a number. A <strong>digit</strong> is one symbol used in a numeral. So 19 and XIX are two numerals representing the same number.</p></details>
    <details><summary>History and edge cases</summary><p>Roman notation developed in the ancient Roman world and did not use modern positional place value or a zero placeholder. Historical forms varied. Beyond100 teaches the standard modern school convention. Under that convention, the usual largest form without extended notation is <strong>3,999 = MMMCMXCIX</strong>; overlines and other larger-number conventions are extension material and were not historically uniform.</p></details>
    <details><summary>1729-style exploration</summary><ul>
      <li>What pattern connects IV, XL and CD?</li>
      <li>What pattern connects IX, XC and CM?</li>
      <li>Invent a plausible false Roman-numeral rule and find a counterexample.</li>
      <li>Why did positional notation with zero make written calculation easier?</li>
    </ul></details>
  </div>`;
}

function syncRomanContext(){
  const active=(window.BEYOND100_TOPIC_STATE?.getName?.()||'Place Value & Number Structure')==='Roman Numerals';
  let section=document.getElementById(ROMAN_CONTEXT_ID);
  if(active&&!section){
    const hero=document.querySelector('.hero'); if(!hero)return;
    section=document.createElement('section');
    section.id=ROMAN_CONTEXT_ID; section.className='topic-context';
    section.innerHTML=romanContextMarkup();
    hero.insertAdjacentElement('afterend',section);
  }
  if(section)section.hidden=!active;
}
window.addEventListener('beyond100-topic-rendered',syncRomanContext);
window.addEventListener('beyond100-topic-changed',syncRomanContext);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncRomanContext);else syncRomanContext();
