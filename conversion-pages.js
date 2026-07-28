(() => {
  const REPO_ISSUES = 'https://github.com/yangmengze608-afk/ai-competition-hub/issues/new';
  const urls = {
    join: `${REPO_ISSUES}?template=beta-signup.yml`,
    submit: `${REPO_ISSUES}?template=submit-competition.yml`,
    report: `${REPO_ISSUES}?template=report-competition.yml`,
  };
  const DEFAULT_TITLE = 'AI 赛场｜只参加真正值得的比赛';

  function e(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }
  function currentPath() { return location.hash.slice(1).split('?')[0] || '/'; }

  function issueLink(type, title = '') {
    const base = urls[type];
    return title ? `${base}&title=${encodeURIComponent(title)}` : base;
  }

  function injectHeaderEntry() {
    const actions = document.querySelector('.header-actions');
    if (actions && !actions.querySelector('[data-beta-entry]')) {
      const link = document.createElement('a');
      link.href = '#/participate';
      link.dataset.betaEntry = '';
      link.className = 'conversion-header-link desktop-only';
      link.textContent = '参与内测';
      actions.insertBefore(link, actions.firstChild);
    }

    const mobile = document.querySelector('[data-mobile-menu]');
    if (mobile && !mobile.querySelector('[data-beta-mobile]')) {
      const link = document.createElement('a');
      link.href = '#/participate';
      link.dataset.betaMobile = '';
      link.textContent = '参与内测与反馈';
      const primary = mobile.querySelector('.primary-button');
      mobile.insertBefore(link, primary || null);
    }
  }

  function injectFooterEntries() {
    const footer = document.querySelector('.footer-main');
    if (!footer || footer.querySelector('[data-conversion-footer]')) return;
    const column = document.createElement('div');
    column.dataset.conversionFooter = '';
    column.innerHTML = `<strong>参与</strong><a href="#/participate">加入内测</a><a href="${urls.submit}" target="_blank" rel="noopener noreferrer">提交比赛</a><a href="${urls.report}" target="_blank" rel="noopener noreferrer">反馈错误</a>`;
    footer.appendChild(column);
  }

  function injectHomeSection() {
    if (currentPath() !== '/') return;
    const main = document.querySelector('main');
    if (!main || main.querySelector('[data-conversion-home]')) return;
    const section = document.createElement('section');
    section.className = 'conversion-home-section';
    section.dataset.conversionHome = '';
    section.innerHTML = `<div class="conversion-home-copy"><span>BUILD WITH EARLY USERS</span><h2>这个版本需要真实参赛者一起把它做对。</h2><p>告诉我们你找比赛时最麻烦的事情；也可以提交新比赛，或指出截止时间、资格与费用错误。</p></div><div class="conversion-home-actions"><a class="primary-button large" href="#/participate">参与 Commercial Beta</a><a class="secondary-button large" href="${urls.submit}" target="_blank" rel="noopener noreferrer">提交一场比赛 ↗</a></div>`;
    main.appendChild(section);
  }

  function injectCorrectionEntry() {
    const path = currentPath();
    if (!path.startsWith('/competitions/')) return;
    const detail = document.querySelector('.competition-detail-hero h1');
    const note = document.querySelector('.detail-sidebar .official-note');
    if (!note || note.querySelector('[data-correction-entry]')) return;
    const competitionName = detail?.textContent?.trim() || '赛事信息';
    const link = document.createElement('a');
    link.href = issueLink('report', `[信息纠错] ${competitionName}`);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.correctionEntry = '';
    link.className = 'correction-entry-link';
    link.textContent = '发现信息错误？提交纠错 ↗';
    note.appendChild(link);
  }

  function actionCard(kind, title, description, points, href, button) {
    return `<article class="conversion-action-card conversion-${e(kind)}"><span>${e(kind.toUpperCase())}</span><h2>${e(title)}</h2><p>${e(description)}</p><ul>${points.map((item) => `<li>${e(item)}</li>`).join('')}</ul><a class="primary-button" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(button)} ↗</a></article>`;
  }

  function renderParticipate(main) {
    document.title = '参与内测与反馈｜AI 赛场';
    main.innerHTML = `<div class="conversion-page">
      <section class="conversion-hero"><span>COMMERCIAL BETA · PUBLIC FEEDBACK</span><h1>别只告诉我们“网站不错”。<br>告诉我们哪里还不能用。</h1><p>当前使用 GitHub 公开表单收集真实需求、比赛线索和错误报告。提交内容会公开显示，请不要填写手机号、邮箱、身份证号、住址、学号或其他敏感信息。</p><div class="conversion-notice"><strong>提交方式</strong><span>点击后登录 GitHub，按结构化表单填写。我们会在对应 Issue 中公开回复处理状态。</span></div></section>
      <section class="conversion-actions-grid">
        ${actionCard('beta','加入内测','告诉我们你的目标、真实困难和最需要的功能。',['用 GitHub 账号作为联系身份','不收集手机号或私人邮箱','优先邀请提出具体问题的用户'],urls.join,'填写内测申请')}
        ${actionCard('competition','提交比赛','推荐尚未收录或值得重新核验的真实比赛。',['必须提供公开来源','优先提供主办方官网或正式规则','聚合页不能单独证明权威性'],urls.submit,'提交比赛线索')}
        ${actionCard('correction','反馈错误','报告截止时间、资格、费用、链接或评级证据问题。',['请指出当前错误内容','提供正确内容和官方证据','高风险与已截止信息优先处理'],urls.report,'提交纠错')}
      </section>
      <section class="conversion-principles"><div><span>01</span><strong>公开可追踪</strong><p>每项反馈都有公开状态，避免“提交后石沉大海”。</p></div><div><span>02</span><strong>证据优先</strong><p>比赛信息和评级修改必须能回到官方依据。</p></div><div><span>03</span><strong>隐私克制</strong><p>当前阶段不收集完成验证所不需要的个人信息。</p></div></section>
    </div>`;
  }

  function renderRoute() {
    injectHeaderEntry();
    injectFooterEntries();
    injectHomeSection();
    injectCorrectionEntry();
    const path = currentPath();
    if (path !== '/participate') {
      if (!path.startsWith('/playbooks') && path !== '/sources' && path !== '/quality') document.title = DEFAULT_TITLE;
      return;
    }
    const main = document.querySelector('main');
    if (main) renderParticipate(main);
  }

  function scheduleRender() { setTimeout(renderRoute, 0); }
  window.addEventListener('DOMContentLoaded', scheduleRender);
  window.addEventListener('hashchange', scheduleRender);
})();
