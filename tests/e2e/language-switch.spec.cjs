const { test, expect } = require('@playwright/test');

test('explicit English mode covers the core flow and restores Chinese without losing state', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());

  await page.goto('/?lang=en#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('banner').locator('.brand')).toContainText('AI Competition Hub');
  await expect(page.getByRole('heading', { name: /Stop bookmarking competitions/i })).toBeVisible();
  await expect(page.locator('[data-language-switch]').first()).toHaveText('中文');
  await expect(page).toHaveURL(/\?lang=en#\//);

  await page.goto('/?lang=en#/competitions/iflytek-spark-cup-2026');
  await expect(page.getByRole('heading', { name: 'Competition Overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Add to My Competitions/i })).toBeVisible();

  await page.getByRole('button', { name: /Add to My Competitions/i }).click();
  await expect(page).toHaveURL(/#\/workspace\/iflytek-spark-cup-2026/);
  await expect(page.getByRole('heading', { name: 'Complete One Real Action Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Execution Tasks' })).toBeVisible();
  await expect(page.locator('.workspace-progress-card strong')).toHaveText('0%');

  await page.locator('.workspace-task').first().click();
  await expect(page.getByRole('heading', { name: 'You Have Officially Started This Competition' })).toBeVisible();
  await expect(page.locator('.workspace-progress-card strong')).not.toHaveText('0%');
  await expect(page.locator('.workspace-meta')).toContainText('completed');

  await page.locator('[data-language-switch]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '你已经真正启动这场比赛' })).toBeVisible();
  await expect(page.locator('.workspace-meta')).toContainText('项完成');
  await expect(page).not.toHaveURL(/\?lang=en/);
  await expect(page.locator('[data-language-switch]').first()).toHaveText('EN');
});

test('Chinese remains default until the visitor explicitly switches to English', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'en-US' });
  });

  await page.goto('/#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: /别再收藏一堆比赛/ })).toBeVisible();
  await expect(page.locator('[data-language-switch]').first()).toHaveText('EN');

  await page.locator('[data-language-switch]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Stop bookmarking competitions/i })).toBeVisible();
  await expect(page).toHaveURL(/\?lang=en#\//);
});
