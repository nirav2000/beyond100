import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const drag=async(page,selector,deltaX,deltaY=0)=>{
 const node=page.locator(selector).first(),box=await node.boundingBox();
 assert.ok(box,'Missing drag handle '+selector);
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.move(x,y);
 await page.mouse.down();
 await page.mouse.move(x+deltaX,y+deltaY,{steps:9});
 await page.mouse.up();
};
try{
 for(const [width,height] of [[390,844],[820,1180],[1280,900]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8877/thinking-lab/tests/fixture.html?lab=1&technique=balance-add',{waitUntil:'load'});
  await page.locator('#tlPrompt').waitFor({state:'visible'});
  const prompt=await page.locator('#tlPrompt').innerText();
  assert.match(prompt,/compare .* \+ .* and .* \+ /);
  const nums=prompt.match(/(\d+) \+ (\d+) and (\d+) \+ (\d+)/);
  assert.ok(nums,'Missing compensation example');
  assert.equal(Number(nums[3])-Number(nums[1]),1,'foundations must start with a transfer of one');
  assert.equal(Number(nums[2])-Number(nums[4]),1);
  await page.locator('#tlGuideOpen').click();
  const svgA=await page.locator('#tlGuideVisual svg').innerHTML();
  assert.ok(svgA.includes('Before'));
  assert.ok(!svgA.includes('After'),'Pause 1 must not show the final bar');
  assert.ok(!svgA.includes('unchanged whole'),'Equality must not be revealed before thinking');
  await page.locator('#tlGuideViewB').click();
  const svgB=await page.locator('#tlGuideVisual svg').innerHTML();
  assert.notEqual(svgA,svgB,'Alternate model must be visually different');
  assert.ok(svgB.includes('Part A')&&svgB.includes('Part B'));
  await page.locator('#tlGuideViewA').click();
  await page.locator('#tlGuideRevealPart').click();
  await page.locator('#tlGuideNext').click();
  await page.locator('#tlGuideRevealPart').click();
  assert.match(await page.locator('#tlGuideVisual').innerText(),/1 unit/);
  await page.locator('#tlGuideNext').click();
  await page.locator('#tlGuideRevealPart').click();
  assert.match(await page.locator('#tlGuideVisual').innerText(),/After/);
  await page.locator('#tlQuickDetails summary').click();
  assert.equal(await page.locator('#tlQuickDetails').evaluate(el=>el.open),true);
  await page.locator('#tlShow').click();
  const quickA=await page.locator('#tlDiagram').innerHTML();
  assert.equal(await page.locator('#tlViewB').isDisabled(),false);
  await page.locator('#tlViewB').click();
  const quickB=await page.locator('#tlDiagram').innerHTML();
  assert.notEqual(quickA,quickB,'Diagram A/B must show distinct views');
  assert.match(await page.locator('#tlViewB').innerText(),/Number bonds/);

  await page.locator('#tlManipToggle').click();
  assert.equal(await page.locator('#tlManipBody').isVisible(),true);
  const initial=await page.locator('#tlManipStatus').innerText();
  await page.locator('#tlManipPlus').click();
  const after=await page.locator('#tlManipStatus').innerText();
  assert.notEqual(initial,after);
  assert.match(after,/Transferred 1 unit/);
  await drag(page,'#tlManipSvg [data-drag="transfer"]',45);
  assert.equal(await page.locator('#tlManipSvg [data-drag="transfer"]').count(),1);

  await page.locator('#tlManipBody [data-model="rectangle"]').click();
  const rectangleBefore=await page.locator('#tlManipStatus').innerText();
  await drag(page,'#tlManipSvg [data-drag="corner"]',38,25);
  assert.notEqual(await page.locator('#tlManipStatus').innerText(),rectangleBefore);
  const beforeMove=await page.locator('#tlManipSvg [data-drag="move"]').getAttribute('x');
  await drag(page,'#tlManipSvg [data-drag="move"]',24,18);
  const afterMove=await page.locator('#tlManipSvg [data-drag="move"]').getAttribute('x');
  assert.notEqual(beforeMove,afterMove,'Rectangle body must be freely draggable');

  await page.locator('#tlManipBody [data-model="tiles"]').click();
  const tileBefore=await page.locator('#tlManipSvg [data-index="0"]').getAttribute('x');
  await drag(page,'#tlManipSvg [data-index="0"]',45,45);
  const tileAfter=await page.locator('#tlManipSvg [data-index="0"]').getAttribute('x');
  assert.notEqual(tileBefore,tileAfter,'Counter rearrangement should change position');

  await page.locator('#tlManipBody [data-model="fraction"]').click();
  const frac=await page.locator('#tlManipStatus').innerText();
  await page.locator('#tlManipMore').click();
  assert.notEqual(await page.locator('#tlManipStatus').innerText(),frac);
  await page.locator('#tlManipBody [data-model="angle"]').click();
  await page.locator('#tlManipPlus').click();
  assert.match(await page.locator('#tlManipStatus').innerText(),/angle/);
  await page.locator('#tlManipBody [data-model="numberline"]').click();
  await page.locator('#tlManipMore').click();
  assert.match(await page.locator('#tlManipStatus').innerText(),/Point at 50/);

  await page.locator('#tlChoices button[data-choice="Equal"]').click();
  assert.match(await page.locator('#tlStatus').innerText(),/not checked yet/);
  await page.locator('#tlCheck').click();
  const evidence=await page.evaluate('window.__labEvents.at(-1)');
  assert.equal(evidence.outcome,'prompted','reveals and manipulatives cannot inflate independent mastery');
  assert.ok(evidence.observations.some(x=>x.startsWith('interactive-model-events:')));

  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#tlPrint section').count(),6);
  assert.equal(await page.locator('#tlPrint').isVisible(),true);
  assert.equal(await page.locator('.section-nav').isVisible(),false);
  assert.equal(await page.locator('#tlPrint .answers').count(),1);
  await page.emulateMedia({media:'screen'});
  const overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  assert.ok(overflow<=2,'Horizontal overflow at '+width+'px = '+overflow);
  assert.deepEqual(errors,[],errors.join(' | '));
  console.log('PASS draggable models, visual reveals, print view at '+width+'x'+height);
  await page.close();
 }
}finally{await browser.close();}
