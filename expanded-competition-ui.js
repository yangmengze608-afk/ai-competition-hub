(() => {
  if (!window.AI_DATA?.realCompetitionMode) return;

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function competitionFromCard(card) {
    const href = card.querySelector('a[href^="#/competitions/"]')?.getAttribute('href') || '';
    const id = decodeURIComponent(href.split('/').pop() || '');
    return window.AI_DATA.competitions.find((item) => item.id === id);
  }

  function collectionLabel(item) {
    if (item.collection === 'archive') return '历史赛事';
    if (item.collection === 'practice') return '长期练习';
    return '真实赛事';
  }

  function applyExplorerCopy() {
    if (currentPath() !== '/competitions') return;
    const total = window.AI_DATA.competitions.length;
    const paragraph = document.querySelector('.explorer-hero > p');
    if (paragraph) paragraph.textContent = `已收录 ${total} 场真实比赛，包含当前机会、长期练习与历史赛题。`;
  }

  function applyCards() {
    document.querySelectorAll('.competition-card').forEach((card) => {
      const item = competitionFromCard(card);
      if (!item?.deadlineText) return;

      card.classList.toggle('competition-card-archive', item.collection === 'archive');
      card.classList.toggle('competition-card-practice', item.collection === 'practice');

      const deadline = card.querySelector('.deadline-row');
      const primary = deadline?.querySelector('span');
      const secondary = deadline?.querySelector('small');
      if (primary) primary.textContent = item.collection === 'archive'
        ? '已结束'
        : item.collection === 'practice'
          ? '长期开放'
          : primary.textContent;
      if (secondary) secondary.textContent = item.deadlineText;
    });
  }

  function applyDetail() {
    const path = currentPath();
    if (!path.startsWith('/competitions/')) return;

    const id = decodeURIComponent(path.split('/')[2] || '');
    const item = window.AI_DATA.competitions.find((competition) => competition.id === id);
    if (!item) return;

    const dataLabel = document.querySelector('.detail-status-row span:not(.status-badge)');
    if (dataLabel) dataLabel.textContent = collectionLabel(item);

    if (!item.deadlineText) return;
    const panel = document.querySelector('.deadline-panel');
    if (!panel) return;

    const small = panel.querySelector('small');
    const strong = panel.querySelector('strong');
    const unit = panel.querySelector('span');
    const date = panel.querySelector('p');

    if (small) small.textContent = item.collection === 'archive' ? '结束时间' : item.collection === 'practice' ? '开放状态' : '截止时间';
    if (strong) strong.textContent = item.collection === 'archive' ? '已' : item.collection === 'practice' ? '—' : strong.textContent;
    if (unit) unit.textContent = item.collection === 'archive' ? '结束' : '';
    if (date) date.textContent = item.deadlineText;
  }

  function apply() {
    applyExplorerCopy();
    applyCards();
    applyDetail();
  }

  function schedule() {
    setTimeout(apply, 40);
    setTimeout(apply, 180);
  }

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
