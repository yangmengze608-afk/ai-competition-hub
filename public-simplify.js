(() => {
  const dimensionText = {
    权威性: '主办方、规则和评审是否可信。',
    履历价值: '对升学、求职或专业发展是否有帮助。',
    成长价值: '能否形成真实能力和可展示作品。',
    个人适配度: '是否符合你的目标、时间和能力。',
  };

  const gradeText = {
    S: '权威且认可度高',
    A: '值得重点投入',
    B: '适合积累作品',
    C: '适合入门练习',
    U: '信息仍不充分',
    R: '默认不推荐',
  };

  let queued = false;
  let observer = null;

  function path() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function observe() {
    if (!observer) observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      observer?.disconnect();
      simplify();
      observe();
    });
  }

  function simplifyNavigation() {
    const nav = document.querySelector('[data-research-nav]');
    if (nav && nav.textContent !== '赛事来源') nav.textContent = '赛事来源';

    const mobileSource = document.querySelector('[data-research-mobile]');
    if (mobileSource && mobileSource.textContent !== '赛事来源') mobileSource.textContent = '赛事来源';

    const mobileQuality = document.querySelector('[data-research-quality-mobile]');
    if (mobileQuality && mobileQuality.textContent !== '评级说明') mobileQuality.textContent = '评级说明';

    const footer = document.querySelector('[data-research-footer]');
    if (footer) {
      const strong = footer.querySelector('strong');
      if (strong && strong.textContent !== '赛事') strong.textContent = '赛事';
      const links = footer.querySelectorAll('a');
      if (links[0] && links[0].textContent !== '来源') links[0].textContent = '来源';
      if (links[1] && links[1].textContent !== '评级说明') links[1].textContent = '评级说明';
      footer.querySelectorAll('span').forEach((node) => node.remove());
    }

    const tabs = document.querySelectorAll('.research-tabs a');
    if (tabs[0] && tabs[0].textContent !== '赛事来源') tabs[0].textContent = '赛事来源';
    if (tabs[1] && tabs[1].textContent !== '评级说明') tabs[1].textContent = '评级说明';
  }

  function simplifyHero(title, description) {
    const hero = document.querySelector('.research-hero');
    if (!hero) return;
    hero.querySelector('.research-kicker')?.remove();
    hero.querySelector('.research-alert')?.remove();
    const heading = hero.querySelector('h1');
    const paragraph = hero.querySelector(':scope > p');
    if (heading && heading.textContent !== title) heading.textContent = title;
    if (paragraph && paragraph.textContent !== description) paragraph.textContent = description;
  }

  function simplifyResultHead() {
    const resultHead = document.querySelector('.source-results-head');
    const count = resultHead?.querySelector('[data-source-count]');
    if (!resultHead || !count) return;

    [...resultHead.childNodes].forEach((node) => {
      if (node === count) return;
      if (node.nodeType === Node.TEXT_NODE || !node.matches?.('[data-source-count-label]')) node.remove();
    });

    let label = resultHead.querySelector('[data-source-count-label]');
    if (!label) {
      label = document.createElement('span');
      label.dataset.sourceCountLabel = '';
      resultHead.appendChild(label);
    }
    label.textContent = '个来源';
  }

  function sourcePurpose(card, direction) {
    const tier = card.dataset.tier;
    if (tier === 'O1') {
      return `可查看${direction}比赛的通知、规则、报名、赛程与结果。`;
    }
    if (tier === 'O2') {
      return `可浏览平台承载的${direction}比赛，具体主办方、规则与时间需按单场确认。`;
    }
    if (tier === 'A2' || tier === 'A3') {
      return `适合发现${direction}机会，报名条件和赛程请以赛事主办方页面为准。`;
    }
    return `可作为${direction}比赛的补充入口，重要信息需要进一步确认。`;
  }

  function enrichSourceSummary(card) {
    const note = card.querySelector('.source-note');
    if (!note || note.dataset.enrichedSummary === 'true') return;

    const original = note.textContent.trim().replace(/[。；;]+$/u, '');
    const typeText = card.querySelector('.source-type')?.textContent.trim() || '';
    const direction = typeText.split('·').pop()?.trim() || '相关';
    const parts = [];

    if (original) parts.push(`${original}。`);
    parts.push(sourcePurpose(card, direction));

    if (card.dataset.status === 'needs_recheck') {
      parts.push('当前入口或当届信息仍需复核。');
    } else if (card.dataset.status === 'candidate') {
      parts.push('目前仅作为候选来源展示。');
    }

    note.textContent = parts.join('');
    note.dataset.enrichedSummary = 'true';
    note.classList.add('source-note-summary');
  }

  function simplifySources() {
    simplifyHero('赛事来源', '国内外大学生比赛入口。');

    const stats = document.querySelectorAll('.source-stats > div');
    [...stats].slice(3).forEach((node) => node.remove());
    if (stats[0]?.querySelector('span')) stats[0].querySelector('span').textContent = '全部';
    if (stats[1]?.querySelector('span')) stats[1].querySelector('span').textContent = '国内';
    if (stats[2]?.querySelector('span')) stats[2].querySelector('span').textContent = '国际';

    document.querySelectorAll('.source-controls label > span').forEach((label) => {
      if (label.textContent.trim() === '来源等级') label.textContent = '类型';
      if (label.textContent.trim() === '核验状态') label.textContent = '状态';
      if (label.textContent.trim() === '覆盖方向') label.textContent = '方向';
    });

    const search = document.querySelector('[data-source-search]');
    if (search) search.placeholder = '网站、国家或方向';

    simplifyResultHead();

    document.querySelectorAll('.source-card').forEach((card) => {
      card.classList.add('source-card-compact');
      card.querySelector('.source-priority')?.remove();
      card.querySelector('.source-usage')?.remove();
      enrichSourceSummary(card);

      const link = card.querySelector('.source-card-footer a');
      if (link && link.textContent !== '访问网站 ↗') link.textContent = '访问网站 ↗';
    });
  }

  function simplifyQuality() {
    simplifyHero('赛事评级', '帮助你判断一场比赛是否值得投入。');

    document.querySelectorAll('.quality-dimension').forEach((card) => {
      card.classList.add('quality-dimension-compact');
      const title = card.querySelector('h2')?.textContent.trim();
      const paragraph = card.querySelector('p');
      if (paragraph && dimensionText[title] && paragraph.textContent !== dimensionText[title]) {
        paragraph.textContent = dimensionText[title];
      }
      card.querySelector('ul')?.remove();
    });

    document.querySelectorAll('.quality-section').forEach((section) => {
      const heading = section.querySelector('.quality-heading h2')?.textContent.trim();
      if (heading === '证据优先级') {
        section.remove();
        return;
      }

      const headingWrap = section.querySelector('.quality-heading');
      headingWrap?.querySelector(':scope > span')?.remove();
      headingWrap?.querySelector(':scope > p')?.remove();

      if (heading === '赛事等级') {
        const title = section.querySelector('.quality-heading h2');
        if (title) title.textContent = '等级';
      }

      if (heading === '严重风险会直接否决') {
        const title = section.querySelector('.quality-heading h2');
        if (title) title.textContent = '风险提示';
        [...section.querySelectorAll('.risk-grid span')].slice(4).forEach((node) => node.remove());
      }
    });

    document.querySelectorAll('.grade-card').forEach((card) => {
      card.classList.add('grade-card-compact');
      const grade = card.querySelector(':scope > strong')?.textContent.trim();
      const paragraph = card.querySelector('p');
      if (paragraph && gradeText[grade] && paragraph.textContent !== gradeText[grade]) {
        paragraph.textContent = gradeText[grade];
      }
    });

    document.querySelector('.quality-cta')?.remove();
  }

  function simplify() {
    simplifyNavigation();
    if (path() === '/sources') simplifySources();
    if (path() === '/quality') simplifyQuality();
  }

  observe();
  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();