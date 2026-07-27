(() => {
  if (!window.AI_DATA?.realCompetitionMode) return;

  let observer;
  let queued = false;

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }

  function findCompetitionFromCard(card) {
    const href = card.querySelector('a[href^="#/competitions/"]')?.getAttribute('href') || '';
    const id = decodeURIComponent(href.split('/').pop() || '');
    return window.AI_DATA.competitions.find((item) => item.id === id);
  }

  function updateCopy() {
    const verified = formatDate(window.AI_DATA.competitionVerifiedAt);
    document.querySelectorAll('.demo-note').forEach((node) => {
      node.textContent = `比赛信息来自公开页面，最近核验：${verified}。具体规则以主办方公告为准。`;
    });

    const explorer = document.querySelector('.explorer-hero > p');
    if (explorer) explorer.textContent = '筛选当前真实比赛，查看截止时间、参赛形式和官方入口。';

    document.querySelectorAll('.footer-brand small').forEach((node) => {
      if (node.textContent.includes('演示')) node.textContent = `真实赛事 · 核验于 ${verified}`;
    });
  }

  function updateCards() {
    document.querySelectorAll('.competition-card').forEach((card) => {
      if (card.dataset.realCompetitionReady === 'true') return;
      const competition = findCompetitionFromCard(card);
      if (!competition) return;
      card.dataset.realCompetitionReady = 'true';

      const footer = card.querySelector('.competition-card-footer');
      const first = footer?.querySelector(':scope > span');
      if (first) {
        first.classList.remove('muted');
        first.textContent = competition.sourceName || '官方页面';
      }
    });
  }

  function updatePlanButton() {
    const plan = document.querySelector('[data-plan]');
    if (!plan || plan.dataset.realPlanAdjusted === 'true') return;

    const replacement = plan.cloneNode(true);
    replacement.removeAttribute('data-plan');
    replacement.dataset.realPlanAdjusted = 'true';
    replacement.textContent = '参赛方案整理中';
    replacement.addEventListener('click', () => {
      alert('该比赛的参赛方案正在整理中。你仍可先查看官方页面和比赛要求。');
    });
    plan.replaceWith(replacement);
  }

  function updateDetail() {
    const path = currentPath();
    if (!path.startsWith('/competitions/')) return;
    const id = decodeURIComponent(path.split('/')[2] || '');
    const competition = window.AI_DATA.competitions.find((item) => item.id === id);
    if (!competition) return;

    const dataLabel = document.querySelector('.detail-status-row span:not(.status-badge)');
    if (dataLabel) dataLabel.textContent = '真实赛事';

    updatePlanButton();

    const actions = document.querySelector('.detail-actions');
    if (actions && competition.sourceUrl && !actions.querySelector('[data-official-competition-link]')) {
      const link = document.createElement('a');
      link.dataset.officialCompetitionLink = '';
      link.className = 'secondary-button';
      link.href = competition.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '查看官方页面 ↗';
      actions.appendChild(link);
    }

    const note = document.querySelector('.competition-detail-hero + .detail-layout .official-note');
    if (note) {
      note.innerHTML = `<strong>${competition.sourceName || '公开来源'}</strong><br>最近核验：${formatDate(competition.lastVerifiedAt)}<br>报名与规则请以官方页面为准。`;
    }

    const resourcesDescription = document.querySelector('.competition-detail-hero + .detail-layout .block-description');
    if (resourcesDescription) resourcesDescription.textContent = '以下资源根据比赛赛道自动匹配，仍为本站辅助内容。';
  }

  function apply() {
    updateCopy();
    updateCards();
    updateDetail();
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
