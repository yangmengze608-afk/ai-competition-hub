(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];

  function e(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function routeId() {
    return decodeURIComponent(currentPath().split('/')[2] || '');
  }

  function stableId(value) {
    const normalized = String(value || '').toLowerCase().trim();
    return /^[a-z0-9][a-z0-9-]{0,79}$/.test(normalized) ? normalized : '';
  }

  function track(name, competitionId) {
    window.AIAnalytics?.track?.(name, stableId(competitionId));
  }

  function workspaceState(page) {
    const tasks = [...page.querySelectorAll('[data-workspace-task]')];
    const completed = tasks.filter((task) => task.checked);
    return {
      completed: completed.length,
      nextTask: tasks.find((task) => !task.checked) || null,
    };
  }

  function guideMarkup(item, state) {
    const official = item?.sourceUrl
      ? `<a class="activation-guide-action" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" data-activation-guide="official"><span>01</span><strong>核对官方规则</strong><small>先确认资格、截止时间和提交要求</small></a>`
      : `<button class="activation-guide-action is-disabled" type="button" disabled><span>01</span><strong>官方规则待补充</strong><small>当前赛事暂无可用官方链接</small></button>`;
    const calendarDisabled = !window.AI_CALENDAR?.eligibleForReminder?.(item);

    if (state.completed > 0) {
      return `<section class="activation-guide activation-guide-started" data-activation-guide-panel>
        <div class="activation-guide-copy"><span>ACTIVATED</span><h2>你已经真正启动这场比赛</h2><p>第一项执行动作已经完成。接下来只推进一个最小步骤，不需要一次把整个计划做完。</p></div>
        <button class="activation-next-task" type="button" data-activation-focus-task ${state.nextTask ? '' : 'disabled'}>${state.nextTask ? '定位下一项任务 →' : '全部任务已完成'}</button>
      </section>`;
    }

    return `<section class="activation-guide" data-activation-guide-panel>
      <div class="activation-guide-heading"><div><span>FIRST REAL ACTION</span><h2>今天先完成一个真实动作</h2><p>不要先整理全部计划。用十分钟确认规则、锁定截止时间，再勾掉第一项任务。</p></div><strong>10 分钟</strong></div>
      <div class="activation-guide-grid">
        ${official}
        <button class="activation-guide-action" type="button" data-activation-focus-task><span>02</span><strong>开始第一项任务</strong><small>定位到清单里最先需要完成的动作</small></button>
        <button class="activation-guide-action ${calendarDisabled ? 'is-disabled' : ''}" type="button" data-activation-calendar data-calendar-reminder="${e(item?.id || '')}" ${calendarDisabled ? 'disabled' : ''}><span>03</span><strong>锁定截止时间</strong><small>${calendarDisabled ? '当前截止时间不可生成提醒' : '下载日历文件，避免错过提交'}</small></button>
      </div>
      <small class="activation-guide-privacy">任务内容和备注只保存在当前浏览器；统计只记录预定义行为和公开赛事 ID。</small>
    </section>`;
  }

  function bindGuide(page, item) {
    page.querySelectorAll('[data-activation-focus-task]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = page.querySelector('[data-workspace-task]:not(:checked)');
        const label = next?.closest('.workspace-task');
        label?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        label?.classList.add('activation-task-focus');
        setTimeout(() => label?.classList.remove('activation-task-focus'), 1600);
        next?.focus({ preventScroll: true });
      });
    });

    page.querySelector('[data-activation-calendar]')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const downloaded = window.AI_CALENDAR?.downloadCalendar?.(item) === true;
      if (!downloaded) return;
      button.dataset.calendarState = 'done';
      const strong = button.querySelector('strong');
      if (strong) strong.textContent = '日历文件已生成';
    });
  }

  function renderGuide() {
    if (!currentPath().startsWith('/workspace/')) return;
    const page = document.querySelector('[data-workspace-page]');
    const layout = page?.querySelector('.workspace-layout');
    if (!page || !layout) return;

    page.querySelector('[data-activation-guide-panel]')?.remove();
    const id = routeId();
    const item = competitions.find((competition) => competition.id === id);
    const state = workspaceState(page);
    layout.insertAdjacentHTML('beforebegin', guideMarkup(item, state));
    bindGuide(page, item);
  }

  function classifyWorkspaceStart(button) {
    const id = button.dataset.startWorkspace || routeId();
    const label = button.textContent || '';
    track(/加入|创建/.test(label) ? 'workspace_create' : 'workspace_open', id);
  }

  function bindActivationEvents() {
    document.addEventListener('click', (event) => {
      const start = event.target.closest?.('[data-start-workspace]');
      if (start) classifyWorkspaceStart(start);
    }, { capture: true });

    document.addEventListener('change', (event) => {
      const task = event.target.closest?.('[data-workspace-task]');
      if (!task || !task.checked) return;
      const page = task.closest('[data-workspace-page]');
      const completedNow = page?.querySelectorAll('[data-workspace-task]:checked').length || 0;
      const id = routeId();
      track('workspace_task_complete', id);
      if (completedNow === 1) track('workspace_first_task_complete', id);
      schedule();
    }, { capture: true });
  }

  function schedule() {
    setTimeout(renderGuide, 60);
  }

  window.AI_ACTIVATION = Object.freeze({
    renderGuide,
    workspaceState,
  });

  bindActivationEvents();
  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
