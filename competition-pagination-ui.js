(() => {
  let queued = false;

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function applyPagination() {
    if (currentPath() !== '/competitions') return;

    const state = window.AI_DATA?.competitionPagination;
    const results = document.querySelector('.results-column');
    if (!state || !results) return;

    const count = results.querySelector('.results-head strong');
    if (count) count.textContent = String(state.filteredTotal);

    results.querySelector('[data-competition-load-more]')?.remove();
    if (state.shown >= state.filteredTotal) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'competition-load-more';
    wrapper.dataset.competitionLoadMore = '';

    const remaining = state.filteredTotal - state.shown;
    const nextCount = Math.min(state.pageSize, remaining);
    wrapper.innerHTML = `
      <button type="button" class="secondary-button">
        再显示 ${nextCount} 场
      </button>
      <span>已显示 ${state.shown} / ${state.filteredTotal}</span>
    `;

    wrapper.querySelector('button')?.addEventListener('click', () => {
      const raw = location.hash.slice(1) || '/competitions';
      const [path, query = ''] = raw.split('?');
      const params = new URLSearchParams(query);
      params.set('page', String(state.page + 1));
      location.hash = `${path}?${params.toString()}`;
    });

    results.appendChild(wrapper);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyPagination();
      setTimeout(applyPagination, 120);
    });
  }

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
