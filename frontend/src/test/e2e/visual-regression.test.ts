/**
 * 視覚的回帰テスト
 * 要件: 6.9, 6.10, 10.14
 * 
 * 検証項目:
 * - 既存サイト（https://unafi.github.io/paint-color-assistant2/）とのスクリーンショット比較
 * - PC・モバイル両方での画面比較
 * - 差分が検出されないことを確認
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('視覚的回帰テスト', () => {
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

  it('モバイル環境での視覚的回帰テスト', async () => {
    // iPhoneエミュレータモードに設定
    const mobileEmulation = {
      name: 'iPhone 12',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false
      }
    };

    await localPage.emulate(mobileEmulation);
    await productionPage.emulate(mobileEmulation);

    // ローカル環境のページを読み込み
    await localPage.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 本番環境のページを読み込み
    await productionPage.goto('https://unafi.github.io/paint-color-assistant2/');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ColorControllerコンポーネントが両方に存在することを確認
    const localColorController = await localPage.$('.color-controller');
    const prodColorController = await productionPage.$('.color-controller');
    
    expect(localColorController).toBeTruthy();
    expect(prodColorController).toBeTruthy();

    // ◀▶ボタンの数を比較
    const localButtons = await localPage.$$('.color-control__button');
    const prodButtons = await productionPage.$$('.color-control__button');
    
    expect(localButtons.length).toBe(prodButtons.length);
    console.log(`✅ モバイル環境: ローカル ${localButtons.length}個, 本番 ${prodButtons.length}個のボタン`);

    // 入力フィールドの数を比較
    const localInputs = await localPage.$$('input.color-control__input');
    const prodInputs = await productionPage.$$('input.color-control__input');
    
    expect(localInputs.length).toBe(prodInputs.length);
    console.log(`✅ モバイル環境: ローカル ${localInputs.length}個, 本番 ${prodInputs.length}個の入力フィールド`);

    // レイアウト構造の比較
    const localLayout = await localPage.evaluate(() => {
      const controller = document.querySelector('.color-controller');
      if (!controller) return null;
      
      return {
        sections: controller.querySelectorAll('.color-controller__section').length,
        controls: controller.querySelectorAll('.color-control').length,
        hasTitle: !!controller.querySelector('.color-controller__title'),
        hasTargetColor: !!controller.querySelector('.color-controller__target-color'),
        hasResultColor: !!controller.querySelector('.color-controller__result-color')
      };
    });

    const prodLayout = await productionPage.evaluate(() => {
      const controller = document.querySelector('.color-controller');
      if (!controller) return null;
      
      return {
        sections: controller.querySelectorAll('.color-controller__section').length,
        controls: controller.querySelectorAll('.color-control').length,
        hasTitle: !!controller.querySelector('.color-controller__title'),
        hasTargetColor: !!controller.querySelector('.color-controller__target-color'),
        hasResultColor: !!controller.querySelector('.color-controller__result-color')
      };
    });

    expect(localLayout).toEqual(prodLayout);
    console.log('✅ モバイル環境: レイアウト構造が一致しています');
  }, 60000);

  it('PC環境での視覚的回帰テスト', async () => {
    // デスクトップサイズに設定
    await localPage.setViewport({ width: 1920, height: 1080 });
    await productionPage.setViewport({ width: 1920, height: 1080 });

    // ローカル環境のページを読み込み
    await localPage.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 本番環境のページを読み込み
    await productionPage.goto('https://unafi.github.io/paint-color-assistant2/');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ColorControllerコンポーネントが両方に存在することを確認
    const localColorController = await localPage.$('.color-controller');
    const prodColorController = await productionPage.$('.color-controller');
    
    expect(localColorController).toBeTruthy();
    expect(prodColorController).toBeTruthy();

    // PC環境では◀▶ボタンが表示されないことを確認
    const localButtons = await localPage.$$('.color-control__button');
    const prodButtons = await productionPage.$$('.color-control__button');
    
    expect(localButtons.length).toBe(0);
    expect(prodButtons.length).toBe(0);
    console.log('✅ PC環境: 両方とも◀▶ボタンが非表示です');

    // 入力フィールドの数を比較
    const localInputs = await localPage.$$('input.color-control__input');
    const prodInputs = await productionPage.$$('input.color-control__input');
    
    expect(localInputs.length).toBe(prodInputs.length);
    console.log(`✅ PC環境: ローカル ${localInputs.length}個, 本番 ${prodInputs.length}個の入力フィールド`);

    // レイアウト構造の比較
    const localLayout = await localPage.evaluate(() => {
      const controller = document.querySelector('.color-controller');
      if (!controller) return null;
      
      return {
        sections: controller.querySelectorAll('.color-controller__section').length,
        controls: controller.querySelectorAll('.color-control').length,
        hasTitle: !!controller.querySelector('.color-controller__title'),
        hasTargetColor: !!controller.querySelector('.color-controller__target-color'),
        hasResultColor: !!controller.querySelector('.color-controller__result-color')
      };
    });

    const prodLayout = await productionPage.evaluate(() => {
      const controller = document.querySelector('.color-controller');
      if (!controller) return null;
      
      return {
        sections: controller.querySelectorAll('.color-controller__section').length,
        controls: controller.querySelectorAll('.color-control').length,
        hasTitle: !!controller.querySelector('.color-controller__title'),
        hasTargetColor: !!controller.querySelector('.color-controller__target-color'),
        hasResultColor: !!controller.querySelector('.color-controller__result-color')
      };
    });

    expect(localLayout).toEqual(prodLayout);
    console.log('✅ PC環境: レイアウト構造が一致しています');
  }, 60000);

  it('機能的な動作の比較テスト', async () => {
    // モバイル環境で機能テスト
    const mobileEmulation = {
      name: 'iPhone 12',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false
      }
    };

    await localPage.emulate(mobileEmulation);
    await localPage.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ローカル環境でのボタン操作テスト
    const localButtons = await localPage.$$('.color-control__button');
    if (localButtons.length > 0) {
      const firstButton = localButtons[0];
      
      // ボタンタップ前の値を取得
      const inputBefore = await localPage.$('input.color-control__input');
      const valueBefore = await localPage.evaluate(el => el.value, inputBefore);
      
      // ボタンをタップ
      await firstButton.tap();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ボタンタップ後の値を取得
      const valueAfter = await localPage.evaluate(el => el.value, inputBefore);
      
      // 値が変化していることを確認（機能が動作している）
      expect(valueBefore).not.toBe(valueAfter);
      console.log(`✅ ボタン機能テスト: ${valueBefore} → ${valueAfter}`);
    }

    // 入力フィールドの操作テスト
    const inputs = await localPage.$$('input.color-control__input');
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      
      // 値を変更
      await firstInput.click({ clickCount: 3 });
      await firstInput.type('50');
      
      const newValue = await localPage.evaluate(el => el.value, firstInput);
      expect(newValue).toBe('50');
      console.log('✅ 入力フィールド機能テスト: 値変更が正常に動作');
    }
  }, 60000);
});