const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 1366, height: 900 } });

test('Focus child view stays narrow and parent controls do not obscure it', async ({ page }) => {
  page.on('pageerror', err => {
    const msg=String(err.message||err);
    if(!/Firebase|network|fetch|auth/i.test(msg)) throw err;
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#focusModeButton')).toBeVisible();
  await page.locator('#focusModeButton').click();
  await expect(page.locator('[data-launch="diagnostic"]')).toBeVisible();
  await page.locator('[data-launch="diagnostic"]').click();

  await expect(page.locator('#focusCompleteTask')).toBeVisible();
  await expect(page.locator('.focus-v9-confidence')).toHaveCount(0);

  const compactText=await page.locator('.focus-v9-dock-compact').innerText();
  expect(compactText).not.toMatch(/\d+\.\d+s/);
  expect(compactText).toContain('Question in progress');
  expect(compactText).not.toContain('Thinking');

  await page.locator('#focusCompleteTask').click();
  await expect(page.locator('.focus-v9-confidence')).toBeVisible();

  const backgrounds=await page.locator('.focus-v9-confidence-grid button').evaluateAll(btns =>
    btns.map(b=>getComputedStyle(b).backgroundColor)
  );
  expect(new Set(backgrounds).size).toBe(1);

  await page.locator('#focusDockExpand').click();
  await expect(page.locator('.focus-v9-dock.expanded')).toBeVisible();

  const task=await page.locator('.focus-v9-task').boundingBox();
  const dock=await page.locator('.focus-v9-dock.expanded').boundingBox();
  expect(task).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(task.x + task.width).toBeLessThanOrEqual(dock.x + 1);

  const minFont=await page.locator('.focus-v9-outcomes button').evaluateAll(btns =>
    Math.min(...btns.map(b=>parseFloat(getComputedStyle(b).fontSize)))
  );
  expect(minFont).toBeGreaterThanOrEqual(11);
});

test('Notes summary opens expanded and dashboard is available', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#openDashboardButton')).toBeVisible();
  await page.locator('#openDashboardButton').click();
  await expect(page.locator('#learningDashboard')).toHaveJSProperty('open', true);
  await expect(page.locator('.dashboard-kpis')).toBeVisible();
  await page.locator('#closeDashboard').click();

  await expect(page.locator('#notesButton')).toBeVisible({ timeout: 15000 });
  await page.locator('#notesButton').click();
  await expect(page.locator('#notesDialog')).toHaveJSProperty('open', true);
  await expect(page.locator('#notesInsightsPanel')).toHaveJSProperty('open', true);
});

test('Controller pairing never presents a visually blank state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#parentControllerButton')).toBeVisible();
  await page.locator('#parentControllerButton').click();
  await expect(page.locator('#parentPairingDialog')).toHaveJSProperty('open', true);
  await expect(page.locator('#parentPairStatus')).not.toHaveText('');
  await expect(page.locator('#parentPairQr')).not.toBeEmpty();
});

test('Parent controller hidden states do not leak into each other', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/parent.html', { waitUntil: 'domcontentloaded' });
  const hiddenDisplays=await page.locator('[hidden]').evaluateAll(els => els.map(el => getComputedStyle(el).display));
  expect(hiddenDisplays.every(v=>v==='none')).toBeTruthy();
});


test('Place Value remains intact and Roman Numerals switches the reusable topic engine', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#topicTitle')).toHaveText('Place Value & Number Structure');
  await expect(page.locator('#progressionGrid .stage-card')).toHaveCount(7);
  await expect(page.locator('#questionBank .question-card')).toHaveCount(20);
  await expect(page.locator('#placeValueContext')).toBeVisible();

  if (await page.locator('#openNav').isVisible()) await page.locator('#openNav').click();
  await page.locator('[data-topic="Roman Numerals"]').click();
  await expect(page.locator('#topicTitle')).toHaveText('Roman Numerals');
  await expect(page.locator('#romanNumeralContext')).toBeVisible();
  await expect(page.locator('#placeValueContext')).toBeHidden();
  await expect(page.locator('#questionBank .question-card')).toHaveCount(24);
  await expect(page.locator('#questionBank')).toContainText('IXX');

  if (await page.locator('#openNav').isVisible()) await page.locator('#openNav').click();
  await page.locator('[data-topic="Place Value & Number Structure"]').click();
  await expect(page.locator('#topicTitle')).toHaveText('Place Value & Number Structure');
  await expect(page.locator('#placeValueContext')).toBeVisible();
  await expect(page.locator('#questionBank .question-card')).toHaveCount(20);
});

