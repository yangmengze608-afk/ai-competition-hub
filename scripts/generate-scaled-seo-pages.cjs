const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://aisaichang.cn';
const DATA_PATH = path.join(ROOT, 'data', 'competitions-v1.json');
const VERSION = '0.8.1';

const FEATURED_IDS = [
  'iflytek-spark-cup-2026',
  'spacemind-agent-2026',
  'iflytek-office-skill-2026',
  'tianchi-aftershock-2026',
  'ncccu-2026',
  'simcm-2026',
  'ai-builders-hackathon-2026',
  'includai-2026',
  'kaggle-pokemon-tcg-ai-2026',
  'kaggle-solar-filament-2026',
  'drivendata-trace-the-ace-2026',
  'aicrowd-arc-white-box-2026',
  'arm-ai-optimization-2026',
  'gemini-xprize-2026',
];

const RISK_LABELS = {
  'paid-entry': '报名或参赛可能产生费用，付款前需核对退费、发票与支付规则。',
  'platform-specific-build': '作品需要使用主办方指定的平台、模型或技术栈。',
  'team-details-lock-after-deadline': '团队信息可能在截止节点后锁定，成员安排需要提前确认。',
  'detail-rules-require-login': '部分详细规则需要登录官方平台后才能查看。',
  'qualification-stage-closed': '当前阶段可能只对已经通过前序资格赛的队伍开放。',
  'continuous-submission-required': '比赛可能要求持续提交或分阶段更新结果。',
  'electronic-certificate-only': '证书形式可能仅为电子版。',
  'recognition-varies-by-school': '不同学校对赛事级别、综测或学分认定可能不同。',
  'restricted-eligibility': '参赛身份、地区、年龄、学校或专业范围存在限制。',
  'timezone-risk': '截止时间涉及海外时区，需要自行换算并预留提交时间。',
  'ip-terms': '作品知识产权、数据授权和宣传使用条款需要重点核对。',
  'team-required': '比赛可能要求组队或限制团队人数。',
};

function parseArgs(argv) {
  let out = '.seo-build';
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out' && argv[index + 1]) {
      out = argv[index + 1];
      index += 1;
    }
  }
  return { outDir: path.resolve(ROOT, out) };
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function truncate(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待官方确认';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function isoDate(value, fallback = '2026-07-29') {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
}

function statusLabel(item) {
  return ({
    ongoing: '进行中',
    closing: '即将截止',
    upcoming: '尚未开始',
    ended: '已结束',
    updated: '待再次核验',
  })[item.status] || '状态待确认';
}

function entryLabel(item) {
  return ({
    open: '报名入口开放',
    restricted: '资格或阶段受限',
    closing: '即将截止',
    closed: '报名已关闭',
  })[item.entryStatus] || '需前往官方页面确认';
}

function sourceLabel(item) {
  return ({
    official: '主办方官方来源',
    'official-platform': '官方赛事平台',
    organizer: '主办方公开资料',
  })[item.sourceLevel] || '可追溯公开来源';
}

function eligibilityReason(item) {
  if (!item || typeof item !== 'object') return 'invalidCore';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(item.id || ''))) return 'invalidCore';
  if (!cleanText(item.title)) return 'invalidCore';
  if (item.verificationStatus !== 'reviewed') return 'unreviewed';
  if (item.collection !== 'current') return 'nonCurrent';
  if (!safeUrl(item.sourceUrl)) return 'missingSource';
  return 'eligible';
}

function score(item) {
  const grade = { S: 500, A: 400, B: 300, C: 200, U: 0 }[item.grade] || 0;
  const confidence = { high: 80, medium: 40, low: 10 }[item.confidence] || 0;
  const entry = { open: 50, closing: 35, restricted: 10, closed: 0 }[item.entryStatus] || 0;
  return grade
    + confidence
    + entry
    + Number(item.authorityScore || 0) * 8
    + Number(item.resumeValue || 0) * 6
    + Number(item.growthValue || 0) * 5
    + (item.hasPlaybook ? 20 : 0)
    + (item.sourceLevel === 'official' ? 20 : 0);
}

