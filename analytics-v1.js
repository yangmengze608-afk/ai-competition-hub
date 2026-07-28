(() => {
  const config = window.AI_ANALYTICS_CONFIG || {};
  const eventNames = new Set([
    'matcher_submit',
    'competition_search',
    'competition_filter',
    'official_link_click',
    'playbook_open',
    'beta_signup_click',
    'competition_submit_click',
    'correction_click',
    'favorite_toggle',
    'load_more',
    'segment_open',
  ]);
  const allowedSegments = new Map([
    ['高价值精选', 'high-value'],
    ['零基础友好', 'beginner'],
    ['本周截止', 'week'],
  ]);
  let scriptReady = false;
  let lastPagePath = '';
  const queuedEvents = [];

  function privacySignalActive() {
    if (!config.respectPrivacySignals) return false;
    return navigator.globalPrivacyControl === true
      || navigator.doNotTrack === '1'
      || window.doNotTrack === '1';
  }

  function productionHostAllowed() {
    return Array.isArray(config.allowedHostnames)
      && config.allowedHostnames.includes(location.hostname);
  }

  function validSiteCode() {
    return typeof config.siteCode === 'string'
      && /^[a-z0-9][a-z0-9-]{1,62}$/i.test(config.siteCode);
  }

  function status() {
    if (!config.enabled) return { active: false, reason: 'disabled' };
    if (config.provider !== 'goatcounter') return { active: false, reason: 'unsupported-provider' };
    if (!validSiteCode()) return { active: false, reason: 'missing-site-code' };
    if (!productionHostAllowed()) return { active: false, reason: 'non-production-host' };
    if (privacySignalActive()) return { active: false, reason: 'privacy-signal' };
    return { active: true, reason: scriptReady ? 'ready' : 'loading' };
  }

  function currentRoute() {
    const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
    return { path: path || '/', params: new URLSearchParams(query) };
  }

  function stableId(value) {
    const normalized = String(value || '').toLowerCase().trim();
    return /^[a-z0-9][a-z0-9-]{0,79}$/.test(normalized) ? normalized : '';
  }

  function pagePath() {
    const { path, params } = currentRoute();
    if (path === '/') return '/home';
    if (path === '/competitions') {
      const parts = ['/competitions'];
      const segment = allowedSegments.get(params.get('q'));
      if (segment) parts.push(`segment-${segment}`);
      const collection = params.get('collection');
      if (['current', 'practice', 'archive'].includes(collection)) parts.push(`collection-${collection}`);
      const region = params.get('region');
      if (['CN', 'INTL'].includes(region)) parts.push(`region-${region.toLowerCase()}`);
      const windowName = params.get('window');
      if (windowName === 'week') parts.push('window-week');
      const difficulty = params.get('difficulty');
      if (['入门', '进阶', '专家'].includes(difficulty)) {
        parts.push(`difficulty-${({ 入门: 'beginner', 进阶: 'intermediate', 专家: 'expert' })[difficulty]}`);
      }
      return parts.join('/');
    }
    if (path.startsWith('/competitions/')) {
      return `/competition/${stableId(path.split('/')[2]) || 'unknown'}`;
    }
    if (path === '/playbooks') return '/playbooks';
    if (path.startsWith('/playbooks/')) return `/playbook/${stableId(path.split('/')[2]) || 'unknown'}`;
    if (['/participate', '/quality', '/sources', '/about', '/data-policy', '/privacy', '/terms'].includes(path)) return path;
    return '/other';
  }

  function pageTitle() {
    const path = pagePath();
    if (path === '/home') return 'Home';
    if (path.startsWith('/competition/')) return 'Competition detail';
    if (path.startsWith('/playbook/')) return 'Playbook detail';
    return path.slice(1).replaceAll('/', ' · ') || 'AI 赛场';
  }

  function safeReferrer() {
    if (!document.referrer) return '';
    try {
      const url = new URL(document.referrer);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return '';
    }
  }

  function sendPageview() {
    const currentStatus = status();
    if (!currentStatus.active || !scriptReady || !window.goatcounter?.count) return;
    const path = pagePath();
    if (path === lastPagePath) return;
    lastPagePath = path;
    window.goatcounter.count({
      path,
      title: pageTitle(),
      referrer: safeReferrer(),
    });
  }

  function eventContext(element) {
    const competitionDetail = location.hash.match(/^#\/competitions\/([^?]+)/);
    const playbookDetail = location.hash.match(/^#\/playbooks\/([^?]+)/);
    if (competitionDetail) return stableId(decodeURIComponent(competitionDetail[1]));
    if (playbookDetail) return stableId(decodeURIComponent(playbookDetail[1]));
    const href = element?.closest?.('a')?.getAttribute('href') || '';
    const linkedCompetition = href.match(/^#\/competitions\/([^?]+)/);
    const linkedPlaybook = href.match(/^#\/playbooks\/([^?]+)/);
    if (linkedCompetition) return stableId(decodeURIComponent(linkedCompetition[1]));
    if (linkedPlaybook) return stableId(decodeURIComponent(linkedPlaybook[1]));
    return '';
  }

  function sendEvent(name, context = '') {
    if (!eventNames.has(name)) return false;
    const currentStatus = status();
    if (!currentStatus.active) return false;
    const safeContext = stableId(context);
    const payload = {
      path: `event:${name}${safeContext ? `:${safeContext}` : ''}`,
      title: name,
      event: true,
      referrer: '',
    };
    if (!scriptReady || !window.goatcounter?.count) {
      queuedEvents.push(payload);
      return true;
    }
    window.goatcounter.count(payload);
    return true;
  }

  function flushQueue() {
    if (!scriptReady || !window.goatcounter?.count) return;
    while (queuedEvents.length) window.goatcounter.count(queuedEvents.shift());
  }

  function classifyClick(target) {
    const link = target.closest?.('a');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href.includes('template=beta-signup.yml')) return 'beta_signup_click';
      if (href.includes('template=submit-competition.yml')) return 'competition_submit_click';
      if (href.includes('template=report-competition.yml')) return 'correction_click';
      if (/^#\/playbooks\//.test(href)) return 'playbook_open';
      if (link.matches('.decision-segment-card, .launch-segment-card')) return 'segment_open';
      try {
        const url = new URL(link.href, location.href);
        if (url.hostname !== location.hostname && link.target === '_blank') return 'official_link_click';
      } catch {}
    }
    if (target.closest?.('[data-favorite]')) return 'favorite_toggle';
    if (target.closest?.('[data-load-more]')) return 'load_more';
    return '';
  }

  function bindInteractions() {
    document.addEventListener('click', (event) => {
      const name = classifyClick(event.target);
      if (name) sendEvent(name, eventContext(event.target));
    }, { capture: true });

    document.addEventListener('submit', (event) => {
      if (event.target.matches('[data-fit-form]')) sendEvent('matcher_submit');
      else if (event.target.matches('[data-home-search], [data-explorer-search], [data-header-search]')) sendEvent('competition_search');
    }, { capture: true });

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-filter]')) sendEvent('competition_filter');
    }, { capture: true });
  }

  function loadProvider() {
    const currentStatus = status();
    if (!currentStatus.active) return;
    window.goatcounter = {
      no_onload: true,
      no_events: true,
      endpoint: `https://${config.siteCode}.goatcounter.com/count`,
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.v5.js';
    script.crossOrigin = 'anonymous';
    script.integrity = 'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ';
    script.dataset.goatcounter = `https://${config.siteCode}.goatcounter.com/count`;
    script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true, no_events: true });
    script.addEventListener('load', () => {
      scriptReady = true;
      flushQueue();
      sendPageview();
    });
    document.head.appendChild(script);
  }

  function onRouteChange() {
    setTimeout(sendPageview, 0);
  }

  window.AIAnalytics = Object.freeze({
    track: sendEvent,
    status,
    pagePath,
  });
  bindInteractions();
  window.addEventListener('DOMContentLoaded', () => {
    loadProvider();
    onRouteChange();
  });
  window.addEventListener('hashchange', onRouteChange);
})();
