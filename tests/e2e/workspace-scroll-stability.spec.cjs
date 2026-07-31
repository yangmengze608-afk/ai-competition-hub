const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('checking a workspace task does not visibly jump or rebuild the workspace', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/#/competitions/iflytek-spark-cup-2026');
  await page.locator('[data-start-workspace="iflytek-spark-cup-2026"]').click();
  await expect(page).toHaveURL(/#\/workspace\/iflytek-spark-cup-2026/);
  await expect(page.locator('[data-activation-guide-panel]').getByRole('heading', { name: '今天先完成一个真实动作' })).toBeVisible();
  await page.waitForTimeout(100);

  const firstRow = page.locator('.workspace-task').first();
  await firstRow.evaluate((row) => row.scrollIntoView({ block: 'center', behavior: 'auto' }));
  await page.waitForTimeout(80);

  await page.evaluate(() => {
    const checkbox = document.querySelector('[data-workspace-task]');
    window.__workspaceTasksNode = document.querySelector('.workspace-tasks');
    window.__workspacePageNode = document.querySelector('[data-workspace-page]');
    window.__workspaceTaskId = checkbox?.dataset.workspaceTask || '';
    window.__workspaceTaskSamples = [];
    window.__workspaceTaskSampling = true;
    const sample = () => {
      const id = window.__workspaceTaskId;
      const escaped = window.CSS?.escape ? window.CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
      const row = document.querySelector(`[data-workspace-task="${escaped}"]`)?.closest('.workspace-task');
      if (row) window.__workspaceTaskSamples.push(row.getBoundingClientRect().top);
      if (window.__workspaceTaskSampling) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await firstRow.click();
  await expect(page.locator('[data-activation-guide-panel]').getByRole('heading', { name: '你已经真正启动这场比赛' })).toBeVisible();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    window.__workspaceTaskSampling = false;
    const samples = window.__workspaceTaskSamples || [];
    const id = window.__workspaceTaskId || '';
    const escaped = window.CSS?.escape ? window.CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
    const checkbox = document.querySelector(`[data-workspace-task="${escaped}"]`);
    return {
      checked: Boolean(checkbox?.checked),
      sameTasksNode: window.__workspaceTasksNode === document.querySelector('.workspace-tasks'),
      samePageNode: window.__workspacePageNode === document.querySelector('[data-workspace-page]'),
      samples,
      range: samples.length ? Math.max(...samples) - Math.min(...samples) : Infinity,
    };
  });

  expect(result.checked).toBe(true);
  expect(result.sameTasksNode).toBe(true);
  expect(result.samePageNode).toBe(true);
  expect(result.samples.length).toBeGreaterThan(4);
  expect(result.range).toBeLessThan(6);
  expect(errors).toEqual([]);
});