test('Real homepage loads full-screen Maths Thinking Lab and explanation navigation', async ({page})=>{
 const errors=[];
 page.on('pageerror',error=>{if(/thinking-lab|Explanation coach|Maths Thinking Lab/i.test(String(error)))errors.push(String(error));});
 await page.goto('http://127.0.0.1:4173/?lab=1&technique=balance-add',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#openThinkingLab')).toBeAttached({timeout:15000});
 await expect(page.locator('#thinkingLabDialog')).toHaveJSProperty('open',true);
 await expect(page.locator('#tlPrompt')).toBeVisible();
 await expect(page.locator('#tlJourney')).toBeVisible();
 await expect(page.locator('#tlExplainCoach')).toBeAttached();
 await expect(page.locator('#tlExplainModels')).toBeHidden();
 await page.locator('#tlJumpVocabulary').click();
 await expect(page.locator('.tl-explain-words')).toHaveAttribute('open','');
 for(const word of ['Describe','Explain','Why?','How?','Justify','Prove'])await expect(page.locator('#tlExplainWordList')).toContainText(word);
 await page.locator('#tlJumpExplain').click();
 await expect(page.locator('#tlExplainCoach')).toBeVisible();
 await expect(page.locator('#tlExplainGate')).toBeVisible();
 await page.locator('#tlJumpParent').click();
 await expect(page.locator('#tlParent')).toBeVisible();
 await expect(page.locator('#tlExplainParentReview')).toBeVisible();
 await page.locator('#closeThinkingLab').click();
 await expect(page.locator('#thinkingLabDialog')).not.toHaveJSProperty('open',true);
 await expect(page.locator('#launchMathsThinkingLab')).toBeVisible();
 await page.locator('#launchMathsThinkingLab').click();
 await expect(page.locator('#thinkingLabDialog')).toHaveJSProperty('open',true);
 expect(errors).toEqual([]);
});


test('Tense Lab generates the twelve forms, marks first attempts and schedules real delayed reviews', async()=>{
 const {default:m}=await import('../tense-lab/model.mjs');
 expect(m.sentence('play',0,1)).toBe('I was playing the piano.');
 expect(m.form('eat',0,0)).toBe('ate');
 expect(m.form('eat',1,2)).toBe('have eaten');
 expect(m.form('write',2,3)).toBe('will have been writing');
 expect(m.questions(5)).toHaveLength(12);
 for(const k of Object.keys(m.verbs))for(let stage=0;stage<6;stage++)for(const mode of ['practice','review'])for(const day of mode==='review'?[1,3,7]:[0])for(const q of m.questions(stage,mode,day,k)){
  expect(m.mark(q.answer,q)).toBe(true);
  if(q.options){expect(q.options).toContain(q.answer);expect(new Set(q.options).size).toBe(q.options.length)}
 }
 const completed={1:{at:1000,verb:'play'}};
 expect(m.reviews(completed,[],1000+86400000-1).filter(r=>r.ready)).toHaveLength(0);
 expect(m.reviews(completed,[],1000+86400000).filter(r=>r.ready).map(r=>r.day)).toEqual([1]);
 expect(m.reviews(completed,[{stage:1,mode:'review',day:1,complete:true}],1000+86400000).filter(r=>r.ready)).toHaveLength(0);
 expect(m.stats([{mode:'practice',correct:true,hints:1,transfer:true}])).toEqual([100,0,null,0]);
});

test('Tense Lab personal timeline, practice, local evidence and review gating', async({page})=>{
 await page.goto('http://127.0.0.1:4173/?tense=1',{waitUntil:'domcontentloaded'});
 const dialog=page.locator('#tenseLabDialog'),root=dialog.locator('#ttContent');
 await expect(dialog).toHaveJSProperty('open',true);
 await expect(root.getByRole('heading',{name:'When were you born?'})).toBeVisible();
 const today=await page.evaluate(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 await dialog.locator('#ttBirth').fill('2017-01-15');
 await dialog.locator('#ttToday').fill(today);
 await root.getByRole('button',{name:'Put dates on timeline'}).click();
 await expect(root).toContainText('15 Jan 2017');
 await expect(root.locator('#ttDateFeedback')).toContainText('That is today!');
 await root.getByRole('button',{name:'Start practice'}).click();
 await expect(root.locator('#ttDragCard')).toBeVisible();
 const answers=['Past','Present','Future','I was born.','Future'];
 for(let i=0;i<answers.length;i++){
  if(i===0)await root.getByRole('button',{name:'Hint',exact:true}).click();
  await root.getByRole('button',{name:answers[i],exact:true}).click();
  await root.getByRole('button',{name:'Check answer'}).click();
  await expect(root.locator('.tt-feedback')).toContainText('Correct!');
  if(i===0)await root.locator('#ttExplain').fill('It already happened.');
  await root.getByRole('button',{name:i===answers.length-1?'Finish':'Next question',exact:true}).click();
 }
 await expect(root).toContainText('5 of 5 first answers correct');
 await expect(root).toContainText('80%');
 await root.getByRole('button',{name:'Review progress'}).click();
 await expect(root).toContainText('Day 7');
 await expect(root.getByRole('button',{name:'Not due yet'})).toHaveCount(3);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('beyond100.tense-timeline.v1')));
 expect(saved.rows).toHaveLength(5);
 expect(saved.rows[0].explanation).toBe('It already happened.');
 expect(saved.rows[0].hints).toBe(1);
 expect(JSON.stringify(saved)).not.toContain('2017-01-15');
 await expect.poll(async()=>page.evaluate(()=>window.BEYOND100_EVIDENCE?.getState()?.events?.filter(e=>e.source==='tense-timeline'&&e.subject==='English'&&e.topicId==='english-tense-aspect'&&e.phase!=='teach').length||0)).toBe(5);
 await page.evaluate(()=>{const key='beyond100.tense-timeline.v1',s=JSON.parse(localStorage.getItem(key));s.completed[0].at=Date.now()-8*86400000;localStorage.setItem(key,JSON.stringify(s))});
 await page.reload({waitUntil:'domcontentloaded'});
 await dialog.getByRole('button',{name:'Progress & reviews',exact:true}).click();
 await expect(root.getByRole('button',{name:'Start recall'})).toHaveCount(3);
 await root.locator('[data-review="0:7"]').click();
 await expect(root).toContainText('Day 7 recall');
 await root.getByRole('button',{name:'Past',exact:true}).click();
 await root.getByRole('button',{name:'Check answer'}).click();
 await expect(root.locator('.tt-feedback')).toContainText('Answer recorded');
 await expect(root.locator('.tt-feedback')).not.toContainText('Correct!');
});

test('Tense Lab fits a phone, changes only the selected verb form, closes and reopens',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173/?tense=1',{waitUntil:'domcontentloaded'});
 const dialog=page.locator('#tenseLabDialog'),root=dialog.locator('#ttContent');
 await expect(dialog).toHaveJSProperty('open',true);
 await dialog.getByRole('button',{name:'3. Continuous forms',exact:true}).click();
 await expect(root).toContainText('I was playing the piano.');
 await expect(root).toContainText('Long-lasting does not mean continuous');
 await expect(root).toContainText('I was in Year 4.');
 await dialog.locator('#ttVerb').selectOption('eat');
 for(const s of ['I was eating breakfast.','I am eating breakfast.','I will be eating breakfast.'])await expect(root).toContainText(s);
 await expect(root.locator('svg')).toHaveCount(7);
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await dialog.getByRole('button',{name:'6. Tense matching',exact:true}).click();
 await expect(root.locator('table tbody tr')).toHaveCount(4);
 await dialog.locator('#closeTenseLab').click();
 await expect(dialog).not.toHaveJSProperty('open',true);
 await page.locator('#launchTenseLab').click();
 await expect(dialog).toHaveJSProperty('open',true);
 await expect(root).toContainText('All twelve forms');
});
