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

  document.addEventListener('change', (event) => {
    const checkbox = event.target.closest?.('[data-workspace-task]');
    const page = checkbox?.closest('[data-workspace-page]');
    const row = checkbox?.closest('.workspace-task');
    const workspaceApi = window.AI_WORKSPACE;

    if (!checkbox || !page || !row || !workspaceApi?.toggleTask) return;

    // Own the task change completely. The legacy target listener rebuilds all
    // of <main>; stopping the event immediately prevents that rerender path.
    event.stopImmediatePropagation();

    const competitionId = page.dataset.workspacePage;
    const workspace = workspaceApi.toggleTask(
      competitionId,
      checkbox.dataset.workspaceTask,
      checkbox.checked,
    );
    if (!workspace) return;

    row.classList.toggle('is-complete', checkbox.checked);
    updateWorkspaceSummary(page, workspace);
    window.AI_ACTIVATION?.renderGuide?.();
  }, { capture: true });
})();
