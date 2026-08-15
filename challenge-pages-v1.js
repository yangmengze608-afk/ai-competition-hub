(() => {
  const DATA_URL = '/data/challenges-v1.json';
  const REPO_ISSUES = 'https://github.com/yangmengze608-afk/ai-competition-hub/issues/new';
  let dataPromise = null;
  let queued = false;

  const copy = {
    zh: {
      nav: '创意擂台', footerTitle: '创造', footerBrowse: '逛创意擂台', footerCreate: '我要出题',
      kicker: 'IDEA → MANY BUILDS', hero1: '有个脑洞？', hero2: '出一道题，看大家怎么做。',
      heroBody: '创意擂台不是另一个 AI 编程工具。你只负责提出一个值得实现的想法，世界各地的人可以用任意 AI / 开发工具给出完全不同的答案。',
      browse: '浏览创意擂台', create: '我要出题', beta: 'Beta 规则', betaBody: '第一版采用审核后发布。Challenge 与 Build 都不会因为提交表单就自动公开，先保证内容、版权与链接安全。',
      open: '全球开放', builds: '个 Builds', first: '成为第一个 Build', featured: '首批创意', featuredTitle: '同一道题，可以有很多种答案', featuredBody: '先从四道开放题开始。第一批真实 Build 会直接挂在对应 Challenge 下，而不是进入另一个作品广场。',
      how1: '01 · 出题', how1b: '一句话说清你想看看别人做出什么，不要求你自己先实现。',
      how2: '02 · 接题', how2b: '参与者使用 Trae、Codex、Claude、Lovable、Replit 或任何工具独立实现。',
      how3: '03 · 看答案', how3b: '所有 Build 回到同一道题下面比较，出题人可以选 Creator’s Pick。',
      detailBack: '创意擂台', challenge: 'Challenge', originalZh: '原始发布语言：中文', originalEn: 'Original language: English',
      brief: '这道题想看什么', submitNeed: '提交一个 Build 需要', submissions: 'Builds', noBuild: '还没有人交卷', noBuildBody: '这个 Challenge 还在等第一个真实作品。你不需要使用指定 AI 工具，只要能给出可体验的答案。', buildThis: '接这道题',
      creator: '发起者', access: '参与范围', language: '原始语言', status: '状态', openStatus: '开放中',
      ip: '创意会公开展示。发布一个 Idea 不会自动获得其他参与者作品的代码、版权或商业权益；Build 的权利仍归其作者，除非双方另有明确约定。不要提交尚需保密的创意或材料。',
      newKicker: 'POST AN IDEA', newTitle: '一句话出题。', newBody: '先不要写一份复杂赛事章程。告诉我们你想看看别人把什么做出来，Beta 会把它整理成一个全球可接的 Challenge 草案。',
      idea: '你的想法', ideaPlaceholder: '例如：做一个全球实时灾难雷达，让人一眼看到世界上正在发生什么。', alias: '显示名称', aliasPlaceholder: '昵称 / 团队名', deadline: '截止日期（可选）', noDeadline: '不设截止日期',
      creatorPick: '允许出题人选择 Creator’s Pick', community: '允许社区点赞 / 投票（后续版本启用）',
      proposal: '提交 Challenge Beta 审核', proposalNote: '当前站点是静态 GitHub Pages，因此 Beta 先走公开审核队列。点击后会打开结构化 GitHub Issue；审核通过后才进入正式 Challenge 数据。',
      publicIdea: '我理解：这个 Idea 会公开，不能把保密创意或未授权材料发到这里。',
      buildKicker: 'SUBMIT A BUILD', buildTitle: '把你的答案交回来。', buildBody: '作品可以部署在任何地方。AI 赛场不托管代码，只把同一道题的不同答案聚合到一起。',
      projectName: '作品名称', liveUrl: 'Live Demo URL', githubUrl: 'GitHub URL（可选）', tools: '使用的 AI / 开发工具', pitch: '一句话介绍',
      submitBuild: '提交 Build Beta 审核', submitBuildNote: 'Beta 阶段提交会进入公开审核队列。不要提交私有仓库密钥、个人敏感信息或你无权公开的内容。',
      notFound: '没有找到这道题', notFoundBody: '它可能尚未发布、已被移除，或链接发生了变化。',
      rights: '公开与权利说明', worldwide: 'Open Worldwide', noRestriction: '默认不限制国家或地区',
      copyDraft: '复制草案', copied: '已复制', titlePrefix: '创意擂台'
    },
    en: {
      nav: 'Challenges', footerTitle: 'Create', footerBrowse: 'Browse Challenges', footerCreate: 'Create a Challenge',
      kicker: 'IDEA → MANY BUILDS', hero1: 'Have an idea?', hero2: 'Challenge people to build it.',
      heroBody: 'Idea Challenges is not another AI coding tool. You provide an idea worth building; people around the world can answer it in completely different ways using any AI or development stack.',
      browse: 'Browse Challenges', create: 'Create a Challenge', beta: 'Beta rule', betaBody: 'The first release is reviewed before publication. Challenge and Build submissions do not go public automatically, so we can protect content quality, rights, and link safety.',
      open: 'Open Worldwide', builds: 'Builds', first: 'Be the first to build', featured: 'FOUNDING CHALLENGES', featuredTitle: 'One idea can have many answers', featuredBody: 'Start with four open prompts. Real builds will live under the Challenge that inspired them instead of disappearing into another generic project feed.',
      how1: '01 · Post the idea', how1b: 'Say what you want to see built. You do not need to implement it yourself first.',
      how2: '02 · Build an answer', how2b: 'Use Trae, Codex, Claude, Lovable, Replit, or any other tool to make your own interpretation.',
      how3: '03 · Compare the builds', how3b: 'Every build returns to the same prompt, and the creator can eventually choose a Creator’s Pick.',
      detailBack: 'Challenges', challenge: 'Challenge', originalZh: 'Originally posted in Chinese', originalEn: 'Originally posted in English',
      brief: 'What this challenge is asking for', submitNeed: 'What to submit', submissions: 'Builds', noBuild: 'No one has submitted a build yet', noBuildBody: 'This Challenge is waiting for its first real answer. Use any AI or development tool you want—the goal is a working interpretation.', buildThis: 'Build This Idea',
      creator: 'Creator', access: 'Access', language: 'Original language', status: 'Status', openStatus: 'Open',
      ip: 'Ideas are displayed publicly. Posting an idea does not automatically grant you ownership of another participant’s code, copyright, or commercial rights. Build authors retain rights unless the parties explicitly agree otherwise. Do not post ideas or materials that must remain confidential.',
      newKicker: 'POST AN IDEA', newTitle: 'Start with one sentence.', newBody: 'Do not write a heavy hackathon rulebook. Tell us what you want to see people build, and the Beta will turn it into a Challenge proposal that can be opened worldwide.',
      idea: 'Your idea', ideaPlaceholder: 'For example: build a live global disaster radar that shows what is happening around the world at a glance.', alias: 'Display name', aliasPlaceholder: 'Nickname / team', deadline: 'Deadline (optional)', noDeadline: 'No deadline',
      creatorPick: 'Let the idea creator choose a Creator’s Pick', community: 'Enable community voting / likes (future release)',
      proposal: 'Submit Challenge for Beta Review', proposalNote: 'The site currently runs on static GitHub Pages, so Beta submissions enter a public review queue first. Approved proposals are then added to the canonical Challenge data.',
      publicIdea: 'I understand this idea will be public and I should not submit confidential ideas or materials I do not have permission to share.',
      buildKicker: 'SUBMIT A BUILD', buildTitle: 'Bring your answer back.', buildBody: 'Your project can be hosted anywhere. AI Competition Hub does not host the code; it groups different answers under the same idea.',
      projectName: 'Project name', liveUrl: 'Live Demo URL', githubUrl: 'GitHub URL (optional)', tools: 'AI / development tools used', pitch: 'One-line pitch',
      submitBuild: 'Submit Build for Beta Review', submitBuildNote: 'During Beta, submissions enter a public review queue. Never include repository secrets, sensitive personal information, or content you do not have permission to publish.',
      notFound: 'Challenge not found', notFoundBody: 'It may not be published yet, may have been removed, or the link may have changed.',
      rights: 'Public posting & rights', worldwide: 'Open Worldwide', noRestriction: 'No country or region restriction by default',
      copyDraft: 'Copy draft', copied: 'Copied', titlePrefix: 'Challenges'
    }
  };

  function lang() { return window.AI_LANGUAGE?.get?.() === 'en' || document.documentElement.dataset.language === 'en' ? 'en' : 'zh'; }
  function c() { return copy[lang()]; }
  function e(value) { return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function currentPath() { return location.hash.slice(1).split('?')[0] || '/'; }
  function text(localized) { return localized?.[lang()] || localized?.zh || localized?.en || ''; }
  function originalLanguageLabel(item) { return item.originalLanguage === 'en' ? c().originalEn : c().originalZh; }
  function loadData() { if (!dataPromise) dataPromise = fetch(DATA_URL, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`Challenge data ${r.status}`); return r.json(); }); return dataPromise; }
  function buildCount(item) { return Array.isArray(item.builds) ? item.builds.length : 0; }
  function issueUrl(title, body) { return `${REPO_ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`; }

  function injectChrome() {
    const label = c().nav;
    const desktop = document.querySelector('.desktop-nav');
    if (desktop) {
      let link = desktop.querySelector('[data-challenge-nav]');
      if (!link) {
        link = document.createElement('a');
        link.href = '#/challenges';
        link.dataset.challengeNav = '';
        const competition = desktop.querySelector('a[href="#/competitions"]');
        if (competition?.nextSibling) desktop.insertBefore(link, competition.nextSibling); else desktop.appendChild(link);
      }
      link.textContent = label;
      link.classList.toggle('active', currentPath().startsWith('/challenges'));
    }
    const mobile = document.querySelector('[data-mobile-menu]');
    if (mobile) {
      let link = mobile.querySelector('[data-challenge-mobile]');
      if (!link) {
        link = document.createElement('a'); link.href = '#/challenges'; link.dataset.challengeMobile = '';
        const first = mobile.querySelector('a[href="#/competitions"]');
        mobile.insertBefore(link, first?.nextSibling || mobile.firstChild);
      }
      link.textContent = label;
    }
    const footer = document.querySelector('.footer-main');
    if (footer) {
      let column = footer.querySelector('[data-challenge-footer]');
      if (!column) { column = document.createElement('div'); column.dataset.challengeFooter = ''; footer.appendChild(column); }
      column.innerHTML = `<strong>${e(c().footerTitle)}</strong><a href="#/challenges">${e(c().footerBrowse)}</a><a href="#/challenges/new">${e(c().footerCreate)}</a>`;
    }
  }

  function card(item) {
    const count = buildCount(item);
    return `<article class="challenge-card">
      <div class="challenge-card-top"><span class="challenge-pill live">${e(c().open)}</span>${item.featured ? `<span class="challenge-pill">${e(lang() === 'en' ? 'Founding Challenge' : '首发 Challenge')}</span>` : ''}</div>
      <h3>${e(text(item.title))}</h3><p>${e(text(item.tagline))}</p>
      <div class="challenge-tags">${(item.tags || []).map((tag) => `<span>${e(tag)}</span>`).join('')}</div>
      <div class="challenge-card-foot"><strong>${count ? `${count} ${e(c().builds)}` : e(c().first)}</strong><a href="#/challenges/${encodeURIComponent(item.id)}">${e(lang() === 'en' ? 'Open Challenge →' : '查看 Challenge →')}</a></div>
    </article>`;
  }

  function renderList(main, dataset) {
    const items = dataset.challenges || [];
    const buildTotal = items.reduce((sum, item) => sum + buildCount(item), 0);
    document.title = `${c().titlePrefix} | ${lang() === 'en' ? 'AI Competition Hub' : 'AI 赛场'}`;
    main.innerHTML = `<div class="challenge-shell" data-challenge-page>
      <section class="challenge-hero"><div><div class="challenge-kicker">${e(c().kicker)}</div><h1>${e(c().hero1)}<span>${e(c().hero2)}</span></h1><p>${e(c().heroBody)}</p><div class="challenge-hero-actions"><a class="challenge-primary" href="#/challenges/new">${e(c().create)}</a><a class="challenge-secondary" href="#/challenges#founding">${e(c().browse)}</a></div><div class="challenge-stats"><div class="challenge-stat"><strong>${items.length}</strong><span>${e(lang() === 'en' ? 'open founding challenges' : '道首批开放题')}</span></div><div class="challenge-stat"><strong>${buildTotal}</strong><span>${e(lang() === 'en' ? 'real builds published' : '个真实 Build')}</span></div><div class="challenge-stat"><strong>2</strong><span>${e(lang() === 'en' ? 'languages, one shared challenge' : '种语言，共用同一 Challenge')}</span></div></div></div><aside class="challenge-hero-note"><strong>${e(c().beta)}</strong><p>${e(c().betaBody)}</p></aside></section>
      <section class="challenge-section" id="founding"><div class="challenge-section-head"><div><span>${e(c().featured)}</span><h2>${e(c().featuredTitle)}</h2></div><p>${e(c().featuredBody)}</p></div><div class="challenge-grid">${items.map(card).join('')}</div></section>
      <section class="challenge-explainer"><article><span>${e(c().how1.split(' · ')[0])}</span><h3>${e(c().how1.split(' · ')[1] || c().how1)}</h3><p>${e(c().how1b)}</p></article><article><span>${e(c().how2.split(' · ')[0])}</span><h3>${e(c().how2.split(' · ')[1] || c().how2)}</h3><p>${e(c().how2b)}</p></article><article><span>${e(c().how3.split(' · ')[0])}</span><h3>${e(c().how3.split(' · ')[1] || c().how3)}</h3><p>${e(c().how3b)}</p></article></section>
    </div>`;
  }

  function renderBuilds(item) {
    const builds = Array.isArray(item.builds) ? item.builds : [];
    if (!builds.length) return `<div class="challenge-empty"><h3>${e(c().noBuild)}</h3><p>${e(c().noBuildBody)}</p><a class="challenge-primary" href="#/challenges/${encodeURIComponent(item.id)}/submit">${e(c().buildThis)}</a></div>`;
    return `<div class="challenge-build-grid">${builds.map((build) => `<article class="challenge-build"><span class="challenge-pill">${e(build.creatorPick ? "Creator's Pick" : 'Build')}</span><h3>${e(build.name)}</h3><p>${e(build.pitch || '')}</p><div class="challenge-tags">${(build.tools || []).map((tool) => `<span>${e(tool)}</span>`).join('')}</div>${build.liveUrl ? `<a href="${e(build.liveUrl)}" target="_blank" rel="noopener noreferrer">Live Demo ↗</a>` : ''}</article>`).join('')}</div>`;
  }

  function renderDetail(main, item) {
    const count = buildCount(item);
    document.title = `${text(item.title)} | ${c().titlePrefix}`;
    main.innerHTML = `<div class="challenge-shell challenge-detail" data-challenge-page>
      <div class="challenge-breadcrumbs"><a href="#/challenges">${e(c().detailBack)}</a> / ${e(text(item.title))}</div>
      <section class="challenge-detail-hero"><div><div class="challenge-detail-meta"><span class="challenge-pill live">${e(c().open)}</span><span class="challenge-pill">${e(originalLanguageLabel(item))}</span></div><h1>${e(text(item.title))}</h1><p class="lead">${e(text(item.tagline))}</p><div class="challenge-hero-actions"><a class="challenge-primary" href="#/challenges/${encodeURIComponent(item.id)}/submit">${e(c().buildThis)}</a><a class="challenge-secondary" href="#/challenges/new">${e(c().create)}</a></div></div><aside class="challenge-side-card"><small>${e(c().submissions)}</small><strong>${count} ${e(c().builds)}</strong><small>${e(c().access)}</small><strong>${e(c().worldwide)}</strong><a class="challenge-primary" href="#/challenges/${encodeURIComponent(item.id)}/submit">${e(c().buildThis)}</a></aside></section>
      <section class="challenge-detail-layout"><div><section class="challenge-block"><h2>${e(c().brief)}</h2><p>${e(text(item.brief))}</p></section><section class="challenge-block"><h2>${e(c().submitNeed)}</h2><ul class="challenge-checklist">${(item.submission?.[lang()] || item.submission?.zh || []).map((line) => `<li>${e(line)}</li>`).join('')}</ul></section><section class="challenge-block"><h2>${e(c().submissions)}</h2>${renderBuilds(item)}</section></div><aside class="challenge-sidebar"><div class="challenge-facts"><div class="challenge-fact"><small>${e(c().creator)}</small><strong>${e(item.creator)}</strong></div><div class="challenge-fact"><small>${e(c().access)}</small><strong>${e(c().noRestriction)}</strong></div><div class="challenge-fact"><small>${e(c().language)}</small><strong>${e(item.originalLanguage)}</strong></div><div class="challenge-fact"><small>${e(c().status)}</small><strong>${e(c().openStatus)}</strong></div></div><div class="challenge-ip-note"><strong>${e(c().rights)}</strong><br>${e(c().ip)}</div></aside></section>
    </div>`;
  }

  function proposalBody(form) {
    const values = Object.fromEntries(new FormData(form));
    const languageName = lang() === 'en' ? 'English' : '中文';
    return `## Challenge idea\n${values.idea}\n\n## Creator / display name\n${values.alias || 'Anonymous / 匿名'}\n\n## Original language\n${languageName}\n\n## Deadline\n${values.deadline || 'No deadline / 不设截止日期'}\n\n## Options\n- Creator's Pick: ${values.creatorPick ? 'yes' : 'no'}\n- Community voting requested: ${values.community ? 'yes' : 'no'}\n\n## Public posting acknowledgement\nConfirmed. This idea may be displayed publicly after review. / 已确认：审核通过后该创意可以公开展示。`;
  }

  function renderNew(main) {
    document.title = `${c().create} | ${c().titlePrefix}`;
    main.innerHTML = `<div class="challenge-form-shell" data-challenge-page><div class="challenge-form-head"><span>${e(c().newKicker)}</span><h1>${e(c().newTitle)}</h1><p>${e(c().newBody)}</p></div><form class="challenge-form" data-challenge-proposal><label>${e(c().idea)}<textarea class="idea-input" name="idea" required maxlength="1000" placeholder="${e(c().ideaPlaceholder)}"></textarea><small>${e(lang() === 'en' ? 'Describe the outcome you want to see, not the implementation stack.' : '先描述你想看到什么，不要先限定参与者必须怎么实现。')}</small></label><div class="challenge-form-row"><label>${e(c().alias)}<input name="alias" maxlength="80" placeholder="${e(c().aliasPlaceholder)}"></label><label>${e(c().deadline)}<input name="deadline" type="date"><small>${e(c().noDeadline)}</small></label></div><div class="challenge-options"><label class="challenge-option"><input type="checkbox" name="creatorPick" checked> ${e(c().creatorPick)}</label><label class="challenge-option"><input type="checkbox" name="community"> ${e(c().community)}</label></div><label class="challenge-option"><input type="checkbox" name="publicAck" required> ${e(c().publicIdea)}</label><div class="challenge-form-notice">${e(c().proposalNote)}</div><div class="challenge-form-actions"><button class="challenge-primary" type="submit">${e(c().proposal)}</button><button class="challenge-secondary" type="button" data-copy-proposal>${e(c().copyDraft)}</button></div></form></div>`;
    const form = main.querySelector('[data-challenge-proposal]');
    form?.addEventListener('submit', (event) => { event.preventDefault(); const idea = String(new FormData(form).get('idea') || '').trim(); if (!idea) return; location.href = issueUrl(`[Challenge Proposal] ${idea.slice(0, 70)}`, proposalBody(form)); });
    main.querySelector('[data-copy-proposal]')?.addEventListener('click', async (event) => { const body = proposalBody(form); try { await navigator.clipboard.writeText(body); event.currentTarget.textContent = c().copied; } catch {} });
  }

  function renderSubmit(main, item) {
    document.title = `${c().submitBuild} | ${text(item.title)}`;
    main.innerHTML = `<div class="challenge-form-shell" data-challenge-page><div class="challenge-form-head"><span>${e(c().buildKicker)}</span><h1>${e(c().buildTitle)}</h1><p>${e(text(item.title))}</p><p>${e(c().buildBody)}</p></div><form class="challenge-form" data-build-submit><label>${e(c().projectName)}<input name="name" required maxlength="120"></label><label>${e(c().pitch)}<input name="pitch" required maxlength="240"></label><div class="challenge-form-row"><label>${e(c().liveUrl)}<input name="liveUrl" type="url" required placeholder="https://..."></label><label>${e(c().githubUrl)}<input name="githubUrl" type="url" placeholder="https://github.com/..."></label></div><label>${e(c().tools)}<input name="tools" required maxlength="240" placeholder="Trae, Codex, Lovable, Replit..."></label><div class="challenge-form-notice">${e(c().submitBuildNote)}</div><div class="challenge-form-actions"><button class="challenge-primary" type="submit">${e(c().submitBuild)}</button><a class="challenge-secondary" href="#/challenges/${encodeURIComponent(item.id)}">${e(lang() === 'en' ? 'Back to Challenge' : '返回 Challenge')}</a></div></form></div>`;
    main.querySelector('[data-build-submit]')?.addEventListener('submit', (event) => { event.preventDefault(); const form = event.currentTarget; const v = Object.fromEntries(new FormData(form)); const body = `## Challenge\n${item.id} — ${text(item.title)}\n\n## Project name\n${v.name}\n\n## One-line pitch\n${v.pitch}\n\n## Live demo\n${v.liveUrl}\n\n## GitHub\n${v.githubUrl || 'N/A'}\n\n## Tools used\n${v.tools}\n\n## Rights confirmation\nI have the right to submit and publicly share these project links. / 我确认有权提交并公开这些作品链接。`; location.href = issueUrl(`[Build Submission] ${v.name} → ${item.id}`, body); });
  }

  function renderNotFound(main) { main.innerHTML = `<div class="challenge-form-shell" data-challenge-page><div class="challenge-form-head"><span>404</span><h1>${e(c().notFound)}</h1><p>${e(c().notFoundBody)}</p></div><a class="challenge-primary" href="#/challenges">${e(c().browse)}</a></div>`; }

  async function renderRoute() {
    injectChrome();
    const path = currentPath();
    if (!path.startsWith('/challenges')) return;
    const main = document.querySelector('main');
    if (!main) return;
    try {
      const dataset = await loadData();
      if (path === '/challenges') renderList(main, dataset);
      else if (path === '/challenges/new') renderNew(main);
      else {
        const parts = path.split('/').filter(Boolean);
        const item = (dataset.challenges || []).find((entry) => entry.id === decodeURIComponent(parts[1] || ''));
        if (!item) renderNotFound(main);
        else if (parts[2] === 'submit') renderSubmit(main, item);
        else renderDetail(main, item);
      }
      injectChrome();
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      renderNotFound(main);
    }
  }

  function schedule() { if (queued) return; queued = true; setTimeout(() => { queued = false; renderRoute(); injectChrome(); }, 0); }
  const observer = new MutationObserver(() => { if (!document.querySelector('[data-challenge-nav]') || !document.querySelector('[data-challenge-footer]')) injectChrome(); });
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('ai-language-change', schedule);
  schedule();
})();
