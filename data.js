const iso = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
};

window.AI_DATA = {
  tracks: ['AI Agent','AI 编程','AI 视频与短剧','AI 绘画与设计','具身智能与机器人','数据科学','创新创业','AI 教育','人机交互','大模型应用','网络安全','科研与学术'],
  hotTags: ['AI Agent','AI 视频','大学生','个人参赛','奖金赛事','具身智能'],
  competitions: [
    {id:'agent-arena-2026',title:'开源 Agent 应用挑战赛 2026',organizer:'示例开源社区（演示数据）',track:'AI Agent',status:'closing',deadline:iso(6),format:'个人/团队',difficulty:'进阶',hasPrize:true,prizeNote:'总奖池 50 万元 + 云资源券',mode:'线上',audience:'开发者、AI 工程师、创业团队',summary:'面向真实工作流的开源 Agent 应用赛道，鼓励可复用、可评测的作品。',description:'聚焦生产可用的 Agent 应用，评审关注真实任务完成率、工具使用鲁棒性与可复现性。作品需开源核心模块并附评测集。',tags:['AI Agent','开源','奖金赛事'],hasPlaybook:true,updatedAt:iso(-2)},
    {id:'ai-shortdrama-cup',title:'AI 短剧创作大赛 · 春季',organizer:'示例创作者联盟（演示数据）',track:'AI 视频与短剧',status:'ongoing',deadline:iso(28),format:'个人/团队',difficulty:'入门',hasPrize:true,prizeNote:'现金奖金 + 平台流量扶持',mode:'线上',audience:'视频创作者、学生、独立制作人',summary:'3–8 分钟 AI 短剧作品征集，鼓励原创剧本与工作流公开。',description:'参赛者提交 AI 辅助创作的短剧作品，包含剧本大纲、镜头脚本、生成流程与最终视频。评审关注叙事完整度与视听质量。',tags:['AI 视频','个人参赛','零基础友好'],hasPlaybook:true,updatedAt:iso(-1)},
    {id:'campus-innovation-2026',title:'全国大学生 AI 创新创业挑战（示例）',organizer:'示例高校联合组委会（演示数据）',track:'创新创业',status:'ongoing',deadline:iso(45),format:'团队',difficulty:'进阶',hasPrize:true,prizeNote:'最高 30 万种子基金 + 孵化名额',mode:'线上+线下',audience:'在校本科生、研究生团队',summary:'从创意到最小可行产品，覆盖立项、答辩与路演的完整赛程。',description:'面向高校学生的 AI 创新创业赛，分为初赛线上作品提交、复赛线下路演、决赛答辩三阶段。',tags:['大学生','创新创业','答辩'],hasPlaybook:true,updatedAt:iso(-5)},
    {id:'codex-programming-open',title:'AI 编程公开赛：全栈应用挑战',organizer:'示例开发者大会（演示数据）',track:'AI 编程',status:'closing',deadline:iso(3),format:'个人',difficulty:'进阶',hasPrize:true,prizeNote:'现金奖金 + 顶会门票',mode:'线上',audience:'全栈开发者、AI 工程师',summary:'72 小时内独立完成一个 AI 全栈应用，评审关注完成度与工程质量。',description:'限时 72 小时的个人编程赛，需交付可部署应用、演示视频与提示词/工作流记录。',tags:['AI 编程','个人参赛','限时挑战'],hasPlaybook:true,updatedAt:iso(-1)},
    {id:'embodied-robotics-league',title:'具身智能机器人联赛（演示）',organizer:'示例机器人研究院（演示数据）',track:'具身智能与机器人',status:'upcoming',deadline:iso(70),format:'团队',difficulty:'专家',hasPrize:true,prizeNote:'总奖池 100 万元',mode:'线下',audience:'机器人实验室、创业团队',summary:'面向家庭场景的具身操作与移动任务比赛，含仿真赛与实机赛。',description:'参赛队伍在统一硬件平台上完成清洁、整理、开门等家庭任务，仿真赛为初筛，实机赛决胜。',tags:['具身智能','机器人','团队'],hasPlaybook:false,updatedAt:iso(-1)},
    {id:'data-science-marathon',title:'行业数据科学马拉松',organizer:'示例数据平台（演示数据）',track:'数据科学',status:'ongoing',deadline:iso(21),format:'个人/团队',difficulty:'进阶',hasPrize:true,prizeNote:'奖金 + 面试直通',mode:'线上',audience:'数据科学家、算法工程师、学生',summary:'真实脱敏数据集上的建模比赛，关注可解释性与泛化能力。',description:'提供多个行业脱敏数据集，参赛者提交模型与报告，评审综合测试集分数与方案文档。',tags:['数据科学','奖金赛事'],hasPlaybook:true,updatedAt:iso(-3)},
    {id:'aiart-illustration-award',title:'AI 绘画与插画年度奖（示例）',organizer:'示例设计社区（演示数据）',track:'AI 绘画与设计',status:'ongoing',deadline:iso(35),format:'个人',difficulty:'入门',hasPrize:true,prizeNote:'奖金 + 画册出版',mode:'线上',audience:'插画师、设计师、爱好者',summary:'面向个人创作者的 AI 辅助插画征集，注重原创性与系列完整度。',description:'作者需提交 5–10 张成系列作品，附创作说明与提示词工作流。',tags:['AI 绘画','个人参赛','零基础友好'],hasPlaybook:true,updatedAt:iso(-2)},
    {id:'llm-application-hackathon',title:'大模型应用黑客松（演示）',organizer:'示例云厂商（演示数据）',track:'大模型应用',status:'updated',deadline:iso(14),format:'团队',difficulty:'进阶',hasPrize:true,prizeNote:'云资源券 + 现金',mode:'线上+线下',audience:'开发者团队、创业公司',summary:'48 小时打造面向真实场景的大模型应用，含现场答辩。',description:'分为教育、办公、医疗、金融四个方向命题，参赛队现场组队与开发。',tags:['大模型应用','黑客松'],hasPlaybook:true,updatedAt:iso(0)},
    {id:'ai-education-challenge',title:'AI 教育产品创新赛（示例）',organizer:'示例教育基金（演示数据）',track:'AI 教育',status:'upcoming',deadline:iso(60),format:'个人/团队',difficulty:'入门',hasPrize:true,prizeNote:'落地试点 + 奖金',mode:'线上',audience:'教师、学生、教育创业者',summary:'征集面向 K12 与高等教育的 AI 学习工具原型。',description:'参赛作品需提交产品原型、用户研究与试用数据，优胜方案有机会进入合作学校试点。',tags:['AI 教育','零基础友好'],hasPlaybook:false,updatedAt:iso(-1)},
    {id:'hci-interaction-prize',title:'人机交互创新奖（演示）',organizer:'示例学术会议（演示数据）',track:'人机交互',status:'ongoing',deadline:iso(40),format:'个人/团队',difficulty:'进阶',hasPrize:false,prizeNote:'无现金奖金，含论文推荐',mode:'线下',audience:'研究者、设计师、开发者',summary:'面向新型人机交互形态的作品与论文征集。',description:'接受可交互原型与短论文，评审侧重创新性与用户价值。',tags:['人机交互','学术'],hasPlaybook:false,updatedAt:iso(-4)},
    {id:'security-ctf-invite',title:'AI 安全 CTF 邀请赛（示例）',organizer:'示例安全实验室（演示数据）',track:'网络安全',status:'closing',deadline:iso(9),format:'团队',difficulty:'专家',hasPrize:true,prizeNote:'奖金 + 顶会资格',mode:'线上',audience:'安全研究团队',summary:'面向大模型与 Agent 系统的红蓝对抗 CTF。',description:'题目涵盖 Prompt 注入、越权工具调用、供应链攻击等 AI 安全新型威胁。',tags:['网络安全','AI Agent'],hasPlaybook:false,updatedAt:iso(-2)},
    {id:'research-paper-award',title:'青年学者 AI 科研奖（演示）',organizer:'示例学会（演示数据）',track:'科研与学术',status:'upcoming',deadline:iso(90),format:'个人',difficulty:'专家',hasPrize:true,prizeNote:'奖金 + 学术支持',mode:'线上',audience:'在读硕博、青年研究者',summary:'面向青年研究者的 AI 前沿论文奖，鼓励原创方向。',description:'参赛者提交近一年发表或预印本论文，评审关注方法创新与影响潜力。',tags:['科研','个人参赛'],hasPlaybook:false,updatedAt:iso(-1)},
    {id:'solo-agent-builder',title:'一个人搭建 Agent 挑战（演示）',organizer:'AI 赛场社区（演示数据）',track:'AI Agent',status:'ongoing',deadline:iso(18),format:'个人',difficulty:'入门',hasPrize:true,prizeNote:'小额奖金 + 精选推荐',mode:'线上',audience:'个人开发者、学生',summary:'限个人参赛，围绕一个日常场景交付可用 Agent。',description:'面向个人的入门友好赛，作品需附一段 2 分钟演示视频与完整搭建说明。',tags:['AI Agent','个人参赛','零基础友好'],hasPlaybook:true,updatedAt:iso(-1)}
  ],
  resourceLabels: {
    tools:{title:'AI 工具',singular:'工具',description:'按照比赛任务筛选真正需要的工具。'},
    prompts:{title:'提示词',singular:'提示词',description:'覆盖选题、剧本、代码、答辩和 Agent 节点。'},
    skills:{title:'Skills',singular:'Skill',description:'适配 Codex、Claude、Trae 等平台的技能模板。'},
    agents:{title:'Agent 手册',singular:'Agent 手册',description:'从零搭建能够辅助参赛的 Agent 与工作流。'},
    workflows:{title:'参赛工作流',singular:'工作流',description:'从报名、制作到提交的完整执行路径。'}
  },
  resources: [
    {id:'tool-agent-runner',kind:'tools',title:'通用 Agent 运行器（示例）',summary:'支持工具调用、任务分解与结果评测的本地 Agent 运行框架。',description:'提供任务日志、工具沙盒与评测集接入，适合参赛作品的可复现搭建。',tags:['Agent','开源'],tracks:['AI Agent','大模型应用'],meta:'本地运行'},
    {id:'tool-video-pipeline',kind:'tools',title:'AI 短剧生产流水线',summary:'剧本 → 分镜 → 生成 → 剪辑的一体化模板。',description:'串联文生图、图生视频、配音与字幕节点，支持导出参赛可复现工程。',tags:['视频','工作流'],tracks:['AI 视频与短剧'],meta:'零基础友好'},
    {id:'tool-data-lab',kind:'tools',title:'数据科学实验台',summary:'面向比赛数据集的清洗、特征工程与提交管理。',description:'内置交叉验证、提交历史比较与实验日志，适合数据比赛全流程。',tags:['数据','实验管理'],tracks:['数据科学'],meta:'进阶'},
    {id:'tool-eval-suite',kind:'tools',title:'作品可复现评测套件',summary:'为参赛作品生成评测报告与复现脚本。',description:'帮助你在提交前验证作品的稳定性、鲁棒性与可复现性。',tags:['评测'],tracks:['AI Agent','大模型应用','AI 编程'],meta:'提交前检查'},
    {id:'prompt-competition-brief',kind:'prompts',title:'比赛简报速读提示词',summary:'把冗长的比赛通知一键提炼成关键要点。',description:'输入比赛通知全文，输出核心时间线、赛道、评审标准与提交要求。',tags:['信息提炼'],tracks:['AI Agent','大模型应用'],meta:'可直接复制'},
    {id:'prompt-story-outline',kind:'prompts',title:'AI 短剧剧本大纲提示词',summary:'从一句话主题生成完整短剧大纲与镜头脚本。',description:'支持人物、冲突、节奏参数化，可直接对接生成式视频工作流。',tags:['剧本','视频'],tracks:['AI 视频与短剧'],meta:'变量模板'},
    {id:'prompt-code-review',kind:'prompts',title:'参赛代码审阅提示词',summary:'让模型像评委一样审阅你的参赛代码与文档。',description:'输出问题清单、改进建议与预计得分区间。',tags:['代码','评审视角'],tracks:['AI 编程','大模型应用'],meta:'评审模拟'},
    {id:'prompt-pitch-deck',kind:'prompts',title:'创业赛路演稿提示词',summary:'生成结构清晰、答辩友好的 10 分钟路演稿。',description:'覆盖问题、方案、市场、竞争、团队、商业化与提问预演。',tags:['路演','答辩'],tracks:['创新创业'],meta:'答辩模板'},
    {id:'skill-reproducible-submission',kind:'skills',title:'可复现参赛作品打包 Skill',summary:'一键生成复现脚本、环境说明与演示视频清单。',description:'将常见评审要求沉淀为可复用 Skill，减少收官阶段的重复劳动。',tags:['提交','复现'],tracks:['AI Agent','AI 编程','数据科学'],meta:'Codex / Claude'},
    {id:'skill-evidence-collector',kind:'skills',title:'作品证据收集 Skill',summary:'自动整理运行日志、测试截图与用户反馈。',description:'在开发过程中持续记录，答辩前一键导出结构化证据包。',tags:['答辩','证据'],tracks:['创新创业','大模型应用'],meta:'持续记录'},
    {id:'skill-storyboard',kind:'skills',title:'分镜脚本生成 Skill',summary:'把剧本大纲结构化为可直接生成视频的分镜表。',description:'输出统一格式的分镜 JSON，可作为视频流水线输入。',tags:['视频','分镜'],tracks:['AI 视频与短剧'],meta:'结构化输出'},
    {id:'agent-competition-scout',kind:'agents',title:'比赛信息侦察 Agent 手册',summary:'让 Agent 主动追踪你关心的比赛更新与截止提醒。',description:'包含数据源、去重策略、通知渠道与失败重试的完整搭建说明。',tags:['信息','监控'],tracks:['AI Agent'],meta:'入门到部署'},
    {id:'agent-submission-copilot',kind:'agents',title:'参赛作品提交副驾 Agent 手册',summary:'从材料校对到打包提交的端到端搭建教程。',description:'覆盖模板校验、附件清单、版本管理与提交前审查。',tags:['提交','副驾'],tracks:['AI Agent','AI 编程'],meta:'全流程'},
    {id:'agent-video-director',kind:'agents',title:'AI 短剧导演 Agent 手册',summary:'把导演思维沉淀为多角色协作的 Agent 编排。',description:'角色包含编剧、分镜、生成、后期与审校，附协作提示词模板。',tags:['视频','多 Agent'],tracks:['AI 视频与短剧'],meta:'多 Agent'},
    {id:'workflow-shortdrama-7d',kind:'workflows',title:'零基础 7 天完成 AI 短剧',summary:'从主题选择到成片提交的 7 天日程与检查清单。',description:'Day1 主题与角色；Day2 剧本；Day3 分镜；Day4 生成；Day5 配音与字幕；Day6 剪辑；Day7 复盘与提交。',tags:['短剧','零基础','7 天'],tracks:['AI 视频与短剧'],meta:'7 天 · 入门'},
    {id:'workflow-solo-agent',kind:'workflows',title:'一个人搭建参赛 Agent',summary:'个人开发者从选题到答辩的最小闭环。',description:'选题 → 场景细化 → 工具选型 → MVP → 评测 → 复现包 → 演示视频。',tags:['Agent','个人'],tracks:['AI Agent'],meta:'10 天 · 入门'},
    {id:'workflow-codex-programming',kind:'workflows',title:'用 AI 助手完成 AI 编程比赛',summary:'限时编程赛的高效协作模板。',description:'任务拆解 → 骨架生成 → 关键路径 → 测试与提交，含时间盒建议。',tags:['AI 编程','限时'],tracks:['AI 编程'],meta:'72 小时 · 进阶'},
    {id:'workflow-campus-startup',kind:'workflows',title:'大学生创新创业从 0 到答辩',summary:'适合校园团队的完整赛程管理模板。',description:'选题会 → 用研 → MVP → 数据 → 商业模式 → 答辩排练。',tags:['大学生','创新创业'],tracks:['创新创业'],meta:'30 天 · 进阶'}
  ]
};
