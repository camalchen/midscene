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
    viewport: { width: 1525, height: 919 },
    ignoreHTTPSErrors: true,
    storageState: require('path').join(__dirname, 'auth.json'),
  });
  const page = await context.newPage();
  const ai = new PlaywrightAgent(page);

  await page.goto('http://test.inventorysysneibu.haiziwang.com/inventory-web/pages/giftnew/giftRule.html');
  await page.waitForLoadState('networkidle');

  // 点击新建赠品规则按钮
  await page.locator('button').filter({ hasText: '新建赠品规则' }).click();
  await page.waitForTimeout(2000);

  // 抓取弹窗内所有表单元素的 DOM 结构
  const domInfo = await page.evaluate(() => {
    const dialogBody = document.querySelector('.el-dialog__body');
    if (!dialogBody) return '弹窗未找到';

    const results = [];

    // 1. 所有 input 元素
    const inputs = dialogBody.querySelectorAll('input');
    inputs.forEach((input, i) => {
      results.push({
        index: i,
        tag: 'input',
        type: input.type,
        placeholder: input.placeholder,
        value: input.value,
        className: input.className,
        readOnly: input.readOnly,
        id: input.id,
        parentClass: input.parentElement?.className || '',
        grandParentClass: input.parentElement?.parentElement?.className || '',
      });
    });

    // 2. 所有 select 元素
    const selects = dialogBody.querySelectorAll('select');
    selects.forEach((sel, i) => {
      results.push({
        index: i,
        tag: 'select',
        className: sel.className,
        options: Array.from(sel.options).map(o => ({ value: o.value, text: o.text })),
      });
    });

    // 3. 所有按钮
    const buttons = dialogBody.querySelectorAll('button, a[class*="btn"], span[class*="btn"]');
    buttons.forEach((btn, i) => {
      results.push({
        index: i,
        tag: btn.tagName,
        text: btn.textContent.trim().substring(0, 30),
        className: btn.className,
      });
    });

    // 4. 所有包含"新增"文字的元素
    const allEls = dialogBody.querySelectorAll('*');
    const addBtns = [];
    allEls.forEach(el => {
      if (el.children.length === 0 || el.tagName === 'A' || el.tagName === 'BUTTON') {
        const text = el.textContent.trim();
        if (text.includes('新增')) {
          addBtns.push({
            tag: el.tagName,
            text: text.substring(0, 30),
            className: el.className,
            parentTag: el.parentElement?.tagName,
            parentClass: el.parentElement?.className?.substring(0, 50),
          });
        }
      }
    });

    // 5. 下拉框结构 - el-select
    const elSelects = dialogBody.querySelectorAll('.el-select');
    const selectInfo = [];
    elSelects.forEach((sel, i) => {
      const input = sel.querySelector('input');
      selectInfo.push({
        index: i,
        placeholder: input?.placeholder || '',
        value: input?.value || '',
        className: sel.className,
      });
    });

    // 6. 日期选择器结构
    const datePickers = dialogBody.querySelectorAll('.el-date-editor');
    const dateInfo = [];
    datePickers.forEach((dp, i) => {
      const input = dp.querySelector('input');
      dateInfo.push({
        index: i,
        placeholder: input?.placeholder || '',
        className: dp.className,
      });
    });

    // 7. 复选框/树结构
    const checkboxes = dialogBody.querySelectorAll('.el-checkbox, .el-tree');
    const checkInfo = [];
    checkboxes.forEach((cb, i) => {
      checkInfo.push({
        index: i,
        tag: cb.tagName,
        className: cb.className?.substring(0, 80),
        text: cb.textContent?.trim().substring(0, 50),
      });
    });

    return {
      inputs: results.filter(r => r.tag === 'input'),
      selects: results.filter(r => r.tag === 'select'),
      buttons: results.filter(r => ['BUTTON', 'A', 'SPAN'].includes(r.tag)),
      addButtons: addBtns,
      elSelects: selectInfo,
      datePickers: dateInfo,
      checkboxes: checkInfo,
    };
  });

  console.log('========== DOM 结构分析 ==========');
  console.log(JSON.stringify(domInfo, null, 2));

  // 额外：获取弹窗表单的完整 HTML 骨架（只保留标签和 class，去掉文本内容节省空间）
  const htmlSkeleton = await page.evaluate(() => {
    const dialogBody = document.querySelector('.el-dialog__body');
    if (!dialogBody) return '';

    function walk(el, depth = 0) {
      if (depth > 6) return '';
      const tag = el.tagName?.toLowerCase();
      if (!tag || ['script', 'style', 'svg', 'path'].includes(tag)) return '';
      const cls = el.className && typeof el.className === 'string' ? ` class="${el.className.substring(0, 60)}"` : '';
      const placeholder = el.placeholder ? ` placeholder="${el.placeholder}"` : '';
      const text = el.children.length === 0 && el.textContent?.trim() ? ` text="${el.textContent.trim().substring(0, 30)}"` : '';
      let result = '  '.repeat(depth) + `<${tag}${cls}${placeholder}${text}>\n`;
      for (const child of el.children) {
        result += walk(child, depth + 1);
      }
      return result;
    }

    return walk(dialogBody);
  });
  console.log('========== HTML 骨架 ==========');
  console.log(htmlSkeleton);

  await browser.close();
})();
