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
