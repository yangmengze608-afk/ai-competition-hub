const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, process.env.SEO_BUILD_DIR || '.seo-build');
const DATA_PATH = path.join(ROOT, 'data', 'competitions-v1.json');
const DOMAIN = 'https://aisaichang.cn';
const VERSION = '0.8.1';
const LEGACY_FIXED_COUNT = 20;

const failures = [];
function fail(message) { failures.push(message); }
function read(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} does not exist: ${path.relative(ROOT, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}
function requireText(text, expected, label) {
  if (!text.includes(expected)) fail(`${label} missing: ${expected}`);
}
function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}
function isEligible(item) {
  return Boolean(
    item
    && typeof item === 'object'
    && /^[a-z0-9][a-z0-9-]*$/.test(String(item.id || ''))
    && String(item.title || '').trim()
    && item.verificationStatus === 'reviewed'
    && item.collection === 'current'
    && safeUrl(item.sourceUrl)
  );
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const canonicalData = JSON.parse(read(DATA_PATH, 'canonical competition data') || '{}');
const competitions = Array.isArray(canonicalData.competitions) ? canonicalData.competitions : [];
const eligible = competitions.filter(isEligible);
const eligibleIds = eligible.map((item) => item.id);
const eligibleSet = new Set(eligibleIds);
const byId = new Map(competitions.map((item) => [item.id, item]));

if (eligibleSet.size !== eligibleIds.length) fail('Canonical data contains duplicate eligible competition ids');
if (eligibleIds.length <= LEGACY_FIXED_COUNT) {
  fail(`Scaling proof requires more than ${LEGACY_FIXED_COUNT} eligible competitions, found ${eligibleIds.length}`);
}

const manifestText = read(path.join(BUILD_DIR, 'seo-pages-manifest.json'), 'SEO page manifest');
let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  fail(`SEO page manifest is invalid JSON: ${error.message}`);
}

const css = read(path.join(ROOT, 'seo-landing-v1.css'), 'SEO landing stylesheet');
const sitemap = read(path.join(BUILD_DIR, 'sitemap.xml'), 'generated sitemap');
const directory = read(path.join(BUILD_DIR, 'competitions', 'index.html'), 'competition directory');

if (manifest) {
  if (manifest.version !== VERSION) fail(`Unexpected manifest version: ${manifest.version}`);
  if (manifest.count !== eligibleIds.length) fail(`Manifest should publish ${eligibleIds.length} eligible pages, received ${manifest.count}`);
  if (!Array.isArray(manifest.ids)) fail('Manifest ids must be an array');
  else {
    const manifestSet = new Set(manifest.ids);
    if (manifestSet.size !== manifest.ids.length) fail('Manifest contains duplicate competition ids');
    for (const id of eligibleIds) if (!manifestSet.has(id)) fail(`Eligible competition missing from manifest: ${id}`);
    for (const id of manifest.ids) if (!eligibleSet.has(id)) fail(`Ineligible competition leaked into manifest: ${id}`);
  }
  if (manifest.counts?.eligible !== eligibleIds.length) fail('Manifest eligibility count does not match canonical data');
  if (manifest.eligibility?.verificationStatus !== 'reviewed') fail('Manifest does not document the reviewed-only boundary');
  if (manifest.eligibility?.collection !== 'current') fail('Manifest does not document the current-only boundary');
  if (manifest.eligibility?.traceableSourceUrl !== true) fail('Manifest does not document the source URL boundary');
}

requireText(css, '.landing-hero', 'SEO stylesheet');
requireText(css, '.directory-grid', 'SEO stylesheet');
requireText(directory, '<h1>值得进一步核对的 AI 比赛</h1>', 'competition directory');
requireText(directory, `${eligibleIds.length} 场合格赛事`, 'competition directory');
requireText(directory, '新增或更新合格赛事后，独立页面和站点地图会在部署时同步生成', 'competition directory');
requireText(directory, '<meta name="robots" content="index,follow,max-image-preview:large"', 'competition directory');
requireText(directory, `<link rel="canonical" href="${DOMAIN}/competitions/"`, 'competition directory');
requireText(sitemap, `<loc>${DOMAIN}/</loc>`, 'generated sitemap');
requireText(sitemap, `<loc>${DOMAIN}/competitions/</loc>`, 'generated sitemap');

