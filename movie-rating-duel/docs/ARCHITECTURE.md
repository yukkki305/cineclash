# 架构说明

## 1. 技术栈

React 19 + TypeScript + Vite + Vitest + React Testing Library（jsdom）。
样式为单一手写 CSS（`src/styles/global.css`），无 UI 框架、无 CSS 预处理器、无状态管理库。

## 2. 目录结构

```
movie-rating-duel/
├── index.html                # 唯一入口 HTML，挂载 #root
├── vite.config.ts            # Vite + Vitest 配置（jsdom、覆盖率）
├── tsconfig.json             # strict + noUncheckedIndexedAccess
├── src/
│   ├── main.tsx              # ReactDOM.createRoot
│   ├── App.tsx               # 唯一持有 GameState 的组件（状态机宿主）
│   ├── game/                 # 纯逻辑层：不 import React，不读写 DOM
│   │   ├── types.ts          # Movie / GameState / Question / Difficulty 类型
│   │   ├── difficulty.ts     # 难度阈值（唯一数据源）
│   │   ├── question.ts       # 配对枚举、合法性判定、抽题
│   │   └── engine.ts         # 局面状态机（开始/作答/下一题/重开/正确率）
│   ├── data/                 # 数据层：校验 + 适配器隔离数据源
│   │   ├── movies.ts         # 60 条合成片库 + 免责声明
│   │   ├── validate.ts       # 记录级校验（纯函数）
│   │   └── source.ts         # MovieSource 适配器，构造即校验
│   ├── components/           # 表现层：只接收 props，无全局状态
│   │   ├── HomeScreen.tsx    # 难度 + 年份筛选 + 配对数
│   │   ├── GameScreen.tsx    # HUD + 题目 + 反馈 + 下一题
│   │   ├── MovieCard.tsx     # 单片卡片（可点、可揭示评分）
│   │   └── ResultScreen.tsx  # 结算
│   ├── styles/global.css     # 全局样式与响应式断点
│   └── test/                 # setup.ts（jest-dom）+ fixtures.ts（测试用片库）
└── legacy/                   # v0 Elo 原型归档，不参与构建、不被 src 引用
```

## 3. 分层与依赖方向

```
components  →  App  →  game/*        （单向）
components  →  data/*（只读展示评分来源）
game/*      →  game/types            （不反向依赖 React 或 data）
data/*      →  data/validate         （movies.ts 只导出数据）
```

`src/game/**` 与 `src/data/**` 是**纯函数库**：给定相同输入必得相同输出，可脱离浏览器直接单测。
所有副作用（随机数、时钟、渲染）被压缩在边界上。

## 4. 状态机

`GameState.phase` 只有三个取值：

```
idle ──startGame──▶ playing ──生命归零──▶ finished
  ▲                    │                    │
  │                    └──无合法配对──▶ finished（exhausted）
  └────────restartGame(无 config)───────────┘
```

字段：`config`、`lives`、`score`、`answered`、`correct`、`question`、`usedPairs`、`feedback`、`exhausted`。

不可变更新：所有 `game/` 函数返回**新的** `GameState`，从不就地修改入参
（唯一例外是 `startGame` 的旧状态参数被忽略，签名保留以便将来做「续局」）。
这使 React 的 `setState` 天然正确，也让测试可以直接比较前后两个快照。

## 5. 关键算法

### 5.1 合法配对枚举（`collectLegalPairs`）

双重循环 O(n²)，逐条应用规则 9–12 与难度区间，结果按 `pairKey` 字典序排序。
排序不是性能需要，而是**确定性**需要：测试与回放必须稳定。
60 条片库 → 最多 1770 对，实测远小于 1ms。

### 5.2 抽题（`selectQuestion`）

1. 取全部合法配对；为空 → 返回 `null`（调用方进入 `exhausted` 终局）。
2. 过滤掉本局已用过的 `pairKey`；若未用集合非空则从中抽，否则**回退**到全部合法配对上抽。
   → 规则 15 在「还有未用配对」时严格成立；配对耗尽后复用而不是卡死。
3. 用注入的 `Rng` 取 `index = floor(normalize(rng()) * pool.length)`。
4. 再用一次 `rng()` 决定是否交换左右，保证正确答案不会系统性出现在同一侧（规则 14）。
5. `correctId` 取两者中评分更高者；因为规则 10 排除了等分，不存在平局。

`normalize()` 把 NaN / 越界随机值夹到合法区间，防止注入的坏随机源导致 `pool[undefined]`。

### 5.3 浮点噪声

评分差统一用 `Math.round(|a.rating − b.rating| × 1000) / 1000` 计算，
并允许 `EPSILON = 1e-9` 的区间容差，避免 `0.8 − 0.7 = 0.10000000000000009` 这类误差
把边界题错误地判为非法。

## 6. 数据层与适配器

`validateMovies(input, now)` 返回 `{ ok, issues, valid }`：**坏记录被剔除，问题被如实报告**，
绝不静默吞掉。校验码：`duplicate-id`、`duplicate-record`、`empty-title`、`invalid-year`、
`invalid-rating`、`missing-rating-source`、`invalid-poster-url`。

`createMovieSource({ name, disclaimer, movies })` 在构造时调用校验，失败抛 `MovieDataError`，
空片库同样抛错——UI 永远不会拿到一个「看起来正常但没数据」的源。
`yearRange` 由片库推导，供首页筛选边界使用。

将来接真实数据时，只需新增一个返回 `MovieSource` 的模块，`game/` 与 `components/` 均无需改动。

## 7. 可测试性设计

- 所有随机行为通过参数 `rng: () => number` 注入；测试用线性同余/固定序列。
- 时间只通过 `validateMovies(input, now)` 显式传入，不读 `Date.now()`。
- 组件测试用 RTL 从用户视角驱动（`getByRole` / `getByLabelText`），不测实现细节。
- `App` 接受 `movies` / `disclaimer` / `rng` props，因此「合成数据」与「测试小片库」共用同一套 UI。

## 8. 决策记录（ADR）

- **ADR-001 用 React + TS + Vite 重写，而非在旧 JS 上打补丁**：旧实现的玩法（Elo 二选一评分器）
  与新 PRD 不同，混改会同时污染逻辑与测试。旧代码以 `legacy/` 归档保留可运行状态。
- **ADR-002 逻辑层纯函数 + 状态整体替换**：避免隐式可变状态，让 15 条规则可以被单独断言。
- **ADR-003 随机源注入而非 `Math.random()` 直调**：题目可复现，测试稳定。
- **ADR-004 配对耗尽后复用而非结束**：配合「生命耗尽」这一主要终局，避免玩家在正常难度下
  被过早打断；规则 15 的约束仅在存在未用配对时生效。
- **ADR-005 合成数据先行**：真实评分涉及版权与数据来源合规，先用明确标注的合成数据打通全链路。

## 9. 已知技术债

- E2E 仅 4 条主干用例，难度切换与「题目用尽」终局仍依赖单元测试。
- 配对枚举是 O(n²) 且每次抽题全量重算；片库扩到数千部时需要预计算或索引。
- `App` 用单个 `useState` 持有整局状态，规模变大后可能拆成 reducer + context。
