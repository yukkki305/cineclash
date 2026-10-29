/**
 * 生成文档用截图：docs/screenshots/*.png
 *
 * 用法（需先启动 dev server：`pnpm dev`）：
 *   node scripts/capture-screenshots.mjs
 *
 * 截图仅用于 README 展示。数据是合成测试数据，请勿在说明里把它描述成真实评分。
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.env.SHOT_BASE_URL ?? 'http://127.0.0.1:5173';
const outDir = 'docs/screenshots';

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

async function shootDesktop() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '谁的评分更高？' }).waitFor();
  await page.screenshot({ path: `${outDir}/01-home.png`, fullPage: true });

  await page.getByRole('button', { name: '开始游戏' }).click();
  await page.getByRole('heading', { name: '哪一部的评分更高？' }).waitFor();
  await page.screenshot({ path: `${outDir}/02-question-hidden.png`, fullPage: true });

  await page.getByRole('button', { name: /^选择《/ }).first().click();
  await page.getByText('正确答案').first().waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/03-answer-revealed.png`, fullPage: true });

  await context.close();
}

async function shootMobile() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '谁的评分更高？' }).waitFor();
  await page.screenshot({ path: `${outDir}/04-mobile-home.png`, fullPage: true });
  await context.close();
}

await shootDesktop();
await shootMobile();
await browser.close();

console.log(`screenshots written to ${outDir}/`);
