import { expect, test, type Page } from '@playwright/test';

/**
 * E2E 冒烟测试：只验证「玩家能一路玩到结束页」这条主干路径，
 * 细粒度规则断言交给 Vitest 单元测试与 RTL 组件测试。
 */

const DISCLAIMER = /演示用的合成数据/;

async function startDefaultGame(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '谁的评分更高？' })).toBeVisible();
  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.getByRole('heading', { name: '哪一部的评分更高？' })).toBeVisible();
}

function movieCards(page: Page) {
  return page.getByRole('button', { name: /^选择《/ });
}

test('首页展示玩法、难度与免责声明', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '谁的评分更高？' })).toBeVisible();
  await expect(page.getByText(DISCLAIMER)).toBeVisible();

  for (const label of ['普通', '进阶', '专家']) {
    await expect(page.getByRole('radio', { name: new RegExp(label) })).toBeVisible();
  }

  await expect(page.getByLabel('起始年份')).toHaveValue('2005');
  await expect(page.getByLabel('结束年份')).toHaveValue('2025');
  await expect(page.getByText(/个合法配对/)).toBeVisible();
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeEnabled();
});

test('年份非法时禁止开始并给出提示', async ({ page }) => {
  await page.goto('/');

  const from = page.getByLabel('起始年份');
  await from.fill('1800');
  await expect(page.getByRole('alert')).toContainText('年份需在 2005–2025 之间');
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeDisabled();

  await from.fill('2020');
  await page.getByLabel('结束年份').fill('2010');
  await expect(page.getByRole('alert')).toContainText('起始年份不能晚于结束年份');
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeDisabled();
});

test('作答后揭示双方评分并可进入下一题', async ({ page }) => {
  await startDefaultGame(page);

  const cards = movieCards(page);
  await expect(cards).toHaveCount(2);

  // 作答前评分必须隐藏
  await expect(page.getByText('评分已隐藏').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '下一题' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('点击你认为评分更高的那一部');

  await cards.first().click();

  const feedback = page.getByRole('status');
  await expect(feedback).toContainText(/答对了|答错了/);
  await expect(page.getByText('评分已隐藏')).toHaveCount(0);
  await expect(page.getByText('正确答案').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '下一题' })).toBeEnabled();

  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.getByRole('status')).toContainText('点击你认为评分更高的那一部');
});

test('一直答题直到结束页，并可以再来一局', async ({ page }) => {
  await startDefaultGame(page);

  const cards = movieCards(page);
  const restartButton = page.getByRole('button', { name: '再来一局' });

  // 生命最多扣 5 次，50 题足够走完（每次点左卡片，对错随机）
  for (let i = 0; i < 50; i += 1) {
    if (await restartButton.isVisible().catch(() => false)) break;
    await cards.first().click();
    const next = page.getByRole('button', { name: '下一题' });
    if (await next.isVisible().catch(() => false)) {
      if (await next.isDisabled()) break;
      await next.click();
    }
  }

  await expect(page.getByRole('heading', { name: '本局结束' })).toBeVisible();
  await expect(page.getByText(/生命耗尽，本局结束。|题目已用尽，本局提前结束。/)).toBeVisible();
  await expect(page.getByText('得分', { exact: true })).toBeVisible();

  await restartButton.click();
  await expect(page.getByRole('heading', { name: '哪一部的评分更高？' })).toBeVisible();
  await expect(page.locator('[aria-label="剩余生命 5 / 5"]')).toBeVisible();
});
