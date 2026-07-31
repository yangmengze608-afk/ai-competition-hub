(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const playbooks = Array.isArray(data.playbooks) ? data.playbooks : [];
  const DAY = 86400000;

  function e(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function path() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function daysUntil(value) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? Math.ceil((time - Date.now()) / DAY) : Infinity;
  }

  function isActionable(item) {
    const days = daysUntil(item.deadline);
    return item.collection === 'current'
      && item.status !== 'ended'
      && item.entryStatus !== 'closed'
      && days >= 0;
  }

  function grade(item) {
    if (item.verificationStatus !== 'reviewed') return 'U';
    return item.grade || 'U';
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '时间待核验';
    return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date);
  }

  function arrowIcon() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  }

  function searchIcon() {
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>';
  }

  function metric(value, label) {
    return `<div class="decision-metric"><strong>${e(value)}</strong><span>${e(label)}</span></div>`;
  }

  function segmentCard(segment, index) {
    return `<a class="decision-segment-card decision-segment-${e(segment.id)}" href="${e(segment.href)}">
      <span class="decision-segment-index">0${index + 1}</span>
      <div><h3>${e(segment.title)}</h3><p>${e(segment.description)}</p><strong>${e(segment.count)} 场可行动机会 ${arrowIcon()}</strong></div>
    </a>`;
  }

  function deadlineCard(item) {
    const days = daysUntil(item.deadline);
    const deadline = days === 0 ? '今天截止' : days === 1 ? '明天截止' : `还剩 ${days} 天`;
    return `<article class="decision-deadline-card">
      <div class="decision-deadline-top"><span class="decision-grade grade-${e(grade(item).toLowerCase())}">${e(grade(item))}</span><span>${e(deadline)}</span></div>
      <a href="#/competitions/${encodeURIComponent(item.id)}"><h3>${e(item.title)}</h3></a>
      <p>${e(item.organizer || '主办方待核验')}</p>
      <div class="decision-deadline-meta"><span>${e(item.track)}</span><span>${e(formatDate(item.deadline))}</span></div>
    </article>`;
  }

  function render() {
    if (path() !== '/') return;
    const main = document.querySelector('main');
    if (!main) return;

    // commercial-app-v3 renders the original white search-first homepage first.
    // Detach that exact node before composing the decision sections so its
    // appearance and already-bound search/hot-tag interactions remain intact.
    const classicHero = main.querySelector('.hero-section');
    if (classicHero) classicHero.remove();

    const actionable = competitions.filter(isActionable);
    const audited = competitions.filter((item) => item.verificationStatus === 'reviewed');
    const segments = Array.isArray(data.launchSegments) ? data.launchSegments : [];
    const tracks = [...new Set((data.tracks || []).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
    const deadlines = actionable
      .filter((item) => daysUntil(item.deadline) <= 21)
      .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline) || String(a.title).localeCompare(String(b.title), 'zh-CN'))
      .slice(0, 4);

    document.title = 'AI 赛场｜找到真正适合你的比赛';
    main.innerHTML = `<div class="decision-home">
      <section class="decision-hero">
        <div class="decision-hero-grid">
          <div class="decision-hero-copy">
            <div class="decision-eyebrow">大学生竞赛决策与参赛执行平台</div>
            <h1>不知道该参加哪场？<br><span>先排除不值得的。</span></h1>
            <p>AI 赛场不只是收集比赛。我们核验来源、判断价值、标出资格风险，再把值得投入的比赛变成可以执行的参赛路线。</p>
            <div class="decision-hero-actions">
              <a class="primary-button large" href="#/competitions?sort=recommended">查看推荐比赛 ${arrowIcon()}</a>
              <a class="secondary-button large" href="#/playbooks">直接看参赛路线</a>
            </div>
            <form class="decision-search" data-decision-search>
              ${searchIcon()}<input name="q" placeholder="搜索比赛、赛道或主办方……" aria-label="搜索比赛"><button>搜索</button>
            </form>
            <div class="decision-metrics">
              ${metric(competitions.length, '场真实赛事')}
              ${metric(audited.length, '场赛事级审核')}
              ${metric(playbooks.length, '条执行路线')}
              ${metric(actionable.length, '场当前机会')}
            </div>
          </div>

          <aside class="decision-matcher">
            <div class="decision-matcher-kicker">透明匹配 · 约 20 秒</div>
            <h2>你现在更需要什么？</h2>
            <p>选择目标、方向和经验，我们按公开规则组合筛选条件，不使用黑箱推荐。</p>
            <form data-fit-form>
              <label><span>参赛目标</span><select name="goal"><option value="高价值精选">冲履历与高含金量</option><option value="零基础友好">拿到第一份比赛经历</option><option value="本周截止">尽快找能立即行动的</option><option value="">先广泛看看机会</option></select></label>
              <label><span>感兴趣的方向</span><select name="track"><option value="">全部方向</option>${tracks.map((track) => `<option value="${e(track)}">${e(track)}</option>`).join('')}</select></label>
              <label><span>当前经验</span><select name="difficulty"><option value="">不限制难度</option><option value="入门">第一次或刚入门</option><option value="进阶">做过项目或比赛</option><option value="专家">科研或高强度挑战</option></select></label>
              <button class="decision-match-button" type="submit">生成我的比赛列表 ${arrowIcon()}</button>
            </form>
            <small>结果仍需你确认报名资格、时间和预算；最终规则以主办方页面为准。</small>
          </aside>
        </div>
      </section>

      <section class="decision-start-section">
        <div class="decision-section-heading"><span>START HERE</span><h2>三种最常见的开始方式</h2><p>先进入与你当前阶段最相关的机会，不必从 156 场比赛里逐条翻找。</p></div>
        <div class="decision-segment-grid">${segments.map(segmentCard).join('')}</div>
      </section>

      <section class="decision-deadline-section">
        <div class="decision-section-heading"><span>DEADLINE FIRST</span><h2>最近需要做决定的比赛</h2><p>只展示仍可行动的当前机会；打开详情后再确认资格、费用、时区和提交要求。</p></div>
        ${deadlines.length ? `<div class="decision-deadline-grid">${deadlines.map(deadlineCard).join('')}</div>` : '<div class="decision-empty">当前没有 21 天内截止且仍可行动的比赛。</div>'}
        <div class="decision-section-actions"><a class="primary-button large" href="#/competitions?sort=deadline">按截止时间查看全部 ${arrowIcon()}</a><a class="secondary-button large" href="#/competitions?sort=recommended">按价值规则查看</a></div>
      </section>

      <section class="decision-proof-section">
        <div><span>01</span><h3>先看事实</h3><p>主办方、截止时间、资格、费用和官方链接必须能够追溯。</p></div>
        <div><span>02</span><h3>再看价值</h3><p>权威性、履历价值和成长价值分开判断，未审核赛事明确标记 U。</p></div>
        <div><span>03</span><h3>最后行动</h3><p>通过参赛路线把要求拆成阶段任务、交付物、停止条件和提交清单。</p></div>
      </section>
    </div>`;

    if (classicHero) {
      const classicStage = document.createElement('div');
      classicStage.className = 'classic-home-stage';
      classicStage.dataset.classicHome = '';
      classicStage.appendChild(classicHero);
      main.prepend(classicStage);
    }

    main.querySelector('[data-decision-search]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = String(new FormData(event.currentTarget).get('q') || '').trim();
      location.hash = `/competitions${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    });

    main.querySelector('[data-fit-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const params = new URLSearchParams();
      const goal = String(form.get('goal') || '');
      const track = String(form.get('track') || '');
      const difficulty = String(form.get('difficulty') || '');
      if (goal) params.set('q', goal);
      if (track) params.set('track', track);
      if (difficulty) params.set('difficulty', difficulty);
      params.set('sort', goal === '本周截止' ? 'deadline' : 'recommended');
      location.hash = `/competitions?${params}`;
    });
  }

  window.addEventListener('DOMContentLoaded', render);
  window.addEventListener('hashchange', render);
})();
