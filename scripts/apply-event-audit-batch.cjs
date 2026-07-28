const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const batchPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : null;

if (!batchPath || !fs.existsSync(batchPath)) {
  throw new Error('Usage: node scripts/apply-event-audit-batch.cjs <batch-json>');
}

const canonicalPath = path.join(root, 'data/competitions-v1.json');
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

if (!Array.isArray(batch.updates) || !batch.updates.length) {
  throw new Error('Audit batch must contain a non-empty updates array');
}

const byId = new Map(canonical.competitions.map((item) => [item.id, item]));
const seen = new Set();

for (const update of batch.updates) {
  if (!update.id || seen.has(update.id)) throw new Error(`Invalid or duplicate audit id: ${update.id}`);
  seen.add(update.id);
  const current = byId.get(update.id);
  if (!current) throw new Error(`Competition not found: ${update.id}`);
  if (update.verificationStatus !== 'reviewed') throw new Error(`Audit must mark reviewed: ${update.id}`);
  if (!['S', 'A', 'B', 'C', 'R'].includes(update.grade)) throw new Error(`Invalid audited grade: ${update.id}`);
  if (!Array.isArray(update.evidenceUrls) || update.evidenceUrls.length < 1) throw new Error(`Missing evidence URLs: ${update.id}`);
  Object.assign(current, update);
}

const reviewedCount = canonical.competitions.filter((item) => item.verificationStatus === 'reviewed').length;
if (reviewedCount < Number(batch.expectedReviewedCount || 0)) {
  throw new Error(`Reviewed count ${reviewedCount} is below expected ${batch.expectedReviewedCount}`);
}

canonical.auditedCount = reviewedCount;
canonical.latestVerifiedAt = batch.verifiedAt;
canonical.version = batch.targetVersion || canonical.version;
fs.writeFileSync(canonicalPath, `${JSON.stringify(canonical, null, 2)}\n`);
console.log(`Applied ${batch.updates.length} event audits. Reviewed total: ${reviewedCount}.`);