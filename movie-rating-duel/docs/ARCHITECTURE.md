# ARCHITECTURE —— 技术架构与关键决策

| 字段 | 值 |
| --- | --- |
| 版本 | v0.1.0 |
| 状态 | 内核已实现，界面待选型 |
| 关联文档 | [PRD.md](PRD.md) · [TASKS.md](TASKS.md) · [TEST_PLAN.md](TEST_PLAN.md) |

## 1. 技术选型

| 项 | 选择 | 理由 |
| --- | --- | --- |
| 语言 | JavaScript（ESM） | 领域逻辑只有算术和数组操作，无需类型系统即可保证正确性；测试和浏览器共用同一份源码 |
| 运行时 | Node.js >= 20 | 内置 `node:test` 与 `--watch`，无需 jest/vitest |
| 依赖 | **无运行时依赖** | 核心是纯计算；降低安装成本与供应链风险 |
| 测试 | `node --test` | 零配置，`npm test` 开箱即用 |
| 构建 | 无 | 源码即产物，浏览器或 Node 直接加载 |

> 未来引入前端框架时重新评估本表，并在第 7 节追加 ADR。

## 2. 分层

```
movie-rating-duel/
├── src/
│   ├── core/            纯领域逻辑：无 IO、无副作用、可任意顺序调用
│   │   ├── elo.js       期望胜率与分值更新
│   │   ├── duel.js      对决配对策略
│   │   └── rng.js       可复现的伪随机数（mulberry32）
│   ├── data/
│   │   └── movies.js    静态片库种子
│   └── index.js         演示入口：组织调用 + 打印表格
├── tests/               与 src/core 对应的单元测试
└── docs/
```

**依赖方向**：`index.js → core + data`；`core` 不依赖 `data`、不依赖 `index`、不 import 任何 `node:` 模块。
这条单向依赖是可移植性（CLI / 浏览器 / Worker / 服务端复用同一内核）的前提。

## 3. 核心算法

### 3.1 期望胜率

```
E_A = 1 / (1 + 10 ^ ((R_B - R_A) / 400))
```

- `E_A` 表示分值更高的 A 应该赢的概率，`E_A + E_B = 1`。
- 400 分差 ≈ 10:1 的胜率比，是 Elo 的经典刻度。

### 3.2 分值更新

```
R_A' = R_A + K * (S_A - E_A)
R_B' = R_B - K * (S_A - E_A)
```

| 符号 | 含义 | 取值 |
| --- | --- | --- |
| `K` | 学习率，越大收敛越快也越抖 | 默认 `32` |
| `S_A` | 实际得分 | 胜 `1` / 平 `0.5` / 负 `0` |
| `R` | 分值 | 初始 `1000`，下限 `100` |

**性质**：

1. **零和**：`ΔR_A = -ΔR_B`（在未取整的实数域上严格成立）。
2. **平移不变**：对所有分值同时加常数，`E_A` 不变。
3. **对称**：交换 A/B 并令 `S_B = 1 - S_A`，更新结果对称。
4. **取整误差**：实现中两边各自 `Math.round`，单边误差最大 1 分 —— 因此测试必须用容差断言。

### 3.3 配对策略（`pickDuel`）

| 策略 | 语义 | 用途 |
| --- | --- | --- |
| `random` | 均匀随机抽两部不同电影 | P0 默认，保证探索 |
| `closest` | 选择分值最接近的一对 | 分值可信度收敛后做精细排序 |
| `widest` | 选择分值差距最大的一对 | 快速确认榜首/榜尾 |

接口：`pickDuel(movies, { strategy = 'random', rng = Math.random, ratingOf })`。
`ratingOf` 默认读取 `movie.rating`，缺省回退到 `1000`，使 `core` 不关心存储形态。

> 少于 2 部电影时抛 `RangeError`。返回 `{ a, b }`，保证 `a !== b`。

## 4. 数据模型

