# AI Competition Hub · AI 赛场

> 帮大学生找到真正值得参加的比赛，并把比赛要求变成可执行的参赛路线。

## 当前版本

项目正在推进 **Activation Beta v0.7**。

这一阶段不再以“增加功能数量”为目标，而是验证真实用户能否完成：

```text
发现比赛 → 判断价值 → 创建参赛计划 → 完成第一个真实动作
```

当前公开能力：

- 156 场真实赛事入口，50 场完成赛事级审核
- 当前机会、长期练习、历史赛题分区
- 关键词、赛道、状态、难度、奖金和举办形式筛选
- 规则透明的推荐排序与赛事决策面板
- 10 条完整参赛路线
- 本地“我的参赛”工作区、任务清单和备注
- 截止日历提醒与工作区 JSON 备份恢复
- 10 分钟首次行动引导
- 隐私友好的激活漏斗统计
- GitHub Pages 自动部署与桌面、手机浏览器验证

## Activation Beta 北极星指标

**每周有效启动参赛人数**

同一公开赛事 ID 需要出现以下路径：

1. 用户查看赛事详情；
2. 创建本地参赛工作区；
3. 完成第一项任务，或下载截止日历提醒。

完整定义、隐私边界和首轮 20–30 人测试方案见：

```text
docs/activation-beta-v0.7.md
```

## 数据架构

真实赛事的唯一数据源是：

```text
data/competitions-v1.json
```

浏览器运行文件 `competition-data.generated.js` 由该 JSON 自动生成，不允许手工维护。

更新赛事数据后执行：

```bash
node scripts/generate-competition-data.cjs
node scripts/data-audit.cjs
node scripts/smoke-test.cjs
```

GitHub Actions 会验证生成文件是否与 JSON 完全一致，并阻止重复 ID、无效日期、无效链接或运行测试失败的版本上线。

## 主要文件

```text
ai-competition-hub/
├── index.html
├── commercial-app-v3.js                 # 核心页面与交互
├── home-decision-v2.js                  # 首页下层决策体验
├── participation-workspace-v1.js        # 本地参赛工作区
├── activation-guide-v1.js               # 首次行动引导与激活事件
├── deadline-calendar-v1.js              # 通用截止日历提醒
├── workspace-backup-v1.js               # 本地备份与恢复
├── analytics-v1.js                      # 隐私友好统计适配器
├── data/competitions-v1.json            # 唯一真实赛事数据源
├── competition-data.generated.js        # 从 JSON 生成的浏览器运行文件
├── data/playbooks-v1.json               # 参赛路线数据
├── docs/activation-beta-v0.7.md          # 激活指标与用户测试方案
├── scripts/activation-audit.cjs          # 激活与隐私静态审计
└── .github/workflows/pages.yml
```

## 本地运行

先确保运行文件与 JSON 同步：

```bash
node scripts/generate-competition-data.cjs
python3 -m http.server 4173
```

然后打开 `http://localhost:4173`。

## 部署

`main` 分支通过 GitHub Actions 自动发布至 GitHub Pages。每次发布前会执行：

1. JavaScript 语法和数据一致性检查；
2. 赛事、路线、工作区、备份和日历审计；
3. 激活漏斗与隐私边界审计；
4. SEO、公开信任页面和转换入口检查；
5. 桌面 Chromium 与 Pixel 7 手机视口测试。

## 数据与隐私原则

- 聚合平台只用于发现，重要结论必须回溯主办方或官方赛事页面。
- 未完成赛事级审核的记录默认标记为 `U · 待核验`。
- 付费推广不得影响赛事评级。
- 报名、资格、费用、时间和奖励最终以主办方公告为准。
- 本地任务、备注和备份不会上传到本站数据库。
- 激活统计只允许预定义事件与公开赛事 ID，不发送搜索词、任务内容、任务数量、进度、备注或表单文本。

## 当前开发重点

- 让用户在进入工作区后完成第一个真实动作；
- 测量从赛事详情到创建计划、完成首项任务和日历提醒的漏斗；
- 邀请 20–30 名目标大学生完成无引导测试；
- 根据最大流失点决定下一阶段是强化赛事供给、信任证据还是执行协作。
