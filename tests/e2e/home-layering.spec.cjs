const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('classic search-first homepage remains the first screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/#/');

  const classic = page.locator('[data-classic-home]');
  const classicHero = classic.locator('.hero-section');
  const decision = page.locator('.decision-home');

  await expect(classic).toHaveCount(1);
  await expect(classicHero.getByRole('heading', { name: /只参加真正值得的/ })).toBeVisible();
  await expect(classicHero.locator('[data-home-search]')).toBeVisible();
  await expect(classicHero.locator('[data-network]')).toBeAttached();
  await expect(decision.getByRole('heading', { name: /先排除不值得的/ })).toBeVisible();

  const placement = await classic.evaluate((node) => ({
    nextClass: node.nextElementSibling?.className || '',
    bottom: node.getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
  }));
  expect(placement.nextClass).toContain('decision-home');
  expect(placement.bottom).toBeGreaterThan(placement.viewportHeight * 0.75);

  const decisionTop = await decision.evaluate((node) => node.getBoundingClientRect().top);
  expect(decisionTop).toBeGreaterThan(placement.viewportHeight * 0.75);

  const search = classicHero.locator('[data-home-search]');
  await search.locator('input[name="q"]').fill('AI Agent');
  await search.getByRole('button', { name: /找适合我的比赛/ }).click();
  await expect(page).toHaveURL(/#\/competitions\?q=AI(?:%20|\+)Agent/);
  await expect(page.getByRole('heading', { name: /找到现在值得参加的比赛/ })).toBeVisible();
  expect(errors).toEqual([]);
});
