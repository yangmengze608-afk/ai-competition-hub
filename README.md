# AI Competition Hub · AI 赛场

> 帮大学生找到真正值得参加的比赛，并把比赛要求变成可执行的参赛路线。

## 当前版本

项目正在推进 **Commercial Beta v0.5**。

当前公开能力：

- 156 场真实赛事入口
- 当前机会、长期练习、历史赛题分区
- 关键词、赛道、状态、难度、奖金和举办形式筛选
- 全量排序后分页，每次最多展示 24 场
- 赛事详情、官方来源、最近核验时间和本地收藏
- 143 个国内外赛事来源入口
- S / A / B / C / U / R 赛事评级说明
- GitHub Pages 自动部署与发布前数据检查

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
├── commercial-app.js                 # Commercial Beta 核心页面与交互
├── commercial-beta.css               # Commercial Beta 样式
├── data.js                            # 基础资源与兼容数据
├── data/competitions-v1.json          # 唯一真实赛事数据源
├── competition-data.generated.js     # 从 JSON 生成的浏览器运行文件
├── data/competition-sources-v1.json   # 赛事来源库
├── research-pages.js                  # 来源与评级说明页面
├── scripts/generate-competition-data.cjs
├── scripts/data-audit.cjs
├── scripts/smoke-test.cjs
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

`main` 分支通过 GitHub Actions 自动发布至 GitHub Pages。每次发布前会依次执行：

1. JavaScript 语法检查
2. 统一赛事数据一致性检查
3. 赛事数据质量审计
4. 商业版页面烟雾测试

## 数据原则

- 聚合平台只用于发现，重要结论必须回溯主办方或官方赛事页面。
- 未完成赛事级审核的记录默认标记为 `U · 待核验`。
- 付费推广不得影响赛事评级。
- 报名、资格、费用、时间和奖励最终以主办方公告为准。

## 当前开发重点

详见 [Commercial Beta Issue #6](https://github.com/yangmengze608-afk/ai-competition-hub/issues/6)：

- 补充国内 / 国际筛选与推荐排序
- 完成首批赛事级核验和评级
- 制作 10 条完整参赛路线
- 增加内测、赛事提交和纠错入口
- 完成分享、SEO、统计和自定义域名准备
