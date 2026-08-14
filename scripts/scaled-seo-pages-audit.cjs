const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, process.env.SEO_BUILD_DIR || '.seo-build');
const DATA_PATH = path.join(ROOT, 'data', 'competitions-v1.json');
const DOMAIN = 'https://aisaichang.cn';
const VERSION = '0.8.2';
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
  return Boolean(item && typeof item === 'object' && /^[a-z0-9][a-z0-9-]*$/.test(String(item.id || '')) && String(item.title || '').trim() && item.verificationStatus === 'reviewed' && item.collection === 'current' && safeUrl(item.sourceUrl));
}
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function locationsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const canonicalData = JSON.parse(read(DATA_PATH, 'canonical competition data') || '{}');
const competitions = Array.isArray(canonicalData.competitions) ? canonicalData.competitions : [];
const eligible = competitions.filter(isEligible);
const eligibleIds = eligible.map((item) => item.id);
const eligibleSet = new Set(eligibleIds);
const byId = new Map(competitions.map((item) => [item.id, item]));

if (eligibleSet.size !== eligibleIds.length) fail('Canonical data contains duplicate eligible competition ids');
if (eligibleIds.length <= LEGACY_FIXED_COUNT) fail(`Scaling proof requires more than ${LEGACY_FIXED_COUNT} eligible competitions, found ${eligibleIds.length}`);

const manifestText = read(path.join(BUILD_DIR, 'seo-pages-manifest.json'), 'SEO page manifest');
let manifest = null;
try { manifest = JSON.parse(manifestText); } catch (error) { fail(`SEO page manifest is invalid JSON: ${error.message}`); }

const css = read(path.join(ROOT, 'seo-landing-v1.css'), 'SEO landing stylesheet');
const sitemap = read(path.join(BUILD_DIR, 'sitemap.xml'), 'generated sitemap');
const zhDirectory = read(path.join(BUILD_DIR, 'competitions', 'index.html'), 'Chinese competition directory');
const enDirectory = read(path.join(BUILD_DIR, 'en', 'competitions', 'index.html'), 'English competition directory');

