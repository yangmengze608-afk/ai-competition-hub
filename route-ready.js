(() => {
  const app = document.getElementById('app');
  if (!app) return;

  let queued = false;
  function notify() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      const path = location.hash.slice(1).split('?')[0] || '/';
      window.dispatchEvent(new CustomEvent('ai:base-rendered', { detail: { path } }));
    });
  }

  const observer = new MutationObserver(notify);
  observer.observe(app, { childList: true });
})();
