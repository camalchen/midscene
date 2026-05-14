const { chromium } = require('playwright');
const { PlaywrightAgent } = require('@midscene/web/playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ================== 截图保存到报告目录 ==================
const screenshotDir = path.join(__dirname, '..', 'midscene_run', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function takeScreenshot(page, name) {
  const file = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[截图] ${file}`);
}

// ================== 封装：带自动重试和 AI 纠正的操作 ==================
// 每步操作后，用 AI 做一个轻量断言让 report 录屏捕获
async function smartAction(page, ai, description, nativeFn, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 优先用 Playwright 原生 API（快）
      if (nativeFn) {
        await nativeFn();
        // 原生成功后，用 aiAction 做一个空操作让 report 记录此步骤
        // （Midscene report 只录屏 AI 调用，原生操作无录屏）
        await ai.aiAction(`确认已完成：${description}`);
        return true;
      }
    } catch (e) {
      console.log(`[原生操作失败 ${attempt + 1}] ${e.message?.substring(0, 80)}`);
    }

    // 原生失败，用 AI 定位操作（自动录屏）
    try {
      console.log(`[AI 兜底] ${description}`);
      await ai.aiAction(description);
      return true;
    } catch (e) {
      console.log(`[AI 操作失败 ${attempt + 1}] ${e.message?.substring(0, 80)}`);
    }
  }
  return false;
}

// ================== 封装：提交后检查错误并自动纠正 ==================
async function submitWithAutoFix(page, ai, dialog, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 点击提交
    const submitBtn = dialog.locator('button').filter({ hasText: '提交' }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    console.log(`[提交] 第 ${attempt + 1} 次提交`);
    await page.waitForTimeout(3000);

    // 检查是否成功
    const dialogGone = await page.evaluate(() => {
      const d = document.querySelector('.el-dialog__wrapper');
      return !d || d.style.display === 'none';
    });
    const hasSuccessMsg = await page.evaluate(() => {
      return document.querySelector('.el-message--success') !== null;
    });

    if (dialogGone || hasSuccessMsg) {
      console.log('提交成功！');
      
      // 等待弹窗关闭动画完成
      await page.waitForTimeout(1500);
      
      // 如果弹窗还在，手动关闭
      const stillOpen = await page.evaluate(() => {
        const d = document.querySelector('.el-dialog__wrapper');
        return d && d.style.display !== 'none' && !d.classList.contains('v-modal-leave');
      });
      
      if (stillOpen) {
        console.log('弹窗未自动关闭，手动关闭...');
        const closeBtn = page.locator('.el-dialog__headerbtn').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
      
      await ai.aiAssert('赠品规则已成功创建，页面显示规则列表');
      await takeScreenshot(page, '7-提交成功');
      return true;
    }

    // 提交失败，用 AI 检查错误原因
    if (attempt < maxRetries) {
      console.log('[自动纠正] 提交失败，用 AI 分析错误原因...');
      const errorInfo = await ai.aiString('弹窗中显示了什么错误信息或校验提示？列出所有未通过校验的字段名和错误描述');
      console.log('[错误信息]', errorInfo);

      // 根据错误信息，用 AI 自动纠正
      console.log('[自动纠正] 根据错误信息尝试修复...');
      await ai.aiAction(`根据以下错误信息修正弹窗中的表单：${errorInfo}。请逐个修正每个报错字段`);
      await page.waitForTimeout(1000);
    } else {
      console.log('[最终失败] 已达最大重试次数，错误信息:', errorInfo || '未知');
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
    storageState: require('path').join(__dirname, 'auth.json'),
  });
  const page = await context.newPage();
  const ai = new PlaywrightAgent(page);

  // ================== 生成带随机数的规则名称 ==================
  const ruleName = `测试${String(Date.now()).slice(-6)}`;
  console.log('规则名称:', ruleName);

  // ================== 打开赠品规则页面 ==================
  await page.goto('http://test.inventorysysneibu.haiziwang.com/inventory-web/pages/giftnew/giftRule.html');
  await page.waitForLoadState('networkidle');

  // ================== 点击"新建赠品规则"按钮 ==================
  await smartAction(page, ai, '点击页面右上角"新建赠品规则"按钮', async () => {
    await page.locator('button').filter({ hasText: '新建赠品规则' }).click();
    const dialog = page.getByRole('dialog', { name: '新建赠品规则' });
    await dialog.waitFor({ timeout: 5000 });
  });
  const dialog = page.getByRole('dialog', { name: '新建赠品规则' });
  await page.waitForTimeout(800);

  // ================== 1. 填写发放场景 ==================
  await smartAction(page, ai, '点击发放场景"请选择"下拉框，选择"品牌新客"', async () => {
    const sceneSelect = dialog.locator('.el-select').first();
    await sceneSelect.locator('input').click();
    await page.waitForTimeout(500);
    await page.locator('.el-select-dropdown__item').filter({ hasText: '品牌新客' }).first().click();
  });
  await page.waitForTimeout(300);

  // ================== 2. 填写规则名称 ==================
  await smartAction(page, ai, `在规则名称输入框填入"${ruleName}"`, async () => {
    const nameInput = dialog.locator('input[placeholder="请输入规则名称"]');
    await nameInput.click();
    await nameInput.fill(ruleName);
  });

  // ================== 3. 填写生效时间段 ==================
  await smartAction(page, ai, '点击生效时间段的开始时间输入框', async () => {
    const dateRangePicker = dialog.locator('.el-date-editor--datetimerange');
    await dateRangePicker.click();
    await page.waitForSelector('.el-date-range-picker', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    // 计算动态日期：开始=今天+1天，结束=今天+30天
    const startDate = new Date(); startDate.setDate(startDate.getDate() + 1);
    const startDay = String(startDate.getDate());
    const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
    const endDay = String(endDate.getDate());
    const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
    console.log(`日期范围: ${startDate.getMonth()+1}/${startDay} ~ ${endDate.getMonth()+1}/${endDay}`);

    // 选开始日期（今天+1天）
    const leftPanel = page.locator('.el-date-range-picker__content').first();
    const startDayCell = leftPanel.locator('td.available').filter({ hasText: new RegExp(`^${startDay}$`) }).first();
    if (await startDayCell.count() > 0) {
      await startDayCell.click();
    } else {
      const tds = leftPanel.locator('td:not(.disabled):not(.prev-month)');
      for (let i = 0; i < await tds.count(); i++) {
        if ((await tds.nth(i).textContent())?.trim() === startDay) { await tds.nth(i).click(); break; }
      }
    }
    await page.waitForTimeout(200);

    // 选结束日期（今天+30天，同月则在左侧面板，跨月则在右侧面板）
    const targetPanel = sameMonth
      ? page.locator('.el-date-range-picker__content').first()
      : page.locator('.el-date-range-picker__content').nth(1);
    const endDayCell = targetPanel.locator('td.available').filter({ hasText: new RegExp(`^${endDay}$`) }).first();
    if (await endDayCell.count() > 0) {
      await endDayCell.click();
    } else {
      const tds = targetPanel.locator('td:not(.disabled):not(.next-month)');
      for (let i = 0; i < await tds.count(); i++) {
        if ((await tds.nth(i).textContent())?.trim() === endDay) { await tds.nth(i).click(); break; }
      }
    }
    await page.waitForTimeout(200);

    // 点击确定
    const confirmBtn = page.locator('.el-picker-panel__footer button:not(.is-disabled)').filter({ hasText: '确定' });
    await confirmBtn.click({ timeout: 5000 });
  });
  await page.waitForTimeout(300);

  // ================== 4. 选择参与部门（分步操作+验证） ==================
  // 步骤4a: 展开树节点
  await smartAction(page, ai, '点击参与部门区域"全部门店"左侧的三角形展开图标', async () => {
    const expandIcon = dialog.locator('.el-tree-node__expand-icon').first();
    await expandIcon.click();
  });
  await page.waitForTimeout(500);

  // 步骤4b: 勾选"直管"复选框
  let zhiguanChecked = false;
  for (let retry = 0; retry < 2; retry++) {
    // 先尝试原生
    try {
      const treeNodes = dialog.locator('.el-tree-node');
      const nodeCount = await treeNodes.count();
      for (let i = 0; i < nodeCount; i++) {
        const text = await treeNodes.nth(i).locator('.el-tree-node__content').textContent();
        if (text?.includes('直管')) {
          await treeNodes.nth(i).locator('.el-checkbox').click();
          break;
        }
      }
    } catch (e) {
      console.log(`[原生勾选失败] ${e.message?.substring(0, 60)}`);
    }

    // 验证是否勾上
    await page.waitForTimeout(500);
    zhiguanChecked = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.el-dialog__body .el-tree-node');
      for (const node of nodes) {
        const content = node.querySelector('.el-tree-node__content');
        if (content && content.textContent.includes('直管')) {
          const checkbox = node.querySelector('.el-checkbox');
          return checkbox && checkbox.classList.contains('is-checked');
        }
      }
      return false;
    });

    if (zhiguanChecked) {
      console.log('直管已勾选 ✓');
      break;
    }

    // 原生没勾上，用 AI 精确操作
    console.log(`[AI 兜底] 第${retry + 1}次尝试勾选"直管"复选框`);
    await ai.aiAction('在参与部门的树形列表中，找到"直管"这一行，点击它前面的复选框（方框图标），使其打勾选中');
    await page.waitForTimeout(500);

    // 再验证一次
    zhiguanChecked = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.el-dialog__body .el-tree-node');
      for (const node of nodes) {
        const content = node.querySelector('.el-tree-node__content');
        if (content && content.textContent.includes('直管')) {
          const checkbox = node.querySelector('.el-checkbox');
          return checkbox && checkbox.classList.contains('is-checked');
        }
      }
      return false;
    });

    if (zhiguanChecked) {
      console.log('直管已勾选 ✓ (AI)');
      break;
    }
  }

  if (!zhiguanChecked) {
    console.log('[警告] 直管复选框未能勾选，提交时可能会校验失败');
  } else {
    // 用 AI 断言确认勾选结果（让 report 录屏记录）
    await ai.aiAssert('参与部门区域中"直管"已被勾选选中，复选框有打勾标记');
    await takeScreenshot(page, '4-直管已勾选');
  }

  // ================== 5. 点击"新增"按钮添加商品 ==================
  await smartAction(page, ai, '滚动到商品清单区域，点击"新增"按钮', async () => {
    const addBtn = dialog.locator('button.el-button--text').filter({ hasText: '新增' });
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();
  });
  console.log('新增按钮点击成功');
  await page.waitForTimeout(800);

  // ================== 6. 填写商品编码 ==================
  await smartAction(page, ai, '在商品编码输入框填入8306381379', async () => {
    const codeInput = page.locator('input[placeholder="输入商品编码"]').first();
    await codeInput.click();
    await codeInput.fill('8306381379');
    await codeInput.blur();
  });
  await page.waitForTimeout(2000);

  // DOM 检查商品名称是否回填
  const productFilled = await page.evaluate(() => {
    const rows = document.querySelectorAll('table.el-table__body tbody tr');
    if (rows.length === 0) return false;
    const lastRow = rows[rows.length - 1];
    const tds = lastRow.querySelectorAll('td');
    for (const td of tds) {
      const text = td.textContent.trim();
      if (text && text !== '8306381379' && text.length > 1 && !/^\d+$/.test(text) && text !== '暂无数据') {
        return true;
      }
    }
    return false;
  });

  if (!productFilled) {
    console.log('商品名称未回填，尝试用 AI 触发查询...');
    await ai.aiAction('点击商品编码输入框，然后按Tab键触发商品名称查询');
    await page.waitForTimeout(2000);
  } else {
    console.log('商品名称已回填');
  }

  // ================== 7. 提交（带自动检查和纠正） ==================
  await submitWithAutoFix(page, ai, dialog);

  await browser.close();
})();
