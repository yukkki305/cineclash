# AGENTS.md

面向在本仓库工作的 **AI 编码代理**（以及人类协作者）的约定。修改本文件前先确认规则仍然成立。

## 项目一句话

`movie-rating-duel` 是一个纯前端可运行的电影 Elo 对决评分器：用户反复在 A/B 两部电影中二选一，
系统用 Elo 更新分值，形成个人排行榜。

## 常用命令

```bash
npm start            # 运行 60 场对决模拟，打印排行榜
npm test             # 全部单元测试（node:test，需要 Node >= 20）
npm run test:watch   # 测试监听模式
```

没有任何运行时依赖：**不要**在没有充分理由的情况下新增 `dependencies`。
若确有必要，必须在 `docs/ARCHITECTURE.md` 的 ADR 章节记录理由、替代方案与体积影响。

## 目录职责（不要跨界）

| 路径 | 允许做 | 禁止做 |
| --- | --- | --- |
| `src/core/` | 纯函数、数学计算、数据结构 | `fs` / 网络 / `console.log` / 全局可变状态 |
| `src/data/` | 静态种子数据 | 业务逻辑 |
| `src/index.js` | 组织调用、输出展示 | 实现算法细节 |
| `tests/` | 对 `src/core` 的断言 | 修改 `src/` 里的实现 |

**核心不变量：`src/core/**` 必须是无副作用的纯函数，任何时间可被任意顺序调用。**
这是可测性、以及未来复用到 Web / Worker / 服务端的前提（见 ADR-002）。

## 硬性规则

1. **算法改动必须配测试**：`src/core/*` 的任何行为变化都要在 `tests/` 中体现，改前先看
   [docs/TEST_PLAN.md](docs/TEST_PLAN.md) 的用例表。
2. **文档与代码同步**：改了 Elo 公式、默认 K 值、数据模型或目录结构，同一提交内更新
   `docs/ARCHITECTURE.md` 与 `docs/PRD.md` 中受影响的部分。
3. **不提交密钥**：`.env`、token、cookie 一律不进仓库（根目录 `.gitignore` 已覆盖）。
4. **提交前 `npm test` 必须全绿**。红灯不要提交，也不要「先提交再修」。
5. **提交信息用 Conventional Commits**：`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`，
   主题行使用中文短句，例如 `fix: 平局时避免双向漂移`。
6. **中文文档**：`docs/` 与本文档使用中文；代码标识符、提交类型使用英文。

## 完成定义（DoD）

一个任务只有在以下条件都满足时才算完成：

- [ ] 行为有对应测试，`npm test` 通过
- [ ] 受影响的文档已同步
- [ ] 没有新增未记录的依赖
- [ ] 没有留下 `TODO` 注释以外的半成品代码
- [ ] 提交粒度单一，信息符合约定

## 常见陷阱

- **四舍五入会破坏零和**：`updateRatings` 对两侧独立取整，单边误差最大 1 分。测试断言请用容差，
  不要写成严格的 `deltaA === -deltaB`。
- **不要给随机选片用 `Math.random` 直接断言结果**：测试里注入 `mulberry32(seed)` 以获得确定性。
- **`pickDuel` 在少于 2 部电影时必须抛错**，不要返回 `null` 让调用方猜。

## 接手时的第一步

1. 读 [docs/TASKS.md](docs/TASKS.md) 找到未勾选框
2. 读对应的 [docs/PRD.md](docs/PRD.md) 验收标准与 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 约束
3. `npm test` 确认基线为绿
4. 小步提交
