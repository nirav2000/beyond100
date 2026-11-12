import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const origin='http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1&technique=balance-add';
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto(origin+'&explain=guided',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible'});
  assert.equal(await page.locator('#tlQbNew').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#tlQbCoach').isVisible(),true);
  assert.equal(await page.locator('#tlExplainCoach').isVisible(),false);
  assert.equal(await page.locator('#tlQbWork').isVisible(),false);
  assert.equal(await page.locator('#tlQbGate').isVisible(),true);
  await page.locator('#tlQbCommand').selectOption('Why');
  assert.equal(await page.locator('#tlQbWhyTarget').isVisible(),true);
  assert.match(await page.locator('#tlQbQuestion').innerText(),/easier/i);
  await page.locator('#tlQbWhyTarget').selectOption('unchanged');
  assert.match(await page.locator('#tlQbQuestion').innerText(),/unchanged|stay the same/i);
  await page.locator('#tlQbCommand').selectOption('Explain');
  assert.match(await page.locator('#tlQbQuestion').innerText(),/easier.*total stays the same/i);
  assert.equal(await page.locator('#tlQbWhyTarget').isVisible(),false);

  await page.locator('[data-pred="same"]').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('#tlCompMove').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('[data-use="0"]').click();
  await page.locator('#tlCompCheckUse').click();
  assert.equal(await page.locator('#tlQbWork').isVisible(),true);
  assert.equal(await page.locator('#tlQbModels').isVisible(),false);
  await page.locator('#tlQbFirst').fill('I moved 1 to make a friendly number and kept the same total.');
  await page.locator('#tlQbBreak').click();
  assert.equal(await page.locator('#tlQbFirst').isEditable(),false);
  assert.equal(await page.locator('#tlQbSteps').isVisible(),true);
  assert.match(await page.locator('#tlQbCounter').innerText(),/1 of 5/);
  const answers=[
   '730',
   '730 is a multiple of 10 so I can add the tens without regrouping',
   'moved 1 from 21 to 729 leaving 20',
   'one addend gains 1 and the other loses 1',
   '729 + 21 = 730 + 20 = 750'
  ];
  for(let i=0;i<answers.length;i++){
   assert.match(await page.locator('#tlQbCounter').innerText(),new RegExp((i+1)+' of 5'));
   await page.locator('#tlQbStepAnswer').fill(answers[i]);
   if(i===1){
    await page.locator('#tlQbHint').click();
    assert.match(await page.locator('#tlQbStepHelp').innerText(),/Hint:/);
   }
   await page.locator('#tlQbNext').click();
  }
  assert.equal(await page.locator('#tlQbBuild').isVisible(),true);
  const combined=await page.locator('#tlQbCombined').inputValue();
  assert.match(combined,/because 730 is a multiple of 10/i);
  assert.match(combined,/sum stayed the same because one addend gains 1/i);
  assert.match(combined,/729 \+ 21 = 730 \+ 20 = 750/);
  assert.equal(await page.locator('#tlQbModels').isVisible(),false);
  await page.locator('#tlQbCompare').click();
  assert.equal(await page.locator('#tlQbModels').isVisible(),true);
  assert.match(await page.locator('#tlQbFormal').innerText(),/compensation/i);
  assert.match(await page.locator('#tlQbFormal').innerText(),/multiple of 10/i);
  assert.match(await page.locator('#tlQbFormal').innerText(),/without regrouping/i);
  await page.locator('#tlQbImproved').fill('I used compensation to reach 730, which is a multiple of ten, by moving 1 from 21. The new sum is easier and stays 750 because one addend gains what the other loses.');
  for(const key of ['change','purpose','valid','evidence'])await page.locator('[data-qbcheck="'+key+'"]').check();
  await page.locator('#tlQbSave').click();
  assert.equal(await page.locator('#tlQbTransfer').isVisible(),true);
  assert.match(await page.locator('#tlQbTransferPrompt').innerText(),/38 \+ 197/);
  await page.locator('#tlQbNewA').fill('35');
  await page.locator('#tlQbNewB').fill('200');
  await page.locator('#tlQbTransferWhy').fill('I increased 197 by 3 to reach 200, and decreased the other addend by 3. The sum stays unchanged.');
  await page.locator('#tlQbCheckTransfer').click();
  assert.match(await page.locator('#tlQbTransferMessage').innerText(),/kept the sum unchanged|changed both addends/i);

  // Both approaches stay available, with distinct first answers and no extra maths achievement.
  await page.locator('#tlQbOld').click();
  assert.equal(await page.locator('#tlQbCoach').isVisible(),false);
  assert.equal(await page.locator('#tlExplainCoach').isVisible(),true);
  assert.equal(await page.locator('#tlExplainAttempt').isVisible(),true);
  assert.equal(await page.locator('#tlExplainModels').isVisible(),false);
  await page.locator('#tlExplainMethod').fill('I moved 1 from 21 into 729 so it became 730.');
  await page.locator('#tlExplainWhy').fill('One addend went up and the other down by the same amount.');
  await page.locator('#tlExplainCompare').click();
  assert.equal(await page.locator('#tlExplainModels').isVisible(),true);
  const data=await page.evaluate(()=>{
   const prefix='beyond100.thinking-lab.v1.';
   return {rows:JSON.parse(localStorage.getItem(prefix+'explanations.learner')||'[]'),
    history:JSON.parse(localStorage.getItem(prefix+'history.learner')||'[]'),
    parents:JSON.parse(localStorage.getItem(prefix+'explanations.parent')||'[]')};
  });
  const guided=data.rows.find(row=>row.approach==='guided-breakdown');
  const current=data.rows.find(row=>row.approach!=='guided-breakdown');
  assert.ok(guided&&current,'Both approaches must retain independent answers');
  assert.ok(guided.independentAnswer.startsWith('I moved 1'));
  assert.ok(guided.scaffold.answers.benefit.includes('multiple of 10'));
  assert.equal(guided.scaffold.hints.length,1);
  assert.ok(guided.scaffold.edited.includes('Because')||guided.scaffold.edited.includes('because'));
  assert.equal(guided.transfer.correct,true);
  assert.ok(current.firstDescribe.includes('I moved 1'));
  assert.equal(data.history.length,1,'Do not treat explanatory practice as another completed maths question');
  assert.equal(data.parents.length,0,'Parent practice must remain separate');

  await page.locator('#tlRoleparent').click();
  assert.equal(await page.locator('#tlParent').isVisible(),true);
  const summaries=await page.locator('#tlExplainParentRows > details > summary').allInnerTexts();
  assert.equal(summaries.length,2);
  assert.ok(summaries.some(s=>s.includes('Guided breakdown')));
  assert.ok(summaries.some(s=>s.includes('Current way')));

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,'horizontal overflow at '+width+'px: '+overflow);
  assert.deepEqual(errors,[],errors.join(' | '));
  console.log('PASS question-breakdown A/B at width '+width);
  await page.close();
 }
}finally{await browser.close();}