function selectCompetitions(competitions) {
  const counts = {
    total: competitions.length,
    eligible: 0,
    invalidCore: 0,
    unreviewed: 0,
    nonCurrent: 0,
    missingSource: 0,
  };
  const eligible = [];
  const seen = new Set();

  for (const item of competitions) {
    const reason = eligibilityReason(item);
    counts[reason] += 1;
    if (reason !== 'eligible') continue;
    if (seen.has(item.id)) throw new Error(`Duplicate eligible competition id: ${item.id}`);
    seen.add(item.id);
    eligible.push(item);
  }

  const featuredRank = new Map(FEATURED_IDS.map((id, index) => [id, index]));
  eligible.sort((a, b) => {
    const aFeatured = featuredRank.has(a.id) ? featuredRank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bFeatured = featuredRank.has(b.id) ? featuredRank.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;
    return score(b) - score(a) || String(a.title).localeCompare(String(b.title), 'zh-CN');
  });

  if (!eligible.length) throw new Error('No reviewed current competitions with a traceable source are eligible for publication.');
  return { selected: eligible, counts };
}

function pageTitle(item) {
  return truncate(`${item.title}：报名时间、参赛资格与含金量｜AI 赛场`, 66);
}

function metaDescription(item) {
  return truncate(`${item.title}由${item.organizer || '赛事主办方'}举办。查看截止时间、参赛资格、费用与奖金、独立价值判断、风险提示、执行建议和官方报名入口。`, 158);
}

function riskItems(item) {
  const risks = (item.riskFlags || []).map((flag) => RISK_LABELS[flag]).filter(Boolean);
  return risks.length ? risks : ['报名之前仍需核对资格、时区、费用、提交材料和知识产权条款。'];
}

function faqItems(item) {
  return [
    {
      question: `${item.title}什么时候截止？`,
      answer: `本站最近核验到的截止日期为 ${formatDate(item.deadline)}，记录时区为 ${item.deadlineTimezone || '以官方页面为准'}。主办方可能调整赛程，正式报名和提交前必须再次查看官方页面。`,
    },
    {
      question: `${item.title}谁可以参加？`,
      answer: cleanText(item.eligibility || item.audience || '参赛对象、地区和团队限制需要在官方规则中进一步确认。'),
    },
    {
      question: `${item.title}含金量怎么样？`,
      answer: `AI 赛场当前给出的赛事评级为 ${item.grade || 'U'}。该评级综合主办方、证据质量、履历辨识度和成长价值，不代表一定获奖，也不代表适合所有人。`,
    },
    {
      question: `参加${item.title}的第一步是什么？`,
      answer: '先打开官方规则，核对身份资格、报名与最终提交截止时间、团队限制、费用、指定技术平台和最终提交物，再决定是否建立参赛计划。',
    },
  ];
}

function relatedFor(item, selected) {
  const sameTrack = selected.filter((candidate) => candidate.id !== item.id && candidate.track === item.track);
  const others = selected.filter((candidate) => candidate.id !== item.id && candidate.track !== item.track);
  return [...sameTrack, ...others].slice(0, 3);
}

function scoreMeter(label, value) {
  const safeValue = Math.max(0, Math.min(5, Number(value || 0)));
  return `<div class="score-row"><span>${escapeHtml(label)}</span><strong>${safeValue}/5</strong><div class="score-track" aria-hidden="true"><i style="width:${safeValue * 20}%"></i></div></div>`;
}

function renderJsonLd(item, faq) {
  const canonical = `${DOMAIN}/competitions/${encodeURIComponent(item.id)}/`;
  return `<script type="application/ld+json">${safeJson([
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      description: metaDescription(item),
      mainEntityOfPage: canonical,
      dateModified: item.lastVerifiedAt || item.updatedAt,
      author: { '@type': 'Organization', name: 'AI 赛场', url: DOMAIN },
      publisher: { '@type': 'Organization', name: 'AI 赛场', url: DOMAIN },
      about: [item.track, ...(item.tags || [])].filter(Boolean),
      citation: [...new Set([item.sourceUrl, ...(item.evidenceUrls || [])].map(safeUrl).filter(Boolean))],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'AI 赛场', item: `${DOMAIN}/` },
        { '@type': 'ListItem', position: 2, name: '比赛专题', item: `${DOMAIN}/competitions/` },
        { '@type': 'ListItem', position: 3, name: item.title, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer },
      })),
    },
  ])}</script>`;
}

function renderCompetitionPage(item, selected) {
  const canonical = `${DOMAIN}/competitions/${encodeURIComponent(item.id)}/`;
  const officialUrl = safeUrl(item.sourceUrl);
  const appUrl = `/?from=search-landing&competition=${encodeURIComponent(item.id)}#/competitions/${encodeURIComponent(item.id)}`;
  const faq = faqItems(item);
  const related = relatedFor(item, selected);
  const evidence = [...new Set([item.sourceUrl, ...(item.evidenceUrls || [])].map(safeUrl).filter(Boolean))];
  const tags = [statusLabel(item), item.track, item.region === 'international' ? '国际赛事' : '国内赛事', `${item.grade || 'U'} 级`].filter(Boolean);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle(item))}</title>
  <meta name="description" content="${escapeHtml(metaDescription(item))}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:site_name" content="AI 赛场" />
  <meta property="og:title" content="${escapeHtml(pageTitle(item))}" />
  <meta property="og:description" content="${escapeHtml(metaDescription(item))}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${DOMAIN}/assets/social-card.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="/seo-landing-v1.css?v=1" />
  ${renderJsonLd(item, faq)}
