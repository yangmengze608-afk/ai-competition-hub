const { test, expect } = require('@playwright/test');

test('Chinese Challenge library, detail and submission routes share one challenge id', async ({ page }) => {
  await page.goto('/#/challenges');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('有个脑洞');
  await expect(page.locator('.challenge-card')).toHaveCount(4);
  await expect(page.getByRole('link', { name: '创意擂台' }).first()).toBeVisible();

  await page.getByRole('link', { name: '查看 Challenge →' }).first().click();
  await expect(page).toHaveURL(/#\/challenges\/global-disaster-radar$/);
  await expect(page.getByRole('heading', { level: 1, name: '做一个全球实时灾难雷达' })).toBeVisible();
  await expect(page.getByText('发布一个 Idea 不会自动获得其他参与者作品的代码、版权或商业权益')).toBeVisible();
  await expect(page.getByRole('link', { name: '接这道题' }).first()).toBeVisible();

  await page.getByRole('link', { name: '接这道题' }).first().click();
  await expect(page).toHaveURL(/#\/challenges\/global-disaster-radar\/submit$/);
  await expect(page.getByRole('heading', { level: 1, name: '把你的答案交回来。' })).toBeVisible();
  await expect(page.locator('input[name="liveUrl"]')).toHaveAttribute('type', 'url');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('English Challenge UI reuses the same data and contains no Chinese explanatory copy', async ({ page }) => {
  await page.goto('/?lang=en#/challenges');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Have an idea?');
  await expect(page.locator('.challenge-card')).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Challenges' }).first()).toBeVisible();
  await expect(page.getByText('One idea can have many answers')).toBeVisible();

  await page.locator('.challenge-card').first().getByRole('link', { name: 'Open Challenge →' }).click();
  await expect(page).toHaveURL(/\?lang=en#\/challenges\/global-disaster-radar$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Build a Global Disaster Radar' })).toBeVisible();
  await expect(page.getByText('Posting an idea does not automatically grant you ownership', { exact: false })).toBeVisible();
  await expect(page.getByText('Originally posted in Chinese')).toBeVisible();

  const challengeText = await page.locator('[data-challenge-page]').innerText();
  expect(challengeText).not.toMatch(/[\u3400-\u9fff]/u);
});

test('Challenge creation is honest about the reviewed Beta publication boundary', async ({ page }) => {
  await page.goto('/#/challenges/new');
  await expect(page.getByRole('heading', { level: 1, name: '一句话出题。' })).toBeVisible();
  await expect(page.locator('textarea[name="idea"]')).toBeVisible();
  await expect(page.getByText('当前站点是静态 GitHub Pages，因此 Beta 先走公开审核队列。', { exact: false })).toBeVisible();
  await expect(page.getByText('这个 Idea 会公开', { exact: false })).toBeVisible();
});

test('generated Challenge SEO pages are bilingual, reciprocal and added to the shared sitemap', async ({ page, request }) => {
  const manifestResponse = await request.get('/.seo-build/challenge-pages-manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.count).toBe(4);
  expect(manifest.localizedPageCount).toBe(8);
  expect(manifest.sitemap.addedCount).toBe(10);

  await page.goto('/.seo-build/challenges/global-disaster-radar/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1, name: '做一个全球实时灾难雷达' })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://aisaichang.cn/en/challenges/global-disaster-radar/');

  await page.goto('/.seo-build/en/challenges/global-disaster-radar/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Build a Global Disaster Radar' })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute('href', 'https://aisaichang.cn/challenges/global-disaster-radar/');

  const sitemap = await (await request.get('/.seo-build/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://aisaichang.cn/challenges/global-disaster-radar/</loc>');
  expect(sitemap).toContain('<loc>https://aisaichang.cn/en/challenges/global-disaster-radar/</loc>');
});
