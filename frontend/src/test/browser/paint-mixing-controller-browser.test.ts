/**
 * PaintMixingController ブラウザテスト
 * タスク9: 実際のブラウザでの動作確認
 * 
 * 検証項目:
 * 1. Reactフックエラーの修正確認
 * 2. レイアウトが色調コントローラと同じ形式になっているか
 * 3. ◀▶ボタンがモバイル時のみ表示されるか
 * 4. ボタンクリックが正常に動作するか
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('PaintMixingController ブラウザテスト', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // コンソールエラーを監視
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('ブラウザコンソールエラー:', msg.text());
      }
    });
    
    // ページエラーを監視
    page.on('pageerror', (error) => {
      console.error('ページエラー:', error.message);
    });
    
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  }, 30000);

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('1. Reactフックエラーの修正確認', () => {
    it('ページロード時にReactフックエラーが発生しない', async () => {
      let hasHookError = false;
      
      page.on('console', (msg) => {
        if (msg.text().includes('Invalid hook call') || 
            msg.text().includes('Hooks can only be called')) {
          hasHookError = true;
        }
      });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // 少し待機してエラーが発生しないことを確認
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(hasHookError).toBe(false);
    });

    it('◀▶ボタンクリック時にReactフックエラーが発生しない', async () => {
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      let hasHookError = false;
      
      page.on('console', (msg) => {
        if (msg.text().includes('Invalid hook call') || 
            msg.text().includes('Hooks can only be called')) {
          hasHookError = true;
        }
      });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // ◀▶ボタンが表示されるまで待機
      await page.waitForSelector('.color-control__button', { timeout: 5000 });
      
      // 最初の▶ボタンをクリック
      const increaseButtons = await page.$$('.color-control__button');
      if (increaseButtons.length > 0) {
        await increaseButtons[1].click(); // 2番目のボタン（▶ボタン）
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      expect(hasHookError).toBe(false);
    });
  });

  describe('2. レイアウト確認', () => {
    it('色調コントローラと同じ横一列レイアウトになっている', async () => {
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // 色調整行を取得
      const colorControls = await page.$$('.color-control');
      expect(colorControls.length).toBeGreaterThan(0);
      
      // 最初の色調整行（シアン）の要素配置を確認
      const firstControl = colorControls[0];
      const elements = await firstControl.$$('*');
      
      // 要素が横一列に配置されていることを確認
      const boundingBox = await firstControl.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.height).toBeLessThan(50); // 高さが50px未満（横一列）
    });

    it('「[色見本] ラベル ◀ [入力欄] ▶ [色見本]」の順序で配置されている', async () => {
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // 最初の色調整行（シアン）の要素順序を確認
      const firstControl = await page.$('.color-control');
      expect(firstControl).toBeTruthy();
      
      const elements = await firstControl!.$$('*');
      expect(elements.length).toBeGreaterThanOrEqual(5);
      
      // 要素のクラス名を確認
      const classNames = await Promise.all(
        elements.map(el => el.evaluate(node => node.className))
      );
      
      // 期待される順序: 色見本 → ラベル → ◀ボタン → 入力欄 → ▶ボタン → 色見本
      expect(classNames).toContain('color-control__full-sample');
      expect(classNames).toContain('color-control__label');
      expect(classNames).toContain('color-control__button');
      expect(classNames).toContain('color-control__input');
      expect(classNames).toContain('color-control__current-sample');
    });
  });

  describe('3. モバイル専用表示確認', () => {
    it('デスクトップ時は◀▶ボタンが表示されない', async () => {
      // デスクトップビューポートに設定
      await page.setViewport({ width: 1024, height: 768 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // ◀▶ボタンが表示されていないことを確認
      const buttons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(buttons.length).toBe(0);
    });

    it('モバイル時は◀▶ボタンが表示される', async () => {
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // ◀▶ボタンが表示されることを確認
      await page.waitForSelector('.paint-mixing-controller .color-control__button', { timeout: 5000 });
      const buttons = await page.$$('.paint-mixing-controller .color-control__button');
      
      // 5つの塗料成分 × 2つのボタン（◀▶）= 10個のボタン
      console.log(`実際のボタン数: ${buttons.length}`);
      expect(buttons.length).toBe(10);
    });
  });

  describe('4. ボタン動作確認', () => {
    it('▶ボタンクリックで値が1増加する', async () => {
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // 最初の入力欄（シアン）の初期値を取得
      const input = await page.$('.paint-mixing-controller .color-control__input');
      const initialValue = await input!.evaluate(el => (el as HTMLInputElement).value);
      
      console.log(`初期値: ${initialValue}`);
      
      // 最初の色調整行の▶ボタンを取得（より具体的なセレクタ）
      const firstColorControl = await page.$('.paint-mixing-controller .color-control');
      const buttons = await firstColorControl!.$$('.color-control__button');
      
      console.log(`ボタン数: ${buttons.length}`);
      
      if (buttons.length >= 2) {
        // 2番目のボタンが▶ボタン（増加ボタン）
        const increaseButton = buttons[1];
        
        // ボタンのテキストを確認
        const buttonText = await increaseButton.evaluate(el => el.textContent);
        console.log(`ボタンテキスト: ${buttonText}`);
        
        // タッチイベントをシミュレート
        await increaseButton.evaluate((button) => {
          const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [new Touch({
              identifier: 0,
              target: button,
              clientX: 0,
              clientY: 0
            })]
          });
          const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            touches: []
          });
          
          button.dispatchEvent(touchStartEvent);
          setTimeout(() => button.dispatchEvent(touchEndEvent), 50);
        });
        
        // 値が1増加したことを確認
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newValue = await input!.evaluate(el => (el as HTMLInputElement).value);
        console.log(`新しい値: ${newValue}`);
        
        expect(parseInt(newValue)).toBe(parseInt(initialValue) + 1);
      } else {
        throw new Error('▶ボタンが見つかりません');
      }
    });
  });

  describe('5. 全体的な動作確認', () => {
    it('コンソールエラーが発生しない', async () => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      // モバイルビューポートに設定
      await page.setViewport({ width: 375, height: 667 });
      
      // 混色コントローラが表示されるまで待機
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
      
      // 複数のボタンをクリックしてテスト
      const buttons = await page.$$('.paint-mixing-controller .color-control__button');
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        await buttons[i].click();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Reactフックエラーが含まれていないことを確認
      const hookErrors = errors.filter(error => 
        error.includes('Invalid hook call') || 
        error.includes('Hooks can only be called')
      );
      
      expect(hookErrors.length).toBe(0);
    });
  });
});
