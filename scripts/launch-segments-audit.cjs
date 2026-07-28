const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
global.window = global;

for (const file of ['competition-data.generated.js', 'launch-segments.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

const data = window.AI_DATA || {};
const competitions = Array.isArray(data.competitions) ? data.competitions : [];
const segments = Array.isArray(data.launchSegments) ? data.launchSegments : [];
const failures = [];
const day = 86400000;
const now = Date.now();

if (segments.length !== 3) failures.push(`Expected 3 launch segments, received ${segments.length}`);
for (const expected of ['高价值精选', '零基础友好', '本周截止']) {
  if (!segments.some((segment) => segment.tag === expected)) failures.push(`Missing launch segment: ${expected}`);
}

const tagged = (tag) => competitions.filter((item) => (item.tags || []).includes(tag));
const highValue = tagged('高价值精选');
const beginner = tagged('零基础友好');
const week = tagged('本周截止');

if (!highValue.length) failures.push('High-value launch segment is empty');
if (!beginner.length) failures.push('Beginner-friendly launch segment is empty');

for (const item of highValue) {
  if (item.verificationStatus !== 'reviewed' || !['S', 'A'].includes(item.grade)) failures.push(`${item.id} is invalid in high-value segment`);
  if (item.entryStatus === 'restricted' || item.entryStatus === 'closed') failures.push(`${item.id} is not actionable in high-value segment`);
  if (new Date(item.deadline).getTime() < now) failures.push(`${item.id} is expired in high-value segment`);
}
for (const item of beginner) {
  if (item.verificationStatus !== 'reviewed' || item.difficulty !== '入门') failures.push(`${item.id} is invalid in beginner segment`);
  if (item.entryStatus === 'restricted' || item.entryStatus === 'closed') failures.push(`${item.id} is not actionable in beginner segment`);
  if (new Date(item.deadline).getTime() < now) failures.push(`${item.id} is expired in beginner segment`);
}
for (const item of week) {
  const daysLeft = Math.ceil((new Date(item.deadline).getTime() - now) / day);
  if (daysLeft < 0 || daysLeft > 7) failures.push(`${item.id} is outside the seven-day window`);
  if (item.entryStatus === 'restricted' || item.entryStatus === 'closed') failures.push(`${item.id} is not actionable in weekly segment`);
}

for (const segment of segments) {
  const actual = tagged(segment.tag).length;
  if (segment.count !== actual) failures.push(`${segment.tag} count mismatch: ${segment.count} vs ${actual}`);
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const file of ['launch-segments.js', 'launch-entrypoints.js', 'launch-entrypoints.css']) {
  if (!index.includes(file)) failures.push(`index.html does not load ${file}`);
}
const ui = fs.readFileSync(path.join(root, 'launch-entrypoints.js'), 'utf8');
for (const text of ['按你现在最需要的方式找比赛', '已审核的高价值比赛', '零基础也能开始的比赛', '7 天内截止的比赛']) {
  if (!ui.includes(text)) failures.push(`Launch UI missing copy: ${text}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Launch segments audit passed: ${highValue.length} high-value, ${beginner.length} beginner, ${week.length} weekly.`);
