(() => {
  const CJK = /[\u3400-\u9fff]/u;
  const textRecords = new WeakMap();
  let scheduled = false;
  let applying = false;

  const SCOPE_SELECTOR = [
    '.site-header',
    '.site-footer',
    '.launch-segments-section',
    '.decision-home',
    '.conversion-home-section',
    '.home-competition-section',
    '.hot-tags'
  ].join(',');

  const TRACK_EN = {
    'AI Agent': 'AI Agents',
    'AI 编程': 'AI Coding',
    'AI 编程与开发': 'AI Coding & Development',
    'AI 视频与短剧': 'AI Video & Short Drama',
    'AI 绘画与设计': 'AI Art & Design',
    'AI 教育': 'AI in Education',
    '具身智能与机器人': 'Embodied AI & Robotics',
    '数据科学': 'Data Science',
    '数据分析': 'Data Analytics',
    '创新创业': 'Innovation & Entrepreneurship',
    '人机交互': 'Human-Computer Interaction',
    '大模型应用': 'LLM Applications',
    '网络安全': 'Cybersecurity',
    '科研与学术': 'Research & Academia',
    '科研': 'Research',
    '人工智能': 'Artificial Intelligence',
    '机器学习': 'Machine Learning',
    '智能办公': 'AI Productivity',
    '计算机综合': 'Computer Science',
    '算法': 'Algorithms',
    '程序设计': 'Programming',
    '数字创意': 'Digital Creativity',
    '健康科技': 'Health Technology',
    '医疗健康': 'Healthcare',
    '医疗 AI': 'Healthcare AI',
    '金融科技': 'FinTech',
    '教育科技': 'EdTech',
    '计算机视觉': 'Computer Vision',
    '自然语言处理': 'Natural Language Processing',
    '推荐系统': 'Recommender Systems',
    '时序预测': 'Time Series Forecasting',
    '遥感': 'Remote Sensing',
    '气候与环境': 'Climate & Environment',
    '可持续发展': 'Sustainability',
    '量子计算': 'Quantum Computing',
    '数学建模': 'Mathematical Modeling',
    '智能制造': 'Smart Manufacturing',
    '智慧城市': 'Smart Cities',
    '农业科技': 'AgriTech',
    '生物医药': 'Biomedicine',
    '自动驾驶': 'Autonomous Driving',
    '多模态': 'Multimodal AI',
    '生成式 AI': 'Generative AI',
    '运筹优化': 'Operations Research & Optimization',
    '能源': 'Energy',
    '社会公益': 'Social Impact',
    '边缘 AI': 'Edge AI',
    '博弈': 'Game AI',
    '模型优化': 'Model Optimization',
    'AI 安全': 'AI Safety'
  };

  const EXACT_EN = {
    '参赛路线': 'Competition Playbooks',
    '参与内测': 'Join Beta',
    '参与内测与反馈': 'Beta & Feedback',
    '执行': 'Execute',
    '从选题到提交': 'From idea to submission',
    '参与': 'Participate',
    '加入内测': 'Join Beta',
    '提交比赛': 'Submit Competition',
    '反馈错误': 'Report an Error',
    '赛事': 'Competitions',
    '来源': 'Sources',
    '高价值精选': 'High-Value Picks',
    '零基础友好': 'Beginner Friendly',
    '本周截止': 'Closing This Week',
    '按你现在最需要的方式找比赛': 'Find Competitions by What You Need Now',
    '不是再给你一个更长的列表，而是先把最值得行动的入口分出来。': 'Start with the most actionable paths instead of another long list.',
    '已完成赛事级审核，评级为 S 或 A，且当前仍具备行动资格。': 'Fully reviewed, rated S or A, and still actionable now.',
    '门槛相对清晰、当前可行动，并已经完成赛事级审核。': 'Clearer entry requirements, actionable now, and fully reviewed.',
    '距离截止不超过 7 天，适合立即确认资格和提交要求。': 'Closing within 7 days—verify eligibility and submission requirements now.',
    '不知道该参加哪场？': 'Not Sure Which Competition to Enter?',
    '先排除不值得的。': 'Rule Out the Ones Not Worth Your Time First.',
    'AI 赛场不只是收集比赛。我们核验来源、判断价值、标出资格风险，再把值得投入的比赛变成可以执行的参赛路线。': 'AI Competition Hub does more than collect listings. We verify sources, assess value, flag eligibility risks, and turn worthwhile competitions into executable playbooks.',
    '查看推荐比赛': 'View Recommended Competitions',
    '直接看参赛路线': 'Go to Competition Playbooks',
    '场真实赛事': 'real competitions',
    '场赛事级审核': 'full reviews',
    '条执行路线': 'execution playbooks',
    '场当前机会': 'open opportunities',
    '透明匹配 · 约 20 秒': 'Transparent matching · about 20 sec',
    '你现在更需要什么？': 'What Do You Need Most Right Now?',
    '选择目标、方向和经验，我们按公开规则组合筛选条件，不使用黑箱推荐。': 'Choose your goal, track, and experience. We combine filters using public rules—not a black-box recommender.',
    '参赛目标': 'Goal',
    '冲履历与高含金量': 'Resume Signal & High Value',
    '拿到第一份比赛经历': 'Get My First Competition Experience',
    '尽快找能立即行动的': 'Find Something I Can Act on Now',
    '先广泛看看机会': 'Browse Broadly',
    '感兴趣的方向': 'Track of Interest',
    '全部方向': 'All Tracks',
    '当前经验': 'Experience',
    '不限制难度': 'Any Experience Level',
    '第一次或刚入门': 'First Time / Beginner',
    '做过项目或比赛': 'Project / Competition Experience',
    '科研或高强度挑战': 'Research / Advanced Challenges',
    '生成我的比赛列表': 'Build My Competition List',
    '结果仍需你确认报名资格、时间和预算；最终规则以主办方页面为准。': 'You still need to confirm eligibility, timing, and budget. Organizer rules remain the source of truth.',
    '三种最常见的开始方式': 'Three Common Ways to Start',
    '最近需要做决定的比赛': 'Competitions Requiring a Decision Soon',
    '只展示仍可行动的当前机会；打开详情后再确认资格、费用、时区和提交要求。': 'Only actionable current opportunities are shown. Open details to confirm eligibility, fees, time zone, and submission requirements.',
    '明天截止': 'Closes Tomorrow',
    '当前没有 21 天内截止且仍可行动的比赛。': 'No actionable competitions close within the next 21 days.',
    '按截止时间查看全部': 'View All by Deadline',
    '按价值规则查看': 'View by Value Rules',
    '先看事实': 'Check the Facts First',
    '主办方、截止时间、资格、费用和官方链接必须能够追溯。': 'Organizer, deadline, eligibility, fees, and official links must be traceable.',
    '再看价值': 'Then Assess Value',
    '权威性、履历价值和成长价值分开判断，未审核赛事明确标记 U。': 'Authority, resume value, and learning value are assessed separately; unreviewed competitions are clearly marked U.',
    '最后行动': 'Then Take Action',
    '通过参赛路线把要求拆成阶段任务、交付物、停止条件和提交清单。': 'Use a playbook to break requirements into stages, deliverables, stop conditions, and a submission checklist.',
    '这个版本需要真实参赛者一起把它做对。': 'This Version Needs Real Competitors to Help Us Get It Right.',
    '告诉我们你找比赛时最麻烦的事情；也可以提交新比赛，或指出截止时间、资格与费用错误。': 'Tell us what makes finding competitions hardest. You can also submit a competition or report deadline, eligibility, and fee errors.',
    '参与 Commercial Beta': 'Join the Commercial Beta',
    '提交一场比赛 ↗': 'Submit a Competition ↗',
    '赛事主办方（Devpost 承载）': 'Event organizer (hosted on Devpost)',
    'AI 赛场': 'AI Competition Hub'
  };

  function language() {
    return window.AI_LANGUAGE?.get?.() || document.documentElement.dataset.language || 'zh';
  }

  function inScope(node) {
    const parent = node.parentElement;
    return Boolean(parent && parent.closest(SCOPE_SELECTOR) && !parent.closest('[data-language-switch]'));
  }

  function translatePattern(value) {
    const text = String(value || '').trim();
    if (!text) return text;
    if (EXACT_EN[text]) return EXACT_EN[text];
    if (TRACK_EN[text]) return TRACK_EN[text];

    let match = text.match(/^(\d+)\s*场当前机会\s*→?$/);
    if (match) return `${match[1]} open opportunities${text.endsWith('→') ? ' →' : ''}`;
    match = text.match(/^(\d+)\s*场可行动机会\s*→?$/);
    if (match) return `${match[1]} actionable opportunities${text.endsWith('→') ? ' →' : ''}`;
    match = text.match(/^先进入与你当前阶段最相关的机会，不必从\s*(\d+)\s*场比赛里逐条翻找。$/);
    if (match) return `Start with the opportunities most relevant to your current stage instead of browsing all ${match[1]} competitions.`;
    match = text.match(/^([SABCUR])\s*·\s*已审核$/);
    if (match) return `${match[1]} · Reviewed`;
    match = text.match(/^©\s*(\d{4})\s*AI 赛场$/);
    if (match) return `© ${match[1]} AI Competition Hub`;
    match = text.match(/^还剩\s*(\d+)\s*天$/);
    if (match) return `${match[1]} ${match[1] === '1' ? 'day' : 'days'} left`;

    return text;
  }

  function properNameContainer(node) {
    const parent = node.parentElement;
    if (!parent) return null;
    return parent.closest('.competition-title, .organizer, .decision-deadline-card h3, .decision-deadline-card > p, [data-network]');
  }

  function preserveOfficialName(node) {
    const container = properNameContainer(node);
    if (!container || !CJK.test(node.nodeValue || '')) return false;
    container.setAttribute('lang', 'zh-CN');
    container.dataset.homepageOfficialName = 'true';
    return true;
  }

  function processTextNode(node) {
    if (!inScope(node)) return;
    const current = node.nodeValue || '';
    if (!current.trim()) return;

    let record = textRecords.get(node);
    if (!record) {
      record = { source: current, rendered: current };
      textRecords.set(node, record);
    } else if (current !== record.rendered && current !== record.source) {
      record.source = current;
    }

    if (language() !== 'en') {
      if (current !== record.source) node.nodeValue = record.source;
      record.rendered = record.source;
      return;
    }

    const translated = translatePattern(record.source);
    if (translated !== record.source.trim()) {
      const leading = record.source.match(/^\s*/)?.[0] || '';
      const trailing = record.source.match(/\s*$/)?.[0] || '';
      const next = `${leading}${translated}${trailing}`;
      record.rendered = next;
      if (current !== next) node.nodeValue = next;
      return;
    }

    if (preserveOfficialName(node)) return;
  }

  function walk() {
    const root = document.getElementById('app');
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      processTextNode(node);
      node = walker.nextNode();
    }
  }

  function apply() {
    scheduled = false;
    applying = true;
    try {
      walk();
      if (language() !== 'en') {
        document.querySelectorAll('[data-homepage-official-name="true"]').forEach((element) => {
          element.removeAttribute('lang');
          delete element.dataset.homepageOfficialName;
        });
      }
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  const root = document.getElementById('app');
  if (root) {
    const observer = new MutationObserver(() => {
      if (!applying) schedule();
    });
    observer.observe(root, { subtree: true, childList: true, characterData: true });
  }

  window.addEventListener('ai-language-change', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('DOMContentLoaded', schedule);
  schedule();
})();
