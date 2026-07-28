(() => {
  const DEFAULT_TITLE = 'AI 赛场｜只参加真正值得的比赛';
  const EFFECTIVE_DATE = '2026 年 7 月 28 日';

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function injectFooter() {
    const footer = document.querySelector('.footer-main');
    if (!footer || footer.querySelector('[data-trust-footer]')) return;
    const column = document.createElement('div');
    column.dataset.trustFooter = '';
    column.innerHTML = '<strong>信任与说明</strong><a href="#/about">关于我们</a><a href="#/data-policy">数据说明</a><a href="#/privacy">隐私政策</a><a href="#/terms">使用条款</a>';
    footer.appendChild(column);
  }

  function page(title, kicker, intro, sections) {
    return `<div class="trust-page"><section class="trust-hero"><span>${kicker}</span><h1>${title}</h1><p>${intro}</p><small>当前版本：Commercial Beta · 生效日期 ${EFFECTIVE_DATE}</small></section><section class="trust-content">${sections.map((section) => `<article class="trust-block"><h2>${section.title}</h2>${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}${section.items ? `<ul>${section.items.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}</article>`).join('')}</section></div>`;
  }

  function renderAbout(main) {
    document.title = '关于 AI 赛场';
    main.innerHTML = page('关于 AI 赛场', 'ABOUT AI SAICHANG', 'AI 赛场是面向大学生的竞赛决策与参赛执行平台。我们不只收集比赛入口，更希望帮助用户判断一场比赛是否值得投入，并把要求拆成可以执行的路线。', [
      { title: '我们正在解决什么', paragraphs: ['比赛信息分散、截止时间容易错过、赛事含金量难判断，而普通聚合页面通常只告诉用户“有什么比赛”，很少回答“为什么值得参加”和“接下来怎么做”。'] },
      { title: '当前产品包含什么', items: ['真实赛事库与截止时间筛选', '赛事级审核、证据置信度与风险提示', '国内与国际赛事分类', '首批可执行参赛路线', '公开提交比赛、纠错与内测反馈入口'] },
      { title: '我们不会做什么', items: ['不会把付费推广包装成独立评级', '不会保证获奖、证书、保研或求职结果', '不会用聚合页单独证明赛事权威性', '不会在未核验时把比赛标成高价值推荐'] },
      { title: '当前阶段', paragraphs: ['这是公开 Commercial Beta。产品、数据和规则仍会迭代，欢迎通过“参与内测与反馈”页面提交具体问题和官方证据。'] },
    ]);
  }

  function renderDataPolicy(main) {
    document.title = '数据说明｜AI 赛场';
    main.innerHTML = page('数据说明', 'DATA & RATING POLICY', '这里说明比赛数据从哪里来、如何审核、什么时候可能出错，以及推荐排序不代表什么。', [
      { title: '数据来源', paragraphs: ['赛事信息主要来自主办方官网、正式组委会页面、专业赛事承载平台及公开规则。聚合平台只用于发现线索，不能单独作为高等级评级证据。'] },
      { title: '赛事审核', items: ['未完成赛事级审核的记录显示 U · 待核验', '已审核赛事补充主办方、资格、费用、时区、证据链接和风险', '权威性、履历价值和成长价值分别判断', '严重资格限制和风险会覆盖普通推荐分数'] },
      { title: '更新时间与错误', paragraphs: ['比赛规则、截止时间、费用和资格可能被主办方临时调整。页面显示的“最近核验”不是实时保证，报名和提交前必须回到官方页面再次确认。发现错误时，可通过公开纠错表单提交官方证据。'] },
      { title: '推荐排序', paragraphs: ['推荐排序考虑赛事等级、证据置信度、审核状态、信息完整度、行动时间和风险。它是透明规则排序，不是个性化录取预测，也不保证某场比赛适合所有用户。商业合作不得改变独立评级。'] },
      { title: '数据使用边界', paragraphs: ['本站整理内容用于赛事发现、比较与学习，不替代主办方规则。赛事名称、商标、规则和原始资料归各自权利人所有。'] },
    ]);
  }

  function renderPrivacy(main) {
    document.title = '隐私政策｜AI 赛场';
    main.innerHTML = page('隐私政策', 'PRIVACY POLICY', '当前 Beta 坚持最少收集原则：没有必要的数据，不主动收集。', [
      { title: '本站前端当前保存什么', paragraphs: ['收藏功能仅在你的浏览器 localStorage 中保存赛事编号，不会由本站上传到独立数据库。清除浏览器数据后，本地收藏可能消失。'] },
      { title: '公开表单', paragraphs: ['加入内测、提交比赛和纠错目前跳转到 GitHub Issue Forms。提交内容会公开显示，并由 GitHub 处理账号及技术数据。请不要填写手机号、私人邮箱、身份证号、住址、学号、支付信息或其他敏感信息。'] },
      { title: '账号、支付与分析', paragraphs: ['当前版本没有本站账号系统、支付功能或独立用户画像系统。若未来新增分析、登录、提醒或支付，我们会在启用前更新本政策并在产品中明确说明。'] },
      { title: '托管服务', paragraphs: ['网站托管在 GitHub Pages。托管商、DNS 服务商和浏览器可能按照各自政策处理必要的访问日志、IP 地址、Cookie 或安全信息，本站无法替代这些第三方政策。'] },
      { title: '联系与删除', paragraphs: ['当前公开反馈通过 GitHub Issue 处理。需要修改或删除自己提交的公开内容时，可在对应 Issue 中说明，或使用 GitHub 自带的编辑与关闭功能。'] },
    ]);
  }

  function renderTerms(main) {
    document.title = '使用条款｜AI 赛场';
    main.innerHTML = page('Beta 使用条款', 'TERMS OF USE', '使用 AI 赛场即表示你理解：这是辅助决策工具，不是赛事主办方，也不是结果保证服务。', [
      { title: '信息性质', paragraphs: ['本站提供公开赛事整理、独立评级和执行建议，仅供学习与决策参考。正式资格、时间、奖金、规则、知识产权和提交结果均以主办方公告为准。'] },
      { title: '用户责任', items: ['报名之前自行核对资格、费用、时区和官方规则', '妥善保管代码、密钥、个人信息和未公开材料', '遵守赛事关于 AI、外部数据、开源和团队协作的要求', '不使用本站从事虚假报名、抄袭、刷榜或其他违规行为'] },
      { title: '不作保证', paragraphs: ['本站不保证数据永久准确、页面持续可用、比赛一定举办、奖金一定发放，也不保证使用参赛路线能够获奖、升学、就业或获得商业回报。'] },
      { title: '第三方链接', paragraphs: ['本站包含主办方、GitHub、Devpost、Kaggle 等第三方链接。访问后适用第三方规则和隐私政策，本站不控制第三方服务。'] },
      { title: '内容与品牌', paragraphs: ['“AI 赛场”的原创页面结构、评级说明和参赛路线受相应权利保护。赛事名称、Logo、商标和原始规则归各自权利人所有。合理引用本站内容时请注明来源，不得冒充本站或篡改评级后对外传播。'] },
      { title: 'Beta 变更', paragraphs: ['我们可能根据真实反馈调整页面、评级方法、数据结构和服务范围。重大变化会更新生效日期；继续使用更新后的版本视为接受新的条款。'] },
    ]);
  }

  function renderRoute() {
    injectFooter();
    const path = currentPath();
    const main = document.querySelector('main');
    if (!main) return;
    if (path === '/about') renderAbout(main);
    else if (path === '/data-policy') renderDataPolicy(main);
    else if (path === '/privacy') renderPrivacy(main);
    else if (path === '/terms') renderTerms(main);
    else if (!path.startsWith('/playbooks') && path !== '/sources' && path !== '/quality' && path !== '/participate') document.title = DEFAULT_TITLE;
  }

  window.addEventListener('ai:base-rendered', renderRoute);
})();