if (manifest) {
  if (manifest.version !== VERSION) fail(`Unexpected manifest version: ${manifest.version}`);
  if (manifest.count !== eligibleIds.length) fail(`Manifest should publish ${eligibleIds.length} eligible competitions, received ${manifest.count}`);
  if (manifest.localizedPageCount !== eligibleIds.length * 2) fail(`Manifest should publish ${eligibleIds.length * 2} localized pages`);
  if (manifest.sitemapUrlCount !== eligibleIds.length * 2 + 3) fail('Manifest sitemap URL count is incorrect');
  if (JSON.stringify(manifest.languages) !== JSON.stringify(['zh-CN', 'en'])) fail('Manifest must publish zh-CN and en');
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
requireText(zhDirectory, '<html lang="zh-CN">', 'Chinese directory');
requireText(zhDirectory, '<h1>值得进一步核对的 AI 比赛</h1>', 'Chinese directory');
requireText(zhDirectory, `${eligibleIds.length} 场合格赛事`, 'Chinese directory');
requireText(zhDirectory, `<link rel="canonical" href="${DOMAIN}/competitions/"`, 'Chinese directory');
requireText(zhDirectory, `hreflang="en" href="${DOMAIN}/en/competitions/"`, 'Chinese directory');
requireText(zhDirectory, `hreflang="x-default" href="${DOMAIN}/competitions/"`, 'Chinese directory');
requireText(enDirectory, '<html lang="en">', 'English directory');
requireText(enDirectory, '<h1>AI Competitions Worth Checking</h1>', 'English directory');
requireText(enDirectory, `${eligibleIds.length} reviewed competitions`, 'English directory');
requireText(enDirectory, `<link rel="canonical" href="${DOMAIN}/en/competitions/"`, 'English directory');
requireText(enDirectory, `hreflang="zh-CN" href="${DOMAIN}/competitions/"`, 'English directory');
requireText(enDirectory, 'New eligible competitions automatically receive both Chinese and English landing pages', 'English directory');
for (const directory of [zhDirectory, enDirectory]) requireText(directory, '<meta name="robots" content="index,follow,max-image-preview:large"', 'competition directory');

requireText(sitemap, 'xmlns:xhtml="http://www.w3.org/1999/xhtml"', 'generated sitemap');
requireText(sitemap, `<loc>${DOMAIN}/</loc>`, 'generated sitemap');
requireText(sitemap, `<loc>${DOMAIN}/competitions/</loc>`, 'generated sitemap');
requireText(sitemap, `<loc>${DOMAIN}/en/competitions/</loc>`, 'generated sitemap');
const sitemapLocations = locationsFromSitemap(sitemap);
const expectedSitemapCount = eligibleIds.length * 2 + 3;
if (sitemapLocations.length !== expectedSitemapCount) fail(`Sitemap should contain ${expectedSitemapCount} URLs, received ${sitemapLocations.length}`);
if (new Set(sitemapLocations).size !== sitemapLocations.length) fail('Sitemap contains duplicate URLs');
if (sitemapLocations.some((location) => location.includes('#'))) fail('Sitemap must not contain hash routes');
if (sitemapLocations.some((location) => !location.startsWith(`${DOMAIN}/`))) fail('Sitemap contains a non-production URL');
if (sitemapLocations.length > 50000) fail('Sitemap exceeds the single-file URL limit');

const zhTitles = new Set();
const zhDescriptions = new Set();
const enTitles = new Set();
const enDescriptions = new Set();

for (const id of manifest?.ids || []) {
  const item = byId.get(id);
  if (!item) { fail(`Manifest references an unknown competition: ${id}`); continue; }
  if (!isEligible(item)) fail(`${id} does not satisfy the publication boundary`);
  const encoded = encodeURIComponent(id);
  const zhCanonical = `${DOMAIN}/competitions/${encoded}/`;
  const enCanonical = `${DOMAIN}/en/competitions/${encoded}/`;
  const zhPage = read(path.join(BUILD_DIR, 'competitions', id, 'index.html'), `Chinese competition page ${id}`);
  const enPage = read(path.join(BUILD_DIR, 'en', 'competitions', id, 'index.html'), `English competition page ${id}`);

  requireText(zhPage, '<html lang="zh-CN">', `${id} Chinese`);
  requireText(zhPage, `<link rel="canonical" href="${zhCanonical}"`, `${id} Chinese`);
  requireText(zhPage, `hreflang="en" href="${enCanonical}"`, `${id} Chinese`);
  requireText(zhPage, `hreflang="x-default" href="${zhCanonical}"`, `${id} Chinese`);
  requireText(zhPage, `<h1>${escapeHtml(item.title)}</h1>`, `${id} Chinese`);
  requireText(zhPage, 'AI 赛场不是赛事主办方', `${id} Chinese`);
  requireText(zhPage, '查看完整判断与参赛路线', `${id} Chinese`);
  requireText(zhPage, '前往官方比赛页面', `${id} Chinese`);
  requireText(zhPage, 'FAQPage', `${id} Chinese`);
  requireText(zhPage, 'BreadcrumbList', `${id} Chinese`);
  requireText(zhDirectory, `/competitions/${encoded}/`, 'Chinese directory');

  requireText(enPage, '<html lang="en">', `${id} English`);
  requireText(enPage, `<link rel="canonical" href="${enCanonical}"`, `${id} English`);
  requireText(enPage, `hreflang="zh-CN" href="${zhCanonical}"`, `${id} English`);
  requireText(enPage, `hreflang="en" href="${enCanonical}"`, `${id} English`);
  requireText(enPage, `hreflang="x-default" href="${zhCanonical}"`, `${id} English`);
  requireText(enPage, `<h1>${escapeHtml(item.title)}</h1>`, `${id} English`);
  requireText(enPage, 'AI Competition Hub is not the event organizer', `${id} English`);
  requireText(enPage, 'Open the full decision page', `${id} English`);
  requireText(enPage, 'Open official competition page', `${id} English`);
  requireText(enPage, 'What is this competition, and is it worth entering?', `${id} English`);
  requireText(enPage, 'What should you check before entering?', `${id} English`);
  requireText(enPage, 'What should you do first?', `${id} English`);
  requireText(enPage, 'FAQPage', `${id} English`);
  requireText(enPage, 'BreadcrumbList', `${id} English`);
  requireText(enPage, '"inLanguage":"en"', `${id} English JSON-LD`);
  requireText(enDirectory, `/en/competitions/${encoded}/`, 'English directory');

  requireText(sitemap, `<loc>${zhCanonical}</loc>`, 'generated sitemap');
  requireText(sitemap, `<loc>${enCanonical}</loc>`, 'generated sitemap');
  requireText(sitemap, `hreflang="zh-CN" href="${zhCanonical}"`, 'generated sitemap');
  requireText(sitemap, `hreflang="en" href="${enCanonical}"`, 'generated sitemap');

  for (const [page, label] of [[zhPage, `${id} Chinese`], [enPage, `${id} English`]]) {
    requireText(page, '<meta name="robots" content="index,follow,max-image-preview:large"', label);
    if (page.includes('<meta name="robots" content="noindex')) fail(`${label} is unexpectedly noindex`);
    if (page.includes(`rel="canonical" href="${DOMAIN}/#/`)) fail(`${label} canonical uses a hash route`);
  }
  if (zhPage.length < 6000) fail(`${id} Chinese page appears too thin (${zhPage.length} characters)`);
  if (enPage.length < 6500) fail(`${id} English page appears too thin (${enPage.length} characters)`);

  const zhTitleMatch = zhPage.match(/<title>([^<]+)<\/title>/);
  const zhDescriptionMatch = zhPage.match(/<meta name="description" content="([^"]+)"/);
  const enTitleMatch = enPage.match(/<title>([^<]+)<\/title>/);
  const enDescriptionMatch = enPage.match(/<meta name="description" content="([^"]+)"/);
  if (!zhTitleMatch) fail(`${id} Chinese is missing a title`); else { if (zhTitles.has(zhTitleMatch[1])) fail(`${id} repeats an existing Chinese title`); zhTitles.add(zhTitleMatch[1]); if (zhTitleMatch[1].length > 72) fail(`${id} Chinese title is too long (${zhTitleMatch[1].length})`); }
  if (!zhDescriptionMatch) fail(`${id} Chinese is missing a meta description`); else { if (zhDescriptions.has(zhDescriptionMatch[1])) fail(`${id} repeats an existing Chinese meta description`); zhDescriptions.add(zhDescriptionMatch[1]); if (zhDescriptionMatch[1].length > 170) fail(`${id} Chinese description is too long (${zhDescriptionMatch[1].length})`); }
  if (!enTitleMatch) fail(`${id} English is missing a title`); else {
    if (enTitles.has(enTitleMatch[1])) fail(`${id} repeats an existing English title`);
    enTitles.add(enTitleMatch[1]);
    const decodedTitle = enTitleMatch[1].replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
    if (decodedTitle.length > 78) fail(`${id} English title is too long (${decodedTitle.length})`);
    if (!/(Competition|Deadline|Eligibility)/.test(decodedTitle)) fail(`${id} English title does not signal competition intent`);
  }
  if (!enDescriptionMatch) fail(`${id} English is missing a meta description`); else { if (enDescriptions.has(enDescriptionMatch[1])) fail(`${id} repeats an existing English meta description`); enDescriptions.add(enDescriptionMatch[1]); if (enDescriptionMatch[1].length > 175) fail(`${id} English description is too long (${enDescriptionMatch[1].length})`); }
}

function generatedSubdirs(dir) { if (!fs.existsSync(dir)) return []; return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name); }
const zhGeneratedDirs = generatedSubdirs(path.join(BUILD_DIR, 'competitions'));
const enGeneratedDirs = generatedSubdirs(path.join(BUILD_DIR, 'en', 'competitions'));
for (const id of zhGeneratedDirs) if (!eligibleSet.has(id)) fail(`Stale or ineligible Chinese generated directory remains: ${id}`);
for (const id of enGeneratedDirs) if (!eligibleSet.has(id)) fail(`Stale or ineligible English generated directory remains: ${id}`);
if (zhGeneratedDirs.length !== eligibleIds.length) fail(`Expected ${eligibleIds.length} Chinese generated competition directories, found ${zhGeneratedDirs.length}`);
if (enGeneratedDirs.length !== eligibleIds.length) fail(`Expected ${eligibleIds.length} English generated competition directories, found ${enGeneratedDirs.length}`);

if (failures.length) { failures.forEach((message) => console.error(`- ${message}`)); process.exit(1); }
console.log(`Bilingual SEO audit passed: ${eligibleIds.length} reviewed competitions, ${eligibleIds.length * 2} localized pages, two language directories and ${sitemapLocations.length} sitemap URLs.`);
