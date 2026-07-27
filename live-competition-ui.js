(() => {
  if (!window.AI_DATA?.liveMode) return;

  let observer = null;
  let queued = false;

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '最近更新';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(date);
  };

  const currentPath = () => location.hash.slice(1).split('?')[0] || '/';

  function competitionByCard(card) {
    const href = card.querySelector('a[href*="#/competitions/"]')?.getAttribute('href') || '';
    const id = decodeURIComponent(href.split('/').pop() || '');
    return window.AI_DATA.competitions.find((item) => item.id === id);
  }

  function updateStaticCopy() {
    const generatedAt = window.AI_DATA.syncMeta?.generatedAt;
    const updateText = generatedAt ? `公开来源 · 更新于 ${formatDate(generatedAt)}` : '公开来源 · 定期更新';

    document.querySelectorAll('.demo-note').forEach((node) => {
      node.textContent = `比赛信息来自公开来源，报名与规则请以主办方页面为准。${generatedAt ? ` 最近更新：${formatDate(generatedAt)}。` : ''}`;
    });

    const explorerHero = document.querySelector('.explorer-hero > p');
    if (explorerHero) explorerHero.textContent = '按赛道、时间、参赛形式与难度筛选真实比赛。';

    const resultsHead = document.querySelector('.results-head > span');
    if (resultsHead) resultsHead.textContent = updateText;

    document.querySelectorAll('.footer-brand small').forEach((node) => {
      if (node.textContent.includes('演示')) node.textContent = updateText;
    });
  }

  function updateCompetitionCards() {
    document.querySelectorAll('.competition-card').forEach((card) => {
      const competition = competitionByCard(card);
      if (!competition || card.querySelector('[data-live-source]')) return;
      const footer = card.querySelector('.competition-card-footer');
      if (!footer) return;

      const source = document.createElement('span');
      source.dataset.liveSource = '';
      source.className = 'live-source-label';
      source.textContent = competition.sourceName || '公开来源';
      footer.prepend(source);
    });
  }

  function updateCompetitionDetail() {
    const path = currentPath();
    if (!path.startsWith('/competitions/')) return;
    const id = decodeURIComponent(path.split('/')[2] || '');
    const competition = window.AI_DATA.competitions.find((item) => item.id === id);
    if (!competition) return;

    const demoLabel = document.querySelector('.detail-status-row span:not(.status-badge)');
    if (demoLabel) demoLabel.textContent = '真实赛事';

    const actions = document.querySelector('.detail-actions');
    if (actions && competition.sourceUrl && !actions.querySelector('[data-official-link]')) {
      const link = document.createElement('a');
      link.dataset.officialLink = '';
      link.className = 'secondary-button live-official-button';
      link.href = competition.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '查看官方页面 ↗';
      actions.appendChild(link);
    }

    const sidebar = document.querySelector('.detail-sidebar');
    if (sidebar && !sidebar.querySelector('[data-live-meta]')) {
      const meta = document.createElement('div');
      meta.dataset.liveMeta = '';
      meta.className = 'live-detail-meta';
      meta.innerHTML = `<span>来源</span><strong>${escapeHtml(competition.sourceName || '公开来源')}</strong><small>核验于 ${formatDate(competition.lastVerifiedAt || competition.updatedAt)}</small>`;
      const note = sidebar.querySelector('.official-note');
      sidebar.insertBefore(meta, note || null);
    }
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function apply() {
    updateStaticCopy();
    updateCompetitionCards();
    updateCompetitionDetail();
  }

  function observe() {
    if (!observer) observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      observer?.disconnect();
      apply();
      observe();
    });
  }

  observe();
  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
