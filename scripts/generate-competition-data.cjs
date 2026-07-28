const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

global.window = global;
global.location = { hash: '#/' };
global.document = {};
global.localStorage = { getItem() { return null; }, setItem() {} };

const sourceFiles = [
  'data.js',
  'real-competitions.js',
  'expanded-competitions-1.js',
  'expanded-competitions-2.js',
  'expanded-competitions-3.js',
  'expanded-competitions-4.js',
  'expanded-competitions-devpost-v5.js',
  'real-competition-config.js',
];

for (const file of sourceFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

const competitions = window.AI_DATA?.competitions;
if (!Array.isArray(competitions) || competitions.length < 150) {
  throw new Error(`Expected at least 150 competitions, received ${competitions?.length ?? 0}`);
}

const normalized = competitions.map((item) => ({
  ...item,
  tags: Array.isArray(item.tags) ? item.tags : [],
  collection: item.collection || (item.isPractice ? 'practice' : 'current'),
  verificationStatus: item.verificationStatus || 'unreviewed',
  grade: item.grade || 'U',
  confidence: item.confidence || 'low',
  riskFlags: Array.isArray(item.riskFlags) ? item.riskFlags : [],
}));

const verifiedDates = normalized
  .map((item) => Date.parse(item.lastVerifiedAt || item.updatedAt || ''))
  .filter(Number.isFinite);
const latestVerifiedAt = verifiedDates.length
  ? new Date(Math.max(...verifiedDates)).toISOString()
  : new Date().toISOString();

const payload = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  latestVerifiedAt,
  count: normalized.length,
  sourceFiles,
  competitions: normalized,
};

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'data/competitions-v1.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
);

const runtime = `(() => {\n  const payload = ${JSON.stringify(payload)};\n  window.AI_DATA = window.AI_DATA || {};\n  window.AI_DATA.competitions = payload.competitions;\n  window.AI_DATA.realCompetitionMode = true;\n  window.AI_DATA.competitionVerifiedAt = payload.latestVerifiedAt;\n  window.AI_DATA.competitionDataVersion = payload.version;\n  window.AI_DATA.tracks = [...new Set(payload.competitions.map((item) => item.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));\n  window.AI_DATA.hotTags = ['AI Agent', '大学生', '个人参赛', '奖金赛事', '数据科学', '大模型应用'];\n})();\n`;
fs.writeFileSync(path.join(root, 'competition-data.generated.js'), runtime);

console.log(`Generated unified competition data: ${normalized.length} events.`);
