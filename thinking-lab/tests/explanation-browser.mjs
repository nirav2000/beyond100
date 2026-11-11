import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1&technique=balance-add',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible'});
  assert.equal(await page.locator('#tlExplainAttempt').isVisible(),false,'Do not start language comparison before testing the idea');
  await page.locator('.tl-explain-words summary').click();
  const glossary=await page.locator('#tlExplainWordList').innerText();
  for(const word of ['Describe','Explain','Why?','How?','Justify','Prove'])assert.ok(glossary.includes(word),word);
  await page.locator('[data-pred="same"]').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('#tlCompMove').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('#tlCompAdvance').click();
  await page.locator('[data-use="0"]').click();
  await page.locator('#tlCompCheckUse').click();
  assert.equal(await page.locator('#tlExplainAttempt').isVisible(),true,'Child has completed the application');
  assert.equal(await page.locator('#tlExplainModels').isVisible(),false,'Do not show model answers prematurely');
  await page.locator('#tlExplainCompare').click();
  assert.match(await page.locator('#tlExplainAttemptMessage').innerText(),/BOTH/);
  assert.equal(await page.locator('#tlExplainModels').isVisible(),false);
  await page.locator('#tlExplainMethod').fill('I moved 1 from 21 to 729 and made 730 plus 20.');
  await page.locator('#tlExplainWhy').fill('The total does not change because what one number gains the other loses.');
  await page.locator('#tlExplainEvidence').fill('729 + 21 = 730 + 20 = 750.');
  await page.locator('#tlExplainCompare').click();
  assert.equal(await page.locator('#tlExplainModels').isVisible(),true);
  assert.match(await page.locator('#tlExplainPlain').innerText(),/729.*730.*21.*20/);
  assert.match(await page.locator('#tlExplainFormal').innerText(),/compensation.*addend/i);
  assert.equal(await page.locator('#tlExplainMethod').isEditable(),false);
  await page.locator('#tlExplainVocab button').filter({hasText:'compensation'}).click();
  assert.match(await page.locator('#tlExplainDefinition').innerText(),/same amount/);
  await page.locator('#tlExplainRevision').fill('I used compensation: one addend increases by 1 while the other decreases by 1, so the sum remains 750.');
  await page.locator('#tlExplainCoach input[data-check="described"]').check();
  await page.locator('#tlExplainCoach input[data-check="reason"]').check();
  await page.locator('#tlExplainCoach input[data-check="evidence"]').check();
  await page.locator('#tlExplainImprove').click();
  assert.equal(await page.locator('#tlExplainTransfer').isVisible(),true);
  assert.match(await page.locator('#tlExplainTransferPrompt').innerText(),/38 \+ 197/);
  await page.locator('#tlExplainFirst').fill('35');
  await page.locator('#tlExplainSecond').fill('200');
  await page.locator('#tlExplainTransferWhy').fill('I moved 3 from 38 to 197 so I could add a multiple of 100 while keeping the total.');
  await page.locator('#tlExplainTransferCheck').click();
  assert.match(await page.locator('#tlExplainTransferResult').innerText(),/changed both addends|same|kept the sum unchanged/i);
  const records=await page.evaluate(()=>{
   const pref='beyond100.thinking-lab.v1.';
   return {explanations:JSON.parse(localStorage.getItem(pref+'explanations.learner')||'[]'),
           history:JSON.parse(localStorage.getItem(pref+'history.learner')||'[]'),
           parents:JSON.parse(localStorage.getItem(pref+'explanations.parent')||'[]')};
  });
  assert.equal(records.explanations.length,1,'Learner explanation is saved once and updated in place');
  assert.ok(records.explanations[0].firstDescribe.startsWith('I moved 1'));
  assert.ok(records.explanations[0].firstWhy.startsWith('The total'));
  assert.ok(records.explanations[0].improved.includes('compensation'));
  assert.equal(records.explanations[0].modelSeen,true);
  assert.equal(records.explanations[0].independentStart,true);
  assert.equal(records.explanations[0].transfer.correct,true);
  assert.equal(records.history.length,1,'Revising a written answer must not create more mastered attempts');
  assert.equal(records.history[0].explanationRevised,true);
  assert.equal(records.history[0].explanationTransferCorrect,true);
  assert.equal(records.parents.length,0,'No cross-profile copying');
  await page.locator('#tlRoleparent').click();
  assert.equal(await page.locator('#tlParent').isVisible(),true);
  assert.match(await page.locator('#tlExplainParentRows').innerText(),/First draft|Revised/);
  const review=page.locator('#tlExplainParentRows details').first();
  await review.locator('summary').click();
  await review.locator('select[data-rating="description"]').selectOption('secure');
  await review.locator('select[data-rating="reason"]').selectOption('developing');
  await review.locator('select[data-rating="evidence"]').selectOption('secure');
  await review.locator('select[data-rating="terminology"]').selectOption('developing');
  await review.locator('textarea').fill('Good description, now strengthen the general reason.');
  await review.locator('button').click();
  const reviewed=await page.evaluate(()=>JSON.parse(localStorage.getItem('beyond100.thinking-lab.v1.explanations.learner'))[0]);
  assert.equal(reviewed.parentReview.description,'secure');
  assert.equal(reviewed.parentReview.reason,'developing');
  assert.equal(reviewed.parentReview.evidence,'secure');
  assert.equal(reviewed.parentReview.terminology,'developing');
  assert.match(reviewed.parentReview.note,/general reason/);
  const overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  assert.ok(overflow<=2,'horizontal overflow at '+width+': '+overflow);
  assert.deepEqual(errors,[],'browser errors: '+errors.join('; '));
  console.log('PASS explain-coach browser flow at width '+width);
  await page.close();
 }
}finally{await browser.close();}