</head>
<body>
  <header class="seo-header"><a class="seo-brand" href="/"><span class="seo-brand-mark">AI</span><span>AI 赛场</span><small>Beta</small></a><nav><a href="/competitions/">比赛专题</a><a href="/?lang=en">English</a><a class="nav-cta" href="${appUrl}">进入完整决策页</a></nav></header>
  <main>
    <nav class="breadcrumb" aria-label="面包屑"><a href="/">AI 赛场</a><span>›</span><a href="/competitions/">比赛专题</a><span>›</span><span>${escapeHtml(item.title)}</span></nav>
    <section class="landing-hero">
      <div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      <h1>${escapeHtml(item.title)}</h1>
      <p class="hero-summary">${escapeHtml(item.summary || item.description || '查看这场比赛的资格、时间、价值与风险。')}</p>
      <div class="verification-line"><span>${escapeHtml(sourceLabel(item))}</span><span>最近核验 ${escapeHtml(formatDate(item.lastVerifiedAt || item.updatedAt))}</span><span>${escapeHtml(entryLabel(item))}</span></div>
      <div class="hero-actions"><a class="primary-action" href="${appUrl}">查看完整判断与参赛路线</a><a class="secondary-action" href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer nofollow">前往官方比赛页面 ↗</a></div>
      <p class="source-warning">AI 赛场不是赛事主办方。资格、赛程、费用和提交要求最终以官方公告为准。</p>
    </section>

    <section class="fact-grid" aria-label="比赛关键信息">
      <article><span>报名 / 提交截止</span><strong>${escapeHtml(formatDate(item.deadline))}</strong><small>${escapeHtml(item.deadlineTimezone || '时区待确认')}</small></article>
      <article><span>主办方</span><strong>${escapeHtml(item.organizer || '待官方确认')}</strong><small>${escapeHtml(item.sourceName || sourceLabel(item))}</small></article>
      <article><span>参赛形式</span><strong>${escapeHtml(item.format || '待确认')}</strong><small>${escapeHtml(item.mode || '举办形式待确认')}</small></article>
      <article><span>费用与权益</span><strong>${escapeHtml(item.fee || '费用待确认')}</strong><small>${escapeHtml(item.prizeNote || (item.hasPrize ? '设有奖金或权益' : '未发现现金奖金'))}</small></article>
    </section>

    <div class="content-layout">
      <div class="content-main">
        <section class="content-card answer-card"><span class="section-kicker">QUICK ANSWER</span><h2>这是什么比赛，值得参加吗？</h2><p>${escapeHtml(item.description || item.summary || '该赛事已完成基础信息核验。')}</p><p>${escapeHtml(item.auditSummary || '该赛事已经完成赛事级审核，但报名之前仍需回到官方页面确认最终规则。')}</p><div class="decision-note"><strong>AI 赛场判断：</strong>评级 ${escapeHtml(item.grade || 'U')}，证据置信度 ${escapeHtml(item.confidence || '待确认')}。评级用于比较赛事质量，不承诺获奖、升学或就业结果。</div></section>

        <section class="content-card"><span class="section-kicker">ELIGIBILITY</span><h2>谁适合参加？</h2><p>${escapeHtml(item.eligibility || item.audience || '参赛对象和资格需在官方规则中确认。')}</p><ul class="check-list"><li>对 ${escapeHtml(item.track || '相关赛道')} 有学习、科研或作品积累需求的人。</li><li>能够在截止前完成真实提交物，而不只是收藏比赛的人。</li><li>愿意核对资格、费用、技术限制与知识产权条款的人。</li></ul></section>

        <section class="content-card"><span class="section-kicker">VALUE</span><h2>这场比赛的价值如何判断？</h2><p>AI 赛场从主办方权威性、履历辨识度、技能成长和证据置信度四个方面进行独立判断。高评级不代表适合所有人，低门槛也不等于没有价值；真正的判断标准是它是否匹配你的目标、能力和可投入时间。</p><p>当前记录显示：赛道为 ${escapeHtml(item.track || '待确认')}，难度为 ${escapeHtml(item.difficulty || '待确认')}，主要语言为 ${escapeHtml(item.language || '待确认')}，入口状态为 ${escapeHtml(entryLabel(item))}。</p></section>

        <section class="content-card"><span class="section-kicker">RISKS</span><h2>参赛前需要特别注意什么？</h2><ul class="risk-list">${riskItems(item).map((risk) => `<li>${escapeHtml(risk)}</li>`).join('')}</ul><p class="muted">截止日期是本站最近一次核验时的记录，不构成实时保证。建议至少提前 6 小时完成最终提交。</p></section>

        <section class="content-card"><span class="section-kicker">FIRST ACTION</span><h2>现在应该先做什么？</h2><ol class="action-list"><li><strong>打开官方规则：</strong>确认报名和最终提交是否为两个不同节点。</li><li><strong>核对资格：</strong>确认身份、地区、团队人数、费用和指定技术平台。</li><li><strong>确定提交物：</strong>写清需要提交的代码、作品、文档、视频或演示链接。</li><li><strong>建立参赛计划：</strong>进入 AI 赛场，把规则拆成可勾选的执行任务。</li></ol><a class="inline-cta" href="${appUrl}">为这场比赛建立参赛计划 →</a></section>

        <section class="content-card"><span class="section-kicker">FAQ</span><h2>常见问题</h2><div class="faq-list">${faq.map((entry) => `<details><summary>${escapeHtml(entry.question)}</summary><p>${escapeHtml(entry.answer)}</p></details>`).join('')}</div></section>

        <section class="content-card"><span class="section-kicker">EVIDENCE</span><h2>核验依据与官方来源</h2><p>以下链接用于支撑本站的赛事信息与独立判断。进入第三方网站后，适用对方的规则和隐私政策。</p><ul class="source-list">${evidence.map((url, index) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow">${index === 0 ? '官方比赛入口' : `核验依据 ${index + 1}`} ↗</a></li>`).join('')}</ul></section>
      </div>

      <aside class="decision-sidebar">
        <section class="sidebar-card"><span class="section-kicker">AI 赛场评级</span><div class="grade-value">${escapeHtml(item.grade || 'U')}</div>${scoreMeter('权威性', item.authorityScore)}${scoreMeter('履历价值', item.resumeValue)}${scoreMeter('成长价值', item.growthValue)}</section>
        <section class="sidebar-card"><h2>关键信息</h2><dl><div><dt>赛道</dt><dd>${escapeHtml(item.track || '待确认')}</dd></div><div><dt>难度</dt><dd>${escapeHtml(item.difficulty || '待确认')}</dd></div><div><dt>语言</dt><dd>${escapeHtml(item.language || '待确认')}</dd></div><div><dt>状态</dt><dd>${escapeHtml(statusLabel(item))}</dd></div><div><dt>来源</dt><dd>${escapeHtml(sourceLabel(item))}</dd></div></dl></section>
      </aside>
    </div>

    <section class="related-section"><span class="section-kicker">RELATED COMPETITIONS</span><h2>还可以比较这些比赛</h2><div class="related-grid">${related.map((candidate) => `<a href="/competitions/${encodeURIComponent(candidate.id)}/"><span>${escapeHtml(candidate.track || 'AI 比赛')}</span><strong>${escapeHtml(candidate.title)}</strong><small>${escapeHtml(candidate.grade || 'U')} 级 · ${escapeHtml(formatDate(candidate.deadline))}</small></a>`).join('')}</div></section>
  </main>
  <footer class="seo-footer"><div><strong>AI 赛场</strong><p>帮助大学生找到值得参加的比赛，并把兴趣变成真实行动。</p></div><div><a href="/">返回首页</a><a href="/competitions/">比赛专题</a><a href="/#/data-policy">数据说明</a><a href="/#/privacy">隐私政策</a></div></footer>
</body>
</html>`;
}

function renderDirectory(selected, lastModified) {
  const cards = selected.map((item) => `<article><div><span>${escapeHtml(item.track || 'AI 比赛')}</span><span>${escapeHtml(item.grade || 'U')} 级</span></div><h2><a href="/competitions/${encodeURIComponent(item.id)}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary || item.description || '查看比赛资格、时间与价值判断。')}</p><dl><div><dt>截止</dt><dd>${escapeHtml(formatDate(item.deadline))}</dd></div><div><dt>形式</dt><dd>${escapeHtml(item.format || '待确认')}</dd></div></dl><a class="card-link" href="/competitions/${encodeURIComponent(item.id)}/">查看报名时间、资格与含金量 →</a></article>`).join('');
  const canonical = `${DOMAIN}/competitions/`;
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI 赛场审核赛事专题',
    numberOfItems: selected.length,
    itemListElement: selected.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: `${DOMAIN}/competitions/${encodeURIComponent(item.id)}/`,
    })),
  };

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>2026 AI 比赛报名时间、资格与含金量专题｜AI 赛场</title>
  <meta name="description" content="查看经过赛事级审核的 AI、数据科学、智能体和 Hackathon 比赛，包括截止时间、参赛资格、费用、奖金、风险与官方报名入口。" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="2026 AI 比赛报名时间、资格与含金量专题｜AI 赛场" />
  <meta property="og:description" content="自动展示 ${selected.length} 场经过赛事级审核且拥有可追溯来源的 AI 比赛。" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${DOMAIN}/assets/social-card.svg" />
  <link rel="stylesheet" href="/seo-landing-v1.css?v=1" />
  <script type="application/ld+json">${safeJson(itemList)}</script>
