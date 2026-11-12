import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:860}});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:8877/thinking-lab/preview.html',{waitUntil:'load'});
  await page.locator('.option a[href*="explain=guided"]').click();
  await page.locator('#tlPrompt').waitFor({state:'visible'});
  assert.equal(await page.locator('#thinkingLabDialog').evaluate(el=>el.open),true);
  assert.equal(await page.locator('#tlQbNew').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#tlQbCoach').isVisible(),true);
  assert.equal(await page.locator('#tlExplainCoach').isVisible(),false);
  await page.locator('#tlQbOld').click();
  assert.equal(await page.locator('#tlExplainCoach').isVisible(),true);
  await page.locator('#closeThinkingLab').click();
  assert.equal(await page.locator('#thinkingLabDialog').evaluate(el=>el.open),false);
  await page.locator('.option a[href*="explain=existing"]').click();
  await page.locator('#tlPrompt').waitFor({state:'visible'});
  assert.equal(await page.locator('#tlQbOld').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors,[],errors.join(' | '));
  console.log('PASS no-login comparison preview at '+width+'px');
  await page.close();
 }
}finally{await browser.close();}
