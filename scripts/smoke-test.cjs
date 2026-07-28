const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const listeners = new Map();
function on(event, handler) { const items = listeners.get(event) || []; items.push(handler); listeners.set(event, items); }
function emit(event) { for (const handler of listeners.get(event) || []) handler(); }

const app = { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; } };
const noopElement = () => ({
  innerHTML: '', textContent: '', dataset: {}, style: {},
  classList: { add() {}, remove() {}, toggle() {} },
  appendChild() {}, remove() {}, setAttribute() {}, removeAttribute() {}, hasAttribute() { return false; },
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, matches() { return false; },
});

global.window = global;
global.location = { hash: '', pathname: '/ai-competition-hub/', search: '' };
global.history = { replaceState(_state, _title, url) { const index = String(url).indexOf('#'); location.hash = index >= 0 ? String(url).slice(index) : ''; } };
global.document = {
  documentElement: noopElement(), body: noopElement(),
  getElementById(id) { return id === 'app' ? app : null; },
  querySelector() { return null; }, querySelectorAll() { return []; }, createElement: noopElement,
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

for (const file of ['route-bootstrap.js', 'data.js', 'competition-data.generated.js', 'playbook-data.generated.js', 'commercial-app-v3.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

if (location.hash !== '#/') throw new Error(`Bare route was not normalized: ${location.hash}`);
emit('DOMContentLoaded');

const payload = JSON.parse(fs.readFileSync(path.join(root, 'data/competitions-v1.json'), 'utf8'));
const playbookPayload = JSON.parse(fs.readFileSync(path.join(root, 'data/playbooks-v1.json'), 'utf8'));
if (!window.AI_DATA || window.AI_DATA.competitions.length < 150) throw new Error(`Expected at least 150 competitions, received ${window.AI_DATA?.competitions?.length ?? 0}`);
if (window.AI_DATA.competitions.length !== payload.count) throw new Error(`Runtime bundle count ${window.AI_DATA.competitions.length} does not match JSON count ${payload.count}`);
if (!Array.isArray(window.AI_DATA.playbooks) || window.AI_DATA.playbooks.length !== playbookPayload.count) throw new Error('Playbook runtime failed to load or does not match JSON count');

const reviewed = window.AI_DATA.competitions.filter((item) => item.verificationStatus === 'reviewed');
const unreviewed = window.AI_DATA.competitions.filter((item) => item.verificationStatus !== 'reviewed');
if (reviewed.length < 20) throw new Error(`Expected at least 20 reviewed competitions, received ${reviewed.length}`);
if (!unreviewed.length) throw new Error('Expected unreviewed competitions to remain visibly differentiated');
for (const playbook of window.AI_DATA.playbooks) {
  const competition = window.AI_DATA.competitions.find((item) => item.id === playbook.competitionId);
  if (!competition || competition.verificationStatus !== 'reviewed') throw new Error(`${playbook.id} does not point to a reviewed competition`);
}

if (!app.innerHTML.includes('只参加真正值得的')) throw new Error('Commercial homepage failed to render');
if (app.innerHTML.includes('演示数据') || app.innerHTML.includes('占位')) throw new Error('Public homepage still contains prototype copy');
if (!app.innerHTML.includes(`${reviewed.length} 场完成赛事级审核`)) throw new Error('Homepage does not report audited event count');

const current = window.AI_DATA.competitions
  .filter((item) => item.collection === 'current' && item.status !== 'ended')
  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

location.hash = '#/competitions';
emit('hashchange');
let cardCount = (app.innerHTML.match(/class="competition-card"/g) || []).length;
if (cardCount === 0) throw new Error('Competition library rendered no cards');
if (cardCount > 24) throw new Error(`First page rendered ${cardCount} cards instead of at most 24`);
if (!app.innerHTML.includes('推荐（规则排序）') || !app.innerHTML.includes('按透明推荐规则排序')) throw new Error('Recommended sort is missing or not explained');
if (!app.innerHTML.includes('U · 待核验')) throw new Error('Unreviewed competitions are not visibly marked U');
if (!app.innerHTML.includes('已审核')) throw new Error('Reviewed competitions are not visibly marked as audited');

location.hash = '#/competitions?sort=deadline';
emit('hashchange');
if (current[0] && !app.innerHTML.includes(current[0].title)) throw new Error('Global deadline sorting did not place the earliest current opportunity on the first page');

location.hash = '#/competitions?region=CN';
emit('hashchange');
if (!app.innerHTML.includes('data-region="CN"')) throw new Error('Domestic filter rendered no domestic competitions');
if (app.innerHTML.includes('data-region="INTL"')) throw new Error('Domestic filter leaked international competitions');

location.hash = '#/competitions?region=INTL';
emit('hashchange');
if (!app.innerHTML.includes('data-region="INTL"')) throw new Error('International filter rendered no international competitions');
if (app.innerHTML.includes('data-region="CN"')) throw new Error('International filter leaked domestic competitions');

location.hash = '#/competitions?page=2';
emit('hashchange');
cardCount = (app.innerHTML.match(/class="competition-card"/g) || []).length;
if (cardCount <= 24 || cardCount > 48) throw new Error(`Second page cumulative render is invalid: ${cardCount}`);

const auditedDetail = reviewed.find((item) => item.sourceUrl && item.auditSummary && item.eligibility && item.fee);
if (!auditedDetail) throw new Error('No fully audited detail record available');
location.hash = `#/competitions/${encodeURIComponent(auditedDetail.id)}`;
emit('hashchange');
for (const expected of ['查看官方页面', '赛事价值判断', '参赛前确认', '报名资格', '费用', '截止时区', '核验依据', '权威性', '履历价值', '成长价值']) {
  if (!app.innerHTML.includes(expected)) throw new Error(`Audited detail is missing: ${expected}`);
}

const restricted = reviewed.find((item) => item.entryStatus === 'restricted');
if (!restricted) throw new Error('No restricted audited event found');
location.hash = `#/competitions/${encodeURIComponent(restricted.id)}`;
emit('hashchange');
if (!app.innerHTML.includes('资格受限') || !app.innerHTML.includes('需要特别注意')) throw new Error('Restricted event does not disclose eligibility risk');

const pendingDetail = unreviewed.find((item) => item.sourceUrl);
location.hash = `#/competitions/${encodeURIComponent(pendingDetail.id)}`;
emit('hashchange');
if (!app.innerHTML.includes('U · 待核验') || !app.innerHTML.includes('不代表高含金量推荐')) throw new Error('Unreviewed detail does not preserve pending-review disclosure');

console.log(`Commercial smoke test passed: ${window.AI_DATA.competitions.length} competitions, ${reviewed.length} reviewed, ${window.AI_DATA.playbooks.length} playbooks, ${current.length} current opportunities.`);
