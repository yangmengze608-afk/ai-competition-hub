const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const competitionPath = path.join(root, 'data/competitions-v1.json');
const auditPath = path.join(root, 'data/event-audits-v1.json');

const payload = JSON.parse(fs.readFileSync(competitionPath, 'utf8'));
const auditPayload = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const audits = new Map((auditPayload.records || []).map((item) => [item.id, item]));
const missing = [];
let applied = 0;

payload.competitions = payload.competitions.map((item) => {
  const audit = audits.get(item.id);
  if (!audit) return item;
  applied += 1;
  const { id, ...fields } = audit;
  return {
    ...item,
    ...fields,
    id,
    updatedAt: auditPayload.auditedAt,
    lastVerifiedAt: auditPayload.auditedAt,
  };
});

for (const id of audits.keys()) {
  if (!payload.competitions.some((item) => item.id === id)) missing.push(id);
}

if (missing.length) {
  throw new Error(`Audit records reference missing competitions: ${missing.join(', ')}`);
}
if (applied !== audits.size) {
  throw new Error(`Expected to apply ${audits.size} audits, applied ${applied}`);
}

payload.latestVerifiedAt = auditPayload.auditedAt;
payload.auditVersion = auditPayload.version;
payload.auditedCount = payload.competitions.filter((item) => item.verificationStatus === 'reviewed').length;

fs.writeFileSync(competitionPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Applied ${applied} event-level audits. Total reviewed: ${payload.auditedCount}.`);
