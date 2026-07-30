(() => {
  const BACKUP_TYPE = 'aisaichang-workspace-backup';
  const BACKUP_VERSION = 1;
  const MAX_FILE_BYTES = 1024 * 1024;
  const MAX_WORKSPACES = 100;
  const MAX_TASKS_PER_WORKSPACE = 500;
  let pendingStatus = '';

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function safeText(value, maxLength) {
    return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, maxLength);
  }

  function stableId(value) {
    const normalized = safeText(value, 120).toLowerCase();
    return /^[a-z0-9][a-z0-9._-]{0,119}$/.test(normalized) ? normalized : '';
  }

  function normalizedIso(value, fallback) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function timestamp(value) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function cleanTaskId(value, index) {
    const normalized = safeText(value, 100)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff._-]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || `imported-task-${index + 1}`;
  }

  function uniqueTaskId(base, used) {
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      id = `${base.slice(0, 88)}-import-${suffix}`;
      suffix += 1;
    }
    return id;
  }

  function sanitizeTask(raw, index, usedIds) {
    if (!raw || typeof raw !== 'object') return null;
    const title = safeText(raw.title, 240);
    if (!title) return null;
    const baseId = cleanTaskId(raw.id, index);
    const id = uniqueTaskId(baseId, usedIds);
    usedIds.add(id);
    return {
      id,
      phase: safeText(raw.phase, 120) || '导入任务',
      title,
      completed: raw.completed === true,
    };
  }

  function sanitizeWorkspace(raw, fallbackNow = new Date().toISOString()) {
    if (!raw || typeof raw !== 'object') return null;
    const competitionId = stableId(raw.competitionId);
    if (!competitionId) return null;
    const usedIds = new Set();
    const sourceTasks = Array.isArray(raw.tasks) ? raw.tasks.slice(0, MAX_TASKS_PER_WORKSPACE) : [];
    const tasks = sourceTasks
      .map((task, index) => sanitizeTask(task, index, usedIds))
      .filter(Boolean);
    const createdAt = normalizedIso(raw.createdAt, fallbackNow);
    const updatedAt = normalizedIso(raw.updatedAt, createdAt);
    return {
      version: 1,
      competitionId,
      competitionTitle: safeText(raw.competitionTitle, 200) || competitionId,
      createdAt,
      updatedAt,
      notes: safeText(raw.notes, 5000),
      tasks,
    };
  }

  function mergeTasks(existingTasks, incomingTasks, incomingNewer) {
    const result = (existingTasks || []).map((task) => ({ ...task }));
    const indexById = new Map(result.map((task, index) => [task.id, index]));
    const usedIds = new Set(indexById.keys());

    for (const incoming of incomingTasks || []) {
      const existingIndex = indexById.get(incoming.id);
      if (existingIndex === undefined) {
        const id = uniqueTaskId(incoming.id, usedIds);
        usedIds.add(id);
        indexById.set(id, result.length);
        result.push({ ...incoming, id });
        continue;
      }

      const existing = result[existingIndex];
      if (existing.title === incoming.title) {
        const preferred = incomingNewer ? incoming : existing;
        const fallback = incomingNewer ? existing : incoming;
        result[existingIndex] = {
          ...fallback,
          ...preferred,
          completed: existing.completed === true || incoming.completed === true,
        };
        continue;
      }

      const id = uniqueTaskId(incoming.id, usedIds);
      usedIds.add(id);
      indexById.set(id, result.length);
      result.push({ ...incoming, id });
    }

    return result.slice(0, MAX_TASKS_PER_WORKSPACE);
  }

  function mergeWorkspace(existing, incoming) {
    const incomingNewer = timestamp(incoming.updatedAt) >= timestamp(existing.updatedAt);
    const newer = incomingNewer ? incoming : existing;
    const older = incomingNewer ? existing : incoming;
    const createdAt = timestamp(existing.createdAt) <= timestamp(incoming.createdAt)
      ? existing.createdAt
      : incoming.createdAt;
    const updatedAt = timestamp(existing.updatedAt) >= timestamp(incoming.updatedAt)
      ? existing.updatedAt
      : incoming.updatedAt;

    return {
      version: 1,
      competitionId: existing.competitionId,
      competitionTitle: newer.competitionTitle || older.competitionTitle || existing.competitionId,
      createdAt,
      updatedAt,
      notes: newer.notes || older.notes || '',
      tasks: mergeTasks(existing.tasks, incoming.tasks, incomingNewer),
    };
  }

  function mergeWorkspaces(existingItems, incomingItems) {
    const now = new Date().toISOString();
    const result = [];
    const indexByCompetition = new Map();
    let added = 0;
    let merged = 0;
    let ignored = 0;

    for (const raw of existingItems || []) {
      const workspace = sanitizeWorkspace(raw, now);
      if (!workspace) {
        ignored += 1;
        continue;
      }
      const existingIndex = indexByCompetition.get(workspace.competitionId);
      if (existingIndex === undefined) {
        indexByCompetition.set(workspace.competitionId, result.length);
        result.push(workspace);
      } else {
        result[existingIndex] = mergeWorkspace(result[existingIndex], workspace);
      }
    }

    for (const raw of incomingItems || []) {
      const workspace = sanitizeWorkspace(raw, now);
      if (!workspace) {
        ignored += 1;
        continue;
      }
      const existingIndex = indexByCompetition.get(workspace.competitionId);
      if (existingIndex === undefined) {
        indexByCompetition.set(workspace.competitionId, result.length);
        result.push(workspace);
        added += 1;
      } else {
        result[existingIndex] = mergeWorkspace(result[existingIndex], workspace);
        merged += 1;
      }
    }

    return { workspaces: result.slice(0, MAX_WORKSPACES), added, merged, ignored };
  }

  function readStoredWorkspaces() {
    const api = window.AI_WORKSPACE;
    if (api?.listWorkspaces) return api.listWorkspaces();
    try {
      const parsed = JSON.parse(localStorage.getItem(api?.storageKey || 'ai-competition-workspaces:v1') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function createBackupPayload(workspaces = readStoredWorkspaces(), exportedAt = new Date()) {
    const merged = mergeWorkspaces([], workspaces);
    return {
      type: BACKUP_TYPE,
      version: BACKUP_VERSION,
      exportedAt: exportedAt.toISOString(),
      workspaceCount: merged.workspaces.length,
      workspaces: merged.workspaces,
    };
  }

  function serializeBackup(workspaces = readStoredWorkspaces(), exportedAt = new Date()) {
    return JSON.stringify(createBackupPayload(workspaces, exportedAt), null, 2);
  }

  function textSize(text) {
    if (typeof Blob === 'function') return new Blob([text]).size;
    return String(text).length;
  }

  function parseBackupText(text) {
    const source = String(text ?? '').replace(/^\uFEFF/u, '');
    if (!source.trim()) return { ok: false, error: '备份文件为空。' };
    if (textSize(source) > MAX_FILE_BYTES) return { ok: false, error: '备份文件超过 1 MB，已停止导入。' };

    let payload;
    try {
      payload = JSON.parse(source);
    } catch {
      return { ok: false, error: '文件不是有效的 JSON 备份。' };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, error: '备份文件结构无效。' };
    }
    if (payload.type !== BACKUP_TYPE) {
      return { ok: false, error: '这不是 AI 赛场的参赛计划备份。' };
    }
    if (payload.version !== BACKUP_VERSION) {
      return { ok: false, error: '备份版本不受支持，请使用当前版本重新导出。' };
    }
    if (!Array.isArray(payload.workspaces)) {
      return { ok: false, error: '备份中缺少参赛计划列表。' };
    }
    if (payload.workspaces.length > MAX_WORKSPACES) {
      return { ok: false, error: `单个备份最多包含 ${MAX_WORKSPACES} 份参赛计划。` };
    }

    const sanitized = [];
    let ignored = 0;
    const now = new Date().toISOString();
    for (const raw of payload.workspaces) {
      const workspace = sanitizeWorkspace(raw, now);
      if (workspace) sanitized.push(workspace);
      else ignored += 1;
    }
    if (payload.workspaces.length && !sanitized.length) {
      return { ok: false, error: '备份中没有可恢复的有效参赛计划。' };
    }
    return { ok: true, workspaces: sanitized, ignored };
  }

  function writeStoredWorkspaces(workspaces) {
    const key = window.AI_WORKSPACE?.storageKey || 'ai-competition-workspaces:v1';
    try {
      localStorage.setItem(key, JSON.stringify(workspaces));
      for (const workspace of workspaces) localStorage.setItem(`favorite:${workspace.competitionId}`, '1');
      return true;
    } catch {
      return false;
    }
  }

  function importBackupText(text) {
    const parsed = parseBackupText(text);
    if (!parsed.ok) return parsed;
    const merged = mergeWorkspaces(readStoredWorkspaces(), parsed.workspaces);
    if (!writeStoredWorkspaces(merged.workspaces)) {
      return { ok: false, error: '浏览器无法保存导入的数据，请检查存储空间或隐私设置。' };
    }
    return {
      ok: true,
      workspaces: merged.workspaces,
      added: merged.added,
      merged: merged.merged,
      ignored: merged.ignored + parsed.ignored,
    };
  }

  function backupFilename(date = new Date()) {
    return `AI赛场-参赛计划备份-${date.toISOString().slice(0, 10)}.json`;
  }

  function downloadBackup() {
    const workspaces = readStoredWorkspaces();
    if (!workspaces.length) return { ok: false, error: '当前没有可导出的参赛计划。' };
    const content = serializeBackup(workspaces);
    const anchor = document.createElement('a');
    let href = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
    let objectUrl = '';
    if (typeof Blob === 'function' && window.URL?.createObjectURL) {
      objectUrl = window.URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
      href = objectUrl;
    }
    anchor.href = href;
    anchor.download = backupFilename();
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (objectUrl) setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
    return { ok: true, count: workspaces.length };
  }

  async function readFileText(file) {
    if (!file) throw new Error('没有选择文件。');
    if (Number(file.size) > MAX_FILE_BYTES) throw new Error('备份文件超过 1 MB，已停止导入。');
    if (typeof file.text === 'function') return file.text();
    if (typeof FileReader !== 'function') throw new Error('当前浏览器无法读取这个文件。');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result || '')));
      reader.addEventListener('error', () => reject(new Error('读取备份文件失败。')));
      reader.readAsText(file, 'utf-8');
    });
  }

  function renderBackupPanel(count) {
    return `<section class="workspace-backup-panel" data-workspace-backup-panel>
      <div class="workspace-backup-copy"><span>LOCAL BACKUP</span><h2>备份与恢复参赛计划</h2><p>导出一个 JSON 文件，换浏览器或换设备后再导入。导入会安全合并，不会整库覆盖现有计划。</p></div>
      <div class="workspace-backup-actions">
        <button type="button" class="secondary-button" data-workspace-export ${count ? '' : 'disabled'}>导出全部计划${count ? `（${count}）` : ''}</button>
        <button type="button" class="primary-button" data-workspace-import>导入备份</button>
        <input type="file" accept=".json,application/json" data-workspace-import-file hidden>
        <small data-workspace-backup-status role="status">备份包含任务、完成状态和备注；请自行保管文件。</small>
      </div>
    </section>`;
  }

  function setStatus(panel, message, tone = '') {
    const status = panel?.querySelector('[data-workspace-backup-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function refreshWorkspaceList() {
    location.hash = `#/workspace?backup=${Date.now()}`;
  }

  function bindPanel(panel) {
    panel.querySelector('[data-workspace-export]')?.addEventListener('click', () => {
      const result = downloadBackup();
      setStatus(panel, result.ok ? `已导出 ${result.count} 份参赛计划。` : result.error, result.ok ? 'success' : 'error');
    });

    const fileInput = panel.querySelector('[data-workspace-import-file]');
    panel.querySelector('[data-workspace-import]')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      setStatus(panel, '正在检查备份文件……');
      try {
        const text = await readFileText(file);
        const result = importBackupText(text);
        if (!result.ok) {
          setStatus(panel, result.error, 'error');
          return;
        }
        pendingStatus = `导入完成：新增 ${result.added} 份，合并 ${result.merged} 份${result.ignored ? `，忽略 ${result.ignored} 条无效数据` : ''}。`;
        refreshWorkspaceList();
      } catch (error) {
        setStatus(panel, error?.message || '导入失败，请重新选择备份文件。', 'error');
      } finally {
        fileInput.value = '';
      }
    });
  }

  function injectPanel() {
    if (currentPath() !== '/workspace') return;
    const hero = document.querySelector('.workspace-list-hero');
    if (!hero || document.querySelector('[data-workspace-backup-panel]')) return;
    const count = readStoredWorkspaces().length;
    hero.insertAdjacentHTML('afterend', renderBackupPanel(count));
    const panel = document.querySelector('[data-workspace-backup-panel]');
    bindPanel(panel);
    if (pendingStatus) {
      setStatus(panel, pendingStatus, 'success');
      pendingStatus = '';
    }
  }

  function schedule() {
    setTimeout(injectPanel, 0);
  }

  window.AI_WORKSPACE_BACKUP = Object.freeze({
    backupType: BACKUP_TYPE,
    backupVersion: BACKUP_VERSION,
    maxFileBytes: MAX_FILE_BYTES,
    sanitizeWorkspace,
    mergeWorkspaces,
    createBackupPayload,
    serializeBackup,
    parseBackupText,
    importBackupText,
    backupFilename,
    renderBackupPanel,
  });

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();