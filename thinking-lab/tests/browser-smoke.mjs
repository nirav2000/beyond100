import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[390,844],[1280,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1&source=dol&number=84&technique=double-half',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#tlTechnique').inputValue(),'double-half');
  assert.equal(await page.locator('#tlFactor').isVisible(),true,'Dol factor context should open');
  await page.locator('#tlFactorTest').selectOption('7');
  assert.match(await page.locator('#tlFactorResult').innerText(),/7 x 12 = 84/);
  await page.locator('#tlTopic').selectOption('patterns');
  await page.locator('#tlChoices button[data-choice="Even"]').click();
  await page.locator('#tlCheck').click();
  assert.equal(await page.locator('#tlSolution').isVisible(),true);
  assert.equal(await page.evaluate('window.__labEvents.length'),1);
  await page.locator('#tlRoleparent').click();
  assert.equal(await page.locator('#tlParent').isVisible(),true);
  await page.locator('#tlReveal').click();
  assert.equal(await page.evaluate('window.__labEvents.length'),1,'Parent rehearsals cannot enter learner evidence');
  await page.locator('#tlShow').click();
  assert.equal(await page.locator('#tlDiagram svg').count(),1);
  assert.equal(await page.locator('#tlCompleted').innerText(),'1');
  const overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  assert.ok(overflow<=1,'horizontal overflow at '+width+': '+overflow);
  assert.deepEqual(errors,[],'browser page errors: '+errors.join(', '));
  console.log('PASS browser viewport',width+'x'+height);
  await page.close();
 }
}finally{await browser.close();}
