const ROMAN_CONTEXT_ID='romanNumeralContext';

function romanContextMarkup(){
  return `
  <div class="topic-context-kid" data-note-anchor="context:roman:writing-system" data-note-label="Roman numerals as a writing system">
    <p class="eyebrow">THE BIG IDEA</p>
    <h2>Roman numerals are a writing system, not an arithmetic expression</h2>
    <p>Roman numerals are a <strong>conventional way of writing numbers</strong>. They are not a free-form calculation. To write a number, first split the ordinary number into its decimal places, then write the <strong>standard Roman chunk for each place</strong> and join the chunks.</p>
    <div class="kid-example" aria-label="Roman numeral place construction">
      <span><b>19</b><small>10 | 9</small></span><span><b>X</b><small>tens chunk</small></span><span><b>IX</b><small>ones chunk</small></span><span><b>XIX</b><small>join them</small></span>
    </div>
    <p><strong>Why not IXX?</strong> You can invent the arithmetic “20 − 1”, but that does not make <strong>IXX</strong> a valid spelling of 19. The standard ones chunk for 9 is <strong>IX</strong>, so 19 is <strong>X + IX = XIX</strong>.</p>
    <div class="roman-place-table" role="table" aria-label="Roman numeral place-value construction table">
      <div role="row" class="roman-place-head"><span role="columnheader">Number</span><span role="columnheader">Thousands</span><span role="columnheader">Hundreds</span><span role="columnheader">Tens</span><span role="columnheader">Ones</span><span role="columnheader">Roman numeral</span></div>
      <div role="row"><span role="cell">19</span><span role="cell">—</span><span role="cell">—</span><span role="cell">10 → X</span><span role="cell">9 → IX</span><span role="cell"><strong>XIX</strong></span></div>
      <div role="row"><span role="cell">49</span><span role="cell">—</span><span role="cell">—</span><span role="cell">40 → XL</span><span role="cell">9 → IX</span><span role="cell"><strong>XLIX</strong></span></div>
      <div role="row"><span role="cell">94</span><span role="cell">—</span><span role="cell">—</span><span role="cell">90 → XC</span><span role="cell">4 → IV</span><span role="cell"><strong>XCIV</strong></span></div>
      <div role="row"><span role="cell">1,994</span><span role="cell">1000 → M</span><span role="cell">900 → CM</span><span role="cell">90 → XC</span><span role="cell">4 → IV</span><span role="cell"><strong>MCMXCIV</strong></span></div>
    </div>
    <p class="muted">This table uses decimal place value as a <em>construction aid</em>. Roman numerals themselves are not a positional place-value system.</p>
  </div>
  <div class="topic-context-panels">
    <details open><summary>Start here: why this is a different writing system</summary><p>We normally write nineteen as <strong>19</strong> using the Hindu–Arabic decimal system. Roman writers used a different set of symbols and conventions. The same number can therefore have different numerals: <strong>19</strong> and <strong>XIX</strong>. Learning Roman numerals is closer to learning the spelling rules of another notation system than solving a subtraction expression.</p><p>This distinction matters when a child argues that <strong>IXX</strong> “equals” 19. The arithmetic interpretation is not the question; the question is whether <strong>IXX</strong> is a valid standard Roman spelling.</p></details>
    <details><summary>The seven symbols and a memory pattern</summary><p><strong>I=1, V=5, X=10, L=50, C=100, D=500, M=1,000.</strong> A useful pattern is 1,5,10,50,100,500,1000: the values alternate ×5, ×2, ×5, ×2…</p></details>
    <details><summary>The place-by-place construction method</summary><ol>
      <li>Write the ordinary number in thousands | hundreds | tens | ones.</li>
      <li>Convert each non-zero place using its standard Roman chunk.</li>
      <li>Join the chunks from largest place to smallest.</li>
      <li>Then check the Roman construction rules.</li>
    </ol><p>For example: <strong>94 = 90 + 4 = XC + IV = XCIV</strong>. This prevents tempting shortcuts such as <strong>IC</strong>.</p></details>
    <details><summary>The definitive construction rules</summary><ul>
      <li><strong>Normally descend:</strong> larger symbols come before smaller ones and their values add.</li>
      <li><strong>Repeat only I, X, C, M</strong>, and no more than three times consecutively in the standard school convention.</li>
      <li><strong>Never repeat V, L or D.</strong></li>
      <li><strong>Subtraction is restricted to six pairs:</strong> IV, IX, XL, XC, CD, CM.</li>
      <li>Build each decimal place separately: 49 = 40 + 9 = XL + IX = <strong>XLIX</strong>, not IL.</li>
    </ul></details>
    <details><summary>Diagnostic: calculation thinking or writing-system thinking?</summary><p>Ask: <strong>“A pupil says IXX is 19 because XX − I = 19. Are they right?”</strong></p><p>If the child defends IXX, do not immediately add more rules. Return to the place table and the idea of a conventional writing system: 19 has tens chunk X and ones chunk IX, so its standard form is XIX. Then retest with 49 (XLIX, not IL) and 99 (XCIX, not IC).</p></details>
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
