const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const competitionPayload = JSON.parse(fs.readFileSync(path.join(root, 'data/competitions-v1.json'), 'utf8'));
const playbookPayload = JSON.parse(fs.readFileSync(path.join(root, 'data/playbooks-v1.json'), 'utf8'));
const competitions = new Map((competitionPayload.competitions || []).map((item) => [item.id, item]));
const playbooks = playbookPayload.playbooks || [];
const errors = [];
const ids = new Set();
const competitionIds = new Set();

if (playbookPayload.count !== playbooks.length) errors.push(`Playbook count ${playbookPayload.count} does not match ${playbooks.length}`);
if (playbooks.length < 10) errors.push(`Expected at least 10 playbooks, received ${playbooks.length}`);

for (const playbook of playbooks) {
  if (ids.has(playbook.id)) errors.push(`Duplicate playbook id: ${playbook.id}`);
  ids.add(playbook.id);
  if (competitionIds.has(playbook.competitionId)) errors.push(`Multiple first-batch playbooks target the same competition: ${playbook.competitionId}`);
  competitionIds.add(playbook.competitionId);

  const competition = competitions.get(playbook.competitionId);
  if (!competition) {
    errors.push(`${playbook.id} references missing competition: ${playbook.competitionId}`);
    continue;
  }
  if (competition.verificationStatus !== 'reviewed') errors.push(`${playbook.id} targets an unreviewed competition`);
  if (['restricted', 'closed'].includes(competition.entryStatus)) errors.push(`${playbook.id} targets a non-actionable competition with entryStatus=${competition.entryStatus}`);

  for (const field of ['title', 'goal', 'fit', 'pace']) {
    if (!String(playbook[field] || '').trim()) errors.push(`${playbook.id} missing ${field}`);
  }
  if (!Number.isInteger(playbook.durationDays) || playbook.durationDays < 1 || playbook.durationDays > 60) errors.push(`${playbook.id} has invalid durationDays: ${playbook.durationDays}`);

  const arrays = {
    deliverables: 3,
    stopConditions: 2,
    stages: 3,
    stack: 3,
    submissionChecklist: 3,
    risks: 2,
  };
  for (const [field, minimum] of Object.entries(arrays)) {
    if (!Array.isArray(playbook[field]) || playbook[field].length < minimum) errors.push(`${playbook.id} needs at least ${minimum} ${field}`);
  }

  for (const [index, stage] of (playbook.stages || []).entries()) {
    for (const field of ['label', 'title', 'focus', 'exitCriteria']) {
      if (!String(stage[field] || '').trim()) errors.push(`${playbook.id} stage ${index + 1} missing ${field}`);
    }
    if (!Array.isArray(stage.tasks) || stage.tasks.length < 3) errors.push(`${playbook.id} stage ${index + 1} needs at least 3 tasks`);
  }
}

global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(root, 'playbook-data.generated.js'), 'utf8'), { filename: 'playbook-data.generated.js' });
if (!window.AI_DATA || !Array.isArray(window.AI_DATA.playbooks)) errors.push('Generated playbook runtime did not initialize AI_DATA.playbooks');
else if (window.AI_DATA.playbooks.length !== playbooks.length) errors.push(`Runtime playbook count ${window.AI_DATA.playbooks.length} does not match JSON count ${playbooks.length}`);

const pageSource = fs.readFileSync(path.join(root, 'playbook-pages.js'), 'utf8');
for (const marker of ["path === '/playbooks'", "path.startsWith('/playbooks/')", '这场比赛已有完整参赛路线', '出现这些情况就停止投入', '进入下一阶段前']) {
  if (!pageSource.includes(marker)) errors.push(`Playbook page implementation missing marker: ${marker}`);
}

if (errors.length) {
  console.error(`Playbook audit errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  playbooks: playbooks.length,
  reviewedCompetitionsCovered: competitionIds.size,
  stages: playbooks.reduce((sum, item) => sum + item.stages.length, 0),
  totalPlannedDays: playbooks.reduce((sum, item) => sum + item.durationDays, 0),
}, null, 2));
console.log('Playbook data and route audit passed.');
