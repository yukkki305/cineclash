import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置：E2E 冒烟测试跑在真实的 Vite 开发服务器上。
 *
 * 注意：`webServer.command` 直接调用 node 执行 vite，避免依赖 pnpm 的 cmd 包装
 * （本机 node 不在 PATH 时 `pnpm run` 会报 `'node' is not recognized`）。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