```js
// 电影（片库条目，只读）
Movie {
  id: string;        // 稳定的唯一标识，例如 'spirited-away-2001'
  title: string;
  year: number;
  genres: string[];  // 用于未来的题材筛选
}

// 评分（每用户每电影一条，可变）
Rating {
  movieId: string;
  value: number;     // Elo 分值，初始 1000
  duels: number;     // 参与场次
  wins: number;
  losses: number;
  draws: number;
}

// 对决记录（用于撤销与审计）
DuelRecord {
  id: string;
  movieA: string;
  movieB: string;
  outcome: 'a' | 'b' | 'draw' | 'skip';
  ratingABefore: number;
  ratingBBefore: number;
  ratingAAfter: number;
  ratingBAfter: number;
  at: number;        // 时间戳
}
```

`DuelRecord` 同时保存前值与后值，使撤销（US-4）只需回读快照，无需重放整段历史。

## 5. 存储演进

| 阶段 | 方案 | 触发条件 |
| --- | --- | --- |
| M0 | 进程内存 | 当前（模拟运行） |
| M1 | `localStorage` 单键 JSON（`mrd:v1`） | 需要跨刷新保留 |
| M2 | IndexedDB | 片库 > 500 部或记录 > 5000 场 |
| M3 | Postgres + REST | 需要账号与多设备同步 |

**迁移策略**：M1→M2 读取 `localStorage` 后批量写入 IndexedDB，写入成功再删除旧键。
所有持久化数据带 `schemaVersion` 字段，升级时走显式迁移函数，不做静默兼容。

## 6. 未来接口草案（M3，非本期实现）

```http
GET  /api/duel?userId=:id               → { a: Movie, b: Movie }
POST /api/duel/:duelId/result           → { outcome: "a" | "b" | "draw" | "skip" }
GET  /api/leaderboard?userId=:id        → [{ movieId, value, duels }]
```

服务端只信任 `outcome`，分值由服务端调用同一份 `core/elo.js` 计算 —— 这是内核保持纯函数、
零依赖的直接收益。

## 7. 架构决策记录（ADR）

### ADR-001：用 Elo，而不是平均分

**背景**：二选一只提供「A 比 B 好」这一比特信息。
**决策**：采用 Elo。
**理由**：平均分把每次比较当作一个独立评分，忽略对手强弱；Elo 天然编码「赢了强对手得分更多」。
**替代方案**：TrueSkill（更强但实现重）、Bradley–Terry 最大似然（需要批量重算，不适合实时更新）。
**后果**：需要定期检查收敛性；分值绝对大小无意义，只有相对顺序有意义。

### ADR-002：核心逻辑保持纯函数

**决策**：`src/core/**` 不接触 IO、时间、随机源（随机源通过参数注入）。
**理由**：可确定性测试；同一份代码可运行在 CLI、浏览器、Worker、服务端。
**后果**：`index.js` 承担所有「副作用编排」，会比其他文件啰嗦，这是刻意的。

### ADR-003：零依赖起步

**决策**：不引入任何运行时依赖，测试用 `node:test`。
**理由**：当前代码量小；避免锁定构建工具；供应链风险最低。
**后果**：没有 JSX/类型检查/热更新；界面阶段需要重新评估（见第 8 节）。

### ADR-004：暂不引入 Glicko-2

**决策**：保留 Elo 的固定 K 值。
**理由**：Glicko-2 需要维护 RD 与波动率，最小对局数门槛更高，早期数据不足时置信区间会很宽，反而难解释。
**后果**：场次少的电影分值不可信 —— 由「覆盖度」提示与未来的 Q1（自适应 K）缓解。

## 8. 待定事项

- **界面框架**：React / Svelte / Vue / 原生 Web Components，未定；倾向 Svelte 或原生，以保持轻量。
- **海报来源**：版权与热链风险未评估，M1 前必须给出方案（本地占位图 / TMDB API / 用户自传）。
- **分享卡片**：Canvas 渲染 vs SVG 转 PNG，未定。
- **部署**：GitHub Pages（纯静态）为首选，需确认子路径 `base` 配置。
