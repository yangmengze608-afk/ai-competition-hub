const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'conversion-pages.js');
const pageSource = fs.readFileSync(pagePath, 'utf8');
const templates = {
  join: '.github/ISSUE_TEMPLATE/beta-signup.yml',
  submit: '.github/ISSUE_TEMPLATE/submit-competition.yml',
  report: '.github/ISSUE_TEMPLATE/report-competition.yml',
};
const errors = [];

for (const [kind, relativePath] of Object.entries(templates)) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing ${kind} issue form: ${relativePath}`);
    continue;
  }
  const source = fs.readFileSync(fullPath, 'utf8');
  for (const marker of ['name:', 'description:', 'title:', 'body:', 'validations:', 'required: true']) {
    if (!source.includes(marker)) errors.push(`${relativePath} missing marker: ${marker}`);
  }
  if (!source.includes('敏感信息')) errors.push(`${relativePath} does not warn against sensitive information`);
}

for (const marker of [
  "path !== '/participate'",
  '参与 Commercial Beta',
  '提交一场比赛',
  '发现信息错误？提交纠错',
  'beta-signup.yml',
  'submit-competition.yml',
  'report-competition.yml',
  '不要填写手机号、邮箱、身份证号',
]) {
  if (!pageSource.includes(marker)) errors.push(`Conversion page implementation missing marker: ${marker}`);
}

const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const asset of ['conversion-pages.css', 'conversion-pages.js']) {
  if (!indexSource.includes(asset)) errors.push(`index.html does not load ${asset}`);
}

if (errors.length) {
  console.error(`Conversion audit errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  publicForms: Object.keys(templates).length,
  publicRoute: '#/participate',
  correctionLinks: true,
  sensitiveDataWarning: true,
}, null, 2));
console.log('Public conversion entrypoint audit passed.');
