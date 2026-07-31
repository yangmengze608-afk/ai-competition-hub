const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('commercial-app-v3.js', 'utf8');
const preserver = fs.readFileSync('classic-home-preserver-v1.js', 'utf8');
const decision = fs.readFileSync('home-decision-v2.js', 'utf8');

for (const token of ['hero-section', 'capability-strip', 'home-competition-section']) {
  if (!app.includes(token)) throw new Error(`classic homepage section missing from core app: ${token}`);
}

for (const token of [
  'Array.from(main.children)',
  "node.classList?.contains('hero-section')",
  "main.querySelector('.classic-home-stage')?.remove()",
  'decisionHome.before(node)',
  "decisionHome.dataset.classicHomeBelow = 'true'",
]) {
  if (!preserver.includes(token)) throw new Error(`classic homepage preserver missing: ${token}`);
}

for (const forbidden of ['cloneNode', 'main.innerHTML', 'outerHTML']) {
  if (preserver.includes(forbidden)) throw new Error(`classic homepage preserver must move real nodes, not recreate them: ${forbidden}`);
}

if (!decision.includes("const classicHero = main.querySelector('.hero-section')")) {
  throw new Error('decision layer assumptions changed; review the homepage preserver integration');
}

const appIndex = index.indexOf('commercial-app-v3.js');
const preserverIndex = index.indexOf('classic-home-preserver-v1.js');
const decisionIndex = index.indexOf('home-decision-v2.js');
if (appIndex < 0 || preserverIndex < 0 || decisionIndex < 0) throw new Error('homepage composition scripts are not loaded');
if (!(appIndex < preserverIndex && preserverIndex < decisionIndex)) {
  throw new Error('classic homepage preserver must load between the core app and decision layer');
}

console.log('Classic homepage remains first; decision experience is layered below it.');
