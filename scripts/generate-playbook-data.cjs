const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const inputPath = path.join(root, 'data/playbooks-v1.json');
const outputPath = path.join(root, 'playbook-data.generated.js');
const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (!Array.isArray(payload.playbooks) || payload.playbooks.length < 10) {
  throw new Error(`Expected at least 10 playbooks, received ${payload.playbooks?.length ?? 0}`);
}
if (payload.count !== payload.playbooks.length) {
  throw new Error(`Payload count ${payload.count} does not match ${payload.playbooks.length} playbooks`);
}

const ids = new Set();
for (const playbook of payload.playbooks) {
  for (const field of ['id', 'competitionId', 'title', 'goal', 'fit']) {
    if (!String(playbook[field] || '').trim()) throw new Error(`${playbook.id || '(missing id)'} missing ${field}`);
  }
  if (ids.has(playbook.id)) throw new Error(`Duplicate playbook id: ${playbook.id}`);
  ids.add(playbook.id);
  if (!Array.isArray(playbook.stages) || playbook.stages.length < 3) throw new Error(`${playbook.id} needs at least 3 stages`);
  if (!Array.isArray(playbook.submissionChecklist) || playbook.submissionChecklist.length < 3) throw new Error(`${playbook.id} needs a submission checklist`);
}

const runtime = `(() => {\n  const payload = ${JSON.stringify(payload)};\n  window.AI_DATA = window.AI_DATA || {};\n  window.AI_DATA.playbooks = payload.playbooks;\n  window.AI_DATA.playbookDataVersion = payload.version;\n})();\n`;
fs.writeFileSync(outputPath, runtime);
console.log(`Generated playbook runtime: ${payload.playbooks.length} playbooks.`);
