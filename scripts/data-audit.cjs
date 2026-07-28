const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const payload = JSON.parse(fs.readFileSync(path.join(root, 'data/competitions-v1.json'), 'utf8'));
const items = payload.competitions || [];
const required = ['id', 'title', 'organizer', 'track', 'deadline', 'summary', 'sourceUrl', 'sourceName', 'lastVerifiedAt'];
const reviewedRequired = ['language', 'eligibility', 'fee', 'deadlineTimezone', 'sourceLevel', 'entryStatus', 'auditSummary'];
const errors = [];
const warnings = [];

if (payload.count !== items.length) errors.push(`Payload count ${payload.count} does not match ${items.length} records`);

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

  if (!['S', 'A', 'B', 'C', 'U', 'R'].includes(item.grade)) errors.push(`${item.id} has invalid grade: ${item.grade}`);
  if (!['high', 'medium', 'low', 'unknown'].includes(item.confidence)) errors.push(`${item.id} has invalid confidence: ${item.confidence}`);

  if (item.verificationStatus === 'reviewed') {
    const reviewedMissing = reviewedRequired.filter((field) => !String(item[field] ?? '').trim());
    if (reviewedMissing.length) errors.push(`${item.id} reviewed record missing: ${reviewedMissing.join(', ')}`);
    if (['U', 'R'].includes(item.grade)) errors.push(`${item.id} reviewed record cannot use grade ${item.grade}`);
    if (!['high', 'medium'].includes(item.confidence)) errors.push(`${item.id} reviewed record must use high or medium confidence`);
    if (!['CN', 'INTL', 'domestic', 'international'].includes(item.region)) errors.push(`${item.id} reviewed record has invalid region: ${item.region}`);
    for (const field of ['authorityScore', 'resumeValue', 'growthValue']) {
      if (!Number.isInteger(item[field]) || item[field] < 1 || item[field] > 5) errors.push(`${item.id} has invalid ${field}: ${item[field]}`);
    }
    if (!Array.isArray(item.riskFlags)) errors.push(`${item.id} reviewed record must include riskFlags array`);
    if (!Array.isArray(item.evidenceUrls) || item.evidenceUrls.length === 0) {
      errors.push(`${item.id} reviewed record has no evidence URLs`);
    } else {
      for (const url of item.evidenceUrls) {
        try {
          const evidence = new URL(url);
          if (!['http:', 'https:'].includes(evidence.protocol)) throw new Error('unsupported');
        } catch {
          errors.push(`${item.id} has invalid evidence URL: ${url}`);
        }
      }
    }
  } else if (item.grade !== 'U') {
    warnings.push(`${item.id} is unreviewed but carries grade ${item.grade}`);
  }
}

const genericOrganizers = items.filter((item) => /赛事主办方|合作机构|组委会 \/|主办方待核验/i.test(item.organizer || ''));
const stale = items.filter((item) => {
  const verified = new Date(item.lastVerifiedAt || item.updatedAt || 0);
  return Number.isNaN(verified.getTime()) || Date.now() - verified.getTime() > 1000 * 60 * 60 * 24 * 120;
});
const reviewed = items.filter((item) => item.verificationStatus === 'reviewed');
const unreviewed = items.filter((item) => item.verificationStatus !== 'reviewed');
if (reviewed.length < 20) errors.push(`Expected at least 20 reviewed event records, received ${reviewed.length}`);
if (payload.auditedCount !== reviewed.length) errors.push(`Payload auditedCount ${payload.auditedCount} does not match ${reviewed.length}`);

console.log(JSON.stringify({
  version: payload.version,
  total: items.length,
  reviewed: reviewed.length,
  unreviewed: unreviewed.length,
  errors: errors.length,
  warnings: warnings.length,
  genericOrganizers: genericOrganizers.length,
  staleRecords: stale.length,
  collections: {
    current: items.filter((item) => item.collection === 'current' && item.status !== 'ended').length,
    practice: items.filter((item) => item.collection === 'practice').length,
    archive: items.filter((item) => item.collection === 'archive' || item.status === 'ended').length,
  },
}, null, 2));

if (warnings.length) {
  console.warn(`Data audit warnings (${warnings.length}):`);
  warnings.slice(0, 20).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 20) console.warn(`- ...and ${warnings.length - 20} more`);
}
if (genericOrganizers.length) console.warn(`${genericOrganizers.length} records still use generic organizer labels and require event-level review.`);
if (errors.length) {
  console.error(`Data audit errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
if (items.length < 150) {
  console.error(`Expected at least 150 competition records, received ${items.length}`);
  process.exit(1);
}
console.log('Canonical competition JSON audit passed with no blocking errors.');
