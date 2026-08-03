const { test, expect } = require('@playwright/test');

test('scaled SEO directory exposes every eligible page and opens a non-featured competition', async ({ page, request }) => {
  const manifestResponse = await request.get('/.seo-build/seo-pages-manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();

  expect(manifest.version).toBe('0.8.1');
  expect(manifest.count).toBeGreaterThan(20);
  expect(manifest.ids).toHaveLength(manifest.count);

  await page.goto('/.seo-build/competitions/');
  await expect(page.getByRole('heading', { level: 1, name: '值得进一步核对的 AI 比赛' })).toBeVisible();
  await expect(page.locator('.directory-grid article')).toHaveCount(manifest.count);
  await expect(page.getByText(`${manifest.count} 场合格赛事`, { exact: true })).toBeVisible();

  const expandedCompetitionId = manifest.ids.at(-1);
  expect(expandedCompetitionId).toBeTruthy();
  await page.goto(`/.seo-build/competitions/${expandedCompetitionId}/`);

  await expect(page.locator('h1')).not.toHaveText('');
  await expect(page.getByRole('link', { name: '查看完整判断与参赛路线' })).toBeVisible();
  await expect(page.getByRole('link', { name: /前往官方比赛页面/ })).toBeVisible();
  await expect(page.getByText('AI 赛场不是赛事主办方。资格、赛程、费用和提交要求最终以官方公告为准。')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://aisaichang.cn/competitions/${expandedCompetitionId}/`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
