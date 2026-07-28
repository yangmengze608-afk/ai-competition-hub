const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
global.window = global;

const scripts = [
  'data.js',
  'real-competitions.js',
  'expanded-competitions-1.js',
  'expanded-competitions-2.js',
  'expanded-competitions-3.js',
  'expanded-competitions-4.js',
  'expanded-competitions-devpost-v5.js',
  'real-competition-config.js'
];

for (const file of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

const items = window.AI_DATA?.competitions || [];
const required = ['id', 'title', 'organizer', 'track', 'deadline', 'summary', 'sourceUrl', 'sourceName', 'lastVerifiedAt'];
const errors = [];
const warnings = [];

const idMap = new Map();
const titleMap = new Map();

for (const item of items) {
  if (idMap.has(item.id)) errors.push(`Duplicate id: ${item.id}`);
  idMap.set(item.id, item);

  const normalizedTitle = String(item.title || '').trim().toLowerCase();
  if (normalizedTitle) {
    if (titleMap.has(normalizedTitle)) warnings.push(`Duplicate title: ${item.title}`);
    titleMap.set(normalizedTitle, item);
  }

  const missing = required.filter((field) => !String(item[field] ?? '').trim());
  if (missing.length) warnings.push(`${item.id || '(missing id)'} missing: ${missing.join(', ')}`);

  const deadline = new Date(item.deadline);
  if (Number.isNaN(deadline.getTime())) errors.push(`${item.id} has invalid deadline: ${item.deadline}`);

  try {
    const source = new URL(item.sourceUrl);
    if (!['http:', 'https:'].includes(source.protocol)) errors.push(`${item.id} has unsupported source URL: ${item.sourceUrl}`);
  } catch {
    errors.push(`${item.id} has invalid source URL: ${item.sourceUrl}`);
  }
}

const genericOrganizers = items.filter((item) => /赛事主办方|合作机构|组委会 \/|主办方待核验/i.test(item.organizer || ''));
const stale = items.filter((item) => {
  const verified = new Date(item.lastVerifiedAt || item.updatedAt || 0);
  return Number.isNaN(verified.getTime()) || Date.now() - verified.getTime() > 1000 * 60 * 60 * 24 * 120;
});

console.log(JSON.stringify({
  total: items.length,
  errors: errors.length,
  warnings: warnings.length,
  genericOrganizers: genericOrganizers.length,
  staleRecords: stale.length,
  collections: {
    current: items.filter((item) => !item.collection && item.status !== 'ended').length,
    practice: items.filter((item) => item.collection === 'practice').length,
    archive: items.filter((item) => item.collection === 'archive' || item.status === 'ended').length
  }
}, null, 2));

if (warnings.length) {
  console.warn(`Data audit warnings (${warnings.length}):`);
  warnings.slice(0, 20).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 20) console.warn(`- ...and ${warnings.length - 20} more`);
}

if (genericOrganizers.length) {
  console.warn(`${genericOrganizers.length} records still use generic organizer labels and require event-level review.`);
}

if (errors.length) {
  console.error(`Data audit errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

if (items.length < 150) {
  console.error(`Expected at least 150 competition records, received ${items.length}`);
  process.exit(1);
}

console.log('Competition data audit passed with no blocking errors.');
