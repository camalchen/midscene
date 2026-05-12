/**
 * Midscene.js Web Demo - 使用本地 Chrome
 */
const { PlaywrightAgent } = require('@midscene/web');
const { chromium } = require('playwright');

(async () => {
  console.log('启动 Midscene Web 自动化...');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });
  const page = await browser.newPage();

  const agent = new PlaywrightAgent(page, {
    aiActionContext: '你正在控制一个浏览器页面进行操作',
  });

  try {
    console.log('打开百度...');
    await page.goto('https://www.baidu.com');

    console.log('AI 执行操作...');
    await agent.aiAct('在搜索框中输入Midscene.js，然后点击搜索按钮');

    console.log('AI 获取查询结果...');
    const result = await agent.aiQuery(
      '{titles: string[]}, 获取搜索结果前3个标题'
    );
    console.log('查询结果:', JSON.stringify(result, null, 2));

    console.log('AI 断言...');
    await agent.aiAssert('页面显示了搜索结果列表');
    console.log('断言通过！');

  } catch (err) {
    console.error('执行出错:', err.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('完成！');
  }
})();
