(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const playbooks = Array.isArray(data.playbooks) ? data.playbooks : [];
  const playbookByCompetition = new Map(playbooks.map((item) => [item.competitionId, item]));
  const STORAGE_KEY = 'ai-competition-workspaces:v1';
  const SCHEMA_VERSION = 1;

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

  function now() {
    return new Date().toISOString();
  }

  function readAll() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item.competitionId === 'string');
    } catch {
      return [];
    }
  }

  function writeAll(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  }

  function normalizeTitle(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function taskId(prefix, index, title) {
    const slug = normalizeTitle(title).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/gu, '-').replace(/^-|-$/g, '').slice(0, 28);
    return `${prefix}-${index + 1}-${slug || 'task'}`;
  }

  function buildDefaultTasks(item, playbook) {
    const tasks = [];
    if (playbook?.stages?.length) {
      playbook.stages.forEach((stage, stageIndex) => {
        (stage.tasks || []).forEach((title, taskIndex) => {
          tasks.push({
            id: taskId(`stage-${stageIndex + 1}`, taskIndex, title),
            phase: stage.label || stage.title || `阶段 ${stageIndex + 1}`,
            title: normalizeTitle(title),
            completed: false,
          });
        });
      });
      (playbook.submissionChecklist || []).forEach((title, index) => {
        tasks.push({
          id: taskId('submit', index, title),
          phase: '提交前检查',
          title: normalizeTitle(title),
          completed: false,
        });
      });
    } else {
      [
        ['参赛确认', '打开官方规则，核对报名截止、最终提交时间和时区'],
        ['参赛确认', '确认身份资格、团队人数、费用和必须使用的技术栈'],
        ['范围定义', '写清唯一目标、评分标准和最终提交物'],
        ['最小验证', '在 48 小时内完成一条可运行的核心流程'],
        ['真实测试', '找至少 3 名目标用户或同学完成测试并记录问题'],
        ['提交准备', '整理演示视频、项目说明、代码或作品链接'],
        ['提交准备', '在截止前至少 6 小时完成最终提交和链接复查'],
      ].forEach(([phase, title], index) => {
        tasks.push({ id: taskId('base', index, title), phase, title, completed: false });
      });
    }
    return tasks;
  }

  function getWorkspace(competitionId) {
    return readAll().find((item) => item.competitionId === competitionId) || null;
  }

  function listWorkspaces() {
    return readAll().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  function createWorkspace(competitionId) {
    const item = competitions.find((competition) => competition.id === competitionId);
    if (!item) return null;
    const existing = getWorkspace(competitionId);
    if (existing) return existing;
    const playbook = playbookByCompetition.get(competitionId);
    const timestamp = now();
    const workspace = {
      version: SCHEMA_VERSION,
      competitionId,
      competitionTitle: item.title,
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: '',
      tasks: buildDefaultTasks(item, playbook),
    };
    const items = readAll();
    items.push(workspace);
    writeAll(items);
    try { localStorage.setItem(`favorite:${competitionId}`, '1'); } catch {}
    return workspace;
  }

  function updateWorkspace(competitionId, updater) {
    const items = readAll();
    const index = items.findIndex((item) => item.competitionId === competitionId);
    if (index < 0) return null;
    const updated = updater({ ...items[index], tasks: [...(items[index].tasks || [])] });
    if (!updated) return null;
    updated.updatedAt = now();
    items[index] = updated;
    writeAll(items);
    return updated;
  }

  function toggleTask(competitionId, id, completed) {
    return updateWorkspace(competitionId, (workspace) => ({
      ...workspace,
      tasks: workspace.tasks.map((task) => task.id === id ? { ...task, completed: Boolean(completed) } : task),
    }));
  }

  function addTask(competitionId, title) {
    const clean = normalizeTitle(title);
    if (!clean) return null;
    return updateWorkspace(competitionId, (workspace) => ({
      ...workspace,
      tasks: [...workspace.tasks, {
        id: taskId('custom', workspace.tasks.length, clean),
        phase: '自定义任务',
        title: clean,
        completed: false,
      }],
    }));
  }

  function updateNotes(competitionId, notes) {
    return updateWorkspace(competitionId, (workspace) => ({ ...workspace, notes: String(notes || '').slice(0, 5000) }));
  }

  function deleteWorkspace(competitionId) {
    const items = readAll();
    const next = items.filter((item) => item.competitionId !== competitionId);
    if (next.length === items.length) return false;
    writeAll(next);
    return true;
  }

  function progress(workspace) {
    const tasks = Array.isArray(workspace?.tasks) ? workspace.tasks : [];
    const completed = tasks.filter((task) => task.completed).length;
    return {
      total: tasks.length,
      completed,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '待确认' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }

  function workspaceStatus(item) {
    if (!item) return '赛事信息已移除';
    if (item.collection === 'practice') return '长期练习';
    if (item.status === 'ended' || item.collection === 'archive') return '赛事已结束';
    const timestamp = new Date(item.deadline).getTime();
    if (!Number.isFinite(timestamp)) return '截止时间待确认';
    const days = Math.ceil((timestamp - Date.now()) / 86400000);
    return days < 0 ? '已截止' : days === 0 ? '今天截止' : `还剩 ${days} 天`;
  }

  function groupTasks(tasks) {
    const groups = new Map();
    for (const task of tasks || []) {
      const phase = task.phase || '其他任务';
      if (!groups.has(phase)) groups.set(phase, []);
      groups.get(phase).push(task);
    }
    return [...groups.entries()];
  }

  function renderEmptyWorkspace(item) {
    return `<div class="workspace-page"><div class="workspace-breadcrumbs"><a href="#/competitions/${encodeURIComponent(item.id)}">返回比赛详情</a></div><section class="workspace-empty"><span>LOCAL WORKSPACE</span><h1>为“${e(item.title)}”创建参赛计划</h1><p>系统会根据现有参赛路线生成任务；没有路线时会创建一套通用执行清单。数据只保存在当前浏览器。</p><button class="primary-button large" data-start-workspace="${e(item.id)}">创建我的参赛计划</button></section></div>`;
  }

  function renderWorkspace(competitionId) {
    const item = competitions.find((competition) => competition.id === competitionId);
    if (!item) return `<div class="workspace-page"><section class="workspace-empty"><h1>没有找到这场比赛</h1><p>赛事可能已被移除或地址发生变化。</p><a class="primary-button" href="#/workspace">返回我的参赛</a></section></div>`;
    const workspace = getWorkspace(competitionId);
    if (!workspace) return renderEmptyWorkspace(item);
    const stats = progress(workspace);
    const playbook = playbookByCompetition.get(competitionId);
    const groups = groupTasks(workspace.tasks);
    const official = item.sourceUrl ? `<a class="secondary-button" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方规则 ↗</a>` : '';
    const playbookLink = playbook ? `<a class="secondary-button" href="#/playbooks/${encodeURIComponent(playbook.id)}">查看完整参赛路线</a>` : '';
    return `<div class="workspace-page" data-workspace-page="${e(competitionId)}">
      <div class="workspace-breadcrumbs"><a href="#/workspace">我的参赛</a><span>›</span><a href="#/competitions/${encodeURIComponent(item.id)}">${e(item.title)}</a></div>
      <section class="workspace-hero">
        <div class="workspace-hero-copy"><span class="workspace-kicker">LOCAL PARTICIPATION WORKSPACE</span><h1>${e(item.title)}</h1><p>把比赛从“收藏”变成每天可以推进的任务。当前版本仅保存在这台设备的浏览器中。</p><div class="workspace-meta"><span>${e(workspaceStatus(item))}</span><span>${stats.completed}/${stats.total} 项完成</span><span>更新于 ${e(formatDate(workspace.updatedAt))}</span></div></div>
        <div class="workspace-progress-card"><strong>${stats.percent}%</strong><span>整体进度</span><div class="workspace-progress-track"><i style="width:${stats.percent}%"></i></div></div>
      </section>
      <div class="workspace-layout">
        <section class="workspace-tasks">
          <div class="workspace-section-heading"><div><span>EXECUTION CHECKLIST</span><h2>执行任务</h2></div><small>完成一项，进度就会自动更新</small></div>
          ${groups.map(([phase, tasks]) => `<div class="workspace-task-group"><h3>${e(phase)}</h3>${tasks.map((task) => `<label class="workspace-task ${task.completed ? 'is-complete' : ''}"><input type="checkbox" data-workspace-task="${e(task.id)}" ${task.completed ? 'checked' : ''}><span class="workspace-task-check"></span><span>${e(task.title)}</span></label>`).join('')}</div>`).join('')}
          <form class="workspace-add-task" data-add-workspace-task><input name="title" maxlength="120" placeholder="增加一个自己的任务……" aria-label="新增任务"><button class="secondary-button" type="submit">添加任务</button></form>
        </section>
        <aside class="workspace-sidebar">
          <section><span>比赛状态</span><strong>${e(workspaceStatus(item))}</strong><p>${item.deadline ? `官方截止：${e(item.deadlineText || formatDate(item.deadline))}` : '截止时间仍需在官方页面确认。'}</p></section>
          <section><label for="workspace-notes">我的备注</label><textarea id="workspace-notes" data-workspace-notes maxlength="5000" placeholder="记录选题、队友、技术路线、卡点或下一步……">${e(workspace.notes)}</textarea><button class="primary-button" data-save-workspace-notes>保存备注</button><small data-notes-status>备注仅保存在当前浏览器</small></section>
          <div class="workspace-sidebar-actions">${playbookLink}${official}<button class="workspace-delete" data-delete-workspace>删除本地计划</button></div>
        </aside>
      </div>
    </div>`;
  }

  function renderWorkspaceList() {
    const workspaces = listWorkspaces();
    if (!workspaces.length) {
      return `<div class="workspace-page"><section class="workspace-list-hero"><span>MY COMPETITIONS</span><h1>我的参赛</h1><p>这里会集中显示你真正决定投入的比赛，而不是所有收藏。</p></section><section class="workspace-empty"><h2>还没有参赛计划</h2><p>从一场比赛的详情页点击“加入我的参赛”，系统会生成可勾选的执行清单。</p><a class="primary-button large" href="#/competitions?sort=recommended">找一场值得参加的比赛</a></section></div>`;
    }
    return `<div class="workspace-page"><section class="workspace-list-hero"><span>MY COMPETITIONS</span><h1>我的参赛</h1><p>${workspaces.length} 场正在管理的比赛。数据只保存在当前浏览器。</p></section><section class="workspace-card-grid">${workspaces.map((workspace) => {
      const item = competitions.find((competition) => competition.id === workspace.competitionId);
      const stats = progress(workspace);
      return `<a class="workspace-card" href="#/workspace/${encodeURIComponent(workspace.competitionId)}"><div class="workspace-card-top"><span>${e(workspaceStatus(item))}</span><strong>${stats.percent}%</strong></div><h2>${e(item?.title || workspace.competitionTitle || workspace.competitionId)}</h2><p>${stats.completed}/${stats.total} 项完成 · 最近更新 ${e(formatDate(workspace.updatedAt))}</p><div class="workspace-progress-track"><i style="width:${stats.percent}%"></i></div><footer>继续推进 →</footer></a>`;
    }).join('')}</section></div>`;
  }

  function eligibleForWorkspace(item) {
    if (!item) return false;
    if (item.entryStatus === 'closed' || item.status === 'ended' || item.collection === 'archive') return false;
    return true;
  }

  function injectNavigation() {
    const path = currentPath();
    const count = listWorkspaces().length;
    const label = count ? `我的参赛 ${count}` : '我的参赛';
    const desktop = document.querySelector('.desktop-nav');
    if (desktop && !desktop.querySelector('[data-workspace-nav]')) {
      desktop.insertAdjacentHTML('beforeend', `<a href="#/workspace" data-workspace-nav class="${path.startsWith('/workspace') ? 'active' : ''}">${e(label)}</a>`);
    }
    const mobile = document.querySelector('[data-mobile-menu]');
    if (mobile && !mobile.querySelector('[data-workspace-nav]')) {
      mobile.insertAdjacentHTML('beforeend', `<a href="#/workspace" data-workspace-nav class="${path.startsWith('/workspace') ? 'active' : ''}">${e(label)}</a>`);
    }
  }

  function injectDetailAction() {
    if (!currentPath().startsWith('/competitions/')) return;
    const id = routeId();
    const item = competitions.find((competition) => competition.id === id);
    if (!eligibleForWorkspace(item)) return;
    const target = document.querySelector('.detail-actions');
    if (!target || target.querySelector('[data-start-workspace]')) return;
    const existing = getWorkspace(id);
    const label = existing ? '继续我的参赛计划' : '加入我的参赛';
    target.insertAdjacentHTML('beforeend', `<button class="secondary-button workspace-start-button" data-start-workspace="${e(id)}">${e(label)}</button>`);
    target.querySelector('[data-start-workspace]')?.addEventListener('click', () => {
      createWorkspace(id);
      location.hash = `#/workspace/${encodeURIComponent(id)}`;
    });
  }

  function bindWorkspacePage(competitionId) {
    const main = document.querySelector('main');
    if (!main) return;
    main.querySelectorAll('[data-start-workspace]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.startWorkspace;
      createWorkspace(id);
      location.hash = `#/workspace/${encodeURIComponent(id)}`;
    }));
    main.querySelectorAll('[data-workspace-task]').forEach((checkbox) => checkbox.addEventListener('change', () => {
      toggleTask(competitionId, checkbox.dataset.workspaceTask, checkbox.checked);
      renderRoute();
    }));
    main.querySelector('[data-add-workspace-task]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = event.currentTarget.querySelector('input[name="title"]');
      if (!input?.value.trim()) return;
      addTask(competitionId, input.value);
      renderRoute();
    });
    main.querySelector('[data-save-workspace-notes]')?.addEventListener('click', () => {
      const textarea = main.querySelector('[data-workspace-notes]');
      updateNotes(competitionId, textarea?.value || '');
      const status = main.querySelector('[data-notes-status]');
      if (status) status.textContent = '已保存到当前浏览器';
    });
    main.querySelector('[data-delete-workspace]')?.addEventListener('click', () => {
      const allowed = typeof window.confirm !== 'function' || window.confirm('删除这份本地参赛计划？此操作不会影响官方报名。');
      if (!allowed) return;
      deleteWorkspace(competitionId);
      location.hash = '#/workspace';
    });
  }

  function renderRoute() {
    const path = currentPath();
    injectNavigation();
    injectDetailAction();
    if (path !== '/workspace' && !path.startsWith('/workspace/')) return;
    const main = document.querySelector('main');
    if (!main) return;
    if (path === '/workspace') {
      main.innerHTML = renderWorkspaceList();
      return;
    }
    const id = routeId();
    main.innerHTML = renderWorkspace(id);
    bindWorkspacePage(id);
  }

  function schedule() {
    setTimeout(renderRoute, 0);
  }

  window.AI_WORKSPACE = Object.freeze({
    storageKey: STORAGE_KEY,
    buildDefaultTasks,
    createWorkspace,
    getWorkspace,
    listWorkspaces,
    toggleTask,
    addTask,
    updateNotes,
    deleteWorkspace,
    progress,
    renderWorkspace,
    renderWorkspaceList,
  });

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
