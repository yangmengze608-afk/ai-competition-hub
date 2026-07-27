(() => {
  const SOURCE_DATA_URL = './data/competition-sources-v1.json';
  const DEFAULT_TITLE = 'AI 赛场｜从发现比赛，到完成作品';
  let sourceDataPromise = null;

  const tierLabels = {
    O1: '一手官方源',
    O2: '专业承载平台',
    A2: '审核型聚合平台',
    A3: '普通发现源',
    U: '待核验来源',
    R: '风险来源',
  };

  const statusLabels = {
    known_active: '已知活跃',
    needs_recheck: '需要复核',
    candidate: '候选待核验',
  };

  const sourceTypeLabels = {
    official_meta: '官方目录 / 元数据',
    official_portal: '政府或教育入口',
    official_platform: '官方赛事平台',
    official_competition: '长期赛事官网',
    official_network: '赛事联盟 / 系列赛',
    platform: '专业承载平台',
    aggregator_host: '聚合与报名平台',
    aggregator: '赛事发现聚合站',
  };

  const usageLabels = {
    fact_source: '可作为事实来源',
    hosting_source_with_event_level_review: '逐场核验后使用',
    discovery_then_trace_to_official: '仅发现线索，必须回溯官方页',
  };

  const categoryLabels = {
    comprehensive: '综合赛事',
    entrepreneurship: '创新创业',
    innovation_research: '创新与科研',
    graduate_multidisciplinary: '研究生综合赛事',
    design: '设计与创意',
    ai_data: 'AI 与数据科学',
    ai_agent: 'AI Agent',
    cloud_ai: '云计算与 AI',
    programming: '程序设计',
    programming_design: '编程与设计',
    computer: '计算机综合',
    software: '软件开发',
    software_entrepreneurship: '软件与创业',
    robotics: '机器人',
    embedded_robotics: '嵌入式与智能车',
    electronics: '电子与通信',
    engineering: '工程技术',
    mathematical_modeling: '数学建模',
    mathematics: '数学',
    statistics: '统计与分析',
    business: '商业与案例',
    finance: '金融与投资',
    marketing: '营销与品牌',
    advertising: '广告与传播',
    media: '数字媒体',
    language: '语言与表达',
    hackathon: '黑客松',
    open_innovation: '开放创新',
    social_impact: '公益与社会影响',
    sustainability: '可持续发展',
    research: '科研挑战',
    cybersecurity: '网络安全',
    law_policy: '法律与公共政策',
    architecture: '建筑与城市',
    film_art: '影视与艺术',
    life_science: '生命科学',
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function currentPath() {
    return (location.hash.slice(1).split('?')[0] || '/');
  }

  function loadSourceData() {
    if (!sourceDataPromise) {
      sourceDataPromise = fetch(SOURCE_DATA_URL, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });
    }
    return sourceDataPromise;
  }

  function injectResearchNavigation() {
    const path = currentPath();
    const desktopNav = document.querySelector('.desktop-nav');
    if (desktopNav && !desktopNav.querySelector('[data-research-nav]')) {
      const link = document.createElement('a');
      link.href = '#/sources';
      link.dataset.researchNav = '';
      link.textContent = '赛事研究';
      const anchor = desktopNav.querySelector('a[href="#/workflows"]');
      desktopNav.insertBefore(link, anchor || null);
    }
    const desktopLink = desktopNav?.querySelector('[data-research-nav]');
    desktopLink?.classList.toggle('active', path === '/sources' || path === '/quality');

    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (mobileMenu && !mobileMenu.querySelector('[data-research-mobile]')) {
      const sourceLink = document.createElement('a');
      sourceLink.href = '#/sources';
      sourceLink.dataset.researchMobile = '';
      sourceLink.textContent = '赛事来源库';
      const qualityLink = document.createElement('a');
      qualityLink.href = '#/quality';
      qualityLink.dataset.researchQualityMobile = '';
      qualityLink.textContent = '含金量评价标准';
      const primary = mobileMenu.querySelector('.primary-button');
      mobileMenu.insertBefore(sourceLink, primary || null);
      mobileMenu.insertBefore(qualityLink, primary || null);
    }

    const footerMain = document.querySelector('.footer-main');
    if (footerMain && !footerMain.querySelector('[data-research-footer]')) {
      const column = document.createElement('div');
      column.dataset.researchFooter = '';
      column.innerHTML = '<strong>研究</strong><a href="#/sources">赛事来源库</a><a href="#/quality">含金量标准</a><span>研究版 · 持续核验</span>';
      footerMain.appendChild(column);
    }
  }

  function researchTabs(active) {
    return `<nav class="research-tabs" aria-label="赛事研究导航">
      <a class="${active === 'sources' ? 'active' : ''}" href="#/sources">赛事来源库</a>
      <a class="${active === 'quality' ? 'active' : ''}" href="#/quality">含金量与权威性</a>
    </nav>`;
  }

  function sourceBadge(type, value, label) {
    return `<span class="research-badge ${type}-${escapeHtml(value)}">${escapeHtml(label)}</span>`;
  }

  function sourceCard(source) {
    const category = categoryLabels[source.coverage_category] || source.coverage_category || '未分类';
    const tier = tierLabels[source.baseline_source_tier] || source.baseline_source_tier || '未评级';
    const status = statusLabels[source.discovery_status] || source.discovery_status || '未知状态';
    const type = sourceTypeLabels[source.source_type] || source.source_type || '其他来源';
    const usage = usageLabels[source.recommended_usage] || source.recommended_usage || '需要人工核验';
    const region = source.region_group === 'CN' ? '国内' : '国际';
    const searchable = [source.name, source.country_or_scope, category, tier, status, type, source.notes].join(' ').toLowerCase();

    return `<article class="source-card" data-source-card
      data-region="${escapeHtml(source.region_group)}"
      data-tier="${escapeHtml(source.baseline_source_tier)}"
      data-status="${escapeHtml(source.discovery_status)}"
      data-category="${escapeHtml(source.coverage_category)}"
      data-search="${escapeHtml(searchable)}">
      <div class="source-card-top">
        <div class="source-badges">
          ${sourceBadge('region', source.region_group, region)}
          ${sourceBadge('tier', source.baseline_source_tier, source.baseline_source_tier || 'U')}
          ${sourceBadge('status', source.discovery_status, status)}
        </div>
        <span class="source-priority">${escapeHtml(source.crawl_priority || 'P?')}</span>
      </div>
      <h2>${escapeHtml(source.name)}</h2>
      <p class="source-type">${escapeHtml(type)} · ${escapeHtml(category)}</p>
      <p class="source-note">${escapeHtml(source.notes || '暂无补充说明')}</p>
      <div class="source-usage"><strong>推荐用法</strong><span>${escapeHtml(usage)}</span></div>
      <div class="source-card-footer">
        <span>${escapeHtml(source.country_or_scope || region)}</span>
        <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">打开源站 ↗</a>
      </div>
    </article>`;
  }

  function renderSourcesPage(main) {
    document.title = `赛事来源库｜AI 赛场`;
    main.innerHTML = `<div class="research-page">
      <section class="research-hero">
        ${researchTabs('sources')}
        <span class="research-kicker">GLOBAL SOURCE AUDIT · V1</span>
        <h1>全球大学生赛事来源库</h1>
        <p>先尽可能找全比赛入口，再区分官方源、专业平台与聚合发现源。这里展示的是研究地图，不是无条件推荐名单。</p>
        <div class="research-alert">所有聚合平台只能用于发现线索；具体比赛仍需回溯官方页面，并在单场赛事层完成权威性与含金量审核。</div>
      </section>
      <section class="research-content">
        <div class="research-loading" data-source-loading>正在读取来源库……</div>
      </section>
    </div>`;

    loadSourceData().then((data) => {
      if (currentPath() !== '/sources') return;
      const content = main.querySelector('.research-content');
      if (!content) return;
      const categories = [...new Set(data.sources.map((source) => source.coverage_category).filter(Boolean))]
        .sort((a, b) => (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b, 'zh-CN'));

      content.innerHTML = `<div class="source-stats">
        <div><strong>${data.counts.total}</strong><span>全部来源</span></div>
        <div><strong>${data.counts.china}</strong><span>国内来源</span></div>
        <div><strong>${data.counts.international}</strong><span>国际来源</span></div>
        <div><strong>${data.counts.known_active}</strong><span>已知活跃</span></div>
        <div><strong>${data.counts.needs_recheck + data.counts.candidate}</strong><span>仍需核验</span></div>
      </div>
      <div class="source-controls">
        <label class="source-search"><span>搜索</span><input data-source-search placeholder="搜索网站、赛道、国家或说明……"></label>
        <label><span>地区</span><select data-source-region><option value="">全部</option><option value="CN">国内</option><option value="INTL">国际</option></select></label>
        <label><span>来源等级</span><select data-source-tier><option value="">全部</option>${Object.entries(tierLabels).map(([value, label]) => `<option value="${value}">${value} · ${label}</option>`).join('')}</select></label>
        <label><span>核验状态</span><select data-source-status><option value="">全部</option>${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
        <label><span>覆盖方向</span><select data-source-category><option value="">全部</option>${categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(categoryLabels[value] || value)}</option>`).join('')}</select></label>
      </div>
      <div class="source-results-head"><strong data-source-count>${data.sources.length}</strong><span>个来源 · 数据生成于 ${escapeHtml(data.generated_at)}</span></div>
      <div class="source-grid" data-source-grid>${data.sources.map(sourceCard).join('')}</div>
      <div class="research-empty" data-source-empty hidden><h2>没有匹配来源</h2><p>减少筛选条件或换一个关键词。</p></div>`;
      bindSourceFilters(content);
    }).catch((error) => {
      const loading = main.querySelector('[data-source-loading]');
      if (loading) loading.innerHTML = `<strong>来源库读取失败</strong><span>${escapeHtml(error.message)}</span><p>请刷新页面，或稍后再试。</p>`;
    });
  }

  function bindSourceFilters(root) {
    const search = root.querySelector('[data-source-search]');
    const region = root.querySelector('[data-source-region]');
    const tier = root.querySelector('[data-source-tier]');
    const status = root.querySelector('[data-source-status]');
    const category = root.querySelector('[data-source-category]');
    const cards = [...root.querySelectorAll('[data-source-card]')];
    const count = root.querySelector('[data-source-count]');
    const empty = root.querySelector('[data-source-empty]');

    const update = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const match = (!query || card.dataset.search.includes(query))
          && (!region.value || card.dataset.region === region.value)
          && (!tier.value || card.dataset.tier === tier.value)
          && (!status.value || card.dataset.status === status.value)
          && (!category.value || card.dataset.category === category.value);
        card.hidden = !match;
        if (match) visible += 1;
      });
      count.textContent = String(visible);
      empty.hidden = visible !== 0;
    };

    [search, region, tier, status, category].forEach((control) => {
      control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', update);
    });
  }

  function dimensionCard(code, title, description, items) {
    return `<article class="quality-dimension">
      <span>${code}</span><h2>${title}</h2><p>${description}</p>
      <ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>
    </article>`;
  }

  function gradeCard(grade, title, description) {
    return `<article class="grade-card grade-${grade.toLowerCase()}"><strong>${grade}</strong><div><h3>${title}</h3><p>${description}</p></div></article>`;
  }

  function renderQualityPage(main) {
    document.title = `含金量评价标准｜AI 赛场`;
    main.innerHTML = `<div class="research-page quality-page">
      <section class="research-hero">
        ${researchTabs('quality')}
        <span class="research-kicker">QUALITY RUBRIC · V1.0</span>
        <h1>比赛的“含金量”不能只看一个分数</h1>
        <p>我们把赛事价值拆成权威性、履历价值、成长价值和个人适配度，并要求每个结论都有可追溯证据。</p>
        <div class="research-alert">来源可信度评价的是“信息从哪里来”；赛事评级评价的是“这一场比赛是否值得投入”。两者必须分开。</div>
      </section>
      <section class="research-content">
        <div class="quality-dimensions">
          ${dimensionCard('01', '权威性', '判断赛事是否由可信机构组织，规则、评审和结果是否透明。', ['主办机构是否合法可核验', '是否有正式认可与机构背书', '评审、申诉和学术诚信机制', '历史届数与结果是否可追溯'])}
          ${dimensionCard('02', '履历价值', '判断奖项能否向学校、研究机构和雇主传递有效能力信号。', ['高校、升学与奖学金认可', '行业和雇主识别度', '竞争选择性与获奖比例', '实习、孵化、发表或展示机会'])}
          ${dimensionCard('03', '成长价值', '判断参赛过程能否产生真实能力、作品与长期可复用成果。', ['是否交付代码、论文、设计或原型', '问题真实性与专业深度', '导师、评委反馈与训练支持', '成果能否进入作品集或继续迭代'])}
          ${dimensionCard('04', '个人适配度', '同一比赛对不同学生价值不同，需要根据目标和现实条件动态计算。', ['专业、兴趣与技能门槛', '剩余时间与团队条件', '地区、身份、语言和预算', '保研、求职、科研、创业或作品集目标'])}
        </div>

        <section class="quality-section">
          <div class="quality-heading"><span>EVIDENCE</span><h2>证据优先级</h2><p>没有官方证据支撑的高分，不应显示为高含金量。</p></div>
          <div class="evidence-grid">
            <article><strong>E1</strong><h3>一手官方证据</h3><p>主办方、正式组委会、政府、大学、国际组织或专业学会页面。</p></article>
            <article><strong>E2</strong><h3>机构认可证据</h3><p>高校认定办法、培养方案、行业协会和正式合作机构信息。</p></article>
            <article><strong>E3</strong><h3>历史与结果证据</h3><p>历届结果、获奖作品、评委、参赛范围、晋级率和评审记录。</p></article>
            <article><strong>E4</strong><h3>二手发现证据</h3><p>聚合平台、媒体和社交渠道，只能发现线索，不能单独证明权威。</p></article>
          </div>
        </section>

        <section class="quality-section">
          <div class="quality-heading"><span>RATING</span><h2>赛事等级</h2><p>等级同时受分项得分、证据置信度和风险否决规则约束。</p></div>
          <div class="grade-grid">
            ${gradeCard('S', '旗舰赛事', '权威性和履历价值均高，证据充分，通常具有严格选拔和广泛认可。')}
            ${gradeCard('A', '高价值赛事', '专业领域认可度高，履历或成长价值突出，值得重点投入。')}
            ${gradeCard('B', '优质实践赛事', '权威性中等，但能够形成真实作品、能力和明确实践价值。')}
            ${gradeCard('C', '体验型赛事', '适合入门、练习或短期产出，不应包装成强履历背书。')}
            ${gradeCard('U', '待核验赛事', '官方来源、主办信息、规则或历史证据不足，不进入高价值筛选。')}
            ${gradeCard('R', '风险赛事', '存在保奖、证书售卖、冒名、收费诱导或组织不透明等严重问题。')}
          </div>
        </section>

        <section class="quality-section risk-section">
          <div class="quality-heading"><span>RISK CONTROL</span><h2>严重风险会直接否决</h2><p>风险不是普通扣分项；严重问题会覆盖正常评分。</p></div>
          <div class="risk-grid">
            <span>保证获奖、包证书、内部名额</span>
            <span>名称模仿权威赛事或故意混淆</span>
            <span>主办方身份无法核验</span>
            <span>高额报名费且成本不透明</span>
            <span>强制购买培训、教材或服务</span>
            <span>几乎人人获奖、无真实评审</span>
            <span>没有规则、评委、结果或申诉机制</span>
            <span>只有聚合页，无法回溯官方链接</span>
          </div>
        </section>

        <section class="quality-cta">
          <div><span>研究版 · 持续更新</span><h2>先看来源，再看比赛本身。</h2><p>来源库负责发现入口；这套标准负责决定比赛是否值得推荐。</p></div>
          <a class="primary-button large" href="#/sources">查看赛事来源库</a>
        </section>
      </section>
    </div>`;
  }

  function renderResearchRoute() {
    injectResearchNavigation();
    const path = currentPath();
    const main = document.querySelector('main');
    if (!main) return;
    if (path === '/sources') renderSourcesPage(main);
    else if (path === '/quality') renderQualityPage(main);
    else document.title = DEFAULT_TITLE;
  }

  function scheduleRender() {
    setTimeout(renderResearchRoute, 0);
  }

  window.addEventListener('DOMContentLoaded', scheduleRender);
  window.addEventListener('hashchange', scheduleRender);
})();
