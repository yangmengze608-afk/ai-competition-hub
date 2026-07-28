const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'trust-pages.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'trust-pages.css'), 'utf8');

for (const asset of ['trust-pages.css', 'trust-pages.js']) {
  if (!index.includes(asset)) throw new Error(`index.html does not load ${asset}`);
}

for (const route of ['/about', '/data-policy', '/privacy', '/terms']) {
  if (!script.includes(`'${route}'`)) throw new Error(`Missing trust route: ${route}`);
}

for (const heading of ['关于 AI 赛场', '数据说明', '隐私政策', 'Beta 使用条款']) {
  if (!script.includes(heading)) throw new Error(`Missing trust content: ${heading}`);
}

for (const disclosure of ['localStorage', 'GitHub Issue Forms', '没有本站账号系统、支付功能', '不保证数据永久准确']) {
  if (!script.includes(disclosure)) throw new Error(`Missing current-behavior disclosure: ${disclosure}`);
}

if (!script.includes('请不要填写手机号、私人邮箱、身份证号、住址、学号、支付信息')) {
  throw new Error('Privacy page does not warn against submitting sensitive information');
}

if (!style.includes('.trust-page') || !style.includes('@media')) {
  throw new Error('Trust pages stylesheet is incomplete');
}

console.log('Public trust pages audit passed: about, data, privacy and terms are present.');
