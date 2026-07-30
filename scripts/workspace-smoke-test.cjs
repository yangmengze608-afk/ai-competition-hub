const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();

global.window = global;
global.location = { hash: '#/' };
global.document = { querySelector() { return null; } };
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
global.window.addEventListener = () => {};
global.setTimeout = (callback) => callback();

for (const file of ['data.js', 'competition-data.generated.js', 'playbook-data.generated.js', 'participation-workspace-v1.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

if (!window.AI_WORKSPACE) throw new Error('Workspace API did not load');

const competition = window.AI_DATA.competitions.find((item) =>
  window.AI_DATA.playbooks.some((playbook) => playbook.competitionId === item.id)
);
if (!competition) throw new Error('No competition with a playbook is available');

const workspace = window.AI_WORKSPACE.createWorkspace(competition.id);
if (!workspace || workspace.competitionId !== competition.id) throw new Error('Workspace creation failed');
if (workspace.tasks.length < 8) throw new Error(`Workspace checklist is too short: ${workspace.tasks.length}`);
if (window.AI_WORKSPACE.progress(workspace).percent !== 0) throw new Error('A new workspace should start at 0%');

const firstTask = workspace.tasks[0];
window.AI_WORKSPACE.toggleTask(competition.id, firstTask.id, true);
let updated = window.AI_WORKSPACE.getWorkspace(competition.id);
if (!updated.tasks.find((task) => task.id === firstTask.id)?.completed) throw new Error('Task completion was not persisted');
if (window.AI_WORKSPACE.progress(updated).percent <= 0) throw new Error('Task completion did not change progress');

window.AI_WORKSPACE.addTask(competition.id, '完成一次提交前彩排');
window.AI_WORKSPACE.updateNotes(competition.id, '测试备注');
updated = window.AI_WORKSPACE.getWorkspace(competition.id);
if (!updated.tasks.some((task) => task.title === '完成一次提交前彩排')) throw new Error('Custom task was not persisted');
if (updated.notes !== '测试备注') throw new Error('Notes were not persisted');

const detailHtml = window.AI_WORKSPACE.renderWorkspace(competition.id);
for (const expected of ['LOCAL PARTICIPATION WORKSPACE', '执行任务', '整体进度', '我的备注', competition.title]) {
  if (!detailHtml.includes(expected)) throw new Error(`Workspace detail is missing: ${expected}`);
}

const listHtml = window.AI_WORKSPACE.renderWorkspaceList();
if (!listHtml.includes(competition.title) || !listHtml.includes('继续推进')) throw new Error('Workspace list did not render the saved competition');

if (!window.AI_WORKSPACE.deleteWorkspace(competition.id)) throw new Error('Workspace deletion failed');
if (window.AI_WORKSPACE.getWorkspace(competition.id)) throw new Error('Deleted workspace still exists');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!indexHtml.includes('participation-workspace-v1.css') || !indexHtml.includes('participation-workspace-v1.js')) {
  throw new Error('Workspace assets are not loaded by index.html');
}

console.log(`Workspace smoke test passed with ${workspace.tasks.length} generated tasks.`);
