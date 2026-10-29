# movie-rating-duel

用「二选一」的强制选择来给电影排序：每次只呈现两部电影，选出更喜欢的那个，
系统用 **Elo 算法**持续更新每部电影在你心里的分值，最终得到一份可解释的个人排行榜。

- 不要求给绝对分数（避免「8 分到底有多好」的标准漂移）
- 每一次对比只消耗一次直觉判断
- 分值变化可追溯，榜单可分享

## 快速开始

需要 Node.js >= 20。

```bash
cd movie-rating-duel
npm start        # 运行内置的 60 场对决模拟，打印排行榜
npm test         # 运行单元测试（使用 Node 内置 test runner，无第三方依赖）
npm run coverage # 覆盖率报告（门槛：core 行覆盖 ≥ 90%）
```

换种子复现不同趋势：

```bash
MRD_SEED=5320 npm start     # bash / macOS / Linux
$env:MRD_SEED=5320; npm start   # PowerShell
```

`npm start` 的输出示例：

```
#  电影                          年份   分值    Δ
1  千与千寻                      2001   1187   +187
2  疯狂的麦克斯 4：狂暴之路       2015   1142   +142
...
```

## 目录结构

```
movie-rating-duel/
├── AGENTS.md          # 面向 AI 编码代理与协作者的约定
├── README.md
├── package.json
├── docs/
│   ├── PRD.md         # 产品需求文档
│   ├── ARCHITECTURE.md# 技术架构与关键决策
│   ├── TASKS.md       # 里程碑与任务清单
│   └── TEST_PLAN.md   # 测试策略与用例
├── src/
│   ├── core/          # 纯领域逻辑（无 IO，可单测）
│   ├── data/          # 静态片库种子数据
│   └── index.js       # 演示入口
└── tests/             # 与 src/core 一一对应的单元测试
```

## 核心规则

1. 每部电影初始分值 1000，用户看到 A/B 两部电影二选一。
2. 选择结果折算为得分 `S ∈ {1, 0.5, 0}`（胜 / 平 / 负）。
3. 期望胜率 `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`。
4. 新分值 `R_A' = R_A + K * (S_A - E_A)`，默认 `K = 32`，下限 100。
5. 单场对决是零和的（扣除四舍五入误差）。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | 目标用户、用户故事、P0/P1/P2 功能与验收标准 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 分层、算法细节、数据模型、存储演进、ADR |
| [docs/TASKS.md](docs/TASKS.md) | M0–M3 里程碑与可勾选任务 |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | 测试分层、用例表、覆盖率与 CI 要求 |

## 当前状态

`v0.1.0` —— 领域内核与文档就绪，尚无 Web 界面。界面框架选型见
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 的「待定」一节。
