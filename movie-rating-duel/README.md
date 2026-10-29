# 谁的评分更高？ · Movie Rating Duel

一个纯浏览器端的电影评分二选一小游戏：同时给出两部电影，点出**评分更高的那一部**。
答对 +1 分，答错 −1 条命，5 条命用完游戏结束。

> ⚠️ 当前片库是 **60 条合成测试数据**（虚构片名 + 虚构评分），不是豆瓣或任何真实评分。
> UI 内会持续显示该免责声明。

## 界面预览

| 首页 | 作答后揭示评分 |
| --- | --- |
| ![首页](docs/screenshots/01-home.png) | ![作答后揭示评分](docs/screenshots/03-answer-revealed.png) |

移动端（390px 宽）：

<img src="docs/screenshots/04-mobile-home.png" alt="移动端首页" width="320" />

> 截图脚本：`node scripts/capture-screenshots.mjs`（需先启动 `pnpm dev`）。

## 快速开始

```bash
pnpm install
pnpm dev          # http://127.0.0.1:5173
```

生产构建与预览：

```bash
pnpm run build    # tsc --noEmit && vite build → dist/
pnpm run preview
```

> 环境备注：如果终端里 `node` 命令不可用，`pnpm run` 会失败并报
> `'node' is not recognized`。此时先把 Node 目录加入 `PATH`，或直接用绝对路径的 node 调 pnpm。

## 可用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发服务器（5173） |
| `pnpm run build` | 类型检查 + 生产构建 |
| `pnpm run preview` | 预览 `dist/` |
| `pnpm run typecheck` | 仅跑 `tsc --noEmit` |
| `pnpm test` | Vitest 全量用例（70 个） |
| `pnpm run test:watch` | 监听模式 |
| `pnpm run coverage` | 覆盖率报告（`src/game` + `src/data`） |
| `pnpm run test:e2e` | Playwright E2E 冒烟测试（自动启动 vite） |

## 玩法

1. 首页选难度与年份范围，开始。
2. 每道题显示两部电影（片名 + 年份），评分先隐藏；点其中一部作答。
3. 立即揭晓双方评分与数据来源，并高亮正确答案。
4. 生命耗尽，或当前筛选下再没有合法题目时，进入结束页：得分、已作答、答对、正确率、剩余生命。
5. 「再来一局」沿用上次配置，所有数值清零。

难度按**评分差绝对值**划分（`src/game/difficulty.ts`，唯一数据源）：

| 难度 | 评分差 | 手感 |
| --- | --- | --- |
| 普通 | 0.8 – 2.0 | 靠印象就能答对 |
| 进阶 | 0.3 – 0.7 | 需要一点印象比对 |
| 专家 | 0.1 – 0.2 | 基本靠猜 |

正确率 = 答对 / 已作答；一题都没答时显示「暂不可用」，绝不除零。

## 目录

```
src/
├── game/        纯逻辑：难度、配对合法性、抽题、局面状态机
├── data/        合成片库、记录校验、数据源适配器
├── components/  首页 / 游戏页 / 卡片 / 结束页
├── styles/      全局样式与响应式
└── test/        jest-dom setup + 测试用片库夹具
legacy/          v0 Elo 原型归档（不参与构建，见 legacy/README.md）
docs/           PRD、架构、任务清单、测试计划
```

## 质量现状

- 类型检查与生产构建通过；`vitest run` 70 个用例全绿。
- 覆盖率（`src/game` + `src/data`）：语句 94.37%、分支 91.48%。
- Playwright E2E 4 条用例全绿（首页要素、年份非法拦截、作答揭示评分、打完整局并再来一局）。

## 文档

- [产品需求 `docs/PRD.md`](docs/PRD.md)
- [架构说明 `docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [任务清单 `docs/TASKS.md`](docs/TASKS.md)
- [测试计划 `docs/TEST_PLAN.md`](docs/TEST_PLAN.md)
- [开发规范 `AGENTS.md`](AGENTS.md)
