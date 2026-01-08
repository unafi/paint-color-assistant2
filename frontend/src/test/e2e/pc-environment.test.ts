/**
 * PC環境での動作確認テスト
 * 要件: 10.13, 10.14, 10.15
 * 
 * 検証項目:
 * - デスクトップブラウザでの表示・操作確認
 * - ◀▶ボタンが表示されないことを確認（既存動作）
 * - 数値入力フィールドの操作性確認
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('PC環境での動作確認', () => {
  let browser: Browser;
  let page: Page;

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

    page = await browser.newPage();
    
    // デスクトップサイズに設定（1920x1080）
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    
    // ページが完全に読み込まれるまで待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('PC環境で◀▶ボタンが表示されないことを確認', async () => {
    // ColorControllerコンポーネントが存在することを確認
    const colorController = await page.$('.color-controller');
    expect(colorController).toBeTruthy();

    // ◀▶ボタンが表示されていないことを確認
    const decrementButtons = await page.$$('.color-control__button[data-testid*="decrement"]');
    const incrementButtons = await page.$$('.color-control__button[data-testid*="increment"]');
    
    // PC環境では◀▶ボタンは表示されない（CSS media queryにより非表示）
    expect(decrementButtons.length).toBe(0);
    expect(incrementButtons.length).toBe(0);
    
    console.log('✅ PC環境で◀▶ボタンが正しく非表示になっています');
  });

  it('PC環境で数値入力フィールドの操作性を確認', async () => {
    // 数値入力フィールドを取得（RGB用とCMYK用）
    const inputFields = await page.$$('input.color-control__input');
    
    // 入力フィールドが存在することを確認（RGB 3個 + CMYK 4個 = 7個）
    expect(inputFields.length).toBeGreaterThanOrEqual(4);

    // 最初の4つの入力フィールドをテスト（RGB: R,G,B + CMYK: C）
    for (let i = 0; i < Math.min(4, inputFields.length); i++) {
      const input = inputFields[i];
      expect(input).toBeTruthy();

      // 数値入力フィールドの操作性を確認
      await input.click({ clickCount: 3 }); // 全選択
      await input.type(`${25 + i * 25}`); // 25, 50, 75, 100
      
      const value = await page.evaluate(el => el.value, input);
      expect(value).toBe(`${25 + i * 25}`);
    }

    console.log('✅ PC環境で数値入力フィールドが正常に操作できます');
  });

  it('PC環境でのレスポンシブ動作確認', async () => {
    // 異なる画面サイズでテスト
    const desktopSizes = [
      { width: 1920, height: 1080 }, // Full HD
      { width: 1366, height: 768 },  // 一般的なラップトップ
      { width: 1024, height: 768 }   // 小さめのデスクトップ
    ];

    for (const size of desktopSizes) {
      await page.setViewport(size);
      await new Promise(resolve => setTimeout(resolve, 500)); // レイアウト調整を待機

      // ColorControllerが表示されていることを確認
      const colorController = await page.$('.color-controller');
      expect(colorController).toBeTruthy();

      // ◀▶ボタンが表示されていないことを確認
      const buttons = await page.$$('.color-control__button');
      
      // PC環境では◀▶ボタンは0個のはず
      expect(buttons.length).toBe(0);

      console.log(`✅ ${size.width}x${size.height}で◀▶ボタンが正しく非表示です`);
    }
  });

  it('PC環境でのキーボード操作確認', async () => {
    const inputFields = await page.$$('input.color-control__input');
    expect(inputFields.length).toBeGreaterThanOrEqual(1);
    
    const firstInput = inputFields[0];
    
    // フォーカスを当てる
    await firstInput.focus();
    
    // キーボードでの数値変更
    await firstInput.click({ clickCount: 3 }); // 全選択
    await page.keyboard.type('30');
    const value = await page.evaluate(el => el.value, firstInput);
    expect(value).toBe('30');
    
    // Tabキーでの移動（次の入力フィールドがある場合）
    if (inputFields.length > 1) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement);
      const secondInput = inputFields[1];
      const secondElement = await page.evaluate(el => el, secondInput);
      expect(focusedElement).toBe(secondElement);
    }
    
    console.log('✅ PC環境でキーボード操作が正常に動作します');
  });
});
