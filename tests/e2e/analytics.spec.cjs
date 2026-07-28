const { test, expect } = require('@playwright/test');

test('analytics removes free-text queries and stays off before provider activation', async ({ page }) => {
  const providerRequests = [];
  page.on('request', (request) => {
    if (/goatcounter|gc\.zgo\.at/i.test(request.url())) providerRequests.push(request.url());
  });

  await page.goto('/#/competitions?q=secret%40example.com&region=CN&difficulty=%E5%85%A5%E9%97%A8');
  await expect(page.getByRole('heading', { name: '找到现在值得参加的比赛' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '暂时没有匹配结果' })).toBeVisible();

  const analytics = await page.evaluate(() => ({
    status: window.AIAnalytics.status(),
    pagePath: window.AIAnalytics.pagePath(),
  }));

  expect(['disabled', 'non-production-host']).toContain(analytics.status.reason);
  expect(analytics.pagePath).toBe('/competitions/region-cn/difficulty-beginner');
  expect(analytics.pagePath).not.toContain('secret');
  expect(analytics.pagePath).not.toContain('example.com');
  expect(providerRequests).toEqual([]);

  await page.goto('/#/privacy');
  await expect(page.getByRole('heading', { name: '隐私政策' })).toBeVisible();
  await expect(page.getByText(/当前配置仍为关闭状态/)).toBeVisible();
  await expect(page.getByText(/Global Privacy Control 与 Do Not Track/)).toBeVisible();
  expect(providerRequests).toEqual([]);
});
