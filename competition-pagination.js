(() => {
  const data = window.AI_DATA;
  if (!data || !Array.isArray(data.competitions)) return;

  const fullList = data.competitions;
  const state = {
    pageSize: 24,
    page: 1,
    total: fullList.length,
    filteredTotal: fullList.length,
    shown: Math.min(24, fullList.length)
  };

  data.competitionPagination = state;
  data.competitions = new Proxy(fullList, {
    get(target, property, receiver) {
      if (property === 'filter') {
        return (callback, thisArg) => {
          const filtered = Array.prototype.filter.call(target, callback, thisArg);
          const path = location.hash.slice(1).split('?')[0] || '/';
          if (path !== '/competitions') return filtered;

          const query = location.hash.includes('?') ? location.hash.split('?')[1] : '';
          const params = new URLSearchParams(query);
          const requestedPage = Number.parseInt(params.get('page') || '1', 10);
          const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
          const limit = page * state.pageSize;

          state.page = page;
          state.total = target.length;
          state.filteredTotal = filtered.length;
          state.shown = Math.min(limit, filtered.length);

          return filtered.slice(0, limit);
        };
      }
      return Reflect.get(target, property, receiver);
    }
  });
})();
