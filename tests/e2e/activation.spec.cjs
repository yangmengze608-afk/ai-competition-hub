const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('workspace turns a chosen competition into a first real action', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/competitions/iflytek-spark-cup-2026');

  const start = page.locator('[data-start-workspace="iflytek-spark-cup-2026"]');
  await expect(start).toContainText('加入我的参赛');
  await start.click();
  await expect(page).toHaveURL(/#\/workspace\/iflytek-spark-cup-2026/);

  const guide = page.locator('[data-activation-guide-panel]');
  await expect(guide.getByRole('heading', { name: '今天先完成一个真实动作' })).toBeVisible();
  await expect(guide.locator('.activation-guide-action')).toHaveCount(3);

  const downloadPromise = page.waitForEvent('download');
  await guide.locator('[data-activation-calendar]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('截止提醒.ics');

  await guide.locator('[data-activation-focus-task]').click();
  const firstTask = page.locator('[data-workspace-task]').first();
  await expect(firstTask).not.toBeChecked();
  await page.locator('.workspace-task').first().click();

  await expect(page.locator('[data-workspace-task]').first()).toBeChecked();
  await expect(page.locator('[data-activation-guide-panel]').getByRole('heading', { name: '你已经真正启动这场比赛' })).toBeVisible();
  await expect(page.locator('.workspace-progress-card strong')).not.toHaveText('0%');
  expect(errors).toEqual([]);
});
