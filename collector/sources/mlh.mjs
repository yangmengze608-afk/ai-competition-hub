import * as cheerio from 'cheerio';

const MONTHS = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseRange(text, defaultYear) {
  const match = String(text || '').toUpperCase().match(/([A-Z]{3})\s+(\d{1,2})\s*[-–]\s*(?:([A-Z]{3})\s+)?(\d{1,2})/);
  if (!match || MONTHS[match[1]] === undefined) return null;
  const startMonth = MONTHS[match[1]];
  const endMonth = MONTHS[match[3] || match[1]];
  let endYear = defaultYear;
  if (endMonth < startMonth) endYear += 1;
  return {
    start: new Date(Date.UTC(defaultYear, startMonth, Number(match[2]), 0, 0, 0)).toISOString(),
    end: new Date(Date.UTC(endYear, endMonth, Number(match[4]), 23, 59, 0)).toISOString(),
  };
}

function flattenCandidates(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenCandidates(item, output));
    return output;
  }
  const title = value.name || value.title || value.eventName || value.event_name;
  const start = value.startDate || value.start_date || value.startsAt || value.start_time;
  const end = value.endDate || value.end_date || value.endsAt || value.end_time;
  const url = value.url || value.website || value.registrationUrl || value.registration_url;
  if (typeof title === 'string' && (start || end) && typeof url === 'string') {
    output.push({ title, start, end, url, raw: value });
  }
  Object.values(value).forEach((item) => flattenCandidates(item, output));
  return output;
}

function fromNextData($) {
  const raw = $('#__NEXT_DATA__').text();
  if (!raw) return [];
  try {
    return flattenCandidates(JSON.parse(raw));
  } catch {
    return [];
  }
}

function fromCards($, year) {
  const rows = [];
  $('a[href]').each((_, anchor) => {
    const $anchor = $(anchor);
    const href = $anchor.attr('href');
    if (!href || href.startsWith('#') || href.includes('/signin')) return;
    const text = $anchor.text().replace(/\s+/g, ' ').trim();
    if (!/(IN-PERSON|DIGITAL)/i.test(text)) return;
    const range = parseRange(text, year);
    if (!range) return;

    const title = $anchor.find('h2,h3,h4,[class*="name"],[class*="title"]').first().text().replace(/\s+/g, ' ').trim()
      || $anchor.attr('aria-label')
      || text.split(/[A-Z]{3}\s+\d{1,2}\s*[-–]/)[0].split(',').pop().trim();
    if (!title || title.length < 3) return;

    const location = $anchor.find('[class*="location"],[class*="city"]').first().text().replace(/\s+/g, ' ').trim();
    rows.push({
      title,
      start: range.start,
      end: range.end,
      url: new URL(href, 'https://www.mlh.com').href,
      raw: { text, location, digital: /DIGITAL/i.test(text) },
    });
  });
  return rows;
}

export async function fetchMlhCompetitions({ now = new Date() } = {}) {
  const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const sourceUrl = `https://www.mlh.com/seasons/${season}/events`;
  const response = await fetch(sourceUrl, {
    headers: { 'user-agent': 'AI-Competition-Hub/1.0 (+https://github.com/yangmengze608-afk/ai-competition-hub)' },
  });
  if (!response.ok) throw new Error(`MLH HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const candidates = [...fromNextData($), ...fromCards($, now.getUTCFullYear())];
  const seen = new Set();

  return candidates.filter((item) => {
    const end = new Date(item.end || item.start);
    const key = `${item.title}|${end.toISOString().slice(0, 10)}`;
    if (seen.has(key) || end < new Date(now.getTime() - 14 * 86400000)) return false;
    seen.add(key);
    return true;
  }).map((item) => {
    const deadline = new Date(item.end || item.start).toISOString();
    const digital = Boolean(item.raw?.digital) || /online|digital|worldwide/i.test(JSON.stringify(item.raw));
    return {
      title: item.title,
      organizer: 'Major League Hacking / 活动主办方',
      track: /agent/i.test(item.title) ? 'AI Agent' : /data|analytics/i.test(item.title) ? '数据科学' : 'AI 编程',
      deadline,
      mode: digital ? '线上' : '线下',
      region: item.raw?.location || (digital ? 'Worldwide' : '国际'),
      format: '个人/团队',
      difficulty: '入门',
      summary: 'MLH 官方赛季日程收录的学生黑客松，适合完成技术原型并积累团队项目经历。',
      description: '活动来自 Major League Hacking 官方赛季日程。具体参赛资格、报名方式、赛题、奖金与提交要求请进入活动官网确认。',
      tags: ['大学生', '黑客松', '真实赛事'],
      sourceUrl: item.url,
      sourceName: 'Major League Hacking',
      sourceType: 'official_network',
      authenticityStatus: 'source_verified',
    };
  });
}
