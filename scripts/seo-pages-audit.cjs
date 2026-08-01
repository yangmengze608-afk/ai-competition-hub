const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, process.env.SEO_BUILD_DIR || '.seo-build');
const DOMAIN = 'https://aisaichang.cn';
const EXPECTED_COUNT = 20;

const failures = [];
function fail(message) { failures.push(message); }
function requireText(text, expected, label) {
  if (!text.includes(expected)) fail(`${label} missing: ${expected}`);
}
function read(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} does not exist: ${path.relative(ROOT, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

const manifestPath = path.join(BUILD_DIR, 'seo-pages-manifest.json');
const manifestText = read(manifestPath, 'SEO page manifest');
let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`SEO page manifest is invalid JSON: ${error.message}`);
}

const canonicalData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'competitions-v1.json'), 'utf8'));
const byId = new Map((canonicalData.competitions || []).map((item) => [item.id, item]));
const css = read(path.join(ROOT, 'seo-landing-v1.css'), 'SEO landing stylesheet');
const sitemap = read(path.join(BUILD_DIR, 'sitemap.xml'), 'generated sitemap');
const directory = read(path.join(BUILD_DIR, 'competitions', 'index.html'), 'competition directory');

if (manifest) {
  if (manifest.version !== '0.8.0') fail(`Unexpected manifest version: ${manifest.version}`);
  if (manifest.count !== EXPECTED_COUNT) fail(`Expected ${EXPECTED_COUNT} pages, received ${manifest.count}`);
  if (!Array.isArray(manifest.ids)) fail('Manifest ids must be an array');
  else if (new Set(manifest.ids).size !== manifest.ids.length) fail('Manifest contains duplicate competition ids');
}

requireText(css, '.landing-hero', 'SEO stylesheet');
requireText(css, '.directory-grid', 'SEO stylesheet');
requireText(directory, '<h1>值得进一步核对的 AI 比赛</h1>', 'competition directory');
requireText(directory, '<meta name="robots" content="index,follow,max-image-preview:large"', 'competition directory');
requireText(directory, `<link rel="canonical" href="${DOMAIN}/competitions/"`, 'competition directory');
requireText(sitemap, `<loc>${DOMAIN}/</loc>`, 'generated sitemap');
requireText(sitemap, `<loc>${DOMAIN}/competitions/</loc>`, 'generated sitemap');

const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapLocations.length !== EXPECTED_COUNT + 2) {
  fail(`Sitemap should contain ${EXPECTED_COUNT + 2} URLs, received ${sitemapLocations.length}`);
}
if (new Set(sitemapLocations).size !== sitemapLocations.length) fail('Sitemap contains duplicate URLs');
if (sitemapLocations.some((location) => location.includes('#'))) fail('Sitemap must not contain hash routes');
if (sitemapLocations.some((location) => !location.startsWith(`${DOMAIN}/`))) fail('Sitemap contains a non-production URL');

const titles = new Set();
const descriptions = new Set();

for (const id of manifest?.ids || []) {
  const item = byId.get(id);
  if (!item) {
    fail(`Manifest references an unknown competition: ${id}`);
    continue;
  }
  if (item.verificationStatus !== 'reviewed') fail(`${id} is not reviewed`);
  if (item.collection !== 'current') fail(`${id} is not in the current collection`);
  if (!item.sourceUrl) fail(`${id} is missing an official/source URL`);

  const filePath = path.join(BUILD_DIR, 'competitions', id, 'index.html');
  const page = read(filePath, `competition page ${id}`);
  const canonical = `${DOMAIN}/competitions/${encodeURIComponent(id)}/`;

  requireText(page, `<link rel="canonical" href="${canonical}"`, id);
  requireText(page, '<meta name="robots" content="index,follow,max-image-preview:large"', id);
  requireText(page, `<h1>${String(item.title).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')}</h1>`, id);
  requireText(page, 'AI 赛场不是赛事主办方', id);
  requireText(page, '查看完整判断与参赛路线', id);
  requireText(page, '前往官方比赛页面', id);
  requireText(page, '<script type="application/ld+json">', id);
  requireText(page, 'FAQPage', id);
  requireText(page, 'BreadcrumbList', id);
  requireText(page, `/competitions/${encodeURIComponent(id)}/`, 'competition directory');
  requireText(sitemap, `<loc>${canonical}</loc>`, 'generated sitemap');

  if (page.includes('<meta name="robots" content="noindex')) fail(`${id} is unexpectedly noindex`);
  if (page.includes(`rel="canonical" href="${DOMAIN}/#/`)) fail(`${id} canonical uses a hash route`);
  if (page.length < 5000) fail(`${id} page appears too thin (${page.length} characters)`);

  const titleMatch = page.match(/<title>([^<]+)<\/title>/);
  const descriptionMatch = page.match(/<meta name="description" content="([^"]+)"/);
  if (!titleMatch) fail(`${id} is missing a title`);
  else {
    if (titles.has(titleMatch[1])) fail(`${id} repeats an existing title`);
    titles.add(titleMatch[1]);
    if (titleMatch[1].length > 70) fail(`${id} title is too long (${titleMatch[1].length})`);
  }
  if (!descriptionMatch) fail(`${id} is missing a meta description`);
  else {
    if (descriptions.has(descriptionMatch[1])) fail(`${id} repeats an existing meta description`);
    descriptions.add(descriptionMatch[1]);
    if (descriptionMatch[1].length > 170) fail(`${id} description is too long (${descriptionMatch[1].length})`);
  }
}

if (failures.length) {
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Static SEO page audit passed: ${EXPECTED_COUNT} reviewed competition pages, one directory and ${sitemapLocations.length} sitemap URLs.`);
