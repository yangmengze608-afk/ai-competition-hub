# AI Competition Hub · AI 赛场

> 从发现 AI 比赛，到完成作品 —— 一站式 AI 竞赛导航与参赛工具平台

## 产品定位

AI Competition Hub 是一个专注于 AI 竞赛领域的发现与工具平台，帮助参赛者：
- 快速发现适合自己的 AI 比赛
- 获取参赛所需的工具、提示词、Skills 和 Agent 手册
- 掌握从选题到提交的完整参赛工作流

## 当前功能（Phase 0 · 静态验收版）

- **动态首页**：纯白背景 + 动态知识脉络，比赛名称以「淡入—停留—淡出」循环逐个呈现，悬停暂停，点击进入详情
- **比赛搜索**：中央搜索入口，支持关键词搜索比赛
- **比赛筛选**：按类别、状态、奖金等维度筛选
- **比赛收藏**：本地收藏感兴趣的比赛（localStorage）
- **比赛详情**：查看比赛介绍、时间、奖金、链接等信息
- **工具库**：参赛常用工具分类展示
- **提示词库**：高质量参赛提示词，支持一键复制
- **Skills 库**：AI Agent 可复用技能集合
- **Agent 手册**：AI Agent 使用与开发参考
- **工作流**：端到端参赛工作流指导
- **响应式设计**：适配手机、平板、桌面端
- **无障碍支持**：`prefers-reduced-motion` 减少动效
- **Hash 路由**：纯静态即可运行，刷新不 404

## 本地打开方法

### 方法一：直接打开（最简单）

直接双击 `index.html` 即可在浏览器中查看。

### 方法二：本地 HTTP 服务器（推荐）

在项目根目录运行：

```bash
# Python 3
python3 -m http.server 4173

# 或 Node.js
npx serve . -p 4173
```

然后打开浏览器访问 `http://localhost:4173`。

## 文件结构

```
ai-competition-hub/
├── index.html          # 入口 HTML
├── app.js              # 应用主逻辑（路由、渲染、交互）
├── data.js             # 演示数据（比赛、工具、提示词等）
├── styles.css          # 全局样式
├── vercel.json         # Vercel 部署配置（SPA rewrites）
├── .nojekyll           # 禁用 GitHub Pages Jekyll 处理
├── .gitignore          # Git 忽略规则
├── README.md           # 项目说明
└── ROADMAP.md          # 开发路线图
```

## 演示数据说明

⚠️ **重要**：当前版本（v0.1.0）中的所有比赛内容、工具信息、提示词示例等均为**演示数据**，用于展示产品交互和界面效果。

- 比赛名称、时间、奖金、链接等均为虚构或示例
- 不构成任何真实赛事推荐
- 后续 Phase 1 将接入真实比赛数据库

## 部署方式

### GitHub Pages（推荐）

项目已配置 GitHub Actions 自动部署。推送到 `main` 分支后会自动构建并发布到 GitHub Pages。

Workflow 文件位于 `.github/workflows/pages.yml`，使用官方 `actions/deploy-pages` 从仓库根目录发布静态文件。

如果使用 GitHub Pages：
- 由于项目使用 Hash 路由 (`#/search`, `#/competition/xxx` 等)，刷新页面天然支持，无需额外的 404 回退配置
- `.nojekyll` 文件确保 GitHub Pages 不跳过以下划线开头的文件

### Vercel

直接导入仓库到 Vercel 即可：
1. 在 Vercel 点击 "New Project"
2. 导入 GitHub 仓库
3. **Framework Preset** 选择 `Other`
4. **Build Command** 留空（无需构建）
5. **Output Directory** 留空或填 `.`
6. 部署完成

项目根目录的 `vercel.json` 已配置 SPA rewrites，所有路径回退到 `index.html`。

### Netlify / Cloudflare Pages

同样支持直接部署静态目录，无需构建命令。如需 SPA 路由支持：
- Netlify：创建 `_redirects` 文件写入 `/* /index.html 200`
- Cloudflare Pages：在设置中配置所有路径回退到 `index.html`

## 后续开发方向

详见 [ROADMAP.md](./ROADMAP.md)，主要阶段：

- **Phase 0**（当前）：静态原型验收版 ✅
- **Phase 1**：真实比赛数据库、来源追踪、定时更新、后台录入
- **Phase 2**：用户登录、收藏云同步、个性化推荐
- **Phase 3**：工具、提示词、Skills、Agent 手册完整内容库
- **Phase 4**：AI 参赛方案生成器
- **Phase 5**：商业化与运营后台

## 技术说明

- **零依赖**：纯原生 HTML/CSS/JavaScript，无需 npm install，无需构建步骤
- **Hash 路由**：通过 `window.location.hash` 实现前端路由
- **LocalStorage**：收藏功能使用浏览器本地存储
- **CSS 变量**：主题色、间距等通过 CSS 自定义属性管理
- **无框架**：不使用 React/Vue/Angular，保持轻量
