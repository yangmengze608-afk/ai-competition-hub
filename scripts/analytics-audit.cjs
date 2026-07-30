const fs = require('node:fs');
const vm = require('node:vm');

const configSource = fs.readFileSync('analytics-config.js', 'utf8');
const analyticsSource = fs.readFileSync('analytics-v1.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const privacy = fs.readFileSync('trust-pages.js', 'utf8');
const setup = fs.readFileSync('docs/analytics-setup.md', 'utf8');

for (const token of [
  "provider: 'goatcounter'",
  'enabled: true',
  "siteCode: 'aisaichang'",
  "'aisaichang.cn'",
  'respectPrivacySignals: true',
]) {
  if (!configSource.includes(token)) throw new Error(`analytics config missing: ${token}`);
}

for (const token of [
  'navigator.globalPrivacyControl',
  'navigator.doNotTrack',
  'productionHostAllowed',
  'stableId',
  'allowedSegments',
  'no_onload: true',
  'no_events: true',
  'count.v5.js',
  'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ',
  'matcher_submit',
  'official_link_click',
  'playbook_open',
  'beta_signup_click',
  'competition_submit_click',
  'correction_click',
  'workspace_open',
  'calendar_download',
  '[data-start-workspace]',
  '[data-calendar-reminder]',
]) {
  if (!analyticsSource.includes(token)) throw new Error(`analytics adapter missing: ${token}`);
}

for (const forbidden of [
  'document.cookie',
  'localStorage',
  'sessionStorage',
  'new FormData',
  '.innerText',
  '.textContent',
  'location.search',
]) {
  if (analyticsSource.includes(forbidden)) throw new Error(`analytics adapter accesses forbidden data: ${forbidden}`);
}

if (!privacy.includes('Global Privacy Control') || !privacy.includes('Do Not Track')) {
  throw new Error('privacy policy does not disclose privacy signals');
}
if (!privacy.includes('不会发送搜索词、表单内容、邮箱、手机号')) {
  throw new Error('privacy policy does not disclose excluded payloads');
}
if (!setup.includes('Free-text search queries are never included')) {
  throw new Error('analytics setup does not document search-query exclusion');
}
if (!setup.includes('workspace_open') || !setup.includes('calendar_download')) {
  throw new Error('analytics setup does not document execution conversion events');
}

const configIndex = index.indexOf('analytics-config.js');
const routeIndex = index.indexOf('route-bootstrap.js');
const adapterIndex = index.indexOf('analytics-v1.js');
if (configIndex < 0 || adapterIndex < 0) throw new Error('analytics files are not loaded');
if (configIndex > routeIndex) throw new Error('analytics config must load before application scripts');
if (adapterIndex < index.indexOf('public-simplify.js')) throw new Error('analytics adapter must load after public UI scripts');

function evaluate(hash, configOverrides = {}) {
  const listeners = new Map();
  const createdScripts = [];
  const context = {
    URL,
    URLSearchParams,
    setTimeout: (fn) => fn(),
    location: { hostname: 'aisaichang.cn', hash, href: `https://aisaichang.cn/${hash}` },
    navigator: { globalPrivacyControl: false, doNotTrack: '0' },
    document: {
      referrer: '',
      head: { appendChild(node) { createdScripts.push(node); } },
      createElement() {
        return {
          dataset: {},
          addEventListener() {},
        };
      },
      addEventListener() {},
    },
  };
  context.window = context;
  context.window.doNotTrack = '0';
  context.window.addEventListener = (name, fn) => {
    const items = listeners.get(name) || [];
    items.push(fn);
    listeners.set(name, items);
  };
  context.AI_ANALYTICS_CONFIG = {
    provider: 'goatcounter',
    enabled: false,
    siteCode: '',
    allowedHostnames: ['aisaichang.cn', 'www.aisaichang.cn'],
    respectPrivacySignals: true,
    ...configOverrides,
  };
  vm.createContext(context);
  vm.runInContext(analyticsSource, context, { filename: 'analytics-v1.js' });
  return { context, createdScripts, listeners };
}

const freeText = evaluate('#/competitions?q=secret%40example.com&region=CN&difficulty=%E5%85%A5%E9%97%A8');
const sanitizedPath = freeText.context.AIAnalytics.pagePath();
if (sanitizedPath.includes('secret') || sanitizedPath.includes('example.com')) {
  throw new Error(`free-text query leaked into analytics path: ${sanitizedPath}`);
}
if (sanitizedPath !== '/competitions/region-cn/difficulty-beginner') {
  throw new Error(`unexpected sanitized competition path: ${sanitizedPath}`);
}
if (freeText.context.AIAnalytics.status().reason !== 'disabled') {
  throw new Error('disabled analytics config is not reported as disabled');
}
if (freeText.createdScripts.length !== 0) throw new Error('disabled analytics created a provider script');

const production = evaluate('#/', {
  enabled: true,
  siteCode: 'aisaichang',
});
if (!production.context.AIAnalytics.status().active) {
  throw new Error(`production analytics is not active: ${production.context.AIAnalytics.status().reason}`);
}
const domReady = production.listeners.get('DOMContentLoaded') || [];
domReady.forEach((listener) => listener());
if (production.createdScripts.length !== 1) throw new Error('production analytics did not create exactly one provider script');
if (production.createdScripts[0].dataset.goatcounter !== 'https://aisaichang.goatcounter.com/count') {
  throw new Error('production analytics endpoint is incorrect');
}

const detail = evaluate('#/competitions/IFLYTEK-SPARK-CUP-2026');
if (detail.context.AIAnalytics.pagePath() !== '/competition/iflytek-spark-cup-2026') {
  throw new Error('competition detail path is not reduced to a stable public id');
}

const workspace = evaluate('#/workspace/IFLYTEK-SPARK-CUP-2026');
if (workspace.context.AIAnalytics.pagePath() !== '/workspace/iflytek-spark-cup-2026') {
  throw new Error('workspace path is not reduced to a stable public competition id');
}

const privacySignal = evaluate('#/', {
  enabled: true,
  siteCode: 'aisaichang',
});
privacySignal.context.navigator.globalPrivacyControl = true;
if (privacySignal.context.AIAnalytics.status().reason !== 'privacy-signal') {
  throw new Error('Global Privacy Control does not disable analytics');
}

const nonProduction = evaluate('#/', {
  enabled: true,
  siteCode: 'aisaichang',
  allowedHostnames: ['example.com'],
});
if (nonProduction.context.AIAnalytics.status().reason !== 'non-production-host') {
  throw new Error('analytics does not reject non-production hostnames');
}

console.log('privacy analytics audit passed');
