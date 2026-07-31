const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const guide = fs.readFileSync('activation-guide-v1.js', 'utf8');
const analytics = fs.readFileSync('analytics-v1.js', 'utf8');
const docs = fs.readFileSync('docs/activation-beta-v0.7.md', 'utf8');

for (const token of [
  'FIRST REAL ACTION',
  '今天先完成一个真实动作',
  'ACTIVATED',
  '你已经真正启动这场比赛',
  '[data-workspace-task]:checked',
  'data-calendar-reminder=',
  'downloadCalendar?.(item)',
  '[data-start-workspace]',
]) {
  if (!guide.includes(token)) throw new Error(`activation guide missing: ${token}`);
}

for (const token of [
  'workspace_create',
  'workspace_open',
  'workspace_task_complete',
  'workspace_first_task_complete',
  'calendar_download',
]) {
  if (!analytics.includes(token) && !guide.includes(token)) {
    throw new Error(`activation event missing: ${token}`);
  }
}

for (const forbidden of [
  'localStorage',
  'sessionStorage',
  'document.cookie',
  'workspace-notes',
  'data-workspace-notes',
  'new FormData',
]) {
  if (guide.includes(forbidden)) throw new Error(`activation guide accesses forbidden user data: ${forbidden}`);
}

if (!guide.includes("track('workspace_task_complete', id)")) {
  throw new Error('task completion event is not emitted');
}
if (!guide.includes("if (completedNow === 1) track('workspace_first_task_complete', id)")) {
  throw new Error('first-task milestone is not isolated');
}
if (!guide.includes("track(/加入|创建/.test(label) ? 'workspace_create' : 'workspace_open', id)")) {
  throw new Error('workspace create and return actions are not distinguished');
}
if (!docs.includes('Weekly activated participants')) {
  throw new Error('activation north-star metric is not documented');
}
if (!docs.includes('task titles or task counts')) {
  throw new Error('activation privacy boundary is not documented');
}

const cssIndex = index.indexOf('activation-guide-v1.css');
const guideIndex = index.indexOf('activation-guide-v1.js');
const analyticsIndex = index.indexOf('analytics-v1.js');
if (cssIndex < 0 || guideIndex < 0) throw new Error('activation guide assets are not loaded');
if (!(guideIndex < analyticsIndex)) throw new Error('activation guide must initialize before analytics adapter');

console.log('Activation Beta v0.7 audit passed.');
