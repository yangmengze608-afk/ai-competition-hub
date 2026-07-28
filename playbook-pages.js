(() => {
  const data = window.AI_DATA || {};
  const playbooks = Array.isArray(data.playbooks) ? data.playbooks : [];
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const competitionMap = new Map(competitions.map((item) => [item.id, item]));
  const playbookByCompetition = new Map(playbooks.map((item) => [item.competitionId, item]));
  const DEFAULT_TITLE = 'AI 赛场｜只参加真正值得的比赛';

  function e(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }
  function currentPath() { return location.hash.slice(1).split('?')[0] || '/'; }
  function routeId() { return decodeURIComponent(currentPath().split('/')[2] || ''); }
  function competitionFor(playbook) { return competitionMap.get(playbook.competitionId); }
  function gradeOf(playbook) { return competitionFor(playbook)?.grade || 'U'; }

  function injectNavigation() {
    const path = currentPath();
    const desktop = document.querySelector('.desktop-nav');
    if (desktop && !desktop.querySelector('[data-playbook-nav]')) {
      const link = document.createElement('a');
      link.href = '#/playbooks';
      link.dataset.playbookNav = '';
      link.textContent = '参赛路线';
      const quality = desktop.querySelector('a[href="#/quality"]');
      desktop.insertBefore(link, quality || null);
    }
    desktop?.querySelector('[data-playbook-nav]')?.classList.toggle('active', path.startsWith('/playbooks'));

    const mobile = document.querySelector('[data-mobile-menu]');
    if (mobile && !mobile.querySelector('[data-playbook-mobile]')) {
      const link = document.createElement('a');
      link.href = '#/playbooks';
      link.dataset.playbookMobile = '';
      link.textContent = '参赛路线';
      const primary = mobile.querySelector('.primary-button');
      mobile.insertBefore(link, primary || null);
    }

    const footer = document.querySelector('.footer-main');
    if (footer && !footer.querySelector('[data-playbook-footer]')) {
      const column = document.createElement('div');
      column.dataset.playbookFooter = '';
      column.innerHTML = '<strong>执行</strong><a href="#/playbooks">参赛路线</a><span>从选题到提交</span>';
      footer.appendChild(column);
    }
  }

  function playbookCard(playbook) {
    const competition = competitionFor(playbook);
    return `<article class="playbook-card" data-playbook-card>
      <div class="playbook-card-top"><span class="playbook-grade grade-${e(gradeOf(playbook).toLowerCase())}">${e(gradeOf(playbook))}</span><span>${e(playbook.durationDays)} 天路线</span></div>
      <h2><a href="#/playbooks/${encodeURIComponent(playbook.id)}">${e(playbook.title)}</a></h2>
      <p class="playbook-competition">${e(competition?.title || '对应比赛')}</p>
      <p>${e(playbook.goal)}</p>
      <div class="playbook-card-meta"><span>${e(playbook.pace)}</span><span>${e(competition?.track || '')}</span></div>
      <div class="playbook-card-deliverables">${playbook.deliverables.slice(0, 3).map((item) => `<em>${e(item)}</em>`).join('')}</div>
      <a class="playbook-card-link" href="#/playbooks/${encodeURIComponent(playbook.id)}">查看执行路线 →</a>
    </article>`;
  }

  function renderList(main) {
    document.title = '参赛路线｜AI 赛场';
    main.innerHTML = `<div class="playbook-page">
      <section class="playbook-hero">
        <span>FROM OPPORTUNITY TO SUBMISSION</span>
        <h1>知道比赛之后，<br>下一步每天做什么？</h1>
        <p>首批路线只覆盖完成赛事级审核、资格相对明确且仍有实际行动时间的比赛。每条路线都给出阶段任务、退出标准、提交清单和停止条件。</p>
        <div class="playbook-hero-stats"><div><strong>${playbooks.length}</strong><span>条执行路线</span></div><div><strong>${playbooks.reduce((sum, item) => sum + item.durationDays, 0)}</strong><span>天计划总量</span></div><div><strong>${new Set(playbooks.map((item) => competitionFor(item)?.track).filter(Boolean)).size}</strong><span>个赛道方向</span></div></div>
      </section>
      <section class="playbook-list-section">
        <div class="playbook-list-heading"><div><span>FIRST BATCH</span><h2>从最值得行动的 10 场开始</h2></div><p>评级高不代表一定适合你；先看资格、时间和停止条件，再决定投入。</p></div>
        <div class="playbook-grid">${playbooks.map(playbookCard).join('')}</div>
      </section>
    </div>`;
  }

  function stageCard(stage, index) {
    return `<article class="playbook-stage"><div class="playbook-stage-index">${String(index + 1).padStart(2, '0')}</div><div class="playbook-stage-body"><span>${e(stage.label)}</span><h3>${e(stage.title)}</h3><p class="playbook-stage-focus">${e(stage.focus)}</p><ul>${stage.tasks.map((task) => `<li>${e(task)}</li>`).join('')}</ul><div class="playbook-exit"><small>进入下一阶段前</small><strong>${e(stage.exitCriteria)}</strong></div></div></article>`;
  }

  function renderDetail(main, id) {
    const playbook = playbooks.find((item) => item.id === id);
    if (!playbook) {
      main.innerHTML = '<div class="not-found"><h1>没有找到这条路线</h1><p>它可能尚未发布或地址已经改变。</p><a class="primary-button" href="#/playbooks">回到参赛路线</a></div>';
      return;
    }
    const competition = competitionFor(playbook);
    document.title = `${playbook.title}｜AI 赛场`;
    const official = competition?.sourceUrl ? `<a class="secondary-button" href="${e(competition.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方规则 ↗</a>` : '';
    main.innerHTML = `<div class="playbook-detail">
      <div class="breadcrumbs"><a href="#/playbooks">参赛路线</a><span>›</span><a href="#/competitions/${encodeURIComponent(playbook.competitionId)}">${e(competition?.title || '对应比赛')}</a><span>›</span><strong>${e(playbook.title)}</strong></div>
      <section class="playbook-detail-hero">
        <div><div class="playbook-detail-badges"><span class="playbook-grade grade-${e(gradeOf(playbook).toLowerCase())}">${e(gradeOf(playbook))} · 已审核赛事</span><span>${e(playbook.durationDays)} 天</span><span>${e(playbook.pace)}</span></div><h1>${e(playbook.title)}</h1><p>${e(playbook.goal)}</p><div class="detail-actions"><a class="primary-button" href="#/competitions/${encodeURIComponent(playbook.competitionId)}">查看比赛判断</a>${official}</div></div><aside><small>适合</small><strong>${e(playbook.fit)}</strong></aside>
      </section>

      <section class="playbook-overview-grid">
        <article><span>最终要交付</span><ul>${playbook.deliverables.map((item) => `<li>${e(item)}</li>`).join('')}</ul></article>
        <article class="stop-card"><span>出现这些情况就停止投入</span><ul>${playbook.stopConditions.map((item) => `<li>${e(item)}</li>`).join('')}</ul></article>
      </section>

      <section class="playbook-timeline-section"><div class="playbook-section-heading"><span>EXECUTION PLAN</span><h2>按阶段推进，不按焦虑推进</h2><p>每个阶段都有退出标准；没有达到就先修复，不要继续叠功能。</p></div><div class="playbook-timeline">${playbook.stages.map(stageCard).join('')}</div></section>

      <section class="playbook-bottom-grid">
        <article><span>建议工具栈</span><div class="playbook-chip-list">${playbook.stack.map((item) => `<em>${e(item)}</em>`).join('')}</div></article>
        <article><span>提交前清单</span><ol>${playbook.submissionChecklist.map((item) => `<li>${e(item)}</li>`).join('')}</ol></article>
        <article class="risk-card"><span>主要风险</span><ul>${playbook.risks.map((item) => `<li>${e(item)}</li>`).join('')}</ul></article>
      </section>

      <section class="playbook-final-cta"><div><span>START WITH THE FIRST STAGE</span><h2>今天只完成第一阶段的第一项。</h2><p>路线用于减少决策成本，实际资格、截止时间和提交规则仍以主办方页面为准。</p></div><a class="primary-button large" href="#/competitions/${encodeURIComponent(playbook.competitionId)}">返回比赛详情</a></section>
    </div>`;
  }

  function injectCompetitionCta() {
    const path = currentPath();
    if (!path.startsWith('/competitions/')) return;
    const competitionId = decodeURIComponent(path.split('/')[2] || '');
    const playbook = playbookByCompetition.get(competitionId);
    if (!playbook) return;
    const detailMain = document.querySelector('.detail-main');
    if (!detailMain || detailMain.querySelector('[data-playbook-cta]')) return;
    const block = document.createElement('section');
    block.className = 'detail-block competition-playbook-cta';
    block.dataset.playbookCta = '';
    block.innerHTML = `<div><span>EXECUTION READY</span><h2>这场比赛已有完整参赛路线</h2><p>${e(playbook.durationDays)} 天 · ${e(playbook.pace)} · 从选题、制作到提交清单。</p></div><a class="primary-button" href="#/playbooks/${encodeURIComponent(playbook.id)}">查看执行路线 →</a>`;
    const target = [...detailMain.querySelectorAll('.detail-block')].find((item) => item.querySelector('h2')?.textContent === '适合谁参加');
    detailMain.insertBefore(block, target || null);
  }

  function renderPlaybookRoute() {
    injectNavigation();
    const path = currentPath();
    const main = document.querySelector('main');
    if (!main) return;
    if (path === '/playbooks') renderList(main);
    else if (path.startsWith('/playbooks/')) renderDetail(main, routeId());
    else {
      document.title = DEFAULT_TITLE;
      injectCompetitionCta();
    }
  }

  function scheduleRender() { setTimeout(renderPlaybookRoute, 0); }
  window.addEventListener('DOMContentLoaded', scheduleRender);
  window.addEventListener('hashchange', scheduleRender);
})();
