const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const futureCompetition = {
  id: 'calendar-test',
  title: 'AI,赛场;提醒\\测试\n第二行',
  deadline: '2099-08-13T15:59:59Z',
  deadlineText: '2099 年 8 月 13 日 23:59',
  deadlineTimezone: 'UTC+8',
  status: 'ongoing',
  collection: 'current',
  entryStatus: 'open',
  sourceUrl: 'https://example.com/competition',
};

global.window = global;
global.window.AI_DATA = { competitions: [futureCompetition] };
global.location = { hash: '#/competitions/calendar-test' };
global.document = {
  querySelector() { return null; },
  createElement() { return { click() {}, remove() {}, hidden: false, href: '', download: '' }; },
  body: { appendChild() {} },
};
global.window.addEventListener = () => {};
global.setTimeout = () => 0;

vm.runInThisContext(fs.readFileSync(path.join(root, 'deadline-calendar-v1.js'), 'utf8'), {
  filename: 'deadline-calendar-v1.js',
});

if (!window.AI_CALENDAR) throw new Error('Calendar API was not exposed');
const generatedAt = new Date('2026-07-31T00:00:00Z');
const content = window.AI_CALENDAR.buildCalendarContent(futureCompetition, generatedAt);
if (!content) throw new Error('Future competition did not generate a calendar file');

for (const expected of [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'UID:calendar-test-deadline@aisaichang.cn',
  'DTSTAMP:20260731T000000Z',
  'DTSTART:20990813T155959Z',
  'DTEND:20990813T162959Z',
  'TRIGGER:-P7D',
  'TRIGGER:-P1D',
  'URL:https://example.com/competition',
  'END:VCALENDAR',
]) {
  if (!content.includes(expected)) throw new Error(`Calendar content is missing: ${expected}`);
}

if (!content.includes('SUMMARY:截止｜AI\\,赛场\\;提醒\\\\测试\\n第二行')) {
  throw new Error('Calendar text escaping is invalid');
}
if (!content.includes('\r\n')) throw new Error('Calendar output must use CRLF line endings');

const filename = window.AI_CALENDAR.calendarFilename({ title: 'A/B:C*D?' });
if (/[\\/:*?"<>|]/.test(filename) || !filename.endsWith('.ics')) {
  throw new Error(`Calendar filename is unsafe: ${filename}`);
}

if (window.AI_CALENDAR.eligibleForReminder({ ...futureCompetition, collection: 'practice' }, generatedAt.getTime())) {
  throw new Error('Long-term practice should not expose a deadline reminder');
}
if (window.AI_CALENDAR.eligibleForReminder({ ...futureCompetition, status: 'ended' }, generatedAt.getTime())) {
  throw new Error('Ended competition should not expose a deadline reminder');
}
if (window.AI_CALENDAR.buildCalendarContent({ ...futureCompetition, deadline: '2020-01-01T00:00:00Z' }, generatedAt)) {
  throw new Error('Expired competition generated a calendar file');
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('deadline-calendar-v1.css') || !index.includes('deadline-calendar-v1.js')) {
  throw new Error('Calendar assets are not loaded by index.html');
}

const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
if (!workflow.includes('node scripts/deadline-calendar-smoke-test.cjs')) {
  throw new Error('Calendar smoke test is not wired into GitHub Actions');
}

console.log('Deadline calendar smoke test passed.');
