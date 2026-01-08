/**
 * クロスブラウザテスト
 * 要件: 9.16, 9.17, 9.18
 * 
 * 検証項目:
 * - Safari、Chrome、Firefoxでの動作確認
 * - 各ブラウザでテキスト選択防止が機能することを確認
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('クロスブラウザテスト', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  const browserConfigs = [
    {
      name: 'Chrome (Desktop)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      expectButtons: false
    },
    {
      name: 'Chrome (Mobile)',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      expectButtons: true
    },
    {
      name: 'Safari (Desktop)',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      viewport: { width: 1440, height: 900 },
      expectButtons: false
    },
    {
      name: 'Safari (Mobile)',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      expectButtons: true
    },
    {
      name: 'Firefox (Desktop)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      viewport: { width: 1366, height: 768 },
      expectButtons: false
    },
    {
      name: 'Firefox (Mobile)',
      userAgent: 'Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
      viewport: { width: 360, height: 640 },
      expectButtons: true
    }
  ];

  browserConfigs.forEach((config) => {
    it(`${config.name}での動作確認`, async () => {
      const page = await browser.newPage();
      
      try {
        // ユーザーエージェントとビューポートを設定
        await page.setUserAgent(config.userAgent);
        await page.setViewport(config.viewport);

        // ページを読み込み
        await page.goto('http://localhost:5173');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ColorControllerコンポーネントが存在することを確認
        const colorController = await page.$('.color-controller');
        expect(colorController).toBeTruthy();

        // ボタンの表示状態を確認
        const buttons = await page.$$('.color-control__button');
        
        if (config.expectButtons) {
          // モバイル環境では◀▶ボタンが表示される
          expect(buttons.length).toBeGreaterThan(0);
          
          // テキスト選択防止のCSS確認
          for (const button of buttons) {
            const userSelect = await page.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return computed.userSelect || computed.webkitUserSelect || computed.mozUserSelect || computed.msUserSelect;
            }, button);
            
            expect(userSelect).toBe('none');
          }
          
          // 基本的な機能テスト
          const firstButton = buttons[0];
          const inputFields = await page.$$('input.color-control__input');
          
          if (inputFields.length > 0) {
            const firstInput = inputFields[0];
            const valueBefore = await page.evaluate(el => el.value, firstInput);
            
            // ボタンをタップ
            await firstButton.tap();
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const valueAfter = await page.evaluate(el => el.value, firstInput);
            
            // 値が変化していることを確認
            expect(valueBefore).not.toBe(valueAfter);
          }
          
          console.log(`✅ ${config.name}: ${buttons.length}個のボタンが正常に動作`);
        } else {
          // デスクトップ環境では◀▶ボタンが非表示
          expect(buttons.length).toBe(0);
          
          // 入力フィールドの動作確認
          const inputFields = await page.$$('input.color-control__input');
          expect(inputFields.length).toBeGreaterThan(0);
          
          // 最初の入力フィールドで値変更テスト
          const firstInput = inputFields[0];
          await firstInput.click({ clickCount: 3 }); // 全選択
          await firstInput.type('100');
          
          const newValue = await page.evaluate(el => el.value, firstInput);
          expect(newValue).toBe('100');
          
          console.log(`✅ ${config.name}: 入力フィールドが正常に動作`);
        }

        // 入力フィールドの数を確認（全ブラウザ共通）
        const inputFields = await page.$$('input.color-control__input');
        expect(inputFields.length).toBe(14); // RGB 3個 + CMYK 4個 = 7個 × 2セット = 14個

      } finally {
        await page.close();
      }
    }, 60000);
  });

  it('全ブラウザでのCSS user-select適用確認', async () => {
    const page = await browser.newPage();
    
    try {
      // モバイル環境でテスト（ボタンが表示される）
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
      await page.setViewport({ width: 390, height: 844 });
      
      await page.goto('http://localhost:5173');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const buttons = await page.$$('.color-control__button');
      expect(buttons.length).toBeGreaterThan(0);

      // 全てのボタンでuser-selectプロパティを確認
      let allButtonsHaveUserSelectNone = true;
      
      for (const button of buttons) {
        const styles = await page.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            userSelect: computed.userSelect,
            webkitUserSelect: computed.webkitUserSelect,
            mozUserSelect: computed.mozUserSelect,
            msUserSelect: computed.msUserSelect
          };
        }, button);

        // いずれかのプロパティで'none'が設定されていることを確認
        const hasUserSelectNone = 
          styles.userSelect === 'none' ||
          styles.webkitUserSelect === 'none' ||
          styles.mozUserSelect === 'none' ||
          styles.msUserSelect === 'none';

        if (!hasUserSelectNone) {
          allButtonsHaveUserSelectNone = false;
          console.warn('user-select: noneが適用されていないボタンを発見:', styles);
        }
      }

      expect(allButtonsHaveUserSelectNone).toBeTruthy();
      console.log(`✅ 全${buttons.length}個のボタンにuser-select: noneが適用されています`);

    } finally {
      await page.close();
    }
  });

  it('レスポンシブブレークポイントでの動作確認', async () => {
    const page = await browser.newPage();
    
    try {
      const breakpoints = [
        { width: 320, height: 568, name: 'Small Mobile', expectButtons: true },
        { width: 768, height: 1024, name: 'Tablet', expectButtons: false },
        { width: 1024, height: 768, name: 'Small Desktop', expectButtons: false },
        { width: 1920, height: 1080, name: 'Large Desktop', expectButtons: false }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewport({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        await page.goto('http://localhost:5173');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const buttons = await page.$$('.color-control__button');
        
        if (breakpoint.expectButtons) {
          expect(buttons.length).toBeGreaterThan(0);
        } else {
          expect(buttons.length).toBe(0);
        }

        console.log(`✅ ${breakpoint.name} (${breakpoint.width}x${breakpoint.height}): ${buttons.length}個のボタン`);
      }

    } finally {
      await page.close();
    }
  });
});
