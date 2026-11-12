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
  assert.match(prompt,/move 1 .*TOTAL change/);
  assert.equal(await page.locator('#tlCompHost').isVisible(),true);
  assert.equal(await page.locator('#tlChoices').isVisible(),false,'Do not repeat the child prediction underneath');
  const introSvg=await page.locator('#tlCompPicture svg').innerHTML();
  assert.ok(introSvg.includes('Before')&&!introSvg.includes('After'),'Show only the initial part-whole model');
  await page.locator('#tlCompCards').click();
  const cardSvg=await page.locator('#tlCompPicture svg').innerHTML();
  assert.notEqual(introSvg,cardSvg,'Alternative view must really change the representation');
  await page.locator('#tlCompBars').click();
  await page.locator('[data-pred="same"]').click();
  assert.equal(await page.locator('#tlCompAdvance').isDisabled(),false);
  await page.locator('#tlCompAdvance').click();
  assert.equal(await page.locator('#tlCompPicture .tl-moving-one').count(),1);
  await drag(page,'#tlCompPicture [data-drag-compensation]',0,32);
  // A native SVG drag can be interrupted by a pointer-capture race in Chromium.
  // Retry a distinct gesture once; still fail if dragging remains broken.
  if((await page.locator('#tlCompAdvance').innerText())==='Move the 1')
   await drag(page,'#tlCompPicture [data-drag-compensation]',42,36);
  assert.equal(await page.locator('#tlCompAdvance').innerText(),'Compare the totals');
  await page.locator('#tlCompAdvance').click();
  assert.match(await page.locator('#tlCompResult').innerText(),/total stays the same|Nothing was added/);
  const record=await page.evaluate('window.__labEvents.at(-1)');
  assert.equal(record.outcome,'prompted');
  assert.equal(record.anchorId,'thinking:balance-add');
  assert.equal(await page.locator('#tlCompleted').innerText(),'1');
  await page.locator('#tlCompAdvance').click();
  assert.equal(await page.locator('#tlCompUse').isVisible(),true);
  await page.locator('[data-use="0"]').click();
  await page.locator('#tlCompCheckUse').click();
  assert.match(await page.locator('#tlCompUseResult').innerText(),/730 \+ 20 = 750/);
  assert.match(await page.locator('#tlCompUsePicture svg').innerHTML(),/Still 750 in total/);

  await page.locator('#tlManipToggle').click();
  assert.equal(await page.locator('#tlManipBody').isVisible(),true);
  const initial=await page.locator('#tlManipStatus').innerText();
  await page.locator('#tlManipPlus').click();
  const after=await page.locator('#tlManipStatus').innerText();
  assert.notEqual(initial,after);
  assert.match(after,/Transferred 1 unit/);
  await drag(page,'#tlManipSvg [data-drag="transfer"]',45);
  assert.equal(await page.locator('#tlManipSvg [data-drag="transfer"]').count(),1);
  if(width===390){
   // Real touch events rather than mouse events in a mobile-sized window.
   const handle=page.locator('#tlManipSvg [data-drag="transfer"]');
   await handle.scrollIntoViewIfNeeded();
   const pos=await handle.boundingBox(),cx=pos.x+pos.width/2,cy=pos.y+pos.height/2;
   const beforeTouch=await page.locator('#tlManipStatus').innerText();
   const cdp=await page.context().newCDPSession(page);
   const finger=(x,y)=>({x,y,radiusX:4,radiusY:4,force:1,id:1});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(cx,cy)]});
   for(let i=1;i<=7;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger(cx+i*5,cy)]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.notEqual(await page.locator('#tlManipStatus').innerText(),beforeTouch,'Touch drag should transfer a different number of units');
  }

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

  const evidence=await page.evaluate('window.__labEvents.at(-1)');
  assert.equal(evidence.outcome,'prompted','guided practice does not inflate independent mastery');
  assert.equal(await page.evaluate('window.__labEvents.length'),1);

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
