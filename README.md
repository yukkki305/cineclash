# CineClash

电影主题的浏览器小游戏合集。

当前主项目：**[谁的评分更高？（Movie Rating Duel）](movie-rating-duel/README.md)** ——
给出两部电影，点出评分更高的那一部；答对加分，答错扣命，5 条命用完游戏结束。

> ⚠️ 现阶段的片名与评分全部是**合成演示数据**，与豆瓣等真实平台的评分无关。

## 目录结构

```
CineClash/
├── README.md                 # 本文件：仓库总览
├── .gitignore
└── movie-rating-duel/        # React + TS + Vite 实现的评分对决游戏
    ├── src/game/             # 纯逻辑：难度、配对合法性、抽题、状态机
    ├── src/data/             # 合成片库、记录校验、数据源适配器
    ├── src/components/       # 首页 / 游戏页 / 卡片 / 结束页
    ├── e2e/                  # Playwright 冒烟测试
    ├── legacy/               # v0 Elo 原型归档（不参与构建）
    ├── docs/                 # PRD / 架构 / 任务清单 / 测试计划
    └── AGENTS.md             # 开发规范（规则、数据政策、提交约定）
```

## 快速开始

```bash
cd movie-rating-duel
pnpm install
pnpm dev            # http://127.0.0.1:5173
```

质量检查：

```bash
cd movie-rating-duel
pnpm run typecheck  # 类型检查
pnpm test           # Vitest：70 个用例
pnpm run test:e2e   # Playwright：4 条主干用例
pnpm run build      # 生产构建 → dist/
```

## 文档

- 玩法与开发规范：[`movie-rating-duel/AGENTS.md`](movie-rating-duel/AGENTS.md)
- 产品需求：[`docs/PRD.md`](movie-rating-duel/docs/PRD.md)
- 架构说明：[`docs/ARCHITECTURE.md`](movie-rating-duel/docs/ARCHITECTURE.md)
- 任务清单：[`docs/TASKS.md`](movie-rating-duel/docs/TASKS.md)
- 测试计划：[`docs/TEST_PLAN.md`](movie-rating-duel/docs/TEST_PLAN.md)

## 历史

`movie-rating-duel/legacy/` 保存了项目最早的一版实现：零依赖、跑在 Node 里的
Elo 二选一评分器（33 个 `node:test` 用例，仍可运行）。它记录了被否决的产品方向，
不参与构建。详见 [`legacy/README.md`](movie-rating-duel/legacy/README.md)。
