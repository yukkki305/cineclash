# 任务清单

> 状态图例：✅ 完成　🟡 进行中　⬜ 未开始　⛔ 阻塞
> 完成定义见 `AGENTS.md` 第 13 条：任务只有在「实现 + 测试 + 文档同步」都完成后才算 ✅。

## 里程碑

| 里程碑 | 目标 | 状态 |
| --- | --- | --- |
| M0 | 仓库初始化、目录骨架、工具链（Vite/TS/Vitest） | ✅ |
| M1 | 游戏内核：难度、配对枚举、抽题、局面状态机 | ✅ |
| M2 | 数据层：合成片库 + 校验 + 适配器 | ✅ |
| M3 | UI：首页 / 游戏页 / 结束页 / 响应式 | ✅ |
| M4 | 测试：单元 + 组件（70 用例） | ✅ |
| M5 | 文档：PRD / ARCHITECTURE / TASKS / TEST_PLAN / README | ✅ |
| M6 | E2E：Playwright 冒烟测试 | ✅ |
| M7 | 片库扩容（解决 Expert 区间过窄、配对易耗尽） | ⬜ |
| M8 | 真实评分数据接入（需批准，合规优先） | ⛔ |

## M1 游戏内核（✅）

- [x] `src/game/types.ts`：`Movie` / `GameState` / `Question` / `GameConfig` 类型
- [x] `src/game/difficulty.ts`：Normal 0.8–2.0 / Advanced 0.3–0.7 / Expert 0.1–0.2
- [x] `src/game/question.ts`：`isLegalPair`、`collectLegalPairs`、`selectQuestion`
- [x] `src/game/engine.ts`：`startGame` / `answerQuestion` / `advanceQuestion` / `restartGame` / `accuracyOf`
- [x] 配对付尽时回退复用，绝不返回 `undefined` 或死循环（规则 13）
- [x] 左右位置随机化（规则 14）

## M2 数据层（✅）

- [x] 60 条合成片库，全部带 `ratingSource` 与免责声明
- [x] `validateMovies` 覆盖 7 类问题，坏记录剔除并上报
- [x] `createMovieSource` 构造即校验，失败抛 `MovieDataError`

## M3 UI（✅）

- [x] 首页：难度选择、年份区间、配对数预览、非法输入拦截
- [x] 游戏页：HUD（题号/生命/得分/正确率）、评分隐藏、作答后揭示、下一题
- [x] 结束页：得分 / 已作答 / 答对 / 正确率 / 剩余生命 / 两种终局文案
- [x] 缺图降级为片名首字；小屏单列、大屏双列

## M4 测试（✅）

- [x] `question.test.ts`（19）、`engine.test.ts`（18）、`validate.test.ts`（12）
- [x] `screens.test.tsx`（15）、`App.test.tsx`（6）
- [x] 覆盖率：语句 94.37% / 分支 91.48%（`src/game` + `src/data`）

## M5 文档（✅）

- [x] 本文件与 `PRD.md`、`ARCHITECTURE.md`、`TEST_PLAN.md`
- [x] `README.md`（项目根与子目录）
- [x] `legacy/README.md`：说明旧 Elo 原型的定位与运行方式

## M6 Playwright E2E（✅）

- [x] 安装 `@playwright/test` 1.64.1 与 Chromium headless shell（经本地代理下载）
- [x] `playwright.config.ts`：`webServer` 直接以 node 启动 vite（127.0.0.1:5173），
      避免 `pnpm run` 在 node 不在 PATH 时失败
- [x] `e2e/smoke.spec.ts` 四条用例：首页要素 / 年份非法拦截 / 作答揭示评分 / 打完整局并再来一局
- [x] `package.json` 增加 `pnpm run test:e2e`

运行：`pnpm run test:e2e`（首次需 `node node_modules/@playwright/test/cli.js install chromium`）。
实测 4 条用例全部通过，耗时约 4.7s。

## M7 片库扩容（⬜，用户已确认后期处理）

背景：Expert 只接受 0.1–0.2 的评分差，60 部片库中符合的配对很少；
年份筛选收窄后规则 15 的「不重复配对」也会很快耗尽。

- [ ] 片库扩到 300+ 部，保证每档难度在每个年份子区间内都有足够配对
- [ ] 首页增加「当前条件可出题数」的提示（已有配对数，需补文案）
- [ ] 扩容后重新评估 Expert 的 0.1–0.2 是否仍然合理

## M8 真实数据接入（⛔ 阻塞，需批准）

- [ ] 确认可用且合规的数据源（不得抓取豆瓣、不得绕过限流）
- [ ] 实现新的 `MovieSource`，保留 `ratingSource` 溯源
- [ ] 数据快照入库存档，附抓取时间与许可说明
