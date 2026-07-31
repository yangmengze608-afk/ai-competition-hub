(() => {
  function updateWorkspaceSummary(page, workspace) {
    const stats = window.AI_WORKSPACE?.progress?.(workspace);
    if (!stats) return;

    const progressValue = page.querySelector('.workspace-progress-card strong');
    const progressBar = page.querySelector('.workspace-progress-track i');
    const meta = page.querySelectorAll('.workspace-meta span');

    if (progressValue) progressValue.textContent = `${stats.percent}%`;
    if (progressBar) progressBar.style.width = `${stats.percent}%`;
    if (meta[1]) meta[1].textContent = `${stats.completed}/${stats.total} 项完成`;
    if (meta[2]) meta[2].textContent = '更新于 刚刚';
  }

  function renderActivationWithoutMoving(row) {
    const beforeTop = row.getBoundingClientRect().top;
    window.AI_ACTIVATION?.renderGuide?.();
    const afterTop = row.getBoundingClientRect().top;
    const delta = afterTop - beforeTop;
    if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
  }

  document.addEventListener('change', (event) => {
    const checkbox = event.target.closest?.('[data-workspace-task]');
    const page = checkbox?.closest('[data-workspace-page]');
    const row = checkbox?.closest('.workspace-task');
    const workspaceApi = window.AI_WORKSPACE;

    if (!checkbox || !page || !row || !workspaceApi?.toggleTask) return;

    // The original workspace listener rebuilds all of <main>. Stop the event
    // before it reaches that listener and update only the affected UI instead.
    event.stopPropagation();

    const competitionId = page.dataset.workspacePage;
    const workspace = workspaceApi.toggleTask(
      competitionId,
      checkbox.dataset.workspaceTask,
      checkbox.checked,
    );
    if (!workspace) return;

    row.classList.toggle('is-complete', checkbox.checked);
    updateWorkspaceSummary(page, workspace);
    renderActivationWithoutMoving(row);
  }, { capture: true });
})();
