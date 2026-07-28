const fs = require('fs');
const vm = require('vm');

const script = fs.readFileSync('detail-decision-v1.js', 'utf8');
const css = fs.readFileSync('detail-decision-v1.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

const requiredScriptTokens = [
  '30 SECOND DECISION',
  '适合你，如果',
  '不适合你，如果',
  '现在怎么开始',
  '建议重点考虑',
  '先核验再决定',
  '当前不建议投入',
  'playbookByCompetition',
  'verificationStatus',
  'entryStatus',
];
for (const token of requiredScriptTokens) {
  if (!script.includes(token)) throw new Error(`detail decision script missing: ${token}`);
}

for (const token of ['.detail-decision-panel', '.detail-decision-grid', '.decision-start', '@media (max-width: 640px)']) {
  if (!css.includes(token)) throw new Error(`detail decision styles missing: ${token}`);
}

if (!index.includes('detail-decision-v1.css')) throw new Error('detail decision CSS is not loaded');
if (!index.includes('detail-decision-v1.js')) throw new Error('detail decision JS is not loaded');
if (index.indexOf('playbook-pages.js') > index.indexOf('detail-decision-v1.js')) {
  throw new Error('detail decision script must load after playbook pages');
}

new vm.Script(script, { filename: 'detail-decision-v1.js' });

const forbidden = [
  '保证获奖',
  '一定适合',
  'AI 已为你决定',
  '100% 推荐',
];
for (const phrase of forbidden) {
  if (script.includes(phrase)) throw new Error(`overstated decision copy detected: ${phrase}`);
}

console.log('detail decision audit passed');