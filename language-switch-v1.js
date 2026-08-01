(() => {
  const STORAGE_KEY = 'ai-language:v1';
  const QUERY_KEY = 'lang';
  const LANG_ZH = 'zh';
  const LANG_EN = 'en';

  const exact = new Map(Object.entries({
    'AI 赛场': 'AI Competition Hub',
    '比赛库': 'Competition Library',
    '本周截止': 'Closing This Week',
    '评级说明': 'Rating Guide',
    '找比赛': 'Find Competitions',
    '进入比赛库': 'Open Competition Library',
    '打开菜单': 'Open menu',
    '搜索比赛': 'Search competitions',
    '搜索': 'Search',
    '搜索比赛、赛道、主办方…': 'Search competitions, tracks, organizers…',
    '搜索比赛…': 'Search competitions…',
    '搜索比赛、赛道或主办方……': 'Search competitions, tracks, or organizers…',
    '搜索比赛名称、赛道或主办方……': 'Search by competition, track, or organizer…',
    '帮大学生找到真正值得参加的比赛，并看清截止时间、官方来源和投入价值。': 'Helping students find competitions worth entering, with clear deadlines, official sources, and value signals.',
    '当前机会': 'Open Opportunities',
    '长期练习': 'Ongoing Practice',
    '历史赛题': 'Past Challenges',
    '了解': 'Learn',
    '赛事来源': 'Competition Sources',
    '说明': 'Notes',
    '比赛信息以主办方公告为准': 'Official organizer rules take priority',
    '推广不影响赛事评级': 'Promotion never changes ratings',
    '信任与说明': 'Trust & Policies',
    '关于我们': 'About',
    '数据说明': 'Data Policy',
    '隐私政策': 'Privacy Policy',
    '使用条款': 'Terms of Use',

    '大学生竞赛决策与参赛执行平台': 'Competition discovery and execution for students',
    '别再收藏一堆比赛。': 'Stop bookmarking competitions.',
    '只参加真正值得的。': 'Enter the ones worth your time.',
    '真实赛事、截止时间、官方来源和价值判断，放在同一个地方。': 'Real competitions, deadlines, official sources, and value judgments in one place.',
    '找适合我的比赛': 'Find the right competition',
    '热门：': 'Popular:',
    '真实机会': 'Real Opportunities',
    '只把可追溯来源的比赛放进库中': 'Only competitions with traceable sources enter the library',
    '价值判断': 'Value Assessment',
    '评级与置信度优先，未审核不冒充推荐': 'Ratings and evidence confidence come first; unreviewed listings are never presented as recommendations',
    '截止优先': 'Deadline First',
    '优先发现仍有行动时间的机会': 'Prioritize opportunities that still leave time to act',
    '透明排序': 'Transparent Ranking',
    '推荐规则公开且推广不影响排名': 'Ranking rules are public and promotion never changes the order',
    '优先查看的比赛': 'Competitions to Review First',
    '按赛事评级、证据置信度、资格限制和截止时间排序。': 'Ranked by competition rating, evidence confidence, eligibility limits, and deadline.',
    '查看完整比赛库': 'View the Full Library',
    '查看本周截止': 'See Closing This Week',

    '真实比赛库': 'Verified Competition Library',
    '本周截止的比赛': 'Competitions Closing This Week',
    '长期开放的练习赛': 'Always-Open Practice Challenges',
    '可复现的历史赛题': 'Reproducible Past Challenges',
    '找到现在值得参加的比赛': 'Find a Competition Worth Entering Now',
    '已审核赛事展示价值判断和资格风险；未完成审核的赛事继续标记 U。': 'Reviewed competitions include value judgments and eligibility risks; unreviewed listings remain marked U.',
    '筛选条件': 'Filters',
    '清除': 'Clear',
    '地区': 'Region',
    '国内与国际': 'All Regions',
    '国内': 'China',
    '国际': 'International',
    '比赛状态': 'Status',
    '全部状态': 'All Statuses',
    '进行中': 'Open',
    '即将截止': 'Closing Soon',
    '未开始': 'Upcoming',
    '已结束': 'Ended',
    '待核验': 'Unverified',
    '全部赛道': 'All Tracks',
    '赛道': 'Track',
    '参赛形式': 'Entry Type',
    '不限': 'Any',
    '个人': 'Individual',
    '团队': 'Team',
    '个人/团队': 'Individual / Team',
    '难度': 'Difficulty',
    '入门': 'Beginner',
    '进阶': 'Intermediate',
    '专家': 'Advanced',
    '奖金': 'Prize',
    '有奖金/权益': 'Prize / Benefits',
    '无现金奖金': 'No Cash Prize',
    '形式': 'Format',
    '线上': 'Online',
    '线下': 'On-site',
    '线上+线下': 'Hybrid',
    '排序': 'Sort',
    '推荐（规则排序）': 'Recommended (rule-based)',
    '截止时间': 'Deadline',
    '最近核验': 'Recently Verified',
    '比赛名称': 'Competition Name',
    '按透明推荐规则排序': 'Sorted by transparent recommendation rules',
    '按截止时间排序': 'Sorted by deadline',
    '按最近核验排序': 'Sorted by latest verification',
    '按名称排序': 'Sorted by name',
    '没有找到符合条件的比赛': 'No competitions match these filters',
    '试试清除筛选条件，或搜索更宽泛的关键词。': 'Clear some filters or try a broader search.',
    '清除全部筛选': 'Clear All Filters',
    '查看详情': 'View Details',
    '收藏比赛': 'Save Competition',
    '已收藏': 'Saved',
    '主办方待核验': 'Organizer Unverified',
    '已完成赛事级审核': 'Full Review Complete',
    '公开来源': 'Public Source',
    '长期开放': 'Always Open',
    '可持续练习': 'Practice Anytime',
    '已截止': 'Closed',
    '资格受限': 'Eligibility Restricted',
    '报名关闭': 'Registration Closed',
    '已审核': 'Reviewed',
    '赛事级审核': 'Full Competition Review',
    '基础收录': 'Basic Listing',

    '比赛概览': 'Competition Overview',
    '赛事价值判断': 'Competition Value Assessment',
    '该赛事尚未完成赛事级深度审核，目前只确认公开入口和基础信息，不代表高含金量推荐。': 'This competition has not completed a full review. Only its public entry point and basic information are confirmed, so it is not presented as a high-value recommendation.',
    '权威性': 'Authority',
    '主办方与赛事体系': 'Organizer and competition ecosystem',
    '履历价值': 'Resume Value',
    '简历与升学辨识度': 'Recognition for resumes and further study',
    '成长价值': 'Learning Value',
    '技术、产品与作品积累': 'Technical, product, and portfolio growth',
    '参赛前确认': 'Before You Enter',
    '报名资格': 'Eligibility',
    '费用': 'Fee',
    '截止时区': 'Deadline Time Zone',
    '当前入口': 'Current Entry Status',
    '需要特别注意': 'Important Risks',
    '核验依据': 'Verification Evidence',
    '以下链接用于支撑本站的赛事级判断；报名仍以主办方最终规则为准。': 'These links support our competition-level assessment. Registration still follows the organizer’s final rules.',
    '适合谁参加': 'Who Should Enter',
    '关键信息': 'Key Information',
    '举办形式': 'Delivery Format',
    '奖金/权益': 'Prize / Benefits',
    '赛事等级': 'Competition Grade',
    '证据置信度': 'Evidence Confidence',
    '信息状态': 'Information Status',
    '评级是赛事质量判断，不代表每个人都适合参加。': 'The rating evaluates competition quality; it does not mean the competition fits everyone.',
    '商业推广不影响排名。': 'Commercial promotion never changes ranking.',
    '查看官方页面': 'Open Official Page',
    '开放状态': 'Availability',
    '长期': 'Always',
    '开放': 'Open',
    '结束时间': 'End Date',
    '距离截止': 'Time Left',
    '天': 'days',
    '页面没有连接上': 'Page Not Found',
    '这个页面尚未开放，或地址已经发生变化。': 'This page is not available yet, or its address has changed.',
    '回到首页': 'Back to Home',

    '我的参赛': 'My Competitions',
    '返回比赛详情': 'Back to Competition Details',
    '创建我的参赛计划': 'Create My Competition Plan',
    '系统会根据现有参赛路线生成任务；没有路线时会创建一套通用执行清单。数据只保存在当前浏览器。': 'The system creates tasks from the available playbook, or a general execution checklist when no playbook exists. Data stays in this browser.',
    '没有找到这场比赛': 'Competition Not Found',
    '赛事可能已被移除或地址发生变化。': 'The competition may have been removed or its address may have changed.',
    '返回我的参赛': 'Back to My Competitions',
    '把比赛从“收藏”变成每天可以推进的任务。当前版本仅保存在这台设备的浏览器中。': 'Turn a saved competition into tasks you can advance every day. This version stores data only in this browser.',
    '整体进度': 'Overall Progress',
    '执行任务': 'Execution Tasks',
    '完成一项，进度就会自动更新': 'Complete a task and progress updates automatically',
    '增加一个自己的任务……': 'Add your own task…',
    '新增任务': 'Add task',
    '添加任务': 'Add Task',
    '我的备注': 'My Notes',
    '记录选题、队友、技术路线、卡点或下一步……': 'Record your idea, teammates, technical route, blockers, or next step…',
    '保存备注': 'Save Notes',
    '备注仅保存在当前浏览器': 'Notes stay in this browser',
    '查看官方规则': 'View Official Rules',
    '查看完整参赛路线': 'View Full Playbook',
    '删除本地计划': 'Delete Local Plan',
    '还没有参赛计划': 'No Competition Plans Yet',
    '这里会集中显示你真正决定投入的比赛，而不是所有收藏。': 'This page shows the competitions you have actually decided to pursue, not every saved listing.',
    '从一场比赛的详情页点击“加入我的参赛”，系统会生成可勾选的执行清单。': 'Open a competition and choose “Add to My Competitions” to generate a checkable execution list.',
    '找一场值得参加的比赛': 'Find a Competition Worth Entering',
    '继续推进 →': 'Continue →',
    '参赛确认': 'Entry Check',
    '范围定义': 'Scope Definition',
    '最小验证': 'Minimum Validation',
    '真实测试': 'Real-User Testing',
    '提交准备': 'Submission Prep',
    '提交前检查': 'Pre-Submission Check',
    '自定义任务': 'Custom Tasks',
    '其他任务': 'Other Tasks',
    '打开官方规则，核对报名截止、最终提交时间和时区': 'Open the official rules and verify registration, final submission time, and time zone',
    '确认身份资格、团队人数、费用和必须使用的技术栈': 'Confirm eligibility, team size, fees, and required technology stack',
    '写清唯一目标、评分标准和最终提交物': 'Define one clear goal, the judging criteria, and final deliverables',
    '在 48 小时内完成一条可运行的核心流程': 'Complete one working core flow within 48 hours',
    '找至少 3 名目标用户或同学完成测试并记录问题': 'Test with at least three target users or classmates and record the issues',
    '整理演示视频、项目说明、代码或作品链接': 'Prepare the demo video, project description, code, and project links',
    '在截止前至少 6 小时完成最终提交和链接复查': 'Finish final submission and verify every link at least six hours before the deadline',
    '赛事信息已移除': 'Competition Information Removed',
    '赛事已结束': 'Competition Ended',
    '截止时间待确认': 'Deadline Unconfirmed',
    '今天截止': 'Closes Today',
    '截止时间仍需在官方页面确认。': 'Confirm the deadline on the official page.',

    '加入我的参赛': 'Add to My Competitions',
    '打开我的参赛': 'Open My Competition Plan',
    '已加入我的参赛': 'Added to My Competitions',

    '今天先完成一个真实动作': 'Complete One Real Action Today',
    '不要先整理全部计划。用十分钟确认规则、锁定截止时间，再勾掉第一项任务。': 'Do not organize the entire plan first. Spend ten minutes confirming the rules, locking the deadline, and completing the first task.',
    '10 分钟': '10 min',
    '核对官方规则': 'Check Official Rules',
    '先确认资格、截止时间和提交要求': 'Confirm eligibility, deadlines, and submission requirements first',
    '官方规则待补充': 'Official Rules Unavailable',
    '当前赛事暂无可用官方链接': 'No official link is currently available for this competition',
    '开始第一项任务': 'Start the First Task',
    '定位到清单里最先需要完成的动作': 'Jump to the first action in the checklist',
    '锁定截止时间': 'Lock the Deadline',
    '下载日历文件，避免错过提交': 'Download a calendar file to avoid missing submission',
    '当前截止时间不可生成提醒': 'A reminder cannot be generated for this deadline',
    '任务内容和备注只保存在当前浏览器；统计只记录预定义行为和公开赛事 ID。': 'Task content and notes stay in this browser. Analytics records only predefined actions and public competition IDs.',
    '你已经真正启动这场比赛': 'You Have Officially Started This Competition',
    '第一项执行动作已经完成。接下来只推进一个最小步骤，不需要一次把整个计划做完。': 'The first execution action is complete. Move only one small step forward next; you do not need to finish the whole plan at once.',
    '第一项执行动作已经完成。保持当前节奏，接下来只推进一个最小步骤。': 'The first execution action is complete. Keep the momentum and move one small step forward.',
    '已启动': 'Started',
    '继续下一项任务': 'Continue to the Next Task',
    '全部任务已完成': 'All Tasks Complete',
    '当前任务已划掉，点击定位下一项未完成动作': 'This task is complete. Click to jump to the next unfinished action',
    '这场比赛的本地任务清单已经全部完成': 'All local tasks for this competition are complete',
    '定位下一项任务 →': 'Find the Next Task →',
    '日历文件已生成': 'Calendar File Created',

    '导出备份': 'Export Backup',
    '导入备份': 'Import Backup',
    '下载截止提醒': 'Download Deadline Reminder',
    '截止提醒': 'Deadline Reminder',

    '关于 AI 赛场': 'About AI Competition Hub',
    'AI 赛场是面向大学生的竞赛决策与参赛执行平台。我们不只收集比赛入口，更希望帮助用户判断一场比赛是否值得投入，并把要求拆成可以执行的路线。': 'AI Competition Hub helps students decide which competitions deserve their time and turn requirements into an executable path.',
    '我们正在解决什么': 'The Problem We Are Solving',
    '比赛信息分散、截止时间容易错过、赛事含金量难判断，而普通聚合页面通常只告诉用户“有什么比赛”，很少回答“为什么值得参加”和“接下来怎么做”。': 'Competition information is fragmented, deadlines are easy to miss, and value is hard to judge. Most aggregators say what exists, but rarely explain why it is worth entering or what to do next.',
    '当前产品包含什么': 'What the Product Includes',
    '真实赛事库与截止时间筛选': 'A real competition library with deadline filters',
    '赛事级审核、证据置信度与风险提示': 'Competition-level reviews, evidence confidence, and risk flags',
    '国内与国际赛事分类': 'China and international competition categories',
    '可执行参赛路线与本地工作区': 'Executable playbooks and a local workspace',
    '首次行动引导、截止日历提醒和本地备份': 'First-action guidance, deadline calendar reminders, and local backup',
    '公开提交比赛、纠错与内测反馈入口': 'Public competition submission, correction, and beta feedback channels',
    '我们不会做什么': 'What We Will Not Do',
    '不会把付费推广包装成独立评级': 'We will not disguise paid promotion as an independent rating',
    '不会保证获奖、证书、保研或求职结果': 'We do not guarantee awards, certificates, admissions, or job outcomes',
    '不会用聚合页单独证明赛事权威性': 'We do not use aggregator pages alone as proof of authority',
    '不会在未核验时把比赛标成高价值推荐': 'We do not label unverified competitions as high-value recommendations',
    '当前阶段': 'Current Stage',
    '这是 Activation Beta v0.7。当前重点是验证用户是否能从发现比赛走到创建参赛计划并完成第一个真实动作，而不是继续堆叠功能。欢迎通过“参与内测与反馈”页面提交具体问题和官方证据。': 'This is Activation Beta v0.7. The current goal is to verify whether users can move from discovery to creating a plan and completing a first real action, rather than adding more features.',

    '这里说明比赛数据从哪里来、如何审核、什么时候可能出错，以及推荐排序不代表什么。': 'This page explains where competition data comes from, how it is reviewed, where errors may occur, and what recommendation ranking does not mean.',
    '数据来源': 'Data Sources',
    '赛事信息主要来自主办方官网、正式组委会页面、专业赛事承载平台及公开规则。聚合平台只用于发现线索，不能单独作为高等级评级证据。': 'Competition information primarily comes from organizer websites, official committee pages, professional competition platforms, and public rules. Aggregators are used only for discovery and cannot independently support a high rating.',
    '赛事审核': 'Competition Review',
    '未完成赛事级审核的记录显示 U · 待核验': 'Listings without a full review display U · Unverified',
    '已审核赛事补充主办方、资格、费用、时区、证据链接和风险': 'Reviewed competitions include organizer, eligibility, fees, time zone, evidence links, and risks',
    '权威性、履历价值和成长价值分别判断': 'Authority, resume value, and learning value are assessed separately',
    '严重资格限制和风险会覆盖普通推荐分数': 'Severe eligibility limits and risks override ordinary recommendation scores',
    '更新时间与错误': 'Updates and Errors',
    '比赛规则、截止时间、费用和资格可能被主办方临时调整。页面显示的“最近核验”不是实时保证，报名和提交前必须回到官方页面再次确认。发现错误时，可通过公开纠错表单提交官方证据。': 'Organizers may change rules, deadlines, fees, and eligibility. “Recently verified” is not a real-time guarantee. Always confirm on the official page before registering or submitting.',
    '推荐排序': 'Recommendation Ranking',
    '推荐排序考虑赛事等级、证据置信度、审核状态、信息完整度、行动时间和风险。它是透明规则排序，不是个性化录取预测，也不保证某场比赛适合所有用户。商业合作不得改变独立评级。': 'Ranking considers grade, evidence confidence, review status, information completeness, time to act, and risk. It is transparent rule-based ranking, not a personalized prediction.',
    '数据使用边界': 'Data Use Boundaries',
    '本站整理内容用于赛事发现、比较与学习，不替代主办方规则。赛事名称、商标、规则和原始资料归各自权利人所有。': 'Content is organized for discovery, comparison, and learning and never replaces organizer rules. Competition names, trademarks, rules, and original materials belong to their respective owners.',

    '当前 Beta 坚持最少收集原则：没有必要的数据，不主动收集。': 'The current Beta follows data minimization: data that is not necessary is not actively collected.',
    '本站前端当前保存什么': 'What the Front End Stores',
    '公开表单': 'Public Forms',
    '访问统计': 'Analytics',
    '账号与支付': 'Accounts and Payments',
    '托管服务': 'Hosting Services',
    '联系与删除': 'Contact and Deletion',

    'Beta 使用条款': 'Beta Terms of Use',
    '使用 AI 赛场即表示你理解：这是辅助决策工具，不是赛事主办方，也不是结果保证服务。': 'By using AI Competition Hub, you understand that it is a decision-support tool, not a competition organizer or outcome-guarantee service.',
    '信息性质': 'Nature of Information',
    '用户责任': 'User Responsibilities',
    '不作保证': 'No Guarantees',
    '第三方链接': 'Third-Party Links',
    '内容与品牌': 'Content and Brand',
    'Beta 变更': 'Beta Changes'
  }));

  const titleTranslations = new Map(Object.entries({
    'AI 赛场｜只参加真正值得的比赛': 'AI Competition Hub | Enter Competitions Worth Your Time',
    '关于 AI 赛场': 'About AI Competition Hub',
    '数据说明｜AI 赛场': 'Data Policy | AI Competition Hub',
    '隐私政策｜AI 赛场': 'Privacy Policy | AI Competition Hub',
    '使用条款｜AI 赛场': 'Terms of Use | AI Competition Hub'
  }));
  const reverseTitles = new Map([...titleTranslations.entries()].map(([zh, en]) => [en, zh]));

  const placeholderMap = new Map([
    ['搜索比赛、赛道、主办方…', 'Search competitions, tracks, organizers…'],
    ['搜索比赛…', 'Search competitions…'],
    ['搜索比赛、赛道或主办方……', 'Search competitions, tracks, or organizers…'],
    ['搜索比赛名称、赛道或主办方……', 'Search by competition, track, or organizer…'],
    ['增加一个自己的任务……', 'Add your own task…'],
    ['记录选题、队友、技术路线、卡点或下一步……', 'Record your idea, teammates, technical route, blockers, or next step…']
  ]);

  const textRecords = new WeakMap();
  const attributeRecords = new WeakMap();
  let language = resolveLanguage();
  let queued = false;

  function resolveLanguage() {
    const requested = new URLSearchParams(location.search).get(QUERY_KEY);
    if (requested === LANG_EN || requested === LANG_ZH) return requested;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === LANG_EN || stored === LANG_ZH) return stored;
    } catch {}
    return /^zh(?:-|$)/i.test(navigator.language || '') ? LANG_ZH : LANG_EN;
  }

  function formatEnglishDate(year, month, day) {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (Number.isNaN(date.getTime())) return `${year}-${month}-${day}`;
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function translatePattern(value) {
    let match = value.match(/^还剩\s*(\d+)\s*天$/);
    if (match) return `${match[1]} ${match[1] === '1' ? 'day' : 'days'} left`;

    match = value.match(/^(\d+)\/(\d+)\s*项完成$/);
    if (match) return `${match[1]}/${match[2]} completed`;

    match = value.match(/^我的参赛\s+(\d+)$/);
    if (match) return `My Competitions ${match[1]}`;

    match = value.match(/^再显示\s+(\d+)\s+场$/);
    if (match) return `Show ${match[1]} More`;

    match = value.match(/^已显示\s+(\d+)\s*\/\s*(\d+)$/);
    if (match) return `Showing ${match[1]} / ${match[2]}`;

    match = value.match(/^证据\s+(\d+)$/);
    if (match) return `Evidence ${match[1]}`;

    match = value.match(/^阶段\s+(\d+)$/);
    if (match) return `Stage ${match[1]}`;

    match = value.match(/^更新于\s+(.+)$/);
    if (match) return `Updated ${translatePattern(match[1])}`;

    match = value.match(/^最近更新\s+(.+)$/);
    if (match) return `Last updated ${translatePattern(match[1])}`;

    match = value.match(/^官方截止：\s*(.+)$/);
    if (match) return `Official deadline: ${translatePattern(match[1])}`;

    match = value.match(/^已收录\s+(\d+)\s+场真实赛事，其中\s+(\d+)\s+场完成赛事级审核。具体规则以主办方公告为准。$/);
    if (match) return `${match[1]} real competitions listed, including ${match[2]} with full reviews. Official organizer rules take priority.`;

    match = value.match(/^(\d+)\s+场赛事\s+·\s+(\d+)\s+场深度审核\s+·\s+最近核验\s+(.+)$/);
    if (match) return `${match[1]} competitions · ${match[2]} full reviews · last verified ${translatePattern(match[3])}`;

    match = value.match(/^(\d+)\s+场当前机会\s+·\s+Commercial Beta$/);
    if (match) return `${match[1]} open opportunities · Commercial Beta`;

    match = value.match(/^(\d+)\s+场正在管理的比赛。数据只保存在当前浏览器。$/);
    if (match) return `${match[1]} competitions in progress. Data stays in this browser.`;

    match = value.match(/^当前版本：(.+)\s+·\s+生效日期\s+(.+)$/);
    if (match) return `Current version: ${match[1]} · Effective ${translatePattern(match[2])}`;

    match = value.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    if (match) return formatEnglishDate(match[1], match[2], match[3]);

    match = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (match) return formatEnglishDate(match[1], match[2], match[3]);

    match = value.match(/^为“(.+)”创建参赛计划$/);
    if (match) return `Create a Competition Plan for “${match[1]}”`;

    return value;
  }

  function translateValue(value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return value;
    const translated = exact.get(trimmed) || translatePattern(trimmed);
    if (translated === trimmed) return value;
    const leading = String(value).match(/^\s*/)?.[0] || '';
    const trailing = String(value).match(/\s*$/)?.[0] || '';
    return `${leading}${translated}${trailing}`;
  }

  function shouldSkip(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest('[data-language-switch]')) return true;
    return Boolean(parent.closest('script, style, textarea, [contenteditable="true"]'));
  }

  function processTextNode(node) {
    if (shouldSkip(node)) return;
    const current = node.nodeValue || '';
    let record = textRecords.get(node);
    if (!record) {
      record = { source: current, rendered: current };
      textRecords.set(node, record);
    } else if (current !== record.rendered && current !== record.source) {
      record.source = current;
    }
    const next = language === LANG_EN ? translateValue(record.source) : record.source;
    record.rendered = next;
    if (current !== next) node.nodeValue = next;
  }

  function processAttributes(element) {
    if (element.matches('[data-language-switch]')) return;
    let records = attributeRecords.get(element);
    if (!records) {
      records = new Map();
      attributeRecords.set(element, records);
    }
    for (const name of ['placeholder', 'aria-label', 'title']) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name) || '';
      let record = records.get(name);
      if (!record) {
        record = { source: current, rendered: current };
        records.set(name, record);
      } else if (current !== record.rendered && current !== record.source) {
        record.source = current;
      }
      const next = language === LANG_EN
        ? (placeholderMap.get(record.source) || exact.get(record.source) || translatePattern(record.source))
        : record.source;
      record.rendered = next;
      if (current !== next) element.setAttribute(name, next);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) processAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
      else processAttributes(node);
      node = walker.nextNode();
    }
  }

  function switchMarkup(compact = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = compact ? 'language-switch language-switch-mobile' : 'language-switch';
    button.dataset.languageSwitch = '';
    button.addEventListener('click', () => setLanguage(language === LANG_EN ? LANG_ZH : LANG_EN));
    return button;
  }

  function updateSwitch(button) {
    const show = language === LANG_EN ? '中文' : 'EN';
    button.textContent = show;
    button.setAttribute('aria-label', language === LANG_EN ? '切换为中文' : 'Switch to English');
    button.setAttribute('title', language === LANG_EN ? '切换为中文' : 'Switch to English');
  }

  function injectSwitches() {
    const actions = document.querySelector('.header-actions');
    if (actions && !actions.querySelector('[data-language-switch]')) {
      const button = switchMarkup(false);
      const menu = actions.querySelector('[data-menu]');
      actions.insertBefore(button, menu || actions.firstChild);
    }

    const mobile = document.querySelector('[data-mobile-menu]');
    if (mobile && !mobile.querySelector('[data-language-switch]')) {
      mobile.insertBefore(switchMarkup(true), mobile.firstChild);
    }

    document.querySelectorAll('[data-language-switch]').forEach(updateSwitch);
  }

  function updateUrl() {
    const url = new URL(location.href);
    if (language === LANG_EN) url.searchParams.set(QUERY_KEY, LANG_EN);
    else url.searchParams.delete(QUERY_KEY);
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function applyMetadata() {
    document.documentElement.lang = language === LANG_EN ? 'en' : 'zh-CN';
    if (language === LANG_EN) {
      document.title = titleTranslations.get(document.title) || document.title.replaceAll('AI 赛场', 'AI Competition Hub');
    } else {
      document.title = reverseTitles.get(document.title) || document.title.replaceAll('AI Competition Hub', 'AI 赛场');
    }

    const descriptions = {
      zh: 'AI 赛场帮助大学生找到真正值得参加的比赛，查看截止时间、官方来源、赛事价值和可执行参赛路线。',
      en: 'AI Competition Hub helps students find competitions worth entering, verify deadlines and official sources, assess value, and start an executable plan.'
    };
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', descriptions[language]);

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', language === LANG_EN ? 'en_US' : 'zh_CN');
  }

  function apply() {
    queued = false;
    injectSwitches();
    walk(document.body);
    applyMetadata();
    updateUrl();
    document.documentElement.dataset.language = language;
  }

  function scheduleApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function setLanguage(next) {
    if (next !== LANG_EN && next !== LANG_ZH) return;
    language = next;
    try { localStorage.setItem(STORAGE_KEY, language); } catch {}
    updateUrl();
    apply();
    window.dispatchEvent(new CustomEvent('ai-language-change', { detail: { language } }));
  }

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });

  window.AI_LANGUAGE = Object.freeze({
    get: () => language,
    set: setLanguage,
    apply
  });

  window.addEventListener('DOMContentLoaded', scheduleApply);
  window.addEventListener('hashchange', scheduleApply);
  window.addEventListener('popstate', () => {
    const requested = new URLSearchParams(location.search).get(QUERY_KEY);
    if (requested === LANG_EN || requested === LANG_ZH) language = requested;
    scheduleApply();
  });
  scheduleApply();
})();