(() => {
  const { tracks, hotTags, competitions, resources, resourceLabels } = window.AI_DATA;
  const app = document.getElementById('app');
  let networkTimer = null;
  let networkCycle = 0;

  const paths = {
    search: '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    arrowUp: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    sparkles: '<path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15Z"/><path d="m19 14-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8L19 14Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
    wand: '<path d="m15 4 5 5L8 21l-5-5L15 4Z"/><path d="m6 13 5 5"/><path d="M19 2v3"/><path d="M22 5h-3"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.4 22.4 0 0 1-3.95 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-3 3-2.1-2.1a4 4 0 0 0 5 5L20 17.6a2 2 0 1 1-2.8 2.8L8.9 12.1"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 8h8"/><path d="M8 12h5"/>',
    bot: '<rect width="18" height="14" x="3" y="7" rx="2"/><path d="M12 3v4"/><path d="M8 12h.01"/><path d="M16 12h.01"/><path d="M9 16h6"/>',
    workflow: '<rect width="8" height="6" x="3" y="3" rx="1"/><rect width="8" height="6" x="13" y="15" rx="1"/><path d="M7 9v3a3 3 0 0 0 3 3h3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    graduation: '<path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 7.5-4 9"/><path d="m13.5 7.5 4 9"/><path d="M8 19h8"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v12"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  function icon(name, size = 18, extra = '') {
    return `<svg ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
  }
  function e(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function routeHref(path) { return `#${path}`; }
  function parseRoute() {
    const raw = location.hash.slice(1) || '/';
    const [path, query = ''] = raw.split('?');
    return { path: path || '/', params: new URLSearchParams(query) };
  }
  function go(path) { location.hash = path; }
  function formatDate(date) { return new Intl.DateTimeFormat('zh-CN', {year:'numeric',month:'short',day:'numeric'}).format(new Date(date)); }
  function daysUntil(date) { return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000); }
  function statusBadge(status) {
    const labels = {ongoing:'进行中',closing:'即将截止',upcoming:'未开始',ended:'已结束',updated:'信息更新'};
    return `<span class="status-badge status-${status}">${labels[status]}</span>`;
  }
  const resourceIconNames = {tools:'tool',prompts:'message',skills:'sparkles',agents:'bot',workflows:'workflow'};

  function brand() {
    return `<a href="#/" class="brand"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M5 24.5 11.7 7l4.1 10.3L20.6 11 27 24.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="5" r="2" fill="currentColor"/></svg></span><span>AI 赛场</span><small>Beta</small></a>`;
  }
  function header(landing, currentPath) {
    const nav = [['/competitions','比赛库'],['/workflows','参赛方案'],['/tools','工具'],['/prompts','提示词'],['/skills','Skills'],['/agents','Agent 手册']];
    return `<header class="site-header ${landing ? 'site-header-landing' : ''}"><div class="header-inner">${brand()}<nav class="desktop-nav">${nav.map(([to,label])=>`<a href="#${to}" class="${currentPath.startsWith(to)?'active':''}">${label}</a>`).join('')}${landing?'<a href="#/" data-scroll-how>关于</a>':''}</nav>${!landing?`<form class="header-search" data-header-search>${icon('search',16)}<input name="q" placeholder="搜索比赛、赛道、主办方…" aria-label="全站搜索"></form>`:''}<div class="header-actions"><button class="text-button desktop-only" data-login>登录</button><a class="primary-button compact desktop-only" href="#/competitions">进入比赛库 ${icon('arrow',15)}</a><button class="menu-button" data-menu>${icon('menu',21)}</button></div></div><div class="mobile-menu" data-mobile-menu hidden>${!landing?`<form class="mobile-search" data-header-search>${icon('search',16)}<input name="q" placeholder="搜索比赛…"></form>`:''}${nav.map(([to,label])=>`<a href="#${to}">${label}</a>`).join('')}<a class="primary-button" href="#/competitions">进入比赛库</a></div></header>`;
  }
  function footer() {
    return `<footer class="site-footer"><div class="footer-main"><div class="footer-brand">${brand()}<p>搜索 AI 比赛，连接工具、提示词、Skills、Agent 手册和完整参赛路径。</p><small>当前比赛内容为产品演示数据。</small></div><div><strong>发现</strong><a href="#/competitions">全部比赛</a><a href="#/competitions?status=closing">即将截止</a><a href="#/workflows">参赛方案</a></div><div><strong>资源</strong><a href="#/tools">AI 工具</a><a href="#/prompts">提示词</a><a href="#/skills">Skills</a></div><div><strong>搭建</strong><a href="#/agents">Agent 手册</a><a href="#/workflows">工作流</a><span>意见反馈（占位）</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} AI 赛场</span><span>比赛信息请以主办方官方公告为准。</span></div></footer>`;
  }

  function home() {
    const conceptPool = ['AI Agent','AI 视频','具身智能','大学生赛事','个人参赛','奖金赛事','提示词','Skills','Agent 手册','工作流','答辩材料','AI 编程','创新创业','作品交付','团队协作','零基础'];
    const positions = [{x:10,y:24,m:1},{x:24,y:12,m:0},{x:42,y:21,m:1},{x:72,y:13,m:0},{x:86,y:30,m:1},{x:16,y:67,m:0},{x:34,y:82,m:1},{x:66,y:78,m:1},{x:87,y:69,m:0},{x:57,y:8,m:0}];
    const lines = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[4,8],[2,9],[9,3],[2,7],[1,6],[3,7]];
    const colors = ['blue','green','purple','orange','pink'];
    const nodes = positions.map((p,i)=>`<button data-network-node="${i}" data-base="${i*2}" class="network-node node-${colors[i%colors.length]} ${p.m?'':'network-node-desktop'}" style="left:${p.x}%;top:${p.y}%;animation-delay:${i*-.7}s"><span class="node-dot"></span><span data-node-label>${conceptPool[(i*2)%conceptPool.length]}</span></button>`).join('');
    const svgLines = lines.map(([a,b],i)=>`<line data-line="${i}" data-a="${a}" data-b="${b}" x1="${positions[a].x}" y1="${positions[a].y}" x2="${positions[b].x}" y2="${positions[b].y}"/>`).join('');
    const resourcesEntry = [['tools','blue'],['prompts','green'],['skills','purple'],['agents','orange']].map(([kind,color])=>{
      const info = resourceLabels[kind]; const count = resources.filter(r=>r.kind===kind).length;
      return `<a href="#/${kind}" class="resource-entry resource-${color}"><div class="resource-entry-top"><span>${icon(resourceIconNames[kind],20)}</span><em>${count} 项演示资源</em></div><h3>${info.title}</h3><p>${info.description}</p><div class="resource-entry-link">进入资源库 ${icon('arrowUp',17)}</div></a>`;
    }).join('');
    const workflows = resources.filter(r=>r.kind==='workflows').map((r,i)=>`<a href="#/workflows/${r.id}" class="workflow-feature"><div class="workflow-index">0${i+1}</div><div class="workflow-feature-body"><span>${e(r.meta)}</span><h3>${e(r.title)}</h3><p>${e(r.summary)}</p><div class="tag-row">${r.tags.map(t=>`<em>${e(t)}</em>`).join('')}</div></div>${icon('arrowUp')}</a>`).join('');
    return `<section class="hero-section"><div class="knowledge-network" data-network><svg class="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${svgLines}</svg>${nodes}</div><div class="hero-content"><div class="eyebrow">${icon('sparkles',15)} AI 比赛与参赛资源的连接层</div><h1>从发现比赛，<br><span>到完成作品</span></h1><p>把 AI 比赛、工具、提示词、Skills、Agent 手册和工作流连成一条真正能执行的参赛路径。</p><form class="hero-search" data-home-search>${icon('search',22)}<input name="q" placeholder="搜索 AI 比赛、赛道或你想完成的作品……" aria-label="搜索 AI 比赛"><button>开始探索 ${icon('arrow',17)}</button></form><div class="hot-tags"><span>热门：</span>${hotTags.map(t=>`<button data-quick-search="${e(t)}">${e(t)}</button>`).join('')}</div><p class="demo-note">当前比赛内容为演示数据，正式信息将标注来源与更新时间。</p></div><div class="hero-scroll-hint"><span></span>向下了解平台</div></section>
    <section class="capability-strip">${[[icon('compass'),'发现比赛','找到适合你的机会'],[icon('target'),'生成方案','拆解要求与时间线'],[icon('layers'),'匹配工具','组合 Prompt 与 Skills'],[icon('checkCircle'),'完成作品','检查材料并交付']].map((v,i)=>`<div class="capability-item"><span class="capability-number">0${i+1}</span><span class="capability-icon">${v[0]}</span><div><strong>${v[1]}</strong><small>${v[2]}</small></div>${i<3?icon('chevron',15,'class="capability-arrow"'):''}</div>`).join('')}</section>
    <section id="how-it-works" class="section section-soft"><div class="section-heading"><span>HOW IT WORKS</span><h2>从比赛到作品，只需要三步</h2><p>不是再给你一堆链接，而是把下一步直接摆在眼前。</p></div><div class="steps-grid">${step('01','search','找到适合你的比赛','按照赛道、时间、参赛身份、难度和作品类型筛选，快速排除不适合的机会。','mint')}${step('02','wand','获得完整参赛路线','把规则拆成选题、时间安排、工具组合、提示词、Skills 和制作节点。','lilac')}${step('03','rocket','完成作品并提交','沿着清单推进制作，整理证据、检查材料，最后形成可以交付的作品。','peach')}</div></section>
    <section class="section"><div class="section-heading"><span>RESOURCE LAYER</span><h2>完成比赛所需的一切资源</h2><p>每项资源都应该回答：它在哪个比赛、哪个环节真正有用。</p></div><div class="resource-entry-grid">${resourcesEntry}</div></section>
    <section class="section section-dark"><div class="dark-heading"><div><span>FEATURED PATHS</span><h2>精选参赛路径</h2><p>从具体作品出发，给出可以照着执行的时间表与交付清单。</p></div><a href="#/workflows" class="ghost-light-button">查看全部工作流 ${icon('arrow',16)}</a></div><div class="workflow-showcase">${workflows}</div></section>
    <section class="section final-cta"><div class="final-cta-copy"><span>READY TO START?</span><h2>先找到值得做的比赛，<br>再决定用什么工具。</h2><p>从比赛搜索开始，建立你的第一条参赛路径。</p></div><a class="primary-button large" href="#/competitions">进入比赛库 ${icon('arrow',18)}</a></section>`;
  }
  function step(number, iconName, title, desc, accent) { return `<article class="step-card step-${accent}"><div class="step-top"><span>${number}</span><i>${icon(iconName)}</i></div><h3>${title}</h3><p>${desc}</p><div class="step-line"></div></article>`; }

  function competitionCard(c) {
    const days = daysUntil(c.deadline); const favorite = localStorage.getItem(`favorite:${c.id}`)==='1';
    return `<article class="competition-card"><div class="competition-card-top">${statusBadge(c.status)}<button class="favorite-button ${favorite?'favorite':''}" data-favorite="${c.id}">${icon('heart',18, favorite?'fill="currentColor"':'')}</button></div><a href="#/competitions/${c.id}" class="competition-title">${e(c.title)}</a><p class="organizer">${e(c.organizer)}</p><p class="competition-summary">${e(c.summary)}</p><div class="deadline-row">${icon('calendar',16)}<div><span>${days>=0?`还剩 ${days} 天`:'已截止'}</span><small>${formatDate(c.deadline)}</small></div></div><div class="meta-grid"><span>${icon('target',14)}${e(c.track)}</span><span>${icon('users',14)}${e(c.format)}</span><span>${icon('graduation',14)}${e(c.difficulty)}</span><span>${icon('dollar',14)}${c.hasPrize?'有奖金/权益':'无现金奖金'}</span></div><div class="tag-row">${c.tags.map(t=>`<em>${e(t)}</em>`).join('')}</div><div class="competition-card-footer"><span class="${c.hasPlaybook?'':'muted'}">${c.hasPlaybook?`${icon('check',14)}有本站方案`:'方案整理中'}</span><a href="#/competitions/${c.id}">查看详情 ${icon('arrow',14)}</a></div></article>`;
  }

  function competitionExplorer(params) {
    const q=params.get('q')||'', track=params.get('track')||'', status=params.get('status')||'', format=params.get('format')||'', difficulty=params.get('difficulty')||'', prize=params.get('prize')||'', mode=params.get('mode')||'';
    const filtered=competitions.filter(c=>{const hay=[c.title,c.organizer,c.track,c.summary,...c.tags].join(' ').toLowerCase();return(!q||hay.includes(q.toLowerCase()))&&(!track||c.track===track)&&(!status||c.status===status)&&(!format||c.format===format)&&(!difficulty||c.difficulty===difficulty)&&(!prize||(prize==='yes'?c.hasPrize:!c.hasPrize))&&(!mode||c.mode===mode)}).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
    const select=(name,label,value,options)=>`<label class="filter-field"><span>${label}</span><select data-filter="${name}">${options.map(([v,l])=>`<option value="${e(v)}" ${value===v?'selected':''}>${e(l)}</option>`).join('')}</select></label>`;
    return `<div class="app-page"><section class="explorer-hero"><div class="page-kicker">${icon('search',15)} AI 比赛搜索引擎</div><h1>找到现在值得参加的 AI 比赛</h1><p>筛选适合你的赛道、时间、身份与难度。当前均为演示数据。</p><form class="explorer-search" data-explorer-search>${icon('search',19)}<input name="q" value="${e(q)}" placeholder="搜索比赛名称、赛道、主办方或作品方向……"><button>搜索</button></form><div class="hot-tags explorer-tags">${hotTags.map(t=>`<button data-quick-search="${e(t)}">${e(t)}</button>`).join('')}</div></section><section class="explorer-layout"><aside class="filter-panel"><div class="filter-title">${icon('filter',17)}<strong>筛选条件</strong><button data-clear-filters>清除</button></div>${select('status','比赛状态',status,[['','全部状态'],['ongoing','进行中'],['closing','即将截止'],['upcoming','未开始'],['updated','信息更新'],['ended','已结束']])}${select('track','赛道',track,[['','全部赛道'],...tracks.map(t=>[t,t])])}${select('format','参赛形式',format,[['','不限'],['个人','个人'],['团队','团队'],['个人/团队','个人/团队']])}${select('difficulty','难度',difficulty,[['','不限'],['入门','入门'],['进阶','进阶'],['专家','专家']])}${select('prize','奖金',prize,[['','不限'],['yes','有奖金/权益'],['no','无现金奖金']])}${select('mode','形式',mode,[['','不限'],['线上','线上'],['线下','线下'],['线上+线下','线上+线下']])}</aside><div class="results-column"><div class="results-head"><div><strong>${filtered.length}</strong> 场匹配比赛${q?` · “${e(q)}”`:''}</div><span>按截止时间排序</span></div>${filtered.length?`<div class="competition-grid">${filtered.map(competitionCard).join('')}</div>`:`<div class="empty-state">${icon('search',30)}<h2>暂时没有匹配结果</h2><p>尝试减少筛选条件，或换一个更宽泛的关键词。</p><button class="secondary-button" data-clear-filters>清除所有筛选</button></div>`}</div></section></div>`;
  }

  function competitionDetail(id) {
    const c=competitions.find(x=>x.id===id); if(!c)return notFound();
    const related=resources.filter(r=>r.tracks.includes(c.track));
    const group=(kind,title)=>{const items=related.filter(r=>r.kind===kind).slice(0,3);if(!items.length)return'';return `<div class="resource-group"><div class="resource-group-title"><span>${icon(resourceIconNames[kind],15)}</span><strong>${title}</strong></div><div class="resource-mini-grid">${items.map(r=>`<a href="#/${kind}/${r.id}"><span>${e(r.title)}</span><small>${e(r.summary)}</small>${icon('arrowUp',15)}</a>`).join('')}</div></div>`};
    const fav=localStorage.getItem(`favorite:${c.id}`)==='1';
    return `<div class="detail-page"><div class="breadcrumbs"><a href="#/competitions">比赛库</a>${icon('chevron',14)}<span>${e(c.title)}</span></div><section class="competition-detail-hero"><div><div class="detail-status-row">${statusBadge(c.status)}<span>演示数据</span></div><h1>${e(c.title)}</h1><p>${e(c.summary)}</p><div class="detail-actions"><button class="primary-button" data-plan>获取参赛方案 ${icon('wand',16)}</button><button class="secondary-button" data-favorite="${c.id}">${icon('heart',16,fav?'fill="currentColor"':'')}${fav?'已收藏':'收藏比赛'}</button></div></div><div class="deadline-panel"><small>距离截止</small><strong>${Math.max(0,daysUntil(c.deadline))}</strong><span>天</span><p>${formatDate(c.deadline)}</p></div></section><section class="detail-layout"><div class="detail-main"><section class="detail-block"><h2>比赛概览</h2><p>${e(c.description)}</p></section><section class="detail-block"><h2>适合谁参加</h2><p>${e(c.audience)}</p><div class="tag-row large-tags">${c.tags.map(t=>`<em>${e(t)}</em>`).join('')}</div></section><section class="detail-block"><h2>配套参赛资源</h2><p class="block-description">以下内容根据赛道自动匹配，当前为演示资源。</p>${group('tools','推荐工具')}${group('prompts','配套提示词')}${group('skills','推荐 Skills')}${group('agents','Agent 手册')}${group('workflows','完整工作流')}</section></div><aside class="detail-sidebar"><h3>关键信息</h3>${infoRow('target','赛道',c.track)}${infoRow('users','参赛形式',c.format)}${infoRow('graduation','难度',c.difficulty)}${infoRow('play','举办形式',c.mode)}${infoRow('award','奖金/权益',c.prizeNote)}<div class="official-note">比赛信息请以主办方官方公告为准。</div></aside></section></div>`;
  }
  function infoRow(iconName,label,value){return `<div class="info-row"><i>${icon(iconName,15)}</i><div><small>${label}</small><strong>${e(value)}</strong></div></div>`}

  function resourceList(kind) {
    const info=resourceLabels[kind]; if(!info)return notFound(); const list=resources.filter(r=>r.kind===kind);
    return `<div class="resource-page app-page"><section class="resource-list-hero"><div class="resource-hero-icon">${icon(resourceIconNames[kind],22)}</div><div><span>参赛资源库</span><h1>${info.title}</h1><p>${info.description}</p></div></section><div class="resource-search">${icon('search',18)}<input data-resource-search data-kind="${kind}" placeholder="搜索${info.title}、标签或适用赛道……"></div><div class="resource-list-head"><strong data-resource-count>${list.length} 项资源</strong><span>当前为演示内容</span></div><div class="resource-card-grid" data-resource-grid>${list.map(resourceCard).join('')}</div></div>`;
  }
  function resourceCard(r) { return `<a class="resource-card" href="#/${r.kind}/${r.id}" data-resource-text="${e([r.title,r.summary,r.description,...r.tags,...r.tracks].join(' ').toLowerCase())}"><div class="resource-card-top"><span>${icon(resourceIconNames[r.kind],17)}</span><em>${e(r.meta||resourceLabels[r.kind].singular)}</em></div><h2>${e(r.title)}</h2><p>${e(r.summary)}</p><div class="tag-row">${r.tags.map(t=>`<em>${e(t)}</em>`).join('')}</div><div class="resource-card-bottom"><span>${e(r.tracks.slice(0,2).join(' · '))}</span>${icon('arrowUp',17)}</div></a>`; }

  function resourceDetail(kind,id) {
    const r=resources.find(x=>x.kind===kind&&x.id===id); if(!r)return notFound(); const info=resourceLabels[kind];
    const promptText=`你是一名 AI 比赛参赛顾问。请根据以下信息完成任务：\n\n比赛名称：{{比赛名称}}\n参赛赛道：{{赛道}}\n我的目标：{{目标}}\n现有资源：{{现有资源}}\n截止时间：{{截止时间}}\n\n请输出：\n1. 核心要求提炼\n2. 作品方向建议\n3. 分阶段执行计划\n4. 风险与检查清单\n5. 下一步最小行动`;
    return `<div class="detail-page resource-detail-page"><div class="breadcrumbs"><a href="#/${kind}">${info.title}</a>${icon('chevron',14)}<span>${e(r.title)}</span></div><section class="resource-detail-hero"><div class="resource-hero-icon large">${icon(resourceIconNames[kind],27)}</div><div><span>${info.singular} · 演示内容</span><h1>${e(r.title)}</h1><p>${e(r.summary)}</p><div class="tag-row large-tags">${r.tags.map(t=>`<em>${e(t)}</em>`).join('')}</div></div></section><section class="resource-detail-layout"><div class="detail-main"><section class="detail-block"><h2>资源说明</h2><p>${e(r.description)}</p></section>${kind==='prompts'?`<section class="detail-block"><h2>可直接复制的提示词</h2><p class="block-description">变量使用 {{变量名}} 标记，复制后替换即可。</p><div class="copy-block"><pre>${e(promptText)}</pre><button data-copy-prompt data-text="${encodeURIComponent(promptText)}">${icon('copy',16)}<span>复制提示词</span></button></div></section>`:`<section class="detail-block"><h2>推荐使用方式</h2><ol class="usage-list"><li>先确认它对应的比赛环节和交付要求。</li><li>用一个小样本测试输出质量，不要直接全量使用。</li><li>保存过程记录，作为答辩中的方法与证据。</li></ol></section>`}<section class="detail-block"><h2>适用赛道</h2><div class="track-links">${r.tracks.map(t=>`<a href="#/competitions?track=${encodeURIComponent(t)}">${e(t)}${icon('arrow',14)}</a>`).join('')}</div></section></div><aside class="detail-sidebar"><h3>资源信息</h3>${infoRow('book','类型',info.singular)}${infoRow('target','适用赛道',r.tracks.join('、'))}${infoRow('clock','状态','演示资源')}<div class="official-note">正式版将增加来源、版本、实测状态和授权信息。</div></aside></section></div>`;
  }

  function notFound(){return `<div class="not-found">${icon('network',48)}<h1>页面没有连接上</h1><p>这个节点可能尚未建立，或者地址已经发生变化。</p><a class="primary-button" href="#/">回到首页</a></div>`}

  function render() {
    if (networkTimer) { clearInterval(networkTimer); networkTimer=null; }
    const {path,params}=parseRoute(); const landing=path==='/';
    let content;
    if(path==='/') content=home();
    else if(path==='/competitions') content=competitionExplorer(params);
    else if(path.startsWith('/competitions/')) content=competitionDetail(decodeURIComponent(path.split('/')[2]||''));
    else {
      const parts=path.split('/').filter(Boolean); const kind=parts[0];
      if(resourceLabels[kind]) content=parts[1]?resourceDetail(kind,decodeURIComponent(parts[1])):resourceList(kind); else content=notFound();
    }
    app.innerHTML=`${header(landing,path)}<main>${content}</main>${footer()}`;
    bindCommon();
    if(landing) bindHomeNetwork();
    if(path==='/competitions') bindExplorer(params);
    if(resourceLabels[path.split('/')[1]] && path.split('/').filter(Boolean).length===1) bindResourceSearch();
    window.scrollTo(0,0);
  }

  function bindCommon() {
    const menu=app.querySelector('[data-menu]'), panel=app.querySelector('[data-mobile-menu]');
    menu?.addEventListener('click',()=>{const open=panel.hasAttribute('hidden'); if(open){panel.removeAttribute('hidden');menu.innerHTML=icon('x',21)}else{panel.setAttribute('hidden','');menu.innerHTML=icon('menu',21)}});
    app.querySelectorAll('[data-header-search]').forEach(form=>form.addEventListener('submit',ev=>{ev.preventDefault();const q=new FormData(form).get('q')||'';go(`/competitions${String(q).trim()?`?q=${encodeURIComponent(String(q).trim())}`:''}`)}));
    app.querySelectorAll('[data-login]').forEach(btn=>btn.addEventListener('click',()=>alert('登录功能将在正式版开放')));
    app.querySelector('[data-scroll-how]')?.addEventListener('click',ev=>{ev.preventDefault();document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'});});
    app.querySelectorAll('[data-favorite]').forEach(btn=>btn.addEventListener('click',ev=>{ev.preventDefault();const id=btn.dataset.favorite;const next=localStorage.getItem(`favorite:${id}`)!=='1';localStorage.setItem(`favorite:${id}`,next?'1':'0');render()}));
    app.querySelector('[data-plan]')?.addEventListener('click',()=>alert('参赛方案生成将在接入真实比赛数据后开放'));
    app.querySelector('[data-copy-prompt]')?.addEventListener('click',async ev=>{const btn=ev.currentTarget;const text=decodeURIComponent(btn.dataset.text);try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}btn.innerHTML=`${icon('check',16)}<span>已复制</span>`;setTimeout(()=>btn.innerHTML=`${icon('copy',16)}<span>复制提示词</span>`,1600)});
  }

  function bindHomeNetwork() {
    const form=app.querySelector('[data-home-search]'); form?.addEventListener('submit',ev=>{ev.preventDefault();const q=new FormData(form).get('q')||'';go(`/competitions${String(q).trim()?`?q=${encodeURIComponent(String(q).trim())}`:''}`)});
    app.querySelectorAll('[data-quick-search]').forEach(btn=>btn.addEventListener('click',()=>go(`/competitions?q=${encodeURIComponent(btn.dataset.quickSearch)}`)));
    const nodes=[...app.querySelectorAll('[data-network-node]')]; const lines=[...app.querySelectorAll('[data-line]')]; const pool=['AI Agent','AI 视频','具身智能','大学生赛事','个人参赛','奖金赛事','提示词','Skills','Agent 手册','工作流','答辩材料','AI 编程','创新创业','作品交付','团队协作','零基础']; const colors=['blue','green','purple','orange','pink'];
    const update=()=>nodes.forEach((node,i)=>{const label=pool[(Number(node.dataset.base)+networkCycle)%pool.length];node.querySelector('[data-node-label]').textContent=label;colors.forEach(c=>node.classList.remove(`node-${c}`));node.classList.add(`node-${colors[(i+networkCycle)%colors.length]}`)});
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) networkTimer=setInterval(()=>{networkCycle++;update()},4200);
    nodes.forEach((node,i)=>{node.addEventListener('click',()=>go(`/competitions?q=${encodeURIComponent(node.querySelector('[data-node-label]').textContent)}`));node.addEventListener('mouseenter',()=>{nodes.forEach((n,j)=>{const connected=i===j||lines.some(l=>(Number(l.dataset.a)===i&&Number(l.dataset.b)===j)||(Number(l.dataset.b)===i&&Number(l.dataset.a)===j));n.classList.toggle('dimmed',!connected)});lines.forEach(l=>l.classList.toggle('active',Number(l.dataset.a)===i||Number(l.dataset.b)===i))});node.addEventListener('mouseleave',()=>{nodes.forEach(n=>n.classList.remove('dimmed'));lines.forEach(l=>l.classList.remove('active'))})});
  }

  function bindExplorer(currentParams) {
    app.querySelector('[data-explorer-search]')?.addEventListener('submit',ev=>{ev.preventDefault();const p=new URLSearchParams(currentParams);const q=new FormData(ev.currentTarget).get('q')||'';if(String(q).trim())p.set('q',String(q).trim());else p.delete('q');go(`/competitions${p.toString()?`?${p}`:''}`)});
    app.querySelectorAll('[data-quick-search]').forEach(btn=>btn.addEventListener('click',()=>{const p=new URLSearchParams(currentParams);p.set('q',btn.dataset.quickSearch);go(`/competitions?${p}`)}));
    app.querySelectorAll('[data-filter]').forEach(sel=>sel.addEventListener('change',()=>{const p=new URLSearchParams(currentParams);if(sel.value)p.set(sel.dataset.filter,sel.value);else p.delete(sel.dataset.filter);go(`/competitions${p.toString()?`?${p}`:''}`)}));
    app.querySelectorAll('[data-clear-filters]').forEach(btn=>btn.addEventListener('click',()=>go('/competitions')));
  }
  function bindResourceSearch() {
    const input=app.querySelector('[data-resource-search]'); if(!input)return; input.addEventListener('input',()=>{const q=input.value.toLowerCase();const cards=[...app.querySelectorAll('[data-resource-text]')];let shown=0;cards.forEach(card=>{const match=card.dataset.resourceText.includes(q);card.style.display=match?'':'none';if(match)shown++});app.querySelector('[data-resource-count]').textContent=`${shown} 项资源`});
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
})();
