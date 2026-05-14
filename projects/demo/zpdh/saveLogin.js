const { chromium } = require('playwright');
const { PlaywrightAgent } = require('@midscene/web/playwright');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  const ai = new PlaywrightAgent(page);

  // ========== 这里只执行一次登录 ==========
  await page.goto('http://test.site.haiziwang.com');
  await page.waitForLoadState('networkidle');
  
  console.log('输入账户...');
  const accountInput = page.locator('input[placeholder*="账户"], input[placeholder*="账号"], input[name*="account"], input[name*="username"]').first();
  await accountInput.click();
  await accountInput.fill('19017539');
  console.log('账户输入完成');

  // 等待"系统繁忙"提示消失
  console.log('等待系统响应...');
  await page.waitForTimeout(1000);

  console.log('输入密码...');
  const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"]').first();
  await passwordInput.click();
  await passwordInput.fill('s05311330');
  console.log('密码输入完成');

    console.log('等待3秒...');
    await page.waitForTimeout(1000);

    console.log('AI 右滑确认登录...');
    await ai.aiAct('按住滑块向右拖动到底完成验证');
    console.log('滑动验证完成');

    console.log('等待3秒，让页面完全加载...');
    await page.waitForTimeout(1000);

  // ========== 关键：保存登录状态到文件 ==========
  await context.storageState({ path: require('path').join(__dirname, 'auth.json') });
  console.log('✅ 登录状态已保存！以后不用再登录！');

  await browser.close();
})();