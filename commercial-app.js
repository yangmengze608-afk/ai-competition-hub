(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const app = document.getElementById('app');
  const PAGE_SIZE = 24;

  const paths = {
    search: '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    arrowUp: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    sparkles: '<path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
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
    network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 7.5-4 9"/><path d="m13.5 7.5 4 9"/><path d="M8 19h8"/>'
  };

  function icon(name, size = 18, extra = '') {
    return `<svg ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
  }

  function e(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function parseRoute() {
    const raw = location.hash.slice(1) || '/';
    const [path, query = ''] = raw.split('?');
    return { path: path || '/', params: new URLSearchParams(query) };
  }

  function go(path) { location.hash = path; }
  function daysUntil(value) { return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000); }
  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '时间待核验';
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
  function formatVerified(value) {
    const date = new Date(value || data.competitionVerifiedAt);
    if (Number.isNaN(date.getTime())) return '待更新';
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date);
  }

  function collectionOf(item) {
    if (item.collection === 'practice') return 'practice';
    if (item.collection === 'archive' || item.status === 'ended') return 'archive';
    return 'current';
  }

  function collectionLabel(item) {
    const labels = { current: '当前机会', practice: '长期练习', archive: '历史赛题' };
    return labels[collectionOf(item)];
  }

  function statusBadge(status) {
    const labels = { ongoing: '进行中', closing: '即将截止', upcoming: '未开始', ended: '已结束', updated: '待核验' };
    return `<span class="status-badge status-${e(status)}">${labels[status] || '待核验'}</span>`;
  }

  function brand() {
    return `<a href="#/" class="brand"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M5 24.5 11.7 7l4.1 10.3L20.6 11 27 24.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="5" r="2" fill="currentColor"/></svg></span><span>AI 赛场</span><small>Beta</small></a>`;
  }

  function header(landing, path, params) {
    const weekActive = path === '/competitions' && params.get('window') === 'week';
    const nav = [
      ['#/competitions', '比赛库', path === '/competitions' && !weekActive],
      ['#/competitions?window=week', '本周截止', weekActive],
      ['#/quality', '评级说明', path === '/quality']
    ];
    const links = nav.map(([href, label, active]) => `<a href="${href}" class="${active ? 'active' : ''}">${label}</a>`).join('');
    const search = !landing ? `<form class="header-search" data-header-search>${icon('search', 16)}<input name="q" placeholder="搜索比赛、赛道、主办方…" aria-label="搜索比赛"></form>` : '';
    return `<header class="site-header ${landing ? 'site-header-landing' : ''}"><div class="header-inner">${brand()}<nav class="desktop-nav">${links}</nav>${search}<div class="header-actions"><a class="primary-button compact desktop-only" href="#/competitions">找比赛 ${icon('arrow', 15)}</a><button class="menu-button" data-menu aria-label="打开菜单">${icon('menu', 21)}</button></div></div><div class="mobile-menu" data-mobile-menu hidden>${!landing ? `<form class="mobile-search" data-header-search>${icon('search', 16)}<input name="q" placeholder="搜索比赛…"></form>` : ''}${links}<a class="primary-button" href="#/competitions">进入比赛库</a></div></header>`;
  }

  function footer() {
    const currentCount = competitions.filter((item) => collectionOf(item) === 'current').length;
    return `<footer class="site-footer"><div class="footer-main"><div class="footer-brand">${brand()}<p>帮大学生找到真正值得参加的比赛，并看清截止时间、官方来源和投入价值。</p><small>${competitions.length} 场赛事 · ${currentCount} 场当前机会 · 最近核验 ${formatVerified()}</small></div><div><strong>找比赛</strong><a href="#/competitions">当前机会</a><a href="#/competitions?window=week">本周截止</a><a href="#/competitions?collection=practice">长期练习</a></div><div><strong>了解</strong><a href="#/quality">评级说明</a><a href="#/sources">赛事来源</a></div><div><strong>说明</strong><span>比赛信息以主办方公告为准</span><span>推广不影响赛事评级</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} AI 赛场</span><span>Commercial Beta</span></div></footer>`;
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
    return `<article class="competition-card" data-collection="${collectionOf(item)}"><div class="competition-card-top"><div class="competition-card-badges">${statusBadge(item.status)}<span class="collection-badge">${collectionLabel(item)}</span></div><button class="favorite-button ${favorite ? 'favorite' : ''}" data-favorite="${e(item.id)}" aria-label="收藏比赛">${icon('heart', 18, favorite ? 'fill="currentColor"' : '')}</button></div><a href="#/competitions/${encodeURIComponent(item.id)}" class="competition-title">${e(item.title)}</a><p class="organizer">${e(item.organizer || '主办方待核验')}</p><p class="competition-summary">${e(item.summary)}</p><div class="deadline-row">${icon('calendar', 16)}<div><span>${e(primaryDate)}</span><small>${e(secondaryDate)}</small></div></div><div class="meta-grid"><span>${icon('target', 14)}${e(item.track)}</span><span>${icon('users', 14)}${e(item.format)}</span><span>${icon('graduation', 14)}${e(item.difficulty)}</span><span>${icon('dollar', 14)}${item.hasPrize ? '有奖金/权益' : '无现金奖金'}</span></div><div class="tag-row">${(item.tags || []).slice(0, 3).map((tag) => `<em>${e(tag)}</em>`).join('')}</div><div class="competition-card-footer"><span>${e(item.sourceName || '公开来源')}</span><a href="#/competitions/${encodeURIComponent(item.id)}">查看详情 ${icon('arrow', 14)}</a></div></article>`;
  }

  function home() {
    const featured = competitions
      .filter((item) => collectionOf(item) === 'current' && item.status !== 'ended')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 6);
    return `<section class="hero-section"><div class="knowledge-network" data-network></div><div class="hero-content"><div class="eyebrow">${icon('sparkles', 15)} 大学生竞赛决策与参赛执行平台</div><h1>别再收藏一堆比赛。<br><span>只参加真正值得的。</span></h1><p>真实赛事、截止时间、官方来源和价值判断，放在同一个地方。</p><form class="hero-search" data-home-search>${icon('search', 22)}<input name="q" placeholder="搜索比赛、赛道或主办方……" aria-label="搜索比赛"><button>找适合我的比赛 ${icon('arrow', 17)}</button></form><div class="hot-tags"><span>热门：</span>${(data.hotTags || []).map((tag) => `<button data-quick-search="${e(tag)}">${e(tag)}</button>`).join('')}</div><p class="demo-note">已收录 ${competitions.length} 场真实赛事，最近核验 ${formatVerified()}。具体规则以主办方公告为准。</p></div></section>
    <section class="capability-strip">${[[icon('compass'),'真实机会','只把可追溯来源的比赛放进库中'],[icon('target'),'价值判断','区分权威性、履历价值与成长价值'],[icon('clock'),'截止优先','先看本周和即将截止的机会'],[icon('checkCircle'),'官方核验','每场保留来源和最近核验时间']].map((item, index) => `<div class="capability-item"><span class="capability-number">0${index + 1}</span><span class="capability-icon">${item[0]}</span><div><strong>${item[1]}</strong><small>${item[2]}</small></div>${index < 3 ? icon('chevron', 15, 'class="capability-arrow"') : ''}</div>`).join('')}</section>
    <section class="section home-competition-section"><div class="section-heading commercial-section-heading"><span>DEADLINE FIRST</span><h2>近期截止</h2><p>先处理时间最紧的真实机会，再决定是否投入。</p></div><div class="competition-grid">${featured.map(competitionCard).join('')}</div><div class="section-action"><a class="secondary-button" href="#/competitions?window=week">查看本周截止</a><a class="primary-button" href="#/competitions">浏览全部当前机会 ${icon('arrow', 16)}</a></div></section>
    <section id="how-it-works" class="section section-soft"><div class="section-heading"><span>HOW IT WORKS</span><h2>从“看到比赛”到“决定参加”</h2><p>先确认机会真实，再判断价值，最后进入官方页面。</p></div><div class="steps-grid">${step('01','search','找到机会','按赛道、时间、难度和参赛形式筛选。','mint')}${step('02','target','判断是否值得','查看来源、主办方、奖金与赛事类型。','lilac')}${step('03','arrowUp','回到官方页面','在报名之前核对资格、时区和提交规则。','peach')}</div></section>
    <section class="section final-cta"><div class="final-cta-copy"><span>START WITH ONE</span><h2>先选出一场值得做的比赛。</h2><p>不要被数量淹没，先从当前机会和本周截止开始。</p></div><a class="primary-button large" href="#/competitions">进入比赛库 ${icon('arrow', 18)}</a></section>`;
  }

  function step(number, iconName, title, description, accent) {
    return `<article class="step-card step-${accent}"><div class="step-top"><span>${number}</span><i>${icon(iconName)}</i></div><h3>${title}</h3><p>${description}</p><div class="step-line"></div></article>`;
  }

  function collectionMatches(item, collection) {
    if (collection === 'all') return true;
    return collectionOf(item) === collection;
  }

  function competitionExplorer(params) {
    const q = params.get('q') || '';
    const collection = params.get('collection') || 'current';
    const status = params.get('status') || '';
    const track = params.get('track') || '';
    const format = params.get('format') || '';
    const difficulty = params.get('difficulty') || '';
    const prize = params.get('prize') || '';
    const mode = params.get('mode') || '';
    const timeWindow = params.get('window') || '';
    const sort = params.get('sort') || 'deadline';
    const requestedPage = Number.parseInt(params.get('page') || '1', 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const filtered = competitions.filter((item) => {
      const haystack = [item.title, item.organizer, item.track, item.summary, ...(item.tags || [])].join(' ').toLowerCase();
      const days = daysUntil(item.deadline);
      return collectionMatches(item, collection)
        && (!q || haystack.includes(q.toLowerCase()))
        && (!status || item.status === status)
        && (!track || item.track === track)
        && (!format || item.format === format)
        && (!difficulty || item.difficulty === difficulty)
        && (!prize || (prize === 'yes' ? item.hasPrize : !item.hasPrize))
        && (!mode || item.mode === mode)
        && (!timeWindow || (timeWindow === 'week' && days >= 0 && days <= 7));
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'latest') return new Date(b.lastVerifiedAt || b.updatedAt || 0) - new Date(a.lastVerifiedAt || a.updatedAt || 0);
      if (sort === 'title') return String(a.title).localeCompare(String(b.title), 'zh-CN');
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const visible = sorted.slice(0, page * PAGE_SIZE);
    const options = (name, label, value, values) => `<label class="filter-field"><span>${label}</span><select data-filter="${name}">${values.map(([key, text]) => `<option value="${e(key)}" ${value === key ? 'selected' : ''}>${e(text)}</option>`).join('')}</select></label>`;
    const collectionTabs = [['current','当前机会'],['practice','长期练习'],['archive','历史赛题']].map(([key, label]) => `<a class="${collection === key ? 'active' : ''}" href="#/competitions?collection=${key}">${label}</a>`).join('');
    const heroTitle = timeWindow === 'week' ? '本周截止的比赛' : collection === 'practice' ? '长期开放的练习赛' : collection === 'archive' ? '可复现的历史赛题' : '找到现在值得参加的比赛';
    const loadMore = visible.length < sorted.length ? `<div class="competition-load-more"><button type="button" class="secondary-button" data-load-more>再显示 ${Math.min(PAGE_SIZE, sorted.length - visible.length)} 场</button><span>已显示 ${visible.length} / ${sorted.length}</span></div>` : '';

    return `<div class="app-page"><section class="explorer-hero"><div class="page-kicker">${icon('search', 15)} 真实比赛库</div><h1>${heroTitle}</h1><p>查看截止时间、参赛形式、主办方和官方入口；未完成深度审核的赛事不等于推荐。</p><form class="explorer-search" data-explorer-search>${icon('search', 19)}<input name="q" value="${e(q)}" placeholder="搜索比赛名称、赛道或主办方……"><button>搜索</button></form><nav class="collection-tabs">${collectionTabs}</nav></section><section class="explorer-layout"><aside class="filter-panel"><div class="filter-title">${icon('filter', 17)}<strong>筛选条件</strong><button data-clear-filters>清除</button></div>${options('status','比赛状态',status,[['','全部状态'],['ongoing','进行中'],['closing','即将截止'],['updated','待核验']])}${options('track','赛道',track,[['','全部赛道'],...(data.tracks || []).map((item) => [item,item])])}${options('format','参赛形式',format,[['','不限'],['个人','个人'],['团队','团队'],['个人/团队','个人/团队']])}${options('difficulty','难度',difficulty,[['','不限'],['入门','入门'],['进阶','进阶'],['专家','专家']])}${options('prize','奖金',prize,[['','不限'],['yes','有奖金/权益'],['no','无现金奖金']])}${options('mode','形式',mode,[['','不限'],['线上','线上'],['线下','线下'],['线上+线下','线上+线下']])}${options('sort','排序',sort,[['deadline','截止时间'],['latest','最近核验'],['title','比赛名称']])}</aside><div class="results-column"><div class="results-head"><div><strong>${sorted.length}</strong> 场匹配比赛${q ? ` · “${e(q)}”` : ''}</div><span>${sort === 'deadline' ? '按截止时间排序' : sort === 'latest' ? '按最近核验排序' : '按名称排序'}</span></div>${visible.length ? `<div class="competition-grid">${visible.map(competitionCard).join('')}</div>${loadMore}` : `<div class="empty-state">${icon('search', 30)}<h2>暂时没有匹配结果</h2><p>减少筛选条件，或换一个更宽泛的关键词。</p><button class="secondary-button" data-clear-filters>清除所有筛选</button></div>`}</div></section></div>`;
  }

  function infoRow(iconName, label, value) {
    return `<div class="info-row"><i>${icon(iconName, 15)}</i><div><small>${label}</small><strong>${e(value || '待核验')}</strong></div></div>`;
  }

  function competitionDetail(id) {
    const item = competitions.find((competition) => competition.id === id);
    if (!item) return notFound();
    const favorite = localStorage.getItem(`favorite:${item.id}`) === '1';
    const collection = collectionOf(item);
    const days = daysUntil(item.deadline);
    const deadlinePanel = collection === 'practice'
      ? '<small>开放状态</small><strong>长期</strong><span>开放</span>'
      : collection === 'archive'
        ? `<small>结束时间</small><strong>已</strong><span>结束</span><p>${e(item.deadlineText || formatDate(item.deadline))}</p>`
        : `<small>距离截止</small><strong>${Math.max(0, days)}</strong><span>天</span><p>${e(item.deadlineText || formatDate(item.deadline))}</p>`;
    const sourceLink = item.sourceUrl ? `<a class="primary-button" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方页面 ${icon('arrowUp', 16)}</a>` : '';
    const informationStatus = item.rating ? `${item.rating} 级` : item.sourceName === 'Devpost' ? '平台页核验' : '基础核验';

    return `<div class="detail-page"><div class="breadcrumbs"><a href="#/competitions">比赛库</a>${icon('chevron', 14)}<span>${e(item.title)}</span></div><section class="competition-detail-hero"><div><div class="detail-status-row">${statusBadge(item.status)}<span>${collectionLabel(item)}</span></div><h1>${e(item.title)}</h1><p>${e(item.summary)}</p><div class="detail-actions">${sourceLink}<button class="secondary-button" data-favorite="${e(item.id)}">${icon('heart', 16, favorite ? 'fill="currentColor"' : '')}${favorite ? '已收藏' : '收藏比赛'}</button></div></div><div class="deadline-panel">${deadlinePanel}</div></section><section class="detail-layout"><div class="detail-main"><section class="detail-block"><h2>比赛概览</h2><p>${e(item.description || item.summary)}</p></section><section class="detail-block"><h2>适合谁参加</h2><p>${e(item.audience)}</p><div class="tag-row large-tags">${(item.tags || []).map((tag) => `<em>${e(tag)}</em>`).join('')}</div></section><section class="detail-block"><h2>信息说明</h2><p>本站整理公开赛事信息，帮助你快速判断是否值得进一步了解。报名资格、费用、截止时区、知识产权和提交材料必须以主办方页面为准。</p></section></div><aside class="detail-sidebar"><h3>关键信息</h3>${infoRow('target','赛道',item.track)}${infoRow('users','参赛形式',item.format)}${infoRow('graduation','难度',item.difficulty)}${infoRow('play','举办形式',item.mode)}${infoRow('award','奖金/权益',item.prizeNote)}${infoRow('network','信息状态',informationStatus)}${infoRow('clock','最近核验',formatVerified(item.lastVerifiedAt || item.updatedAt))}<div class="official-note"><strong>${e(item.sourceName || '公开来源')}</strong><br>本站评级与商业推广相互独立。<br>发现错误请以官方页面为准。</div></aside></section></div>`;
  }

  function notFound() {
    return `<div class="not-found">${icon('network', 48)}<h1>页面没有连接上</h1><p>这个页面尚未开放，或地址已经发生变化。</p><a class="primary-button" href="#/">回到首页</a></div>`;
  }

  function render() {
    const { path, params } = parseRoute();
    const landing = path === '/';
    let content;
    if (path === '/') content = home();
    else if (path === '/competitions') content = competitionExplorer(params);
    else if (path.startsWith('/competitions/')) content = competitionDetail(decodeURIComponent(path.split('/')[2] || ''));
    else content = notFound();
    app.innerHTML = `${header(landing, path, params)}<main>${content}</main>${footer()}`;
    bindCommon(path, params);
    window.scrollTo(0, 0);
  }

  function updateParams(currentParams, name, value) {
    const params = new URLSearchParams(currentParams);
    if (value) params.set(name, value); else params.delete(name);
    params.delete('page');
    return params;
  }

  function bindCommon(path, currentParams) {
    const menu = app.querySelector('[data-menu]');
    const panel = app.querySelector('[data-mobile-menu]');
    menu?.addEventListener('click', () => {
      const open = panel.hasAttribute('hidden');
      if (open) { panel.removeAttribute('hidden'); menu.innerHTML = icon('x', 21); }
      else { panel.setAttribute('hidden', ''); menu.innerHTML = icon('menu', 21); }
    });

    app.querySelectorAll('[data-header-search], [data-home-search], [data-explorer-search]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = String(new FormData(form).get('q') || '').trim();
      const params = form.matches('[data-explorer-search]') ? updateParams(currentParams, 'q', q) : new URLSearchParams(q ? { q } : {});
      go(`/competitions${params.toString() ? `?${params}` : ''}`);
    }));

    app.querySelectorAll('[data-quick-search]').forEach((button) => button.addEventListener('click', () => {
      go(`/competitions?q=${encodeURIComponent(button.dataset.quickSearch)}`);
    }));

    app.querySelectorAll('[data-filter]').forEach((select) => select.addEventListener('change', () => {
      const params = updateParams(currentParams, select.dataset.filter, select.value);
      go(`/competitions${params.toString() ? `?${params}` : ''}`);
    }));

    app.querySelectorAll('[data-clear-filters]').forEach((button) => button.addEventListener('click', () => go('/competitions')));

    app.querySelector('[data-load-more]')?.addEventListener('click', () => {
      const params = new URLSearchParams(currentParams);
      const page = Number.parseInt(params.get('page') || '1', 10);
      params.set('page', String(page + 1));
      go(`/competitions?${params}`);
    });

    app.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = button.dataset.favorite;
      const next = localStorage.getItem(`favorite:${id}`) !== '1';
      localStorage.setItem(`favorite:${id}`, next ? '1' : '0');
      render();
    }));
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
})();
