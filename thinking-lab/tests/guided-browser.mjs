import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[390,844],[1280,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible',timeout:20000});
  await page.locator('#tlTopic').selectOption('geometry');
  await page.locator('#tlTechnique').selectOption('perimeter-invariant');
  assert.equal(await page.locator('#tlGuideOpen').isDisabled(),false,'storyboard should be available');
  await page.locator('#tlGuideOpen').click();
  assert.equal(await page.locator('#tlGuideReveal').isVisible(),false,'do not spoil the prediction');
  assert.match(await page.locator('#tlGuideCounter').innerText(),/Pause 1 of 5/);
  for(let stage=0;stage<5;stage++){
   if(stage>0){
    await page.locator('#tlGuideNext').click();
    assert.equal(await page.locator('#tlGuideReveal').isVisible(),false,'each new pause hides its answer');
    assert.match(await page.locator('#tlGuideCounter').innerText(),new RegExp('Pause '+(stage+1)+' of 5'));
   }
   const a=await page.locator('#tlGuideVisual svg').evaluate(svg=>svg.outerHTML);
   const clean=await page.locator('#tlGuideVisual svg').evaluate(svg=>new XMLSerializer().serializeToString(svg));
   assert.ok(clean.length>250&&a.includes('rect'),'diagram should show structural parts');
   await page.locator('#tlGuideViewB').click();
   assert.equal(await page.locator('#tlGuideViewB').getAttribute('aria-pressed'),'true');
   assert.ok((await page.locator('#tlGuideVisual svg').innerHTML()).length>150);
   await page.locator('#tlGuideViewA').click();
   await page.locator('#tlGuideRevealPart').click();
   assert.equal(await page.locator('#tlGuideReveal').isVisible(),true,'reveal is explicit');
   assert.match(await page.locator('#tlGuideCounter').innerText(),new RegExp('Reveal '+(stage+1)+' of 5'));
  }
  assert.equal(await page.locator('#tlGuideNext').isDisabled(),true);
  await page.locator('#tlChoices button[data-choice="Perimeter only"]').click();
  await page.locator('#tlCheck').click();
  assert.equal(await page.evaluate('window.__labEvents.length'),1);
  const evidence=await page.evaluate('window.__labEvents[0]');
  assert.equal(evidence.outcome,'prompted','guided support must not count as independent');
  assert.ok(evidence.observations.includes('guided-reveals:5'));
  await page.locator('#tlRoleparent').click();
  await page.locator('#tlTechnique').selectOption('perimeter-invariant');
  assert.equal(await page.locator('#tlParent').isVisible(),true);
  await page.locator('#tlGuideOpen').click();
  await page.locator('#tlGuideRevealPart').click();
  await page.locator('#tlReveal').click();
  assert.equal(await page.evaluate('window.__labEvents.length'),1,'parent practice remains separate');
  const overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  assert.ok(overflow<=1,'horizontal overflow at '+width+'px: '+overflow);
  assert.deepEqual(errors,[],errors.join('; '));
  console.log('PASS guided discovery at',width+'x'+height);
  await page.close();
 }
}finally{await browser.close();}
