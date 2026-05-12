require('dotenv').config();
const { PlaywrightAgent } = require('@midscene/web');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // 🔥 关键：调用你本地能登录的 Chrome，不是自带浏览器
    args: [
      '--disable-blink-features=AutomationControlled', // 🔥 关闭自动化标记
      '--start-maximized',
    ],
    ignoreDefaultArgs: ['--enable-automation'] // 🔥 彻底隐藏机器人特征
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true, // 你已经加过的证书忽略
    locale: 'zh-CN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  // 🔥 最关键：抹掉机器人指纹
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });

  const page = await context.newPage();
  const agent = new PlaywrightAgent(page, {
    aiActionContext: '你正在操作一个网站登录和导航流程',
  });

  try {
    console.log('打开登录页面...');
    await page.goto('http://test.site.haiziwang.com');
    await page.waitForLoadState('networkidle');
    console.log('页面加载完成');

    console.log('等待2秒...');
    await page.waitForTimeout(2000);

    console.log('AI 输入账户...');
    await agent.aiAct('在账户输入框中输入19017539');
    console.log('账户输入完成');

    // 等待"系统繁忙"提示消失
    console.log('等待系统响应...');
    await page.waitForTimeout(5000);

    console.log('AI 输入密码...');
    await agent.aiAct('在密码输入框中输入s05311330');
    console.log('密码输入完成');

    console.log('等待3秒...');
    await page.waitForTimeout(3000);

    console.log('AI 右滑确认登录...');
    await agent.aiAct('按住滑块向右拖动到底完成验证');
    console.log('滑动验证完成');

    console.log('等待10秒，让页面完全加载...');
    await page.waitForTimeout(10000);

    console.log('AI 搜索菜单 - 返利订单查询...');
    await agent.aiAct('在左侧菜单中找到搜索框，输入"返利订单查询"，然后从搜索结果中点击"返利订单查询"进入该页面');

    console.log('等待页面加载完成...');
    await page.waitForTimeout(3000);

    console.log('登录和导航完成！');

  } catch (err) {
    console.error('执行出错:', err.message);
    console.error('错误堆栈:', err.stack);
    console.log('截图已保存用于调试');
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    } catch (screenshotErr) {
      console.log('截图失败:', screenshotErr.message);
    }
    console.log('\n===== 发生错误，浏览器保持打开状态供检查 =====');
    console.log('请检查浏览器窗口查看当前页面状态');
    console.log('手动关闭浏览器后脚本才会退出');
    // 不关闭浏览器，等待用户手动关闭
    await new Promise(() => {}); // 永久等待
  } finally {
    // 正常完成，关闭浏览器
    try {
      await context.close();
      console.log('浏览器已关闭！');
    } catch (closeErr) {
      console.log('关闭浏览器时出错:', closeErr.message);
    }
  }
})();
