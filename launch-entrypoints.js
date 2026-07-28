(() => {
  const data = window.AI_DATA || {};
  const titles = {
    '高价值精选': ['已审核的高价值比赛', '优先展示评级为 S 或 A、证据充分且当前仍可行动的赛事。'],
    '零基础友好': ['零基础也能开始的比赛', '优先展示门槛清晰、当前可行动并已完成赛事级审核的入门赛事。'],
    '本周截止': ['7 天内截止的比赛', '先确认资格、材料和时区，再决定是否立即投入。'],
  };

  function pathAndParams() {
    const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
    return { path: path || '/', params: new URLSearchParams(query) };
  }

  function injectHomeSegments() {
    const { path } = pathAndParams();
    if (path !== '/') return;
    const main = document.querySelector('main');
    const capability = main?.querySelector('.capability-strip');
    if (!main || !capability || main.querySelector('[data-launch-segments]')) return;

    const section = document.createElement('section');
    section.className = 'launch-segments-section';
    section.dataset.launchSegments = '';
    section.innerHTML = `<div class="launch-segments-heading"><span>START HERE</span><h2>按你现在最需要的方式找比赛</h2><p>不是再给你一个更长的列表，而是先把最值得行动的入口分出来。</p></div><div class="launch-segments-grid">${(data.launchSegments || []).map((segment, index) => `<a class="launch-segment-card launch-segment-${segment.id}" href="${segment.href}"><span>0${index + 1}</span><div><h3>${segment.title}</h3><p>${segment.description}</p><strong>${segment.count} 场当前机会 →</strong></div></a>`).join('')}</div>`;
    capability.insertAdjacentElement('afterend', section);
  }

  function enhanceLandingTitle() {
    const { path, params } = pathAndParams();
    if (path !== '/competitions') return;
    const query = params.get('q');
    const copy = titles[query];
    if (!copy) return;
    const hero = document.querySelector('.explorer-hero');
    const heading = hero?.querySelector('h1');
    const paragraph = hero?.querySelector(':scope > p');
    if (heading) heading.textContent = copy[0];
    if (paragraph) paragraph.textContent = copy[1];
    document.title = `${copy[0]}｜AI 赛场`;
  }

  function render() {
    setTimeout(() => {
      injectHomeSegments();
      enhanceLandingTitle();
    }, 0);
  }

  window.addEventListener('DOMContentLoaded', render);
  window.addEventListener('hashchange', render);
})();
