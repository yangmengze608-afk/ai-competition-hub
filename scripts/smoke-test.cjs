const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const listeners = new Map();

function on(event, handler) {
  const items = listeners.get(event) || [];
  items.push(handler);
  listeners.set(event, items);
}

function emit(event) {
  for (const handler of listeners.get(event) || []) handler();
}

const app = {
  innerHTML: '',
  querySelector() { return null; },
  querySelectorAll() { return []; },
};

const noopElement = () => ({
  innerHTML: '',
  textContent: '',
  dataset: {},
  style: {},
  classList: { add() {}, remove() {}, toggle() {} },
  appendChild() {},
  remove() {},
  setAttribute() {},
  removeAttribute() {},
  hasAttribute() { return false; },
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  matches() { return false; },
});

global.window = global;
global.location = { hash: '', pathname: '/ai-competition-hub/', search: '' };
global.history = {
  replaceState(_state, _title, url) {
    const index = String(url).indexOf('#');
    location.hash = index >= 0 ? String(url).slice(index) : '';
  },
};
global.document = {
  documentElement: noopElement(),
  body: noopElement(),
  getElementById(id) { return id === 'app' ? app : null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement: noopElement,
};
global.localStorage = { getItem() { return null; }, setItem() {} };
global.navigator = { clipboard: { async writeText() {} } };
global.matchMedia = () => ({ matches: true });
global.requestAnimationFrame = (callback) => callback();
global.cancelAnimationFrame = () => {};
global.scrollTo = () => {};
global.window.scrollTo = () => {};
global.window.addEventListener = on;
global.window.removeEventListener = () => {};
global.FormData = class { get() { return ''; } };

const scripts = [
  'route-bootstrap.js',
  'data.js',
  'competition-data.generated.js',
  'commercial-app.js',
];

for (const file of scripts) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

if (location.hash !== '#/') throw new Error(`Bare route was not normalized: ${location.hash}`);
emit('DOMContentLoaded');

const payload = JSON.parse(fs.readFileSync(path.join(root, 'data/competitions-v1.json'), 'utf8'));
if (!window.AI_DATA || window.AI_DATA.competitions.length < 150) {
  throw new Error(`Expected at least 150 competitions, received ${window.AI_DATA?.competitions?.length ?? 0}`);
}
if (window.AI_DATA.competitions.length !== payload.count) {
  throw new Error(`Runtime bundle count ${window.AI_DATA.competitions.length} does not match JSON count ${payload.count}`);
}

if (!app.innerHTML.includes('只参加真正值得的')) {
  throw new Error('Commercial homepage failed to render');
}
if (app.innerHTML.includes('演示数据') || app.innerHTML.includes('占位')) {
  throw new Error('Public homepage still contains prototype copy');
}

const current = window.AI_DATA.competitions
  .filter((item) => item.collection === 'current' && item.status !== 'ended')
  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

location.hash = '#/competitions';
emit('hashchange');

let cardCount = (app.innerHTML.match(/class="competition-card"/g) || []).length;
if (cardCount === 0) throw new Error('Competition library rendered no cards');
if (cardCount > 24) throw new Error(`First page rendered ${cardCount} cards instead of at most 24`);
if (app.innerHTML.includes('status-ended')) throw new Error('Default current opportunities include ended events');
if (current[0] && !app.innerHTML.includes(current[0].title)) {
  throw new Error('Global deadline sorting did not place the earliest current opportunity on the first page');
}

location.hash = '#/competitions?page=2';
emit('hashchange');
cardCount = (app.innerHTML.match(/class="competition-card"/g) || []).length;
if (cardCount <= 24 || cardCount > 48) throw new Error(`Second page cumulative render is invalid: ${cardCount}`);

const detail = current.find((item) => item.sourceUrl);
if (!detail) throw new Error('No current competition with an official source URL');
location.hash = `#/competitions/${encodeURIComponent(detail.id)}`;
emit('hashchange');
if (!app.innerHTML.includes('查看官方页面')) throw new Error('Competition detail is missing the official-page action');
if (app.innerHTML.includes('参赛方案整理中') || app.innerHTML.includes('接入真实比赛数据后开放')) {
  throw new Error('Competition detail still contains unfinished public actions');
}

console.log(`Commercial smoke test passed: ${window.AI_DATA.competitions.length} competitions, ${current.length} current opportunities.`);
