(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const SITE_ORIGIN = 'https://aisaichang.cn';

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

  function utcStamp(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/u, 'Z');
  }

  function icsText(value) {
    return String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');
  }

  function safeUri(value) {
    return String(value || '').replace(/[\r\n\s]+/g, '').slice(0, 2000);
  }

  function eligibleForReminder(item, now = Date.now()) {
    if (!item || item.collection === 'practice' || item.collection === 'archive') return false;
    if (item.status === 'ended' || item.entryStatus === 'closed') return false;
    const deadline = new Date(item.deadline).getTime();
    return Number.isFinite(deadline) && deadline > now;
  }

  function calendarFilename(item) {
    const title = String(item?.title || 'AI赛场比赛')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    return `${title || 'AI赛场比赛'}-截止提醒.ics`;
  }

  function buildCalendarContent(item, generatedAt = new Date()) {
    if (!eligibleForReminder(item, generatedAt.getTime())) return null;
    const start = new Date(item.deadline);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const detailUrl = `${SITE_ORIGIN}/#/competitions/${encodeURIComponent(item.id)}`;
    const officialUrl = safeUri(item.sourceUrl) || detailUrl;
    const uid = String(item.id || 'competition').replace(/[^a-z0-9._-]+/gi, '-');
    const description = [
      `AI 赛场提醒：${item.title}`,
      `截止时间：${item.deadlineText || start.toISOString()}`,
      item.deadlineTimezone ? `展示时区：${item.deadlineTimezone}` : '',
      '请在提交前再次核对官方规则、参赛资格、时区和最终材料。',
      `AI 赛场详情：${detailUrl}`,
      `官方页面：${officialUrl}`,
    ].filter(Boolean).join('\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Competition Hub//Deadline Reminder//ZH-CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}-deadline@aisaichang.cn`,
      `DTSTAMP:${utcStamp(generatedAt)}`,
      `DTSTART:${utcStamp(start)}`,
      `DTEND:${utcStamp(end)}`,
      `SUMMARY:${icsText(`截止｜${item.title}`)}`,
      `DESCRIPTION:${icsText(description)}`,
      `URL:${officialUrl}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P7D',
      `DESCRIPTION:${icsText(`距离“${item.title}”截止还有 7 天`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P1D',
      `DESCRIPTION:${icsText(`距离“${item.title}”截止还有 1 天`)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  function downloadCalendar(item) {
    const content = buildCalendarContent(item);
    if (!content) return false;
    const anchor = document.createElement('a');
    let href = `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
    let objectUrl = '';

    if (typeof Blob === 'function' && window.URL?.createObjectURL) {
      objectUrl = window.URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
      href = objectUrl;
    }

    anchor.href = href;
    anchor.download = calendarFilename(item);
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (objectUrl) setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
    return true;
  }

  function bindButton(button, item) {
    button.addEventListener('click', () => {
      const original = button.textContent;
      const downloaded = downloadCalendar(item);
      button.textContent = downloaded ? '日历文件已生成' : '截止时间不可用';
      button.dataset.calendarState = downloaded ? 'done' : 'error';
      setTimeout(() => {
        button.textContent = original;
        delete button.dataset.calendarState;
      }, 2400);
    });
  }

  function injectDetailReminder() {
    if (!currentPath().startsWith('/competitions/')) return;
    const item = competitions.find((competition) => competition.id === routeId());
    if (!eligibleForReminder(item)) return;
    const target = document.querySelector('.detail-actions');
    if (!target || target.querySelector('[data-calendar-reminder]')) return;
    target.insertAdjacentHTML('beforeend', `<button type="button" class="secondary-button deadline-calendar-button" data-calendar-reminder="${e(item.id)}" title="下载通用 .ics 文件，导入后提前 7 天和 1 天提醒">加入日历提醒</button>`);
    bindButton(target.querySelector('[data-calendar-reminder]'), item);
  }

  function injectWorkspaceReminder() {
    if (!currentPath().startsWith('/workspace/')) return;
    const item = competitions.find((competition) => competition.id === routeId());
    if (!eligibleForReminder(item)) return;
    const target = document.querySelector('.workspace-sidebar-actions');
    if (!target || target.querySelector('[data-calendar-reminder]')) return;
    target.insertAdjacentHTML('afterbegin', `<div class="deadline-calendar-control"><button type="button" class="secondary-button deadline-calendar-button" data-calendar-reminder="${e(item.id)}">加入日历提醒</button><small>下载通用 .ics，导入后提前 7 天和 1 天提醒。</small></div>`);
    bindButton(target.querySelector('[data-calendar-reminder]'), item);
  }

  function render() {
    injectDetailReminder();
    injectWorkspaceReminder();
  }

  function schedule() {
    setTimeout(render, 0);
  }

  window.AI_CALENDAR = Object.freeze({
    eligibleForReminder,
    calendarFilename,
    buildCalendarContent,
    downloadCalendar,
  });

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();
