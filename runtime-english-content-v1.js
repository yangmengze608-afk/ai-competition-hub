(() => {
  const CJK = /[\u3400-\u9fff]/u;
  const textRecords = new WeakMap();
  let scheduled = false;
  let applying = false;

  const TRACK_EN = {
    'AI Agent': 'AI Agents',
    'AI 编程': 'AI Coding',
    'AI 视频与短剧': 'AI Video & Short Drama',
    'AI 绘画与设计': 'AI Art & Design',
    '具身智能与机器人': 'Embodied AI & Robotics',
    '数据科学': 'Data Science',
    '创新创业': 'Innovation & Entrepreneurship',
    'AI 教育': 'AI in Education',
    '人机交互': 'Human-Computer Interaction',
    '大模型应用': 'LLM Applications',
    '网络安全': 'Cybersecurity',
    '科研与学术': 'Research & Academia',
    '人工智能': 'Artificial Intelligence',
    '机器学习': 'Machine Learning',
    '数据分析': 'Data Analytics',
    '智能办公': 'AI Productivity',
    '计算机综合': 'Computer Science',
    '算法': 'Algorithms',
    '科研': 'Research',
    '数字创意': 'Digital Creativity',
    '程序设计': 'Programming',
    'AI 编程与开发': 'AI Coding & Development',
    '边缘 AI': 'Edge AI',
    '博弈': 'Game AI',
    '模型优化': 'Model Optimization'
  };

  const TOKEN_EN = {
    ...TRACK_EN,
    '大学生': 'Students',
    '高校学生': 'University Students',
    '奖金赛事': 'Prize Competition',
    '个人参赛': 'Solo Entry',
    '应用创新': 'Application Innovation',
    '零基础友好': 'Beginner Friendly',
    '具身智能': 'Embodied AI',
    '机器人': 'Robotics',
    '开源': 'Open Source',
    '限时挑战': 'Time-Limited Challenge',
    '黑客松': 'Hackathon',
    '学术': 'Academic',
    '答辩': 'Pitch / Defense',
    'AI 视频': 'AI Video',
    '数据': 'Data',
    '评测': 'Evaluation',
    '团队': 'Team',
    '个人': 'Individual',
    '中文': 'Chinese',
    '英文': 'English',
    '中英文': 'Chinese / English',
    '免费': 'Free',
    '未发现报名费': 'No entry fee found',
    '高': 'High',
    '中': 'Medium',
    '低': 'Low',
    '未知': 'Unknown'
  };

  const EXACT_EN = {
    '场匹配比赛': 'matching competitions',
    '暂时没有匹配结果': 'No Matching Competitions Yet',
    '减少筛选条件，或换一个更宽泛的关键词。': 'Use fewer filters or try a broader search term.',
    '清除所有筛选': 'Clear All Filters',
    '主办方待核验': 'Organizer Unverified',
    '公开来源': 'Public Source',
    '待核验': 'Unverified',
    '待确认': 'Confirm on official site',
    '时间待核验': 'Date Unverified',
    '可报名': 'Entry Open',
    '有资格限制': 'Eligibility Restricted',
    '已关闭': 'Closed',
    '奖池约 25 万元': 'Prize pool: about CNY 250,000',
    '奖池约 1.8 万元': 'Prize pool: about CNY 18,000',
    '奖池约 10 万元': 'Prize pool: about CNY 100,000'
  };

  const RISK_EN = {
    'platform-specific-build': 'A specific organizer platform or technical stack is required.',
    'team-details-lock-after-deadline': 'Team details may lock after the deadline.',
    'detail-rules-require-login': 'Some detailed rules may require signing in to the official platform.',
    'qualification-stage-closed': 'The qualification stage is closed; only eligible teams may continue.',
    'continuous-submission-required': 'Recurring submissions or participation in a live ranking may be required.',
    'paid-entry': 'An entry fee is required.',
    'electronic-certificate-only': 'Certificates may be digital only.',
    'recognition-varies-by-school': 'Recognition for credits or extracurricular points varies by institution.',
    'commercial-organizer': 'The event is organized by a commercial organization.',
    'entry-deadline-before-final': 'Registration closes before the final submission deadline.',
    'no-cash-prize-in-simulation-track': 'The current track does not include a cash prize.',
    'public-code-required': 'Public code submission is required.',
    'technical-report-required': 'A technical report is required.',
    'banking-requirement-for-prize': 'Prize collection may require specific banking arrangements.',
    'eligibility-territory-restrictions': 'Prize eligibility is restricted in some regions.',
    'solution-documentation-required': 'Complete solution documentation is required for award consideration.',
    'advanced-research-only': 'This event is better suited to advanced researchers.',
    'open-source-license-required': 'An open-source license is required.',
    'phase-specific-rules': 'Rules differ between competition stages.',
    'adult-only': 'Participants must meet the legal adult-age requirement.',
    'adult-only-for-prizes': 'Minors may be able to participate but are usually not eligible for prizes.',
    'required-platform-stack': 'A specified technical stack is required.',
    'public-demo-and-documentation': 'A public demo and documentation are required.',
    'arm-platform-required': 'The solution must run on Arm architecture.',
    'public-open-source-repository': 'A public open-source repository is required.',
    'new-project-after-start-date': 'The project must be created after the competition start date.',
    'google-cloud-required': 'Google Cloud is required.',
    'gemini-api-required': 'The application must call the Gemini API.',
    'business-evidence-may-be-requested': 'Evidence of users or revenue may be requested.',
    'cockroachdb-required': 'CockroachDB is required.',
    'aws-required': 'AWS is required.',
    'functional-demo-required': 'A working demo is required.',
    'public-video-required': 'A public video is required.',
    'us-presence-required-for-finalists': 'Finalists must be legally able to enter the United States.',
    'in-person-final-required': 'The final round requires in-person attendance.',
    'travel-cost-unclear': 'Travel-cost coverage for the in-person stage is unclear.',
    'sensitive-data-prohibited': 'Real sensitive data must not be used in the demo.',
    'africa-residents-only': 'Participation is limited to residents of specified African countries.',
    'early-stage-only': 'Only early-stage projects or teams are eligible.',
    'funding-cap': 'A funding cap applies.',
    'hardware-constraint': 'Specific hardware constraints apply.',
    'organizer-depth-limited': 'Public information about the organizer is limited.',
    'timezone-needs-recheck': 'The deadline timezone still needs verification.',
    'prize-details-need-recheck': 'Prize details still need verification.',
    'backblaze-b2-required': 'Backblaze B2 is required.',
    'genblaze-required': 'Genblaze is required.',
    'public-project-materials': 'Project materials must be publicly accessible.',
    'student-focused': 'The event primarily targets students.',
    'public-github-required': 'A public GitHub repository is required.',
    'real-user-design-testing-required': 'Real target users must participate in design or testing.',
    'sensitive-health-data': 'The competition involves restricted health data.',
    'do-not-upload-data-to-cloud-ai': 'Competition data must not be uploaded to cloud AI tools.',
    'data-deletion-required': 'Local competition data must be deleted after the event.',
    'containerized-code-submission': 'Code must be submitted in a containerized format.',
    'winner-mit-open-source-required': 'Winning solutions must be open-sourced under the MIT License.'
  };

  function language() {
    return window.AI_LANGUAGE?.get?.() || document.documentElement.dataset.language || 'zh';
  }

  function competitions() {
    return Array.isArray(window.AI_DATA?.competitions) ? window.AI_DATA.competitions : [];
  }

  function itemById(id) {
    return competitions().find((item) => item.id === id) || null;
  }

  function cardItem(node) {
    const card = node.parentElement?.closest('.competition-card');
    if (!card) return null;
    const href = card.querySelector('.competition-title')?.getAttribute('href') || '';
    const id = decodeURIComponent(href.split('/').pop() || '');
    return itemById(id);
  }

  function routeItem() {
    const match = location.hash.match(/^#\/competitions\/([^?]+)/);
    return match ? itemById(decodeURIComponent(match[1])) : null;
  }

  function trackEn(value) {
    const text = String(value || '').trim();
    return TRACK_EN[text] || TOKEN_EN[text] || text;
  }

  function tokenEn(value) {
    const text = String(value || '').trim();
    if (!text) return text;
    if (TOKEN_EN[text]) return TOKEN_EN[text];
    let result = text;
    const replacements = [
      ['大模型', 'LLM'], ['智能体', 'AI Agent'], ['人工智能', 'Artificial Intelligence'],
      ['机器学习', 'Machine Learning'], ['数据科学', 'Data Science'], ['数据分析', 'Data Analytics'],
      ['创新创业', 'Innovation & Entrepreneurship'], ['网络安全', 'Cybersecurity'], ['科研', 'Research'],
      ['程序设计', 'Programming'], ['模型优化', 'Model Optimization'], ['边缘', 'Edge'],
      ['大学生', 'Students'], ['高校', 'University'], ['奖金', 'Prize'], ['赛事', 'Competition'],
      ['团队', 'Team'], ['个人', 'Individual'], ['应用', 'Application'], ['创新', 'Innovation'],
      ['机器人', 'Robotics'], ['博弈', 'Game AI'], ['开源', 'Open Source'], ['学术', 'Academic']
    ];
    for (const [zh, en] of replacements) result = result.replaceAll(zh, en);
    return CJK.test(result) ? text : result.replace(/\s+/g, ' ').trim();
  }

  function englishCardSummary(item) {
    const track = trackEn(item?.track || 'AI / technology');
    const grade = item?.grade && item.grade !== 'U' ? `Grade ${item.grade}` : 'a currently tracked';
    const review = item?.verificationStatus === 'reviewed' ? 'reviewed' : 'listed';
    return `A ${review} ${track} competition with ${grade} status. Check the official task, eligibility, deadline, required deliverables and platform rules before committing time.`;
  }

  function englishHeroSummary(item) {
    const track = trackEn(item?.track || 'AI / technology');
    return `A ${item?.verificationStatus === 'reviewed' ? 'reviewed' : 'tracked'} ${track} competition. Use the official rules to confirm eligibility, deadlines, required platforms and final deliverables before entering.`;
  }

  function englishOverview(item) {
    const track = trackEn(item?.track || 'AI / technology');
    const mode = tokenEn(item?.mode || '');
    const format = tokenEn(item?.format || '');
    return `This competition is tracked under ${track}${mode ? ` and is currently listed as ${mode}` : ''}${format ? ` for ${format.toLowerCase()} participation` : ''}. AI Competition Hub summarizes the decision factors, but the organizer's official rules remain the source of truth.`;
  }

  function englishAudit(item) {
    const confidence = ({ high: 'high', medium: 'medium', low: 'low' })[item?.confidence] || 'unconfirmed';
    return `AI Competition Hub currently rates this event Grade ${item?.grade || 'U'} with ${confidence} evidence confidence. The rating compares organizer authority, resume signal and learning value; it does not guarantee an award, admission or employment outcome.`;
  }

  function englishAudience(item) {
    return `Best suited to participants interested in ${trackEn(item?.track || 'this field')} who can complete a real submission before the official deadline and are willing to verify the organizer's eligibility and submission rules.`;
  }

  function englishEligibility() {
    return 'Check the official rules for identity, student or professional status, region, age, team size, qualification stage and any organizer-specific requirements.';
  }

  function englishFee(item) {
    const value = String(item?.fee || '').trim();
    if (!value) return 'Confirm on official site';
    return TOKEN_EN[value] || EXACT_EN[value] || (CJK.test(value) ? 'Confirm fee terms on the official page' : value);
  }

  function englishPrize(item) {
    const value = String(item?.prizeNote || '').trim();
    if (!value) return item?.hasPrize ? 'Prize / benefits available; confirm exact terms officially' : 'No cash prize confirmed';
    return EXACT_EN[value] || (CJK.test(value)
      ? (item?.hasPrize ? 'Prize / benefits available; confirm exact amount and terms officially' : 'No cash prize confirmed')
      : value);
  }

  function residualPattern(source) {
    const text = source.trim();
    if (EXACT_EN[text]) return EXACT_EN[text];
    let match = text.match(/^共?\s*(\d+)\s*场匹配比赛$/);
    if (match) return `${match[1]} matching competitions`;
    match = text.match(/^(\d+)\s*场匹配比赛$/);
    if (match) return `${match[1]} matching competitions`;
    match = text.match(/^奖池约\s*([\d.]+)\s*万元$/);
    if (match) return `Prize pool: about CNY ${Number(match[1]) * 10000}`;
    return tokenEn(text);
  }

  function preserveOfficialName(node) {
    const parent = node.parentElement;
    if (!parent || !CJK.test(node.nodeValue || '')) return false;
    const proper = parent.closest('.competition-title, .organizer, .breadcrumbs > span, .competition-detail-hero h1, .official-note strong');
    if (!proper) return false;
    proper.setAttribute('lang', 'zh-CN');
    proper.dataset.runtimeOfficialName = 'true';
    return true;
  }

  function dynamicTranslation(node, source) {
    const parent = node.parentElement;
    if (!parent) return null;
    const item = cardItem(node) || routeItem();

    if (parent.closest('.competition-summary')) return englishCardSummary(item);
    if (parent.matches('.competition-detail-hero > div > p')) return englishHeroSummary(item);
    if (parent.matches('.audit-summary')) return englishAudit(item);

    const detailBlock = parent.closest('.detail-main > .detail-block');
    if (detailBlock && parent.matches('p') && detailBlock.querySelector('.tag-row.large-tags')) return englishAudience(item);
    if (detailBlock && parent.matches('p') && detailBlock === detailBlock.parentElement?.querySelector('.detail-block')) return englishOverview(item);

    const auditFact = parent.closest('.audit-facts > div');
    if (auditFact && parent.matches('strong')) {
      const facts = [...auditFact.parentElement.children];
      const index = facts.indexOf(auditFact);
      if (index === 0) return englishEligibility(item);
      if (index === 1) return englishFee(item);
      if (index === 2) return String(item?.deadlineTimezone || source).trim();
      if (index === 3) return ({ open: 'Entry Open', closing: 'Closing Soon', restricted: 'Eligibility Restricted', closed: 'Closed' })[item?.entryStatus] || 'Confirm on official site';
    }

    const riskSpan = parent.closest('.audit-risk-list li span');
    if (riskSpan && item) {
      const li = riskSpan.closest('li');
      const items = [...li.parentElement.children];
      const index = items.indexOf(li);
      const flag = item.riskFlags?.[index];
      if (flag) return RISK_EN[flag] || 'Review this risk in the official competition rules.';
    }

    const sidebarValue = parent.closest('.detail-sidebar .info-row strong');
    if (sidebarValue && item) {
      const rows = [...sidebarValue.closest('.detail-sidebar').querySelectorAll('.info-row')];
      const row = sidebarValue.closest('.info-row');
      const index = rows.indexOf(row);
      if (index === 1) return trackEn(item.track);
      if (index === 2) return tokenEn(item.format);
      if (index === 3) return tokenEn(item.difficulty);
      if (index === 4) return tokenEn(item.mode);
      if (index === 5) return englishPrize(item);
      if (index === 7) return tokenEn(({ high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unknown' })[item.confidence] || source);
      if (index === 8) return item.verificationStatus === 'reviewed' ? 'Full Competition Review' : 'Basic Listing';
    }

    if (parent.matches('.tag-row em, .hot-tags button, option')) return residualPattern(source);
    if (parent.closest('.meta-grid') || parent.closest('.filter-field')) return residualPattern(source);

    const footerSource = parent.closest('.competition-card-footer > span');
    if (footerSource && item?.verificationStatus !== 'reviewed' && CJK.test(source)) return 'Public Source';

    return residualPattern(source);
  }

  function processTextNode(node) {
    const current = node.nodeValue || '';
    if (!current.trim()) return;

    let record = textRecords.get(node);
    if (!record) {
      record = { source: current, rendered: current };
      textRecords.set(node, record);
    }

    if (language() !== 'en') {
      if (current !== record.source) node.nodeValue = record.source;
      record.rendered = record.source;
      return;
    }

    if (!CJK.test(record.source) && !CJK.test(current)) return;
    if (preserveOfficialName(node)) return;

    const translated = dynamicTranslation(node, record.source);
    if (!translated || translated.trim() === record.source.trim()) return;

    const leading = record.source.match(/^\s*/)?.[0] || '';
    const trailing = record.source.match(/\s*$/)?.[0] || '';
    const next = `${leading}${translated.trim()}${trailing}`;
    record.rendered = next;
    if (current !== next) node.nodeValue = next;
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
        document.querySelectorAll('[data-runtime-official-name="true"]').forEach((element) => {
          element.removeAttribute('lang');
          delete element.dataset.runtimeOfficialName;
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

  const observer = new MutationObserver(() => {
    if (!applying) schedule();
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  window.addEventListener('ai-language-change', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('DOMContentLoaded', schedule);
  schedule();
})();
