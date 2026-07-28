const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectCards(page) {
  const cards = page.locator('.competition-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
  return cards;
}

test('homepage explains the product and turns a goal into a filtered list', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/');

  await expect(page.getByRole('heading', { name: /先排除不值得的/ })).toBeVisible();
  await expect(page.getByText('AI 赛场不只是收集比赛。')).toBeVisible();
  await expect(page.locator('.decision-metric')).toHaveCount(4);
  await expect(page.locator('.decision-segment-card')).toHaveCount(3);
  expect(await page.locator('.decision-deadline-card').count()).toBeGreaterThan(0);

  const matcher = page.locator('[data-fit-form]');
  await expect(matcher).toBeVisible();
  await matcher.locator('select[name="goal"]').selectOption('零基础友好');
  await matcher.locator('select[name="difficulty"]').selectOption('入门');
  await matcher.getByRole('button', { name: /生成我的比赛列表/ }).click();

  await expect(page).toHaveURL(/q=%E9%9B%B6%E5%9F%BA%E7%A1%80%E5%8F%8B%E5%A5%BD/);
  await expect(page).toHaveURL(/difficulty=%E5%85%A5%E9%97%A8/);
  await expect(page.getByRole('heading', { name: '零基础也能开始的比赛' })).toBeVisible();
  await expectCards(page);
  expect(errors).toEqual([]);
});

test('high-value landing only shows reviewed S or A competitions', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/competitions?q=%E9%AB%98%E4%BB%B7%E5%80%BC%E7%B2%BE%E9%80%89&sort=recommended');

  await expect(page.getByRole('heading', { name: '已审核的高价值比赛' })).toBeVisible();
  const cards = await expectCards(page);
  const gradeTexts = await cards.locator('.grade-badge').allTextContents();
  expect(gradeTexts.length).toBeGreaterThan(0);
  for (const grade of gradeTexts) expect(grade).toMatch(/^(S|A)\s*·\s*已审核/);

  await cards.first().locator('.competition-title').click();
  await expect(page.locator('.competition-detail-hero h1')).toBeVisible();
  await expect(page.getByRole('heading', { name: '赛事价值判断' })).toBeVisible();
  await expect(page.getByText('参赛前确认', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /查看官方页面/ })).toHaveAttribute('target', '_blank');
  expect(errors).toEqual([]);
});

test('reviewed competition answers fit, non-fit and next action in one decision panel', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/competitions/iflytek-spark-cup-2026');

  const panel = page.locator('[data-detail-decision]');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('30 SECOND DECISION')).toBeVisible();
  await expect(panel.getByRole('heading', { name: '建议重点考虑' })).toBeVisible();
  await expect(panel.getByText('适合你，如果', { exact: true })).toBeVisible();
  await expect(panel.getByText('不适合你，如果', { exact: true })).toBeVisible();
  await expect(panel.getByText('现在怎么开始', { exact: true })).toBeVisible();
  await expect(panel.locator('.detail-decision-meta span')).toHaveCount(4);
  await expect(panel.getByRole('link', { name: /开始执行路线/ })).toBeVisible();

  await panel.getByRole('link', { name: /开始执行路线/ }).click();
  await expect(page).toHaveURL(/#\/playbooks\/spark-cup-agent-12-day/);
  await expect(page.locator('.playbook-detail h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('unreviewed competition does not pretend to be a recommendation', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/competitions/devpost-buuniex-hackathon');

  const panel = page.locator('[data-detail-decision]');
  await expect(panel).toBeVisible();
  await expect(page.locator('.grade-badge')).toContainText('U · 待核验');
  await expect(panel.getByRole('heading', { name: '先核验再决定' })).toBeVisible();
  await expect(panel.getByText(/尚不足以支持高含金量或高投入建议/)).toBeVisible();
  await expect(panel.getByRole('heading', { name: '建议重点考虑' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('competition filters update the complete result set', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/competitions');
  await expectCards(page);

  await page.locator('[data-filter="region"]').selectOption('CN');
  await expect(page).toHaveURL(/region=CN/);
  const domesticCards = await expectCards(page);
  const domesticRegions = await domesticCards.evaluateAll((items) => items.map((item) => item.dataset.region));
  expect(new Set(domesticRegions)).toEqual(new Set(['CN']));

  await page.locator('[data-filter="region"]').selectOption('INTL');
  await expect(page).toHaveURL(/region=INTL/);
  const internationalCards = await expectCards(page);
  const internationalRegions = await internationalCards.evaluateAll((items) => items.map((item) => item.dataset.region));
  expect(new Set(internationalRegions)).toEqual(new Set(['INTL']));
  expect(errors).toEqual([]);
});

test('playbook library opens a complete execution route', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/playbooks');

  await expect(page.getByRole('heading', { name: /下一步每天做什么/ })).toBeVisible();
  await expect(page.locator('[data-playbook-card]')).toHaveCount(10);
  await page.locator('.playbook-card-link').first().click();
  await expect(page.locator('.playbook-detail h1')).toBeVisible();
  expect(await page.locator('.playbook-stage').count()).toBeGreaterThanOrEqual(4);
  await expect(page.getByRole('heading', { name: '按阶段推进，不按焦虑推进' })).toBeVisible();
  await expect(page.getByText('提交前清单', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('public feedback and trust pages are reachable without placeholders', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/participate');

  await expect(page.getByRole('heading', { name: /告诉我们哪里还不能用/ })).toBeVisible();
  await expect(page.locator('.conversion-action-card')).toHaveCount(3);
  await expect(page.getByText(/不要填写手机号、邮箱、身份证号/)).toBeVisible();

  const routes = [
    ['/#/about', '关于 AI 赛场'],
    ['/#/data-policy', '数据说明'],
    ['/#/privacy', '隐私政策'],
    ['/#/terms', 'Beta 使用条款'],
  ];
  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('.trust-block').first()).toBeVisible();
  }

  const body = await page.locator('body').innerText();
  expect(body).not.toContain('占位');
  expect(body).not.toContain('演示数据');
  expect(errors).toEqual([]);
});