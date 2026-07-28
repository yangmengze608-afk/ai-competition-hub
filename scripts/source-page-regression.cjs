const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'public-simplify.js'), 'utf8');
const match = source.match(/function simplifyResultHead\(\) \{[\s\S]*?\n  \}\n\n  function sourcePurpose/);
if (!match) throw new Error('Could not locate simplifyResultHead');
const functionSource = match[0].replace(/\n\n  function sourcePurpose$/, '');

class FakeElement {
  constructor(kind = '') {
    this.kind = kind;
    this.childNodes = [];
    this.dataset = {};
    this.textContent = '';
  }
  querySelector(selector) {
    if (selector === '[data-source-count]') return this.childNodes.find((node) => node.kind === 'count') || null;
    if (selector === '[data-source-count-label]') return this.childNodes.find((node) => Object.prototype.hasOwnProperty.call(node.dataset, 'sourceCountLabel')) || null;
    return null;
  }
  replaceChildren(...nodes) {
    this.childNodes = nodes;
  }
}

const head = new FakeElement('head');
const count = new FakeElement('count');
count.textContent = '143';
head.childNodes = [count, new FakeElement('legacy-label'), new FakeElement('duplicate-label')];
const document = {
  querySelector(selector) { return selector === '.source-results-head' ? head : null; },
  createElement() { return new FakeElement('label'); },
};

const simplifyResultHead = new Function('document', `${functionSource}; return simplifyResultHead;`)(document);
for (let index = 0; index < 20; index += 1) simplifyResultHead();

if (head.childNodes.length !== 2) throw new Error(`Expected exactly 2 result-head nodes, received ${head.childNodes.length}`);
if (head.childNodes[0] !== count) throw new Error('Count node was replaced, which would break filter updates');
if (head.childNodes[1].textContent !== '个来源') throw new Error('Source count label is missing or incorrect');

count.textContent = '42';
simplifyResultHead();
if (head.childNodes[0] !== count || count.textContent !== '42') throw new Error('Filter-updated source count was not preserved');
if (head.childNodes.filter((node) => node.textContent === '个来源').length !== 1) throw new Error('Duplicated source count labels remain');

console.log('Source page regression passed: count label remains singular and count node is preserved.');
