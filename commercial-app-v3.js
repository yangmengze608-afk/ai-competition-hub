(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const app = document.getElementById('app');
  const PAGE_SIZE = 24;

  const paths = {
    search: '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    arrowUp: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    sparkles: '<path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    graduation: '<path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v12"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 7.5-4 9"/><path d="m13.5 7.5 4 9"/><path d="M8 19h8"/>',
    alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'
  };

  function icon(name, size = 18, extra = '') { return `<svg ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`; }
  function e(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function parseRoute() { const [path, query = ''] = (location.hash.slice(1) || '/').split('?'); return { path: path || '/', params: new URLSearchParams(query) }; }
  function go(path) { location.hash = path; }
  function daysUntil(value) { return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000); }
  function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '时间待核验' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date); }
  function formatVerified(value) { const date = new Date(value || data.competitionVerifiedAt); return Number.isNaN(date.getTime()) ? '待更新' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date); }

  function collectionOf(item) {
    if (item.collection === 'practice') return 'practice';
    if (item.collection === 'archive' || item.status === 'ended') return 'archive';
    return 'current';
  }
  function collectionLabel(item) { return ({ current: '当前机会', practice: '长期练习', archive: '历史赛题' })[collectionOf(item)]; }

  const cnHosts = ['xfyun.cn', 'aliyun.com', 'ncccu.org.cn', 'simcm.org.cn', 'datafountain.cn', 'baidu.com', 'huaweicloud.com', 'saikr.com', 'moocollege.com', 'ncss.cn', 'tiaozhanbei.net', 'lanqiao.cn'];
  function regionOf(item) {
    if (item.region === 'CN' || item.region === 'domestic') return 'CN';
    if (item.region === 'INTL' || item.region === 'international') return 'INTL';
    try {
      const host = new URL(item.sourceUrl).hostname.toLowerCase();
      if (cnHosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) return 'CN';
    } catch {}
    if (/[\u4e00-\u9fff]/u.test(item.organizer || '') && !/DrivenData|Devpost|Kaggle|AIcrowd|Google|AWS|Microsoft|NASA|IEEE/i.test(item.organizer || '')) return 'CN';
    return 'INTL';
  }
  function regionLabel(item) { return regionOf(item) === 'CN' ? '国内' : '国际'; }

  const gradeWeights = { S: 60, A: 48, B: 36, C: 22, U: 8, R: -100 };
  const confidenceWeights = { high: 20, medium: 12, low: 4, unknown: 0 };
  const severeRiskFlags = new Set(['qualification-stage-closed', 'africa-residents-only', 'us-presence-required-for-finalists', 'in-person-final-required', 'sensitive-health-data', 'do-not-upload-data-to-cloud-ai']);
  function recommendationScore(item) {
    let score = gradeWeights[item.grade] ?? gradeWeights.U;
    score += confidenceWeights[item.confidence] ?? 0;
    if (item.verificationStatus === 'reviewed') score += 18;
    if (item.sourceUrl) score += 5;
    if (item.organizer && !/赛事主办方|合作机构|待核验|组委会 \/|DrivenData \/ 赛事合作机构/i.test(item.organizer)) score += 8;
    if (item.hasPlaybook) score += 7;
    if (item.hasPrize) score += 2;
    const days = daysUntil(item.deadline);
    if (collectionOf(item) === 'current' && days >= 0) score += Math.max(0, 12 - Math.min(12, days / 7));
    for (const flag of item.riskFlags || []) score -= severeRiskFlags.has(flag) ? 18 : 3;
    if (item.entryStatus === 'restricted') score -= 35;
    if (item.entryStatus === 'closed') score -= 80;
    return score;
  }

  function statusBadge(status) {
    const labels = { ongoing: '进行中', closing: '即将截止', upcoming: '未开始', ended: '已结束', updated: '待核验' };
    return `<span class="status-badge status-${e(status)}">${labels[status] || '待核验'}</span>`;
  }
  function gradeBadge(item) {
    const grade = item.grade || 'U';
    const suffix = grade === 'U' ? ' · 待核验' : item.verificationStatus === 'reviewed' ? ' · 已审核' : '';
    return `<span class="grade-badge grade-${e(grade.toLowerCase())}">${e(grade)}${suffix}</span>`;
  }
  function entryBadge(item) {
    const labels = { restricted: '资格受限', closing: '即将截止', closed: '报名关闭' };
    return labels[item.entryStatus] ? `<span class="entry-badge entry-${e(item.entryStatus)}">${labels[item.entryStatus]}</span>` : '';
  }
  function brand() {
    return `<a href="#/" class="brand"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M5 24.5 11.7 7l4.1 10.3L20.6 11 27 24.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="5" r="2" fill="currentColor"/></svg></span><span>AI 赛场</span><small>Beta</small></a>`;
  }

  function header(landing, path, params) {
    const weekActive = path === '/competitions' && params.get('window') === 'week';
    const nav = [['#/competitions', '比赛库', path === '/competitions' && !weekActive], ['#/competitions?window=week', '本周截止', weekActive], ['#/quality', '评级说明', path === '/quality']];
    const links = nav.map(([href, label, active]) => `<a href="${href}" class="${active ? 'active' : ''}">${label}</a>`).join('');
    const search = !landing ? `<form class="header-search" data-header-search>${icon('search', 16)}<input name="q" placeholder="搜索比赛、赛道、主办方…" aria-label="搜索比赛"></form>` : '';
    return `<header class="site-header ${landing ? 'site-header-landing' : ''}"><div class="header-inner">${brand()}<nav class="desktop-nav">${links}</nav>${search}<div class="header-actions"><a class="primary-button compact desktop-only" href="#/competitions">找比赛 ${icon('arrow', 15)}</a><button class="menu-button" data-menu aria-label="打开菜单">${icon('menu', 21)}</button></div></div><div class="mobile-menu" data-mobile-menu hidden>${!landing ? `<form class="mobile-search" data-header-search>${icon('search', 16)}<input name="q" placeholder="搜索比赛…"></form>` : ''}${links}<a class="primary-button" href="#/competitions">进入比赛库</a></div></header>`;
  }
  function footer() {
    const currentCount = competitions.filter((item) => collectionOf(item) === 'current').length;
    const auditedCount = competitions.filter((item) => item.verificationStatus === 'reviewed').length;
    return `<footer class="site-footer"><div class="footer-main"><div class="footer-brand">${brand()}<p>帮大学生找到真正值得参加的比赛，并看清截止时间、官方来源和投入价值。</p><small>${competitions.length} 场赛事 · ${auditedCount} 场深度审核 · 最近核验 ${formatVerified()}</small></div><div><strong>找比赛</strong><a href="#/competitions">当前机会</a><a href="#/competitions?window=week">本周截止</a><a href="#/competitions?collection=practice">长期练习</a></div><div><strong>了解</strong><a href="#/quality">评级说明</a><a href="#/sources">赛事来源</a></div><div><strong>说明</strong><span>比赛信息以主办方公告为准</span><span>推广不影响赛事评级</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} AI 赛场</span><span>${currentCount} 场当前机会 · Commercial Beta</span></div></footer>`;
  }

  function deadlineCopy(item) {
    const collection = collectionOf(item);
    if (collection === 'practice') return ['长期开放', item.deadlineText || '可持续练习'];
    if (collection === 'archive') return ['已结束', item.deadlineText || formatDate(item.deadline)];
    const days = daysUntil(item.deadline);
    return [days >= 0 ? `还剩 ${days} 天` : '已截止', item.deadlineText || formatDate(item.deadline)];
  }
  function competitionCard(item) {
    const [primaryDate, secondaryDate] = deadlineCopy(item);
    const favorite = localStorage.getItem(`favorite:${item.id}`) === '1';
    return `<article class="competition-card" data-collection="${collectionOf(item)}" data-region="${regionOf(item)}"><div class="competition-card-top"><div class="competition-card-badges">${statusBadge(item.status)}<span class="collection-badge">${collectionLabel(item)}</span><span class="region-badge">${regionLabel(item)}</span>${gradeBadge(item)}${entryBadge(item)}</div><button class="favorite-button ${favorite ? 'favorite' : ''}" data-favorite="${e(item.id)}" aria-label="收藏比赛">${icon('heart', 18, favorite ? 'fill="currentColor"' : '')}</button></div><a href="#/competitions/${encodeURIComponent(item.id)}" class="competition-title">${e(item.title)}</a><p class="organizer">${e(item.organizer || '主办方待核验')}</p><p class="competition-summary">${e(item.summary)}</p><div class="deadline-row">${icon('calendar', 16)}<div><span>${e(primaryDate)}</span><small>${e(secondaryDate)}</small></div></div><div class="meta-grid"><span>${icon('target', 14)}${e(item.track)}</span><span>${icon('users', 14)}${e(item.format)}</span><span>${icon('graduation', 14)}${e(item.difficulty)}</span><span>${icon('dollar', 14)}${item.hasPrize ? '有奖金/权益' : '无现金奖金'}</span></div><div class="tag-row">${(item.tags || []).slice(0, 3).map((tag) => `<em>${e(tag)}</em>`).join('')}</div><div class="competition-card-footer"><span>${item.verificationStatus === 'reviewed' ? '已完成赛事级审核' : e(item.sourceName || '公开来源')}</span><a href="#/competitions/${encodeURIComponent(item.id)}">查看详情 ${icon('arrow', 14)}</a></div></article>`;
  }

  function home() {
    const featured = competitions.filter((item) => collectionOf(item) === 'current' && item.status !== 'ended').sort((a, b) => recommendationScore(b) - recommendationScore(a) || new Date(a.deadline) - new Date(b.deadline)).slice(0, 6);
    const auditedCount = competitions.filter((item) => item.verificationStatus === 'reviewed').length;
    return `<section class="hero-section"><div class="knowledge-network" data-network></div><div class="hero-content"><div class="eyebrow">${icon('sparkles', 15)} 大学生竞赛决策与参赛执行平台</div><h1>别再收藏一堆比赛。<br><span>只参加真正值得的。</span></h1><p>真实赛事、截止时间、官方来源和价值判断，放在同一个地方。</p><form class="hero-search" data-home-search>${icon('search', 22)}<input name="q" placeholder="搜索比赛、赛道或主办方……" aria-label="搜索比赛"><button>找适合我的比赛 ${icon('arrow', 17)}</button></form><div class="hot-tags"><span>热门：</span>${(data.hotTags || []).map((tag) => `<button data-quick-search="${e(tag)}">${e(tag)}</button>`).join('')}</div><p class="demo-note">已收录 ${competitions.length} 场真实赛事，其中 ${auditedCount} 场完成赛事级审核。具体规则以主办方公告为准。</p></div></section><section class="capability-strip">${[[icon('compass'),'真实机会','只把可追溯来源的比赛放进库中'],[icon('target'),'价值判断','评级与置信度优先，未审核不冒充推荐'],[icon('clock'),'截止优先','优先发现仍有行动时间的机会'],[icon('checkCircle'),'透明排序','推荐规则公开且推广不影响排名']].map((item, index) => `<div class="capability-item"><span class="capability-number">0${index + 1}</span><span class="capability-icon">${item[0]}</span><div><strong>${item[1]}</strong><small>${item[2]}</small></div>${index < 3 ? icon('chevron', 15, 'class="capability-arrow"') : ''}</div>`).join('')}</section><section class="section home-competition-section"><div class="section-heading commercial-section-heading"><span>RULE-BASED PRIORITY</span><h2>优先查看的比赛</h2><p>按赛事评级、证据置信度、资格限制和截止时间排序。</p></div><div class="competition-grid">${featured.map(competitionCard).join('')}</div><div class="section-actions"><a class="primary-button large" href="#/competitions?sort=recommended">查看完整比赛库 ${icon('arrow', 18)}</a><a class="secondary-button large" href="#/competitions?window=week">查看本周截止</a></div></section>`;
  }

  function collectionMatches(item, collection) { return collection === 'all' || collectionOf(item) === collection; }
  function competitionExplorer(params) {
    const q = params.get('q') || '';
    const collection = params.get('collection') || 'current';
    const region = params.get('region') || '';
    const status = params.get('status') || '';
    const track = params.get('track') || '';
    const format = params.get('format') || '';
    const difficulty = params.get('difficulty') || '';
    const prize = params.get('prize') || '';
    const mode = params.get('mode') || '';
    const timeWindow = params.get('window') || '';
    const sort = params.get('sort') || 'recommended';
    const requestedPage = Number.parseInt(params.get('page') || '1', 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const filtered = competitions.filter((item) => {
      const haystack = [item.title, item.organizer, item.track, item.summary, ...(item.tags || [])].join(' ').toLowerCase();
      const days = daysUntil(item.deadline);
      return collectionMatches(item, collection)
        && (!q || haystack.includes(q.toLowerCase()))
        && (!region || regionOf(item) === region)
        && (!status || item.status === status)
        && (!track || item.track === track)
        && (!format || item.format === format)
        && (!difficulty || item.difficulty === difficulty)
        && (!prize || (prize === 'yes' ? item.hasPrize : !item.hasPrize))
        && (!mode || item.mode === mode)
        && (!timeWindow || (timeWindow === 'week' && days >= 0 && days <= 7));
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'recommended') return recommendationScore(b) - recommendationScore(a) || new Date(a.deadline) - new Date(b.deadline);
      if (sort === 'latest') return new Date(b.lastVerifiedAt || b.updatedAt || 0) - new Date(a.lastVerifiedAt || a.updatedAt || 0);
      if (sort === 'title') return String(a.title).localeCompare(String(b.title), 'zh-CN');
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const visible = sorted.slice(0, page * PAGE_SIZE);
    const options = (name, label, value, values) => `<label class="filter-field"><span>${label}</span><select data-filter="${name}">${values.map(([key, text]) => `<option value="${e(key)}" ${value === key ? 'selected' : ''}>${e(text)}</option>`).join('')}</select></label>`;
    const collectionTabs = [['current','当前机会'],['practice','长期练习'],['archive','历史赛题']].map(([key, label]) => `<a class="${collection === key ? 'active' : ''}" href="#/competitions?collection=${key}">${label}</a>`).join('');
    const heroTitle = timeWindow === 'week' ? '本周截止的比赛' : collection === 'practice' ? '长期开放的练习赛' : collection === 'archive' ? '可复现的历史赛题' : '找到现在值得参加的比赛';
    const loadMore = visible.length < sorted.length ? `<div class="competition-load-more"><button type="button" class="secondary-button" data-load-more>再显示 ${Math.min(PAGE_SIZE, sorted.length - visible.length)} 场</button><span>已显示 ${visible.length} / ${sorted.length}</span></div>` : '';
    const sortCopy = ({ recommended: '按透明推荐规则排序', deadline: '按截止时间排序', latest: '按最近核验排序', title: '按名称排序' })[sort];

    return `<div class="app-page"><section class="explorer-hero"><div class="page-kicker">${icon('search', 15)} 真实比赛库</div><h1>${heroTitle}</h1><p>已审核赛事展示价值判断和资格风险；未完成审核的赛事继续标记 U。</p><form class="explorer-search" data-explorer-search>${icon('search', 19)}<input name="q" value="${e(q)}" placeholder="搜索比赛名称、赛道或主办方……"><button>搜索</button></form><nav class="collection-tabs">${collectionTabs}</nav></section><section class="explorer-layout"><aside class="filter-panel"><div class="filter-title">${icon('filter', 17)}<strong>筛选条件</strong><button data-clear-filters>清除</button></div>${options('region','地区',region,[['','国内与国际'],['CN','国内'],['INTL','国际']])}${options('status','比赛状态',status,[['','全部状态'],['ongoing','进行中'],['closing','即将截止'],['updated','待核验']])}${options('track','赛道',track,[['','全部赛道'],...(data.tracks || []).map((item) => [item,item])])}${options('format','参赛形式',format,[['','不限'],['个人','个人'],['团队','团队'],['个人/团队','个人/团队']])}${options('difficulty','难度',difficulty,[['','不限'],['入门','入门'],['进阶','进阶'],['专家','专家']])}${options('prize','奖金',prize,[['','不限'],['yes','有奖金/权益'],['no','无现金奖金']])}${options('mode','形式',mode,[['','不限'],['线上','线上'],['线下','线下'],['线上+线下','线上+线下']])}${options('sort','排序',sort,[['recommended','推荐（规则排序）'],['deadline','截止时间'],['latest','最近核验'],['title','比赛名称']])}</aside><div class="results-column"><div class="results-head"><div><strong>${sorted.length}</strong> 场匹配比赛${q ? ` · “${e(q)}”` : ''}</div><span>${sortCopy}</span></div>${visible.length ? `<div class="competition-grid">${visible.map(competitionCard).join('')}</div>${loadMore}` : `<div class="empty-state">${icon('search', 30)}<h2>暂时没有匹配结果</h2><p>减少筛选条件，或换一个更宽泛的关键词。</p><button class="secondary-button" data-clear-filters>清除所有筛选</button></div>`}</div></section></div>`;
  }

  const confidenceLabels = { high: '高', medium: '中', low: '低', unknown: '未知' };
  const entryLabels = { open: '可报名', closing: '即将截止', restricted: '有资格限制', closed: '已关闭' };
  const riskLabels = {
    'platform-specific-build': '必须使用指定平台',
    'team-details-lock-after-deadline': '截止后团队信息不可修改',
    'detail-rules-require-login': '详细规则可能需要登录查看',
    'qualification-stage-closed': '资格赛已截止，仅符合条件者可继续',
    'continuous-submission-required': '需要持续提交或参与排名赛',
    'paid-entry': '需要支付报名费',
    'electronic-certificate-only': '仅提供电子证书',
    'recognition-varies-by-school': '校内认定因学校而异',
    'commercial-organizer': '商业机构主办',
    'entry-deadline-before-final': '参赛确认早于最终提交截止',
    'no-cash-prize-in-simulation-track': '当前赛道无现金奖金',
    'public-code-required': '需要公开代码',
    'technical-report-required': '需要技术报告',
    'banking-requirement-for-prize': '领奖可能需要指定银行条件',
    'eligibility-territory-restrictions': '部分地区不具备领奖资格',
    'solution-documentation-required': '获奖需要完整方案文档',
    'advanced-research-only': '更适合高级研究者',
    'open-source-license-required': '需要开源许可证',
    'phase-specific-rules': '不同阶段规则不同',
    'adult-only': '仅限达到法定成年年龄',
    'adult-only-for-prizes': '未成年人可展示但通常不能领奖',
    'required-platform-stack': '必须使用指定技术栈',
    'public-demo-and-documentation': '需要公开演示与文档',
    'arm-platform-required': '必须在 Arm 架构运行',
    'public-open-source-repository': '需要公开开源仓库',
    'new-project-after-start-date': '必须是比赛开始后创建的新项目',
    'google-cloud-required': '必须使用 Google Cloud',
    'gemini-api-required': '必须在应用中调用 Gemini API',
    'business-evidence-may-be-requested': '可能要求用户或营收证据',
    'cockroachdb-required': '必须使用 CockroachDB',
    'aws-required': '必须使用 AWS',
    'functional-demo-required': '需要可运行 Demo',
    'public-video-required': '需要公开视频',
    'us-presence-required-for-finalists': '决赛入围者必须能合法进入美国',
    'in-person-final-required': '决赛必须现场参加',
    'travel-cost-unclear': '现场差旅承担方式不明确',
    'sensitive-data-prohibited': 'Demo 禁止使用真实敏感数据',
    'africa-residents-only': '仅限指定非洲国家居民',
    'early-stage-only': '仅限早期项目或团队',
    'funding-cap': '存在融资额度上限',
    'hardware-constraint': '有明确硬件限制',
    'organizer-depth-limited': '主办方公开信息有限',
    'timezone-needs-recheck': '截止时区仍需复核',
    'prize-details-need-recheck': '奖金细则仍需复核',
    'backblaze-b2-required': '必须使用 Backblaze B2',
    'genblaze-required': '必须使用 Genblaze',
    'public-project-materials': '项目材料需公开展示',
    'student-focused': '主要面向学生',
    'public-github-required': '需要公开 GitHub 仓库',
    'real-user-design-testing-required': '需要真实目标用户参与设计或测试',
    'sensitive-health-data': '涉及受限医疗数据',
    'do-not-upload-data-to-cloud-ai': '竞赛数据不得上传至云端 AI 工具',
    'data-deletion-required': '赛后必须删除本地竞赛数据',
    'containerized-code-submission': '需要容器化代码提交',
    'winner-mit-open-source-required': '获奖方案须以 MIT 许可证开源'
  };
  function infoRow(iconName, label, value) { return `<div class="info-row"><i>${icon(iconName, 15)}</i><div><small>${label}</small><strong>${e(value || '待核验')}</strong></div></div>`; }
  function scoreCard(label, value, note) {
    const score = Number.isFinite(value) ? Math.max(1, Math.min(5, value)) : 0;
    return `<div class="audit-score-card"><span>${e(label)}</span><strong>${score || '—'}<small>/5</small></strong><p>${e(note)}</p></div>`;
  }
  function auditDecision(item) {
    if (item.verificationStatus !== 'reviewed') return `<section class="detail-block"><h2>赛事价值判断</h2><div class="audit-pending">${icon('alert', 20)}<div><strong>U · 待核验</strong><p>该赛事尚未完成赛事级深度审核，目前只确认公开入口和基础信息，不代表高含金量推荐。</p></div></div></section>`;
    return `<section class="detail-block audit-decision"><div class="audit-heading"><div><span>EVENT REVIEW</span><h2>赛事价值判断</h2></div>${gradeBadge(item)}</div><p class="audit-summary">${e(item.auditSummary)}</p><div class="audit-score-grid">${scoreCard('权威性', item.authorityScore, '主办方与赛事体系')}${scoreCard('履历价值', item.resumeValue, '简历与升学辨识度')}${scoreCard('成长价值', item.growthValue, '技术、产品与作品积累')}</div></section>`;
  }
  function participationChecklist(item) {
    if (item.verificationStatus !== 'reviewed') return '';
    const risks = (item.riskFlags || []).map((flag) => `<li class="${severeRiskFlags.has(flag) ? 'severe' : ''}">${icon(severeRiskFlags.has(flag) ? 'alert' : 'checkCircle', 16)}<span>${e(riskLabels[flag] || flag)}</span></li>`).join('');
    return `<section class="detail-block"><h2>参赛前确认</h2><div class="audit-facts"><div><small>报名资格</small><strong>${e(item.eligibility)}</strong></div><div><small>费用</small><strong>${e(item.fee)}</strong></div><div><small>截止时区</small><strong>${e(item.deadlineTimezone)}</strong></div><div><small>当前入口</small><strong>${e(entryLabels[item.entryStatus] || '待确认')}</strong></div></div>${risks ? `<div class="risk-list-title">需要特别注意</div><ul class="audit-risk-list">${risks}</ul>` : ''}</section>`;
  }
  function evidenceBlock(item) {
    if (item.verificationStatus !== 'reviewed' || !(item.evidenceUrls || []).length) return '';
    return `<section class="detail-block"><h2>核验依据</h2><p class="block-description">以下链接用于支撑本站的赛事级判断；报名仍以主办方最终规则为准。</p><div class="evidence-links">${item.evidenceUrls.slice(0, 4).map((url, index) => `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">证据 ${index + 1}${icon('arrowUp', 15)}</a>`).join('')}</div></section>`;
  }

  function competitionDetail(id) {
    const item = competitions.find((competition) => competition.id === id);
    if (!item) return notFound();
    const favorite = localStorage.getItem(`favorite:${item.id}`) === '1';
    const collection = collectionOf(item);
    const days = daysUntil(item.deadline);
    const deadlinePanel = collection === 'practice' ? '<small>开放状态</small><strong>长期</strong><span>开放</span>' : collection === 'archive' ? `<small>结束时间</small><strong>已</strong><span>结束</span><p>${e(item.deadlineText || formatDate(item.deadline))}</p>` : `<small>距离截止</small><strong>${Math.max(0, days)}</strong><span>天</span><p>${e(item.deadlineText || formatDate(item.deadline))}</p>`;
    const sourceLink = item.sourceUrl ? `<a class="primary-button" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方页面 ${icon('arrowUp', 16)}</a>` : '';
    const sourceStatus = item.verificationStatus === 'reviewed' ? '赛事级审核' : '基础收录';
    return `<div class="detail-page"><div class="breadcrumbs"><a href="#/competitions">比赛库</a>${icon('chevron', 14)}<span>${e(item.title)}</span></div><section class="competition-detail-hero"><div><div class="detail-status-row">${statusBadge(item.status)}<span>${collectionLabel(item)}</span><span>${regionLabel(item)}</span>${gradeBadge(item)}${entryBadge(item)}</div><h1>${e(item.title)}</h1><p>${e(item.summary)}</p><div class="detail-actions">${sourceLink}<button class="secondary-button" data-favorite="${e(item.id)}">${icon('heart', 16, favorite ? 'fill="currentColor"' : '')}${favorite ? '已收藏' : '收藏比赛'}</button></div></div><div class="deadline-panel">${deadlinePanel}</div></section><section class="detail-layout"><div class="detail-main"><section class="detail-block"><h2>比赛概览</h2><p>${e(item.description || item.summary)}</p></section>${auditDecision(item)}${participationChecklist(item)}<section class="detail-block"><h2>适合谁参加</h2><p>${e(item.audience)}</p><div class="tag-row large-tags">${(item.tags || []).map((tag) => `<em>${e(tag)}</em>`).join('')}</div></section>${evidenceBlock(item)}</div><aside class="detail-sidebar"><h3>关键信息</h3>${infoRow('network','地区',regionLabel(item))}${infoRow('target','赛道',item.track)}${infoRow('users','参赛形式',item.format)}${infoRow('graduation','难度',item.difficulty)}${infoRow('play','举办形式',item.mode)}${infoRow('award','奖金/权益',item.prizeNote)}${infoRow('checkCircle','赛事等级',item.grade || 'U')}${infoRow('network','证据置信度',confidenceLabels[item.confidence] || '未知')}${infoRow('book','信息状态',sourceStatus)}${infoRow('clock','最近核验',formatVerified(item.lastVerifiedAt || item.updatedAt))}<div class="official-note"><strong>${e(item.sourceName || '公开来源')}</strong><br>评级是赛事质量判断，不代表每个人都适合参加。<br>商业推广不影响排名。</div></aside></section></div>`;
  }

  function notFound() { return `<div class="not-found">${icon('network', 48)}<h1>页面没有连接上</h1><p>这个页面尚未开放，或地址已经发生变化。</p><a class="primary-button" href="#/">回到首页</a></div>`; }
  function render() {
    const { path, params } = parseRoute();
    const landing = path === '/';
    const content = path === '/' ? home() : path === '/competitions' ? competitionExplorer(params) : path.startsWith('/competitions/') ? competitionDetail(decodeURIComponent(path.split('/')[2] || '')) : notFound();
    app.innerHTML = `${header(landing, path, params)}<main>${content}</main>${footer()}`;
    bindCommon(params);
    window.scrollTo(0, 0);
  }
  function updateParams(currentParams, name, value) { const params = new URLSearchParams(currentParams); if (value) params.set(name, value); else params.delete(name); params.delete('page'); return params; }
  function bindCommon(currentParams) {
    const menu = app.querySelector('[data-menu]');
    const panel = app.querySelector('[data-mobile-menu]');
    menu?.addEventListener('click', () => { const open = panel.hasAttribute('hidden'); if (open) { panel.removeAttribute('hidden'); menu.innerHTML = icon('x', 21); } else { panel.setAttribute('hidden', ''); menu.innerHTML = icon('menu', 21); } });
    app.querySelectorAll('[data-header-search], [data-home-search], [data-explorer-search]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); const q = String(new FormData(form).get('q') || '').trim(); const params = form.matches('[data-explorer-search]') ? updateParams(currentParams, 'q', q) : new URLSearchParams(q ? { q } : {}); go(`/competitions${params.toString() ? `?${params}` : ''}`); }));
    app.querySelectorAll('[data-quick-search]').forEach((button) => button.addEventListener('click', () => go(`/competitions?q=${encodeURIComponent(button.dataset.quickSearch)}`)));
    app.querySelectorAll('[data-filter]').forEach((select) => select.addEventListener('change', () => { const params = updateParams(currentParams, select.dataset.filter, select.value); go(`/competitions${params.toString() ? `?${params}` : ''}`); }));
    app.querySelectorAll('[data-clear-filters]').forEach((button) => button.addEventListener('click', () => go('/competitions')));
    app.querySelector('[data-load-more]')?.addEventListener('click', () => { const params = new URLSearchParams(currentParams); const page = Number.parseInt(params.get('page') || '1', 10); params.set('page', String(page + 1)); go(`/competitions?${params}`); });
    app.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); const id = button.dataset.favorite; const next = localStorage.getItem(`favorite:${id}`) !== '1'; localStorage.setItem(`favorite:${id}`, next ? '1' : '0'); render(); }));
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
})();
