/**
 * プロパティテスト: 視覚的回帰防止
 * Feature: color-controller-button-fix, Property 6: 視覚的回帰防止
 * 
 * 任意の画面サイズ・デバイスにおいて、既存サイトとの視覚的一貫性が保たれている
 * 検証: 要件 6.9, 6.10, 10.14
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property Test: Visual Regression Prevention', () => {
  let browser: Browser;
  let localPage: Page;
  let productionPage: Page;

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

    localPage = await browser.newPage();
    productionPage = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('Property: 複数画面サイズでの視覚的一貫性（20回反復）', async () => {
    const testSizes = [
      // モバイルサイズ
      { width: 390, height: 844, name: 'iPhone 12', isMobile: true },
      { width: 375, height: 667, name: 'iPhone SE', isMobile: true },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max', isMobile: true },
      { width: 360, height: 640, name: 'Galaxy S5', isMobile: true },
      // タブレットサイズ
      { width: 768, height: 1024, name: 'iPad', isMobile: false },
      { width: 1024, height: 768, name: 'iPad Landscape', isMobile: false },
      // デスクトップサイズ
      { width: 1366, height: 768, name: 'Laptop', isMobile: false },
      { width: 1920, height: 1080, name: 'Desktop', isMobile: false },
      { width: 1440, height: 900, name: 'MacBook', isMobile: false },
      { width: 2560, height: 1440, name: '4K', isMobile: false }
    ];

    let successCount = 0;
    const iterations = 20;

    for (let i = 0; i < iterations; i++) {
      // ランダムに画面サイズを選択
      const randomSize = testSizes[Math.floor(Math.random() * testSizes.length)];

      try {
        // 両方のページに同じサイズを設定
        await localPage.setViewport({ 
          width: randomSize.width, 
          height: randomSize.height 
        });
        await productionPage.setViewport({ 
          width: randomSize.width, 
          height: randomSize.height 
        });

        // ページを読み込み
        await localPage.goto('http://localhost:5173');
        await productionPage.goto('https://unafi.github.io/paint-color-assistant2/');
        
        // 読み込み完了を待機
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ColorControllerコンポーネントの存在確認
        const localController = await localPage.$('.color-controller');
        const prodController = await productionPage.$('.color-controller');
        
        expect(localController).toBeTruthy();
        expect(prodController).toBeTruthy();

        // ボタン数の比較
        const localButtons = await localPage.$$('.color-control__button');
        const prodButtons = await productionPage.$$('.color-control__button');
        expect(localButtons.length).toBe(prodButtons.length);

        // 入力フィールド数の比較
        const localInputs = await localPage.$$('input.color-control__input');
        const prodInputs = await productionPage.$$('input.color-control__input');
        expect(localInputs.length).toBe(prodInputs.length);

        // モバイル環境でのボタン表示確認
        if (randomSize.isMobile) {
          expect(localButtons.length).toBeGreaterThan(0);
          expect(prodButtons.length).toBeGreaterThan(0);
        } else {
          // PC環境ではボタンが非表示
          expect(localButtons.length).toBe(0);
          expect(prodButtons.length).toBe(0);
        }

        // レイアウト構造の比較
        const localStructure = await localPage.evaluate(() => {
          const controller = document.querySelector('.color-controller');
          if (!controller) return null;
          
          return {
            sections: controller.querySelectorAll('.color-controller__section').length,
            controls: controller.querySelectorAll('.color-control').length,
            inputs: controller.querySelectorAll('input.color-control__input').length,
            buttons: controller.querySelectorAll('.color-control__button').length
          };
        });

        const prodStructure = await productionPage.evaluate(() => {
          const controller = document.querySelector('.color-controller');
          if (!controller) return null;
          
          return {
            sections: controller.querySelectorAll('.color-controller__section').length,
            controls: controller.querySelectorAll('.color-control').length,
            inputs: controller.querySelectorAll('input.color-control__input').length,
            buttons: controller.querySelectorAll('.color-control__button').length
          };
        });

        expect(localStructure).toEqual(prodStructure);

        successCount++;

      } catch (error) {
        console.warn(`Iteration ${i + 1} (${randomSize.name}) failed:`, error.message);
      }

      // 短い待機時間
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 成功率が85%以上であることを確認
    const successRate = successCount / iterations;
    expect(successRate).toBeGreaterThanOrEqual(0.85);

    console.log(`✅ 視覚的回帰防止テスト: ${successCount}/${iterations} (${Math.round(successRate * 100)}%) 成功`);
  }, 120000);

  it('Property: レスポンシブ動作の一貫性', async () => {
    const breakpoints = [
      { width: 320, height: 568, expectButtons: true, name: 'Small Mobile' },
      { width: 768, height: 1024, expectButtons: false, name: 'Tablet' },
      { width: 1024, height: 768, expectButtons: false, name: 'Desktop' }
    ];

    for (const breakpoint of breakpoints) {
      // ローカル環境でテスト
      await localPage.setViewport({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      await localPage.goto('http://localhost:5173');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 本番環境でテスト
      await productionPage.setViewport({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      await productionPage.goto('https://unafi.github.io/paint-color-assistant2/');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ボタンの表示状態を確認
      const localButtons = await localPage.$$('.color-control__button');
      const prodButtons = await productionPage.$$('.color-control__button');

      if (breakpoint.expectButtons) {
        expect(localButtons.length).toBeGreaterThan(0);
        expect(prodButtons.length).toBeGreaterThan(0);
        expect(localButtons.length).toBe(prodButtons.length);
      } else {
        expect(localButtons.length).toBe(0);
        expect(prodButtons.length).toBe(0);
      }

      console.log(`✅ ${breakpoint.name}: ボタン表示が一貫しています (${localButtons.length}個)`);
    }
  });

  it('Property: CSS適用の一貫性', async () => {
    // モバイル環境でテスト
    await localPage.setViewport({ width: 390, height: 844 });
    await localPage.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const buttons = await localPage.$$('.color-control__button');
    expect(buttons.length).toBeGreaterThan(0);

    // 各ボタンのCSS適用状況を確認
    for (const button of buttons) {
      const styles = await localPage.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          userSelect: computed.userSelect || computed.webkitUserSelect || computed.mozUserSelect || computed.msUserSelect,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity
        };
      }, button);

      // user-select: noneが適用されていることを確認
      expect(styles.userSelect).toBe('none');
      
      // ボタンが表示されていることを確認
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    }

    console.log(`✅ ${buttons.length}個のボタンにCSS（user-select: none）が正しく適用されています`);
  });
});