</head>
<body>
  <header class="seo-header"><a class="seo-brand" href="/"><span class="seo-brand-mark">AI</span><span>AI 赛场</span><small>Beta</small></a><nav><a href="/">首页</a><a href="/?lang=en">English</a><a class="nav-cta" href="/#/competitions">打开完整比赛库</a></nav></header>
  <main>
    <nav class="breadcrumb" aria-label="面包屑"><a href="/">AI 赛场</a><span>›</span><span>比赛专题</span></nav>
    <section class="directory-hero"><span class="section-kicker">AUTOMATED SEARCH LANDING PAGES · BETA</span><h1>值得进一步核对的 AI 比赛</h1><p>这里自动展示已经完成赛事级审核、处于当前赛事集合并拥有可追溯来源的比赛。新增或更新合格赛事后，独立页面和站点地图会在部署时同步生成。</p><div class="verification-line"><span>${selected.length} 场合格赛事</span><span>最近更新 ${escapeHtml(formatDate(lastModified))}</span><span>规则以主办方公告为准</span></div></section>
    <section class="directory-grid">${cards}</section>
  </main>
  <footer class="seo-footer"><div><strong>AI 赛场</strong><p>先判断是否值得，再决定是否投入。</p></div><div><a href="/">返回首页</a><a href="/#/quality">评级说明</a><a href="/#/data-policy">数据说明</a><a href="/#/privacy">隐私政策</a></div></footer>
