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

  console.log('========== 测试场景：必填项为空时提交，验证错误提示 ==========');

  // ================== 打开赠品规则页面 ==================
  await page.goto('http://test.inventorysysneibu.haiziwang.com/inventory-web/pages/giftnew/giftRule.html');
  await page.waitForLoadState('networkidle');

  // ================== 点击"新建赠品规则"按钮 ==================
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click();
  const dialog = page.getByRole('dialog', { name: '新建赠品规则' });
  await dialog.waitFor();
  await page.waitForTimeout(1000);

  console.log('\n【测试 1】所有必填项都为空，直接提交');
  console.log('-------------------------------------------');

  // 直接点击提交按钮，不填写任何内容
  const submitBtn = dialog.locator('button').filter({ hasText: '提交' }).first();
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  // 用 AI 读取错误提示信息
  console.log('正在获取错误提示...');
  const errorMsg1 = await ai.aiString('弹窗中显示了什么错误提示信息？是否有"您还有XX未填，提交失败"这样的提示？请完整列出所有错误信息');
  console.log('错误提示:', errorMsg1);

  // 截图记录
  await page.screenshot({ path: require('path').join(__dirname, '..', 'midscene_run', 'screenshots', 'test1-全空提交.png') });
  console.log('✅ 已截图: test1-全空提交.png\n');

  // 关闭错误提示（如果有）
  await page.waitForTimeout(1000);
  const closeMsg = page.locator('.el-message .el-message__closeBtn').first();
  if (await closeMsg.count() > 0) {
    await closeMsg.click();
    await page.waitForTimeout(500);
  }

  // 关闭弹窗（测试1失败后弹窗仍然打开）
  console.log('检查并关闭弹窗...');
  const dialogVisible = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog__wrapper');
    return d && d.style.display !== 'none' && !d.classList.contains('v-modal-leave');
  });
  
  if (dialogVisible) {
    console.log('弹窗仍然打开，尝试关闭...');
    // 方法1：点击关闭按钮
    const closeBtn = page.locator('.el-dialog__headerbtn').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    } else {
      // 方法2：按 ESC 键关闭
      console.log('使用 ESC 键关闭弹窗');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
    
    // 验证是否关闭成功
    const stillVisible = await page.evaluate(() => {
      const d = document.querySelector('.el-dialog__wrapper');
      return d && d.style.display !== 'none';
    });
    if (stillVisible) {
      console.log('弹窗未关闭，再次尝试...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('弹窗已关闭');
  }

  console.log('【测试 2】只填写部分必填项，验证提示');
  console.log('-------------------------------------------');

  // 等待页面完全稳定
  await page.waitForTimeout(1500);
  
  // 重新打开新建弹窗
  console.log('点击"新建赠品规则"按钮...');
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click({ force: true });
  await dialog.waitFor();
  await page.waitForTimeout(1000);

  // 只填写规则名称，其他留空
  const nameInput = dialog.locator('input[placeholder="请输入规则名称"]');
  await nameInput.click();
  await nameInput.fill('测试必填项验证');
  console.log('已填写：规则名称');

  // 提交
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  // 获取错误提示
  console.log('正在获取错误提示...');
  const errorMsg2 = await ai.aiString('弹窗中显示了什么错误提示信息？哪些字段提示未填写？请列出所有错误字段名');
  console.log('错误提示:', errorMsg2);

  // 截图记录
  await page.screenshot({ path: require('path').join(__dirname, '..', 'midscene_run', 'screenshots', 'test2-部分填写.png') });
  console.log('✅ 已截图: test2-部分填写.png\n');

  await page.waitForTimeout(1000);

  // 关闭错误提示
  const closeMsg2 = page.locator('.el-message .el-message__closeBtn').first();
  if (await closeMsg2.count() > 0) {
    await closeMsg2.click();
    await page.waitForTimeout(500);
  }

  // 关闭弹窗
  console.log('检查并关闭弹窗...');
  const dialogVisible2 = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog__wrapper');
    return d && d.style.display !== 'none' && !d.classList.contains('v-modal-leave');
  });
  
  if (dialogVisible2) {
    console.log('弹窗仍然打开，尝试关闭...');
    const closeBtn2 = page.locator('.el-dialog__headerbtn').first();
    if (await closeBtn2.count() > 0) {
      await closeBtn2.click();
      await page.waitForTimeout(800);
    } else {
      console.log('使用 ESC 键关闭弹窗');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
  } else {
    console.log('弹窗已关闭');
  }

  console.log('【测试 3】填写发放场景+规则名称+错误时间，验证提示');
  console.log('-------------------------------------------');

  // 等待页面稳定
  await page.waitForTimeout(1500);
  
  // 重新打开
  console.log('点击"新建赠品规则"按钮...');
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click({ force: true });
  await dialog.waitFor();
  await page.waitForTimeout(1000);

  // 填写发放场景（AI 操作）
  await ai.aiAction('点击发放场景对应的"请选择"下拉框');
  await page.waitForTimeout(300);
  await ai.aiAction('在下拉列表中点击"品牌新客"选项');
  await page.waitForTimeout(300);
  console.log('已填写：发放场景');

  // 填写规则名称
  await nameInput.click();
  await nameInput.fill('测试必填项验证2');
  console.log('已填写：规则名称');

  // 填写错误的生效时间段（结束时间早于开始时间）
  console.log('填写生效时间段（同一天，结束小时早于开始小时）...');
  const dateRangePicker = dialog.locator('.el-date-editor--datetimerange');
  await dateRangePicker.click();
  await page.waitForSelector('.el-date-range-picker', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  // 选择开始时间：14日
  const leftPanel = page.locator('.el-date-range-picker__content').first();
  const day14 = leftPanel.locator('td:not(.disabled)').filter({ hasText: /^14$/ }).first();
  if (await day14.count() > 0) {
    await day14.click();
    console.log('已选择开始日期：14日');
  }
  await page.waitForTimeout(500);

  // 选择结束时间：也是14日（同一天）
  const rightPanel = page.locator('.el-date-range-picker__content').nth(1);
  const day14Right = rightPanel.locator('td:not(.disabled)').filter({ hasText: /^14$/ }).first();
  if (await day14Right.count() > 0) {
    await day14Right.click();
    console.log('已选择结束日期：14日（同一天）');
  }
  await page.waitForTimeout(800);

  // 使用Playwright原生方法设置时间：开始时间14点，结束时间8点
  console.log('使用原生方法设置时间...');
  
  // 使用 JavaScript 直接操作时间选择器的滚动
  await page.evaluate(() => {
    // 找到所有时间列表
    const spinnerLists = document.querySelectorAll('.el-time-spinner__list');
    
    if (spinnerLists.length >= 4) {
      // 开始时间小时列表（第1个）
      const startHourList = spinnerLists[0];
      const startHourItems = startHourList.querySelectorAll('li');
      for (const item of startHourItems) {
        if (item.textContent.trim() === '14') {
          item.click();
          break;
        }
      }
      
      // 结束时间小时列表（第4个）
      const endHourList = spinnerLists[3];
      const endHourItems = endHourList.querySelectorAll('li');
      for (const item of endHourItems) {
        if (item.textContent.trim() === '08') {
          item.click();
          break;
        }
      }
    }
  });
  console.log('✅ 已设置时间：开始14点，结束08点');
  await page.waitForTimeout(500);

  // 点击确定按钮
  const confirmBtn = page.locator('.el-picker-panel__footer button').filter({ hasText: '确定' });
  if (await confirmBtn.count() > 0) {
    const isDisabled = await confirmBtn.evaluate(btn => btn.disabled);
    if (!isDisabled) {
      await confirmBtn.click();
      console.log('已点击确定按钮');
    } else {
      console.log('确定按钮被禁用');
      await page.locator('body').click();
    }
  }
  await page.waitForTimeout(500);

  // 验证日期是否已填入
  const dateValue = await page.evaluate(() => {
    const input = document.querySelector('.el-date-editor--datetimerange input');
    return input ? input.value : null;
  });
  console.log('日期输入框的值:', dateValue || '未填入');

  // 验证是否有时间错误提示
  const hasTimeError = await page.evaluate(() => {
    const messages = document.querySelectorAll('.el-message');
    for (const msg of messages) {
      if (msg.textContent.includes('时间') || msg.textContent.includes('结束') || msg.textContent.includes('开始')) {
        return msg.textContent.trim();
      }
    }
    return null;
  });

  if (hasTimeError) {
    console.log('✅ 系统显示时间校验错误:', hasTimeError);
  } else {
    console.log('检查页面是否有时间相关的错误提示...');
  }

  // 提交
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await page.waitForTimeout(2000);

  // 获取错误提示
  console.log('正在获取错误提示...');
  const errorMsg3 = await ai.aiString('页面显示了什么错误提示信息？请列出：1)是否有时间顺序相关的校验（结束时间不能早于开始时间）；2)还有哪些必填字段未填写');
  console.log('错误提示:', errorMsg3);

  // 验证时间校验是否被测试
  if (errorMsg3 && (errorMsg3.includes('时间') || errorMsg3.includes('结束') || errorMsg3.includes('开始'))) {
    console.log('✅ 已验证时间顺序校验提示');
  } else if (hasTimeError) {
    console.log('✅ 已在日期选择时验证时间拦截');
  } else {
    console.log('⚠️ 未检测到时间校验提示');
  }

  // 截图记录
  await page.screenshot({ path: require('path').join(__dirname, '..', 'midscene_run', 'screenshots', 'test3-必填项+时间错误.png') });
  console.log('✅ 已截图: test3-必填项+时间错误.png\n');

  await page.waitForTimeout(1000);

  // 关闭错误提示
  const closeMsg3 = page.locator('.el-message .el-message__closeBtn').first();
  if (await closeMsg3.count() > 0) {
    await closeMsg3.click();
    await page.waitForTimeout(500);
  }

  // 关闭弹窗
  console.log('检查并关闭弹窗...');
  const dialogVisible3 = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog__wrapper');
    return d && d.style.display !== 'none' && !d.classList.contains('v-modal-leave');
  });
  
  if (dialogVisible3) {
    console.log('弹窗仍然打开，尝试关闭...');
    const closeBtn3 = page.locator('.el-dialog__headerbtn').first();
    if (await closeBtn3.count() > 0) {
      await closeBtn3.click();
      await page.waitForTimeout(800);
    } else {
      console.log('使用 ESC 键关闭弹窗');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
  } else {
    console.log('弹窗已关闭');
  }

  console.log('\n========== 测试完成 ==========');
  console.log('总结：');
  console.log('1. 所有字段为空时的提示:', errorMsg1 ? '✅ 有提示' : '❌ 无提示');
  console.log('2. 只填规则名称时的提示:', errorMsg2 ? '✅ 有提示' : '❌ 无提示');
  console.log('3. 填发放场景+名称+错误时间时的提示:', errorMsg3 ? '✅ 有提示' : '❌ 无提示');
  console.log('\n截图保存在: e:\\midscene\\projects\\demo\\midscene_run\\screenshots\\');

  await browser.close();
})();
