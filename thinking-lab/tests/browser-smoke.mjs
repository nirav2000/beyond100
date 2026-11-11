import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[390,844],[1280,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1&source=dol&number=84&technique=double-half',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible',timeout:20000});
  const dialog=page.locator('#thinkingLabDialog');
  assert.equal(await dialog.evaluate(el=>el.open),true,'Deep link opens the full-screen dialog');
  assert.equal(await page.locator('#thinking-lab').evaluate(el=>el.closest('dialog')?.id),'thinkingLabDialog','Lab is outside crowded syllabus content');
  const dimensions=await page.evaluate(()=>{
   const dialog=document.querySelector('#thinkingLabDialog');
   const rect=dialog.getBoundingClientRect();
   const scroller=document.querySelector('#thinkingLabScroll');
   return {width:rect.width,height:rect.height,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollOverflow:scroller.scrollWidth-scroller.clientWidth};
  });
  assert.ok(Math.abs(dimensions.width-dimensions.viewportWidth)<=2,'Dialog fills viewport width');
  assert.ok(Math.abs(dimensions.height-dimensions.viewportHeight)<=3,'Dialog fills viewport height');
  assert.ok(dimensions.scrollOverflow<=2,'No horizontal overflow in dialog scroll area');
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
  const topicBefore=await page.locator('#tlTopic').inputValue();
  await page.locator('#closeThinkingLab').click();
  assert.equal(await dialog.evaluate(el=>el.open),false,'Close button dismisses the full-screen dialog');
  assert.equal(await page.locator('#tlPrompt').isVisible(),false,'Lab content is hidden after closing');
  await page.locator('#openThinkingLab').click();
  assert.equal(await dialog.evaluate(el=>el.open),true,'Lab opens again without rebuilding');
  assert.equal(await page.locator('#tlTopic').inputValue(),topicBefore,'Topic selection remains intact');
  assert.equal(await page.locator('#tlCompleted').innerText(),'1','Practice summary is retained');
  assert.equal(await page.locator('#tlRoleparent').getAttribute('aria-pressed'),'true','Selected profile survives close/reopen');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate(el=>el.open),false,'Escape dismisses native modal');
  const overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  assert.ok(overflow<=1,'horizontal overflow at '+width+': '+overflow);
  assert.deepEqual(errors,[],'browser page errors: '+errors.join(', '));
  console.log('PASS browser viewport',width+'x'+height);
  await page.close();
 }
}finally{await browser.close();}
