const { test, expect } = require('@playwright/test');

const CJK = /[\u3400-\u9fff]/u;

async function expectNoCjk(locator, label) {
  const texts = await locator.allTextContents();
  for (const text of texts) {
    expect(CJK.test(text), `${label} still contains Chinese: ${text}`).toBe(false);
  }
}

test('English competition library localizes dynamic summaries, tracks, tags and filters', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?lang=en#/competitions');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const cards = page.locator('.competition-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(4);

  const visibleCards = cards.locator('nth=0');
  await expectNoCjk(page.locator('.competition-card .competition-summary').first(), 'card summary');
  await expectNoCjk(page.locator('.competition-card .meta-grid').first(), 'card metadata');
  await expectNoCjk(page.locator('.competition-card .tag-row').first(), 'card tags');
  await expectNoCjk(page.locator('.filter-field option'), 'filter options');

  const firstFour = cards.locator(':scope').filter({ visible: true });
  const count = Math.min(4, await firstFour.count());
  for (let index = 0; index < count; index += 1) {
    const card = firstFour.nth(index);
    await expectNoCjk(card.locator('.competition-summary'), `card ${index + 1} summary`);
    await expectNoCjk(card.locator('.meta-grid'), `card ${index + 1} metadata`);
    await expectNoCjk(card.locator('.tag-row'), `card ${index + 1} tags`);

    const title = card.locator('.competition-title');
    const titleText = await title.innerText();
    if (CJK.test(titleText)) await expect(title).toHaveAttribute('lang', 'zh-CN');

    const organizer = card.locator('.organizer');
    const organizerText = await organizer.innerText();
    if (CJK.test(organizerText)) await expect(organizer).toHaveAttribute('lang', 'zh-CN');
  }
});

test('English competition detail replaces Chinese explanatory content and restores Chinese', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?lang=en#/competitions/iflytek-spark-cup-2026');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectNoCjk(page.locator('.competition-detail-hero > div > p'), 'detail hero summary');
  await expectNoCjk(page.locator('.detail-main > .detail-block').first().locator('p'), 'overview copy');
  await expectNoCjk(page.locator('.audit-summary'), 'audit summary');
  await expectNoCjk(page.locator('.audit-facts strong'), 'audit facts');
  await expectNoCjk(page.locator('.audit-risk-list li span'), 'risk labels');
  await expectNoCjk(page.locator('.tag-row.large-tags'), 'detail tags');

  const detailTitle = page.locator('.competition-detail-hero h1');
  if (CJK.test(await detailTitle.innerText())) await expect(detailTitle).toHaveAttribute('lang', 'zh-CN');

  await page.locator('[data-language-switch]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('.competition-detail-hero > div > p')).toContainText('围绕大模型应用');
  await expect(page.locator('.tag-row.large-tags')).toContainText('大学生');
});