const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapCount = eligibleIds.length + 2;
if (sitemapLocations.length !== expectedSitemapCount) {
  fail(`Sitemap should contain ${expectedSitemapCount} URLs, received ${sitemapLocations.length}`);
}
if (new Set(sitemapLocations).size !== sitemapLocations.length) fail('Sitemap contains duplicate URLs');
if (sitemapLocations.some((location) => location.includes('#'))) fail('Sitemap must not contain hash routes');
if (sitemapLocations.some((location) => !location.startsWith(`${DOMAIN}/`))) fail('Sitemap contains a non-production URL');
if (sitemapLocations.length > 50000) fail('Sitemap exceeds the single-file URL limit');

const titles = new Set();
const descriptions = new Set();

for (const id of manifest?.ids || []) {
  const item = byId.get(id);
  if (!item) {
    fail(`Manifest references an unknown competition: ${id}`);
    continue;
  }
  if (!isEligible(item)) fail(`${id} does not satisfy the publication boundary`);

  const filePath = path.join(BUILD_DIR, 'competitions', id, 'index.html');
  const page = read(filePath, `competition page ${id}`);
  const canonical = `${DOMAIN}/competitions/${encodeURIComponent(id)}/`;

  requireText(page, `<link rel="canonical" href="${canonical}"`, id);
  requireText(page, '<meta name="robots" content="index,follow,max-image-preview:large"', id);
  requireText(page, `<h1>${escapeHtml(item.title)}</h1>`, id);
  requireText(page, 'AI 赛场不是赛事主办方', id);
  requireText(page, '查看完整判断与参赛路线', id);
  requireText(page, '前往官方比赛页面', id);
  requireText(page, '这场比赛的价值如何判断？', id);
  requireText(page, '参赛前需要特别注意什么？', id);
  requireText(page, '现在应该先做什么？', id);
  requireText(page, '<script type="application/ld+json">', id);
  requireText(page, 'FAQPage', id);
  requireText(page, 'BreadcrumbList', id);
  requireText(page, `/competitions/${encodeURIComponent(id)}/`, 'competition directory');
  requireText(sitemap, `<loc>${canonical}</loc>`, 'generated sitemap');

  if (page.includes('<meta name="robots" content="noindex')) fail(`${id} is unexpectedly noindex`);
  if (page.includes(`rel="canonical" href="${DOMAIN}/#/`)) fail(`${id} canonical uses a hash route`);
  if (page.length < 6000) fail(`${id} page appears too thin (${page.length} characters)`);

  const titleMatch = page.match(/<title>([^<]+)<\/title>/);
  const descriptionMatch = page.match(/<meta name="description" content="([^"]+)"/);
  if (!titleMatch) fail(`${id} is missing a title`);
  else {
    if (titles.has(titleMatch[1])) fail(`${id} repeats an existing title`);
    titles.add(titleMatch[1]);
    if (titleMatch[1].length > 72) fail(`${id} title is too long (${titleMatch[1].length})`);
  }
  if (!descriptionMatch) fail(`${id} is missing a meta description`);
  else {
    if (descriptions.has(descriptionMatch[1])) fail(`${id} repeats an existing meta description`);
    descriptions.add(descriptionMatch[1]);
    if (descriptionMatch[1].length > 170) fail(`${id} description is too long (${descriptionMatch[1].length})`);
  }
}

const generatedDirs = fs.existsSync(path.join(BUILD_DIR, 'competitions'))
  ? fs.readdirSync(path.join(BUILD_DIR, 'competitions'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  : [];
for (const id of generatedDirs) if (!eligibleSet.has(id)) fail(`Stale or ineligible generated directory remains: ${id}`);
if (generatedDirs.length !== eligibleIds.length) fail(`Expected ${eligibleIds.length} generated competition directories, found ${generatedDirs.length}`);

if (failures.length) {
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Scaled SEO audit passed: ${eligibleIds.length} eligible reviewed competition pages, one directory and ${sitemapLocations.length} sitemap URLs.`);
