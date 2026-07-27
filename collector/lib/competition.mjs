import crypto from 'node:crypto';

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function safeIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function statusFromDeadline(deadline, now = new Date()) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'updated';
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (days < 0) return 'ended';
  if (days <= 10) return 'closing';
  return 'ongoing';
}

export function normalizeCompetition(input, fetchedAt = new Date().toISOString()) {
  const title = String(input.title || '').trim();
  const deadline = safeIso(input.deadline || input.eventEnd || input.submissionDeadline);
  const sourceUrl = String(input.sourceUrl || '').trim();
  if (!title || !deadline || !sourceUrl) return null;

  const fingerprint = crypto
    .createHash('sha1')
    .update(`${title.toLowerCase()}|${deadline.slice(0, 10)}|${sourceUrl}`)
    .digest('hex')
    .slice(0, 12);

  return {
    id: String(input.id || `${slugify(title)}-${fingerprint}`),
    title,
    organizer: String(input.organizer || input.sourceName || '主办方待确认'),
    track: String(input.track || 'AI 编程'),
    status: input.status || statusFromDeadline(deadline),
    deadline,
    format: String(input.format || '个人/团队'),
    difficulty: String(input.difficulty || '入门'),
    hasPrize: Boolean(input.hasPrize),
    prizeNote: String(input.prizeNote || '奖金与权益请以官方页面为准'),
    mode: String(input.mode || '线上'),
    audience: String(input.audience || '大学生、研究生、学生开发者'),
    summary: String(input.summary || `${title} 的报名、赛程与提交信息。`),
    description: String(input.description || input.summary || `${title} 的具体资格、赛程和提交要求请以官方页面为准。`),
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.map(String))].slice(0, 8) : ['真实赛事'],
    hasPlaybook: Boolean(input.hasPlaybook),
    updatedAt: safeIso(input.updatedAt) || fetchedAt,
    sourceUrl,
    sourceName: String(input.sourceName || '官方来源'),
    sourceType: String(input.sourceType || 'official'),
    lastVerifiedAt: safeIso(input.lastVerifiedAt) || fetchedAt,
    authenticityStatus: String(input.authenticityStatus || 'source_verified'),
    region: String(input.region || '未标注'),
  };
}

export function dedupeCompetitions(records) {
  const byKey = new Map();
  for (const record of records) {
    const key = `${record.title.toLowerCase().replace(/\s+/g, '')}|${record.deadline.slice(0, 10)}`;
    const existing = byKey.get(key);
    if (!existing || sourceRank(record.sourceType) < sourceRank(existing.sourceType)) {
      byKey.set(key, record);
    }
  }
  return [...byKey.values()].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

function sourceRank(type) {
  if (/official_competition|official_platform/.test(type)) return 0;
  if (/official_network|official/.test(type)) return 1;
  if (/platform/.test(type)) return 2;
  return 3;
}
