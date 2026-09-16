const ROOT_ID='placeValueContext';

function mount(){
  if(document.getElementById(ROOT_ID))return;
  const hero=document.querySelector('.hero');
  if(!hero)return;
  const section=document.createElement('section');
  section.id=ROOT_ID;
  section.className='topic-context';
  section.innerHTML=`
    <div class="topic-context-kid">
      <p class="eyebrow">EXPLAIN IT TO A 9-YEAR-OLD</p>
      <h2>Place value is the job a digit is doing</h2>
      <p>Think of the digit <strong>5</strong> as one player who can stand in different positions. In <strong>5</strong> it means five ones. In <strong>50</strong> it means five tens. In <strong>500</strong> it means five hundreds. The digit has not changed — its <em>place</em> has, so its <em>value</em> changes.</p>
      <div class="kid-example" aria-label="Place value example">
        <span><b>5</b><small>5 ones</small></span><span><b>50</b><small>5 tens</small></span><span><b>500</b><small>5 hundreds</small></span><span><b>5,000</b><small>5 thousands</small></span>
      </div>
      <p class="muted">A useful real-life picture: £5, £50 and £500 all contain the digit 5, but you would notice the difference very quickly if someone offered you one of them.</p>
    </div>
    <div class="topic-context-panels">
      <details open><summary>What is place value?</summary><p>Place value is the system that tells us what each digit is worth from where it sits in a number. Moving one place to the left makes a digit worth ten times as much in our decimal system; moving one place right makes it one tenth as much.</p></details>
      <details><summary>Where did it come from?</summary><p>People have used positional number systems for thousands of years. Ancient Babylon used a base-60 place-value system. The decimal place-value system and the use of zero developed in India, then travelled through scholars in the Islamic world and later became widely used in Europe as part of the Hindu–Arabic numeral system.</p></details>
      <details><summary>Why is it useful?</summary><p>Without place value, large numbers would be awkward to write and calculate with. It lets us compare numbers, add and subtract efficiently, multiply and divide by powers of ten, work with money and measurements, understand decimals, and eventually work with scientific notation.</p></details>
      <details><summary>Questions to discuss together</summary><ul><li>Why is the 4 in 4,205 worth more than the 4 in 245?</li><li>What happens to every digit when 3,406 is multiplied by 10?</li><li>Why do we need the zero in 5,007?</li><li>Can you make two different numbers using the same digits but give one digit a much larger value?</li></ul></details>
    </div>`;
  hero.insertAdjacentElement('afterend',section);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
