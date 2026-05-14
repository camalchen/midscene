const { chromium } = require('playwright');
const { PlaywrightAgent } = require('@midscene/web/playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ================== 截图工具 ==================
const screenshotDir = path.join(__dirname, '..', 'midscene_run', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
async function shot(page, name) {
  const file = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`[截图] ${name}`);
}

// ================== 提交后自动检查+纠错 ==================
async function submitWithAutoFix(page, ai, dialog, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const submitBtn = dialog.locator('button').filter({ hasText: '提交' }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    console.log(`[提交] 第 ${attempt + 1} 次`);
    await page.waitForTimeout(3000);

    // DOM 快速检查
    const dialogGone = await page.evaluate(() => {
      const d = document.querySelector('.el-dialog__wrapper');
      return !d || d.style.display === 'none';
    });
    const hasSuccess = await page.evaluate(() =>
      document.querySelector('.el-message--success') !== null
    );

    if (dialogGone || hasSuccess) {
      console.log('提交成功！');
      await ai.aiAssert('赠品规则已成功创建，页面显示规则列表');
      await shot(page, '提交成功');
      return true;
    }

    // 失败：AI 读取错误 + 纠正
    if (attempt < maxRetries) {
      console.log('[自动纠错] 提交失败，AI 分析错误...');
      const errMsg = await ai.aiString('弹窗中显示了什么错误信息或校验提示？列出所有未通过的字段名和错误描述');
      console.log('[错误]', errMsg);
      console.log('[自动纠错] AI 修正表单...');
      await ai.aiAction(`根据以下错误修正弹窗中的表单字段：${errMsg}`);
      await page.waitForTimeout(1000);
    } else {
      console.log('[最终失败] 已达最大重试次数');
    }
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1525, height: 919 },
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, 'auth.json'),
  });
  const page = await context.newPage();
  const ai = new PlaywrightAgent(page);

  const ruleName = `测试${String(Date.now()).slice(-6)}`;
  console.log('规则名称:', ruleName);

  // ================== 打开页面 ==================
  await page.goto('http://test.inventorysysneibu.haiziwang.com/inventory-web/pages/giftnew/giftRule.html');
  await page.waitForLoadState('networkidle');

  // ================== 点击"新建赠品规则" ==================
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click();
  const dialog = page.getByRole('dialog', { name: '新建赠品规则' });
  await dialog.waitFor();
  await page.waitForTimeout(800);

  // ================== 1. 填写发放场景（DOM 操作 Element UI 下拉框） ==================
  await page.evaluate(() => {
    const input = document.querySelector('.el-dialog__body .el-select input');
    if (input) input.click();
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    for (const item of items) {
      if (item.textContent.trim().includes('品牌新客') && item.offsetParent !== null) {
        item.click();
        break;
      }
    }
  });
  await page.waitForTimeout(300);
  // ✅ AI 校验检查点
  await ai.aiAssert('发放场景已选择为"品牌新客"');
  await shot(page, '1-发放场景');

  // ================== 2. 填写规则名称 ==================
  const nameInput = dialog.locator('input[placeholder="请输入规则名称"]');
  await nameInput.click();
  await nameInput.fill(ruleName);
  // ✅ AI 校验检查点
  await ai.aiAssert(`规则名称输入框中已填入"${ruleName}"`);
  await shot(page, '2-规则名称');

  // ================== 3. 填写生效时间段（Playwright 点击日期面板） ==================
  const dateRangePicker = dialog.locator('.el-date-editor--datetimerange');
  await dateRangePicker.click();
  await page.waitForSelector('.el-date-range-picker', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  // 左侧面板选14号
  const leftPanel = page.locator('.el-date-range-picker__content').first();
  const day14 = leftPanel.locator('td.available').filter({ hasText: /^14$/ }).first();
  if (await day14.count() > 0) {
    await day14.click();
  } else {
    const tds = leftPanel.locator('td:not(.disabled):not(.prev-month)');
    for (let i = 0; i < await tds.count(); i++) {
      if ((await tds.nth(i).textContent())?.trim() === '14') { await tds.nth(i).click(); break; }
    }
  }
  await page.waitForTimeout(200);

  // 右侧面板选30号
  const rightPanel = page.locator('.el-date-range-picker__content').nth(1);
  const day30 = rightPanel.locator('td.available').filter({ hasText: /^30$/ }).first();
  if (await day30.count() > 0) {
    await day30.click();
  } else {
    const tds = rightPanel.locator('td:not(.disabled):not(.next-month)');
    for (let i = 0; i < await tds.count(); i++) {
      if ((await tds.nth(i).textContent())?.trim() === '30') { await tds.nth(i).click(); break; }
    }
  }
  await page.waitForTimeout(200);

  // 点击确定
  const confirmBtn = page.locator('.el-picker-panel__footer button:not(.is-disabled)').filter({ hasText: '确定' });
  await confirmBtn.click({ timeout: 5000 });
  await page.waitForTimeout(300);
  // ✅ AI 校验检查点
  await ai.aiAssert('生效时间段已选择，日期范围已填入');
  await shot(page, '3-生效时间');

  // ================== 4. 选择参与部门（DOM 操作 Element UI 树） ==================
  // 展开树节点
  await page.evaluate(() => {
    const icon = document.querySelector('.el-dialog__body .el-tree-node__expand-icon');
    if (icon) icon.click();
  });
  await page.waitForTimeout(500);

  // 勾选"直管"，带 DOM 验证
  let checked = false;
  for (let retry = 0; retry < 3; retry++) {
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.el-dialog__body .el-tree-node');
      for (const node of nodes) {
        const content = node.querySelector('.el-tree-node__content');
        if (content && content.textContent.includes('直管')) {
          const cb = node.querySelector('.el-checkbox');
          if (cb && !cb.classList.contains('is-checked')) cb.click();
          break;
        }
      }
    });
    await page.waitForTimeout(500);

    // DOM 验证
    checked = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.el-dialog__body .el-tree-node');
      for (const node of nodes) {
        const content = node.querySelector('.el-tree-node__content');
        if (content && content.textContent.includes('直管')) {
          const cb = node.querySelector('.el-checkbox');
          return cb && cb.classList.contains('is-checked');
        }
      }
      return false;
    });

    if (checked) break;
    console.log(`[重试] 直管未勾上，第${retry + 1}次重试`);
  }

  if (!checked) {
    console.log('[纠错] DOM 操作未能勾选直管，用 AI 纠正');
    await ai.aiAction('在参与部门树形列表中，找到"直管"这一行，点击它前面的方框复选框使其打勾选中');
    await page.waitForTimeout(500);
  }
  // ✅ AI 校验检查点
  await ai.aiAssert('参与部门区域中"直管"已被勾选，复选框有打勾标记');
  await shot(page, '4-直管已勾选');

  // ================== 5. 点击"新增"按钮添加商品 ==================
  const addBtn = dialog.locator('button.el-button--text').filter({ hasText: '新增' });
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
  console.log('新增按钮点击成功');
  await page.waitForTimeout(800);
  // ✅ AI 校验检查点
  await ai.aiAssert('商品清单区域已出现商品编码输入框');
  await shot(page, '5-新增商品行');

  // ================== 6. 填写商品编码 ==================
  const codeInput = page.locator('input[placeholder="输入商品编码"]').first();
  await codeInput.click();
  await codeInput.fill('8306381379');
  await codeInput.blur();
  await page.waitForTimeout(2000);

  // DOM 检查商品名称是否回填
  const productFilled = await page.evaluate(() => {
    const rows = document.querySelectorAll('table.el-table__body tbody tr');
    if (rows.length === 0) return false;
    const tds = rows[rows.length - 1].querySelectorAll('td');
    for (const td of tds) {
      const text = td.textContent.trim();
      if (text && text !== '8306381379' && text.length > 1 && !/^\d+$/.test(text) && text !== '暂无数据') {
        return true;
      }
    }
    return false;
  });

  if (!productFilled) {
    console.log('商品名称未回填，按 Tab 触发...');
    await codeInput.click();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
  } else {
    console.log('商品名称已回填');
  }
  // ✅ AI 校验检查点
  await ai.aiAssert('商品清单中已填入商品编码8306381379，商品名称已自动回填');
  await shot(page, '6-商品已填');

  // ================== 7. 提交（带自动纠错） ==================
  await submitWithAutoFix(page, ai, dialog);

  await browser.close();
})();
