const { chromium } = require('playwright');
const { PlaywrightAgent } = require('@midscene/web/playwright');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled']
  });

  // ================== 直接加载已登录状态 ==================
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

  // ================== 点击"新建赠品规则"按钮（Playwright 原生，快） ==================
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click();
  const dialog = page.getByRole('dialog', { name: '新建赠品规则' });
  await dialog.waitFor();
  await page.waitForTimeout(1000);

  // ================== 填写发放场景（AI 操作，下拉框难用原生 API） ==================
  await ai.aiAction('点击发放场景对应的"请选择"下拉框');
  await page.waitForTimeout(300);
  await ai.aiAction('在下拉列表中点击"品牌新客"选项');
  await page.waitForTimeout(300);

  // ================== 填写规则名称（原生 API，快） ==================
  const nameInput = dialog.locator('input[placeholder="请输入规则名称"]');
  await nameInput.click();
  await nameInput.fill(ruleName);

  // ================== 填写生效时间段 ==================
  await ai.aiAction('点击生效时间段的开始时间输入框');
  await page.waitForTimeout(800);
  await ai.aiAction('点击日历中2026年5月14日的日期');
  await page.waitForTimeout(300);
  await ai.aiAction('点击日历中2026年6月30日的日期');
  await page.waitForTimeout(300);
  await ai.aiAction('点击日期弹窗中"确定"按钮');
  await page.waitForTimeout(300);

  // ================== 选择参与部门 ==================
  await ai.aiAction('点击参与部门区域"全部门店"左侧的展开按钮');
  await page.waitForTimeout(300);
  await ai.aiAction('勾选参与部门中"直管"选项的复选框');
  await page.waitForTimeout(300);

  // ================== 滚动并点击"新增"按钮（全原生，快） ==================
  const addBtn = dialog.locator('a, button, span').filter({ hasText: /^(\+ ?)?新增$/ }).first();
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
  console.log('新增按钮点击成功');
  await page.waitForTimeout(800);

  // ================== 填写商品编码（原生 API，快） ==================
  const codeInput = page.locator('input[placeholder="输入商品编码"]').first();
  await codeInput.click();
  await codeInput.fill('8306381379');
  await codeInput.blur();
  await page.waitForTimeout(2000);

  // 用 DOM 检查商品名称是否回填（比 aiQuery 快得多）
  const productCheck = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    if (rows.length === 0) return { hasRow: false, name: null };
    const lastRow = rows[rows.length - 1];
    const cells = lastRow.querySelectorAll('td');
    // 遍历所有 td，找到非空文本内容的（排除商品编码列）
    let name = '';
    for (let i = 0; i < cells.length; i++) {
      const text = cells[i].textContent.trim();
      if (text && text !== '8306381379' && text.length > 1 && !/^\d+$/.test(text)) {
        name = text;
        break;
      }
    }
    return { hasRow: true, name };
  });
  console.log('商品名称:', productCheck.name || '未回填');

  // 如果商品名称没回填，按 Tab 触发
  if (!productCheck.name || productCheck.name === '') {
    console.log('商品名称未回填，按 Tab 触发查询...');
    await codeInput.click();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
  }

  // ================== 提交（原生 API，快） ==================
  const submitBtn = dialog.locator('button').filter({ hasText: '提交' }).first();
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  console.log('已点击提交');
  // 用 DOM 检查是否提交成功（比 aiBoolean 快）
  await page.waitForTimeout(3000);
  const dialogGone = await page.evaluate(() => {
    const dialog = document.querySelector('.el-dialog__wrapper');
    return !dialog || dialog.style.display === 'none' || dialog.classList.contains('v-modal-leave');
  });
  // 也检查是否有成功提示
  const hasSuccessMsg = await page.evaluate(() => {
    const msg = document.querySelector('.el-message--success');
    return msg !== null;
  });
  if (dialogGone || hasSuccessMsg) {
    console.log('提交成功！');
  } else {
    console.log('提交可能失败，用 AI 检查错误原因...');
    const errorInfo = await ai.aiString('弹窗中显示了什么错误信息？');
    console.log('错误信息:', errorInfo);
  }

  await browser.close();
})();
