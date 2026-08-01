const { test, expect } = require('@playwright/test');

test('language switch gives non-Chinese visitors an English core flow and restores Chinese', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'en-US' });
  });

  await page.goto('/#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.brand')).toContainText('AI Competition Hub');
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

  await page.locator('[data-language-switch]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '今天先完成一个真实动作' })).toBeVisible();
  await expect(page).not.toHaveURL(/\?lang=en/);
  await expect(page.locator('[data-language-switch]').first()).toHaveText('EN');
});

test('explicit Chinese query overrides an English browser', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'en-US' });
  });
  await page.goto('/?lang=zh#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: /别再收藏一堆比赛/ })).toBeVisible();
});
