const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jsonPath = path.join(root, 'data/competitions-v1.json');
const runtimePath = path.join(root, 'competition-data.generated.js');
const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

if (!Array.isArray(payload.competitions) || payload.competitions.length < 150) {
  throw new Error(`Expected at least 150 competitions, received ${payload.competitions?.length ?? 0}`);
}
if (payload.count !== payload.competitions.length) {
  throw new Error(`Payload count ${payload.count} does not match ${payload.competitions.length} records`);
}

const runtime = `(() => {\n  const payload = ${JSON.stringify(payload)};\n  window.AI_DATA = window.AI_DATA || {};\n  window.AI_DATA.competitions = payload.competitions;\n  window.AI_DATA.realCompetitionMode = true;\n  window.AI_DATA.competitionVerifiedAt = payload.latestVerifiedAt;\n  window.AI_DATA.competitionDataVersion = payload.version;\n  window.AI_DATA.tracks = [...new Set(payload.competitions.map((item) => item.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));\n  window.AI_DATA.hotTags = ['AI Agent', '大学生', '个人参赛', '奖金赛事', '数据科学', '大模型应用'];\n})();\n`;

fs.writeFileSync(runtimePath, runtime);
console.log(`Generated runtime bundle from canonical JSON: ${payload.competitions.length} events.`);
