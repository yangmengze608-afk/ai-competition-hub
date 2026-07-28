(() => {
  if (location.hash) return;
  const base = `${location.pathname}${location.search}`;
  history.replaceState(null, '', `${base}#/`);
})();
