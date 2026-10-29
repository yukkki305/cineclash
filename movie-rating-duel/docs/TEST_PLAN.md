# 测试计划

## 1. 测试分层

| 层级 | 工具 | 范围 | 现状 |
| --- | --- | --- | --- |
| 单元（纯函数） | Vitest | `src/game/*`、`src/data/validate.ts` | ✅ 49 用例 |
| 组件/集成 | Vitest + RTL + jsdom | `src/components/*`、`src/App.tsx` | ✅ 21 用例 |
| E2E | Playwright（Chromium） | 真实浏览器主干路径 | ✅ 4 用例 |
| 视觉回归 | — | 像素比对 | ⬜ 不做（当前阶段） |

## 2. 运行方式

```bash
# 在 movie-rating-duel/ 下
pnpm test            # vitest run，跑全部用例
pnpm run test:watch  # 监听模式
pnpm run coverage    # 覆盖率（v8，统计 src/game + src/data）
pnpm run typecheck   # tsc --noEmit
pnpm run build       # 类型检查 + 生产构建
pnpm run test:e2e    # Playwright E2E（自动拉起 vite dev server）
```

环境备注：本机 Node 不在 PATH 时，需先把捆绑运行时加入 PATH，
否则 `pnpm run` 会报 `'node' is not recognized`。

## 3. 规则覆盖矩阵

| 规则 | 断言点 | 用例位置 |
| --- | --- | --- |
| 1 新局 5 条命 | `LIVES_PER_GAME === 5`，`startGame` 后 `lives === 5` | `engine.test.ts` |
| 2 答对 +1 分 | `score + 1`，`lives` 不变 | `engine.test.ts` |
| 3 答错 −1 命 | `lives - 1`，`score` 不变 | `engine.test.ts` |
| 4 生命不为负 | 连错 5 次后 `lives === 0`，第 6 次不越界 | `engine.test.ts`、`App.test.tsx` |
| 5 每题只答一次 | 二次 `answerQuestion` 返回原状态引用 | `engine.test.ts` |
| 6 结束后不接受作答 | `phase: 'finished'` 下调用无效果 | `engine.test.ts` |
| 7 归零即结束 | `lives === 0 → phase 'finished'` | `engine.test.ts`、`screens.test.tsx` |
| 8 重开重置 | 得分/生命/计数/`usedPairs` 全部清零 | `engine.test.ts`、`App.test.tsx` |
| 9 ID 必须不同 | 同 ID 配对 `isLegalPair === false` | `question.test.ts` |
| 10 等分不出题 | 评分相同 → 非法配对 | `question.test.ts` |
| 11 年份范围 | 越界任一方 → 非法 | `question.test.ts` |
| 12 数值比较 | 评分差按数值计算（9.9 vs 3.1） | `question.test.ts` |
| 13 无配对安全终止 | `selectQuestion` 返回 `null`，`exhausted === true` | `question.test.ts`、`engine.test.ts` |
| 14 左右不偏置 | 固定 rng 序列可产出两种朝向 | `question.test.ts` |
| 15 不重复配对 | 未用池非空时不重复；耗尽后才允许复用 | `question.test.ts`、`engine.test.ts` |

## 4. 其它必测行为

- **正确率**：未作答 → `null`（UI 显示「暂不可用」）；答对 1 错 1 → 0.5。
- **数据校验**：7 类问题码各自有正例；坏记录被剔除但其余记录保留。
- **难度配置**：`getDifficulty` 未知 ID 抛 `RangeError`；三档区间互不重叠。
- **首页输入**：非数字、越界、起始晚于结束、无合法题目——四种错误各自独立触发，按钮禁用。
- **缺图降级**：无 `posterUrl` 时显示片名首字，不渲染破图。
- **免责声明**：首页与结束页都显示 `SYNTHETIC_DATA_DISCLAIMER`
  （「本页所有片名、年份与评分均为演示用的合成数据，与豆瓣等真实平台的评分无关。」）。

## 5. 手工验收清单（每次发版前）

1. 三档难度各开一局，确认题目评分差落在对应区间。
2. 把年份收窄到只剩 2–3 部电影，确认首页拦下「没有合法题目」或开局后能正常走到「题目已用尽」。
3. 连续答错 5 次，确认第 5 次后立即进入结束页且生命显示 0。
4. 结束页点「再来一局」，确认得分/生命/正确率归零、题目重新开始。
5. 窄屏（< 640px）下确认卡片单列、按钮可点、HUD 不换行错位。

## 6. 已知缺口

- 无视觉回归：样式改动仅靠人工检查。
- 覆盖率未强制卡阈值；`components/` 只统计到分支主路径。
- E2E 只覆盖主干路径（4 条用例），难度切换、年份收窄后的 `exhausted` 终局仍靠单元测试保证。