</body>
</html>`;
}

function renderSitemap(selected, lastModified) {
  const urls = [
    { loc: `${DOMAIN}/`, lastmod: lastModified, priority: '1.0', changefreq: 'daily' },
    { loc: `${DOMAIN}/competitions/`, lastmod: lastModified, priority: '0.9', changefreq: 'daily' },
    ...selected.map((item) => ({
      loc: `${DOMAIN}/competitions/${encodeURIComponent(item.id)}/`,
      lastmod: isoDate(item.lastVerifiedAt || item.updatedAt, lastModified),
      priority: item.grade === 'S' || item.grade === 'A' ? '0.9' : '0.8',
      changefreq: 'weekly',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((entry) => `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>\n    <lastmod>${escapeHtml(entry.lastmod)}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const { selected, counts } = selectCompetitions(competitions);
  const competitionsDir = path.join(outDir, 'competitions');
  fs.rmSync(competitionsDir, { recursive: true, force: true });
  ensureDirectory(competitionsDir);

  for (const item of selected) {
    writeFile(path.join(competitionsDir, item.id, 'index.html'), renderCompetitionPage(item, selected));
  }

  const lastModified = isoDate(data.latestVerifiedAt || data.generatedAt || new Date().toISOString());
  writeFile(path.join(competitionsDir, 'index.html'), renderDirectory(selected, data.latestVerifiedAt || data.generatedAt));
  writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap(selected, lastModified));
  writeFile(path.join(outDir, 'seo-pages-manifest.json'), `${JSON.stringify({
    version: VERSION,
    generatedFrom: path.relative(ROOT, DATA_PATH),
    generatedAt: data.latestVerifiedAt || data.generatedAt,
    eligibility: {
      verificationStatus: 'reviewed',
      collection: 'current',
      traceableSourceUrl: true,
      validSlugAndTitle: true,
    },
    counts,
    count: selected.length,
    ids: selected.map((item) => item.id),
  }, null, 2)}\n`);

  console.log(`Generated ${selected.length} scalable competition pages in ${path.relative(ROOT, outDir) || '.'}.`);
  console.log(`Excluded: ${counts.unreviewed} unreviewed, ${counts.nonCurrent} non-current, ${counts.missingSource} without a traceable source, ${counts.invalidCore} invalid core records.`);
}

main();
