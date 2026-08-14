const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function pickFutureReviewedCompetition(request) {
  const response = await request.get('/data/competitions-v1.json');
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const now = Date.now();
  const candidate = (payload.competitions || [])
    .filter((item) => item.verificationStatus === 'reviewed' && item.collection === 'current')
    .filter((item) => Number.isFinite(Date.parse(item.deadline)) && Date.parse(item.deadline) > now + 24 * 60 * 60 * 1000)
    .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))[0];

  expect(candidate, 'Activation test needs at least one reviewed current competition with a deadline more than 24 hours in the future').toBeTruthy();
  return candidate;
}

test('workspace turns a chosen competition into a first real action', async ({ page, request }) => {
  const errors = watchErrors(page);
  const competition = await pickFutureReviewedCompetition(request);
  const competitionId = competition.id;

  await page.goto(`/#/competitions/${competitionId}`);

  const start = page.locator(`[data-start-workspace="${competitionId}"]`);
  await expect(start).toContainText('加入我的参赛');
  await start.click();
  await expect(page).toHaveURL(new RegExp(`#\\/workspace\\/${competitionId}`));

  const guide = page.locator('[data-activation-guide-panel]');
  await expect(guide.getByRole('heading', { name: '今天先完成一个真实动作' })).toBeVisible();
  await expect(guide.locator('.activation-guide-action')).toHaveCount(3);

  const calendarButton = guide.locator('[data-activation-calendar]');
  await expect(calendarButton).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await calendarButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('截止提醒.ics');

  await guide.locator('[data-activation-focus-task]').click();
  const firstTask = page.locator('[data-workspace-task]').first();
  await expect(firstTask).not.toBeChecked();
  await page.locator('.workspace-task').first().click();

  await expect(page.locator('[data-workspace-task]').first()).toBeChecked();
  await expect(page.locator('[data-activation-guide-panel]').getByRole('heading', { name: '你已经真正启动这场比赛' })).toBeVisible();
  await expect(page.locator('.workspace-progress-card strong')).not.toHaveText('0%');
  expect(errors).toEqual([]);
});
