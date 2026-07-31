(() => {
  const STABILITY_WINDOW_MS = 240;
  let stopActiveStabilizer = null;

  function escapedAttribute(value) {
    const text = String(value || '');
    if (window.CSS?.escape) return window.CSS.escape(text);
    return text.replace(/["\\]/g, '\\$&');
  }

  function taskRow(taskId) {
    const selector = `[data-workspace-task="${escapedAttribute(taskId)}"]`;
    return document.querySelector(selector)?.closest('.workspace-task') || null;
  }

  function stabilizeTaskRow(taskId, expectedTop) {
    stopActiveStabilizer?.();

    const main = document.querySelector('main');
    if (!main || !taskId || !Number.isFinite(expectedTop)) return;

    const root = document.documentElement;
    const previousOverflowAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';

    let stopped = false;
    let frameId = 0;

    const correctPosition = () => {
      if (stopped) return;
      const row = taskRow(taskId);
      if (!row) return;
      const currentTop = row.getBoundingClientRect().top;
      const delta = currentTop - expectedTop;
      if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
    };

    const observer = new MutationObserver(correctPosition);
    observer.observe(main, { childList: true, subtree: true });

    const followFrames = () => {
      correctPosition();
      if (!stopped) frameId = requestAnimationFrame(followFrames);
    };
    frameId = requestAnimationFrame(followFrames);

    const stop = () => {
      if (stopped) return;
      correctPosition();
      stopped = true;
      observer.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      root.style.overflowAnchor = previousOverflowAnchor;
      if (stopActiveStabilizer === stop) stopActiveStabilizer = null;
    };

    const timerId = setTimeout(stop, STABILITY_WINDOW_MS);
    stopActiveStabilizer = stop;
  }

  document.addEventListener('change', (event) => {
    const checkbox = event.target.closest?.('[data-workspace-task]');
    const row = checkbox?.closest('.workspace-task');
    if (!checkbox || !row) return;
    stabilizeTaskRow(checkbox.dataset.workspaceTask, row.getBoundingClientRect().top);
  }, { capture: true });

  window.addEventListener('hashchange', () => stopActiveStabilizer?.());
})();
