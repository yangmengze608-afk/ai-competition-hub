import { execFileSync } from 'node:child_process';

function hasPrize(reward) {
  const text = String(reward || '').trim();
  return Boolean(text && !/^0(?:\.0+)?$/i.test(text));
}

export async function fetchKaggleCompetitions() {
  let payload;
  try {
    const output = execFileSync('python', ['collector/sources/kaggle_fetch.py'], {
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'inherit'],
      maxBuffer: 8 * 1024 * 1024,
    });
    payload = JSON.parse(output);
  } catch (error) {
    throw new Error(`Kaggle API failed: ${error.message}`);
  }

  if (payload.skipped) return { records: [], skipped: payload.skipped };

  const records = (payload.competitions || []).map((item) => ({
    id: `kaggle-${item.ref}`,
    title: item.title || item.ref,
    organizer: 'Kaggle / 赛事主办方',
    track: '数据科学',
    deadline: item.deadline,
    format: '个人/团队',
    difficulty: item.category === 'gettingStarted' || item.category === 'playground' ? '入门' : '进阶',
    hasPrize: hasPrize(item.reward),
    prizeNote: item.reward || '奖金与权益请以 Kaggle 页面为准',
    mode: '线上',
    audience: '大学生、研究生、数据科学与机器学习开发者',
    summary: item.description || 'Kaggle 官方 API 收录的数据科学与机器学习竞赛。',
    description: '比赛来自 Kaggle 官方 API。具体数据许可、组队规则、提交次数、奖金和资格限制请进入比赛页面确认。',
    tags: ['Kaggle', '数据科学', '机器学习', '真实赛事'],
    sourceUrl: `https://www.kaggle.com/competitions/${item.ref}`,
    sourceName: 'Kaggle',
    sourceType: 'official_platform',
    authenticityStatus: 'api_verified',
    region: 'Worldwide',
  }));

  return { records, skipped: null };
}
