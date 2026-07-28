const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const competitionPath = path.join(root, 'data/competitions-v1.json');
const dataDir = path.join(root, 'data');
const auditFiles = fs.readdirSync(dataDir)
  .filter((name) => /^event-audits-v\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (!auditFiles.length) throw new Error('No event audit files found.');

const payload = JSON.parse(fs.readFileSync(competitionPath, 'utf8'));
const batches = auditFiles.map((name) => ({
  name,
  ...JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')),
}));
const audits = new Map();

for (const batch of batches) {
  for (const record of batch.records || []) {
    if (audits.has(record.id)) throw new Error(`Duplicate audited competition id: ${record.id}`);
    audits.set(record.id, { ...record, auditedAt: batch.auditedAt, auditVersion: batch.version });
  }
}

const missing = [];
let applied = 0;
payload.competitions = payload.competitions.map((item) => {
  const audit = audits.get(item.id);
  if (!audit) return item;
  applied += 1;
  const { id, auditedAt, auditVersion, ...fields } = audit;
  return {
    ...item,
    ...fields,
    id,
    updatedAt: auditedAt,
    lastVerifiedAt: auditedAt,
    auditVersion,
  };
});

for (const id of audits.keys()) {
  if (!payload.competitions.some((item) => item.id === id)) missing.push(id);
}
if (missing.length) throw new Error(`Audit records reference missing competitions: ${missing.join(', ')}`);
if (applied !== audits.size) throw new Error(`Expected to apply ${audits.size} audits, applied ${applied}`);

const auditDates = batches.map((batch) => Date.parse(batch.auditedAt)).filter(Number.isFinite);
payload.latestVerifiedAt = new Date(Math.max(...auditDates)).toISOString();
payload.auditVersion = batches.map((batch) => `${batch.name}:${batch.version}`).join(',');
payload.auditedCount = payload.competitions.filter((item) => item.verificationStatus === 'reviewed').length;

fs.writeFileSync(competitionPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Applied ${applied} event-level audits from ${auditFiles.length} batches. Total reviewed: ${payload.auditedCount}.`);
