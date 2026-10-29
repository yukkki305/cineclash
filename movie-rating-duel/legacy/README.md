# legacy/ — v0 原型归档（不参与构建）

这个目录保存的是项目最早的一版实现：一个**零依赖、跑在 Node 里的 Elo 二选一评分器**。
它和现在的产品（浏览器端「谁的评分更高？」小游戏）不是同一个东西，因此被完整归档在这里，
只用于对照历史决策，**不进入 Vite 构建、不被 `src/` 引用、不参与 `pnpm test`**。

## 里面有什么

| 文件 | 作用 |
| --- | --- |
| `core/elo.js` | Elo 评分内核：`expectedScore`、`updateRatings`，K=32，初始 1000 分 |
| `core/duel.js` | 出题策略：`random` / `closest` / `widest` |
| `core/rng.js` | `mulberry32` 可复现随机源 |
| `data/movies.js` | 12 部中文片名种子数据（无评分字段） |
| `simulate.js` | 命令行模拟 60 场对决并打印排行榜（支持 `MRD_SEED`） |
| `tests/*.test.js` | 33 个 `node:test` 用例，覆盖 core 与 data |

## 怎么运行

```bash
cd movie-rating-duel/legacy

# 模拟对决（固定种子可复现）
node simulate.js
MRD_SEED=42 node simulate.js      # PowerShell: $env:MRD_SEED=42

# 跑归档测试（33 个用例，node:test）
node --test
```

注意两点：

1. 必须在 `legacy/` 目录内执行 `node --test`；在 Windows + Node 24 上把目录当参数传
   （`node --test tests/`）会报 `Cannot find module ...\tests`。
2. 归档测试的 import 已从 `../src/core/*` 调整为 `../core/*`，其余逻辑一字未改。

## 为什么不删

- 它记录了「Elo 双人对比」这一被否决的产品方向，以及当初的评分公式与出题策略。
- 新实现里的 `pairKey`、难度区间、注入式随机源等设计，都是在这版基础上收敛出来的。
- 保留可运行的测试，方便将来复用时不必重新推导行为。

## 与现行实现的关系

现行实现的规则、数据政策与目录结构见仓库根目录 `AGENTS.md`，
架构说明见 `docs/ARCHITECTURE.md`（ADR-001 记录了「重写而非改造」的原因）。
