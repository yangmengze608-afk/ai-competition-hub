const { test, expect } = require('@playwright/test');

test('scaled SEO directory exposes every eligible page and opens a non-featured competition', async ({ page, request }) => {
  const manifestResponse = await request.get('/.seo-build/seo-pages-manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();

  expect(manifest.version).toBe('0.8.2');
  expect(manifest.count).toBeGreaterThan(20);
  expect(manifest.ids).toHaveLength(manifest.count);
  expect(manifest.localizedPageCount).toBe(manifest.count * 2);
  expect(manifest.languages).toEqual(['zh-CN', 'en']);

  await page.goto('/.seo-build/competitions/');
  await expect(page.getByRole('heading', { level: 1, name: '值得进一步核对的 AI 比赛' })).toBeVisible();
  await expect(page.locator('.directory-grid article')).toHaveCount(manifest.count);
  await expect(page.getByText(`${manifest.count} 场合格赛事`, { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://aisaichang.cn/en/competitions/');

  const expandedCompetitionId = manifest.ids.at(-1);
  expect(expandedCompetitionId).toBeTruthy();
  await page.goto(`/.seo-build/competitions/${expandedCompetitionId}/`);

  await expect(page.locator('h1')).not.toHaveText('');
  await expect(page.getByRole('link', { name: '查看完整判断与参赛路线' })).toBeVisible();
  await expect(page.getByRole('link', { name: /前往官方比赛页面/ })).toBeVisible();
  await expect(page.getByText('AI 赛场不是赛事主办方。资格、赛程、费用和提交要求最终以官方公告为准。')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://aisaichang.cn/competitions/${expandedCompetitionId}/`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://aisaichang.cn/en/competitions/${expandedCompetitionId}/`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('English SEO directory and competition pages are independently indexable and reciprocal', async ({ page, request }) => {
  const manifestResponse = await request.get('/.seo-build/seo-pages-manifest.json');
  const manifest = await manifestResponse.json();
  const competitionId = manifest.ids.at(-1);

  await page.goto('/.seo-build/en/competitions/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'AI Competitions Worth Checking' })).toBeVisible();
  await expect(page.locator('.directory-grid article')).toHaveCount(manifest.count);
  await expect(page.getByText(`${manifest.count} reviewed competitions`, { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://aisaichang.cn/en/competitions/');
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute('href', 'https://aisaichang.cn/competitions/');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://aisaichang.cn/competitions/');

  await page.goto(`/.seo-build/en/competitions/${competitionId}/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: 'Open the full decision page' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open official competition page/ })).toBeVisible();
  await expect(page.getByText('AI Competition Hub is not the event organizer. Eligibility, schedules, fees and submission requirements are governed by the official rules.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'What is this competition, and is it worth entering?' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'What should you do first?' })).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://aisaichang.cn/en/competitions/${competitionId}/`);
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute('href', `https://aisaichang.cn/competitions/${competitionId}/`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://aisaichang.cn/en/competitions/${competitionId}/`);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `https://aisaichang.cn/competitions/${competitionId}/`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
