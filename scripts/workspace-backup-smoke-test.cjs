const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();

global.window = global;
global.location = { hash: '#/workspace' };
global.document = {
  querySelector() { return null; },
  createElement() { return { click() {}, remove() {}, hidden: false, href: '', download: '' }; },
  body: { appendChild() {} },
};
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
global.window.addEventListener = () => {};
global.setTimeout = (callback) => callback();

for (const file of [
  'data.js',
  'competition-data.generated.js',
  'playbook-data.generated.js',
  'participation-workspace-v1.js',
  'workspace-backup-v1.js',
]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

if (!window.AI_WORKSPACE_BACKUP) throw new Error('Workspace backup API did not load');
const api = window.AI_WORKSPACE_BACKUP;
const workspaceApi = window.AI_WORKSPACE;
const competition = window.AI_DATA.competitions.find((item) =>
  window.AI_DATA.playbooks.some((playbook) => playbook.competitionId === item.id)
);
if (!competition) throw new Error('No competition with a playbook is available');

const created = workspaceApi.createWorkspace(competition.id);
workspaceApi.toggleTask(competition.id, created.tasks[0].id, true);
workspaceApi.addTask(competition.id, '备份前完成一次演示彩排');
workspaceApi.updateNotes(competition.id, '需要跨设备保留的测试备注');

const exportedAt = new Date('2026-07-31T02:00:00Z');
const serialized = api.serializeBackup(workspaceApi.listWorkspaces(), exportedAt);
const payload = JSON.parse(serialized);
if (payload.type !== 'aisaichang-workspace-backup' || payload.version !== 1) {
  throw new Error('Backup envelope is invalid');
}
if (payload.workspaceCount !== 1 || payload.exportedAt !== exportedAt.toISOString()) {
  throw new Error('Backup metadata is invalid');
}
if (!serialized.includes('需要跨设备保留的测试备注')) throw new Error('Backup omitted workspace notes');

storage.delete(workspaceApi.storageKey);
let imported = api.importBackupText(serialized);
if (!imported.ok || imported.added !== 1 || imported.merged !== 0) {
  throw new Error(`Initial restore failed: ${JSON.stringify(imported)}`);
}
let restored = workspaceApi.getWorkspace(competition.id);
if (!restored || restored.notes !== '需要跨设备保留的测试备注') throw new Error('Restored notes are missing');
if (!restored.tasks.some((task) => task.title === '备份前完成一次演示彩排')) throw new Error('Restored custom task is missing');
if (!restored.tasks[0].completed) throw new Error('Restored completion state is missing');

const taskCountBeforeRepeat = restored.tasks.length;
imported = api.importBackupText(serialized);
restored = workspaceApi.getWorkspace(competition.id);
if (!imported.ok || imported.added !== 0 || imported.merged !== 1) throw new Error('Repeated import did not merge');
if (workspaceApi.listWorkspaces().length !== 1) throw new Error('Repeated import duplicated the workspace');
if (restored.tasks.length !== taskCountBeforeRepeat) throw new Error('Repeated import duplicated tasks');

const collisionId = restored.tasks[0].id;
const newerBackup = {
  type: api.backupType,
  version: api.backupVersion,
  exportedAt: '2099-01-01T00:00:00Z',
  workspaceCount: 1,
  workspaces: [{
    ...restored,
    updatedAt: '2099-01-01T00:00:00Z',
    notes: '来自另一台设备的更新备注',
    tasks: [
      { ...restored.tasks[0], completed: false },
      { id: collisionId, phase: '导入冲突', title: '同一任务 ID 的另一项任务', completed: false },
    ],
  }],
};
imported = api.importBackupText(JSON.stringify(newerBackup));
restored = workspaceApi.getWorkspace(competition.id);
if (!imported.ok || restored.notes !== '来自另一台设备的更新备注') throw new Error('Newer workspace did not win metadata conflict');
if (!restored.tasks.some((task) => task.title === '同一任务 ID 的另一项任务')) throw new Error('Conflicting task was not preserved');
if (!restored.tasks.find((task) => task.title === created.tasks[0].title)?.completed) {
  throw new Error('Completed task state was lost during merge');
}
const ids = restored.tasks.map((task) => task.id);
if (new Set(ids).size !== ids.length) throw new Error('Merged tasks contain duplicate IDs');

const storageSnapshot = storage.get(workspaceApi.storageKey);
for (const [label, source] of [
  ['invalid JSON', '{not-json'],
  ['wrong type', JSON.stringify({ type: 'other', version: 1, workspaces: [] })],
  ['future version', JSON.stringify({ type: api.backupType, version: 99, workspaces: [] })],
  ['invalid workspace', JSON.stringify({ type: api.backupType, version: 1, workspaces: [{ competitionId: '<script>' }] })],
  ['too large', 'x'.repeat(api.maxFileBytes + 1)],
]) {
  const result = api.importBackupText(source);
  if (result.ok) throw new Error(`${label} backup was accepted`);
  if (storage.get(workspaceApi.storageKey) !== storageSnapshot) throw new Error(`${label} backup changed stored data`);
}

const tooMany = api.parseBackupText(JSON.stringify({
  type: api.backupType,
  version: api.backupVersion,
  workspaces: Array.from({ length: 101 }, (_, index) => ({ competitionId: `competition-${index}`, tasks: [] })),
}));
if (tooMany.ok) throw new Error('Oversized workspace collection was accepted');

const panel = api.renderBackupPanel(2);
for (const expected of ['备份与恢复参赛计划', '导出全部计划（2）', '导入备份', '不会整库覆盖']) {
  if (!panel.includes(expected)) throw new Error(`Backup panel is missing: ${expected}`);
}

const filename = api.backupFilename(new Date('2026-07-31T00:00:00Z'));
if (filename !== 'AI赛场-参赛计划备份-2026-07-31.json') throw new Error(`Unexpected backup filename: ${filename}`);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('workspace-backup-v1.css') || !index.includes('workspace-backup-v1.js')) {
  throw new Error('Backup assets are not loaded by index.html');
}
const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
if (!workflow.includes('node scripts/workspace-backup-smoke-test.cjs')) {
  throw new Error('Workspace backup test is not wired into GitHub Actions');
}

console.log(`Workspace backup smoke test passed with ${restored.tasks.length} merged tasks.`);