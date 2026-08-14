const { test, expect } = require('@playwright/test');

const CJK = /[\u3400-\u9fff]/u;

async function homepageCjkLeaks(page) {
  return page.evaluate(() => {
    const cjk = /[\u3400-\u9fff]/u;
    const scopes = [
      '.site-header',
      '.site-footer',
      '.launch-segments-section',
      '.decision-home',
      '.conversion-home-section',
      '.home-competition-section',
      '.hot-tags'
    ];
    const allowed = [
      '[data-language-switch]',
      '[data-network]',
      '.competition-title',
      '.organizer',
      '.decision-deadline-card h3',
      '.decision-deadline-card > p'
    ].join(',');
    const leaks = [];

    for (const selector of scopes) {
      document.querySelectorAll(selector).forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          const text = (node.nodeValue || '').trim();
          const parent = node.parentElement;
          if (text && cjk.test(text) && parent && !parent.closest(allowed)) {
            leaks.push(`${selector}: ${text}`);
          }
          node = walker.nextNode();
        }
      });
    }
    return [...new Set(leaks)];
  });
}

test('English homepage fully localizes every layered section without changing filter values', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?lang=en#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await expect(page.locator('[data-playbook-nav]')).toHaveText('Competition Playbooks');
  await expect(page.locator('[data-beta-entry]')).toHaveText('Join Beta');
  await expect(page.getByRole('heading', { name: 'Find Competitions by What You Need Now' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What Do You Need Most Right Now?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Three Common Ways to Start' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Competitions Requiring a Decision Soon' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This Version Needs Real Competitors to Help Us Get It Right.' })).toBeVisible();

  const goalOption = page.locator('[data-fit-form] select[name="goal"] option').first();
  await expect(goalOption).toHaveText('Resume Signal & High Value');
  await expect(goalOption).toHaveAttribute('value', '高价值精选');

  const trackOption = page.locator('[data-fit-form] select[name="track"] option[value="数学建模"]');
  await expect(trackOption).toHaveText('Mathematical Modeling');

  await page.waitForTimeout(150);
  const leaks = await homepageCjkLeaks(page);
  expect(leaks, `English homepage still contains Chinese UI copy:\n${leaks.join('\n')}`).toEqual([]);

  const officialChineseNames = page.locator('[data-homepage-official-name="true"]');
  expect(await officialChineseNames.count()).toBeGreaterThan(0);
  for (let index = 0; index < Math.min(3, await officialChineseNames.count()); index += 1) {
    const node = officialChineseNames.nth(index);
    expect(CJK.test(await node.innerText())).toBe(true);
    await expect(node).toHaveAttribute('lang', 'zh-CN');
  }
});

test('homepage restores Chinese after switching back from English', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?lang=en#/');
  await expect(page.getByRole('heading', { name: 'What Do You Need Most Right Now?' })).toBeVisible();

  await page.locator('[data-language-switch]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '你现在更需要什么？' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '三种最常见的开始方式' })).toBeVisible();
  await expect(page.locator('[data-playbook-nav]')).toHaveText('参赛路线');
  await expect(page.locator('[data-beta-entry]')).toHaveText('参与内测');
});
