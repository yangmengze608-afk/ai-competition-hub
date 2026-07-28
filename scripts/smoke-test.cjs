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
  querySelectorAll() { return []; }
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
  querySelectorAll() { return []; }
});

global.window = global;
global.location = { hash: '#/' };
global.document = {
  documentElement: noopElement(),
  body: noopElement(),
  getElementById(id) { return id === 'app' ? app : null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement: noopElement
};
global.localStorage = { getItem() { return null; }, setItem() {} };
global.navigator = { clipboard: { async writeText() {} } };
global.matchMedia = () => ({ matches: true });
global.alert = () => {};
global.requestAnimationFrame = (callback) => callback();
global.cancelAnimationFrame = () => {};
global.scrollTo = () => {};
global.window.scrollTo = () => {};
global.window.addEventListener = on;
global.window.removeEventListener = () => {};
global.MutationObserver = class {
  observe() {}
  disconnect() {}
};

const scripts = [
  'data.js',
  'real-competitions.js',
  'expanded-competitions-1.js',
  'expanded-competitions-2.js',
  'expanded-competitions-3.js',
  'expanded-competitions-4.js',
  'expanded-competitions-devpost-v5.js',
  'real-competition-config.js',
  'competition-pagination.js',
  'app.js'
];

for (const file of scripts) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

emit('DOMContentLoaded');

if (!window.AI_DATA || window.AI_DATA.competitions.length < 150) {
  throw new Error(`Expected at least 150 competitions, received ${window.AI_DATA?.competitions?.length ?? 0}`);
}

if (!app.innerHTML.includes('AI 赛场')) {
  throw new Error('Homepage failed to render');
}

location.hash = '#/competitions';
emit('hashchange');

const cardCount = (app.innerHTML.match(/class="competition-card"/g) || []).length;
if (cardCount === 0) throw new Error('Competition library rendered no cards');
if (cardCount > 24) throw new Error(`Competition library rendered ${cardCount} cards instead of a paginated first page`);

const pagination = window.AI_DATA.competitionPagination;
if (!pagination || pagination.filteredTotal < 150 || pagination.shown > 24) {
  throw new Error(`Pagination state invalid: ${JSON.stringify(pagination)}`);
}

console.log(`Smoke test passed: ${window.AI_DATA.competitions.length} total competitions, ${cardCount} cards on first page.`);
