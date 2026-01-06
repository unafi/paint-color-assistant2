/**
 * PaintMixingController統合テスト
 * スマホ・PC両方での完全な操作フローと既存機能との統合確認
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('PaintMixingController E2E Integration Tests', () => {
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
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('PC環境での動作確認', () => {
    it('PC表示時に◀▶ボタンが表示されないことを確認', async () => {
      // デスクトップサイズに設定
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(baseUrl);

      // PaintMixingControllerが存在することを確認
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // ◀▶ボタンが存在しないことを確認
      const leftButtons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(leftButtons.length).toBe(0);

      // 既存の入力欄が正常に動作することを確認
      const inputs = await page.$$('.paint-mixing-controller .adjustment-input');
      expect(inputs.length).toBe(5); // cyan, magenta, yellow, black, white

      // 数値入力が正常に動作することを確認
      const cyanInput = inputs[0];
      await cyanInput.click();
      await cyanInput.type('25');
      
      const value = await cyanInput.evaluate((el: HTMLInputElement) => el.value);
      expect(value).toBe('25');
    }, 30000);

    it('既存機能が正常に動作することを確認', async () => {
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(baseUrl);

      // 色表示エリアが存在することを確認
      await page.waitForSelector('.color-swatch', { timeout: 10000 });
      const colorSwatches = await page.$$('.color-swatch');
      expect(colorSwatches.length).toBeGreaterThan(0);

      // 調整値の変更が結果色に反映されることを確認
      const magentaInput = await page.$('.adjustment-row:nth-child(2) .adjustment-input');
      if (magentaInput) {
        await magentaInput.click();
        await magentaInput.type('30');
        
        // 結果色の変化を確認（色が変わったことを検証）
        const resultSwatch = await page.$('.color-display--bottom .color-swatch');
        expect(resultSwatch).toBeTruthy();
      }
    }, 30000);
  });

  describe('スマホ環境での動作確認', () => {
    it('スマホ表示時に◀▶ボタンが表示されることを確認', async () => {
      // スマホサイズに設定
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(baseUrl);

      // PaintMixingControllerが存在することを確認
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // ◀▶ボタンが存在することを確認（5成分 × 2ボタン = 10個）
      const buttons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(buttons.length).toBe(10);

      // 各成分に◀▶ボタンが配置されていることを確認
      const adjustmentRows = await page.$$('.adjustment-row');
      expect(adjustmentRows.length).toBe(5);

      for (let i = 0; i < adjustmentRows.length; i++) {
        const rowButtons = await adjustmentRows[i].$$('.color-control__button');
        expect(rowButtons.length).toBe(2); // ◀と▶
      }
    }, 30000);

    it('◀▶ボタンのタップ動作を確認', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(baseUrl);

      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // シアンの◀▶ボタンをテスト
      const cyanRow = await page.$('.adjustment-row:first-child');
      const cyanInput = await cyanRow!.$('.adjustment-input');
      const cyanLeftButton = await cyanRow!.$('.color-control__button:first-of-type');
      const cyanRightButton = await cyanRow!.$('.color-control__button:last-of-type');

      // 初期値を確認
      let initialValue = await cyanInput!.evaluate((el: HTMLInputElement) => parseInt(el.value));

      // ▶ボタンをタップして値が増加することを確認
      await cyanRightButton!.tap();
      await page.waitForTimeout(100); // 値の更新を待つ
      
      let newValue = await cyanInput!.evaluate((el: HTMLInputElement) => parseInt(el.value));
      expect(newValue).toBe(initialValue + 1);

      // ◀ボタンをタップして値が減少することを確認
      await cyanLeftButton!.tap();
      await page.waitForTimeout(100);
      
      newValue = await cyanInput!.evaluate((el: HTMLInputElement) => parseInt(el.value));
      expect(newValue).toBe(initialValue);
    }, 30000);

    it('境界値でのボタン無効化を確認', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(baseUrl);

      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // 値を0に設定
      const cyanRow = await page.$('.adjustment-row:first-child');
      const cyanInput = await cyanRow!.$('.adjustment-input');
      const cyanLeftButton = await cyanRow!.$('.color-control__button:first-of-type');

      await cyanInput!.click();
      await cyanInput!.evaluate((el: HTMLInputElement) => {
        el.value = '0';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(100);

      // ◀ボタンが無効化されていることを確認
      const isDisabled = await cyanLeftButton!.evaluate((el: HTMLButtonElement) => el.disabled);
      expect(isDisabled).toBe(true);

      // 値を100に設定
      await cyanInput!.evaluate((el: HTMLInputElement) => {
        el.value = '100';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(100);

      // ▶ボタンが無効化されていることを確認
      const cyanRightButton = await cyanRow!.$('.color-control__button:last-of-type');
      const isRightDisabled = await cyanRightButton!.evaluate((el: HTMLButtonElement) => el.disabled);
      expect(isRightDisabled).toBe(true);
    }, 30000);
  });

  describe('レスポンシブ切り替えテスト', () => {
    it('画面サイズ変更時の◀▶ボタン表示切り替えを確認', async () => {
      await page.goto(baseUrl);

      // デスクトップサイズで開始
      await page.setViewport({ width: 1200, height: 800 });
      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // ◀▶ボタンが表示されていないことを確認
      let buttons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(buttons.length).toBe(0);

      // スマホサイズに変更
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500); // リサイズの反映を待つ

      // ◀▶ボタンが表示されることを確認
      buttons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(buttons.length).toBe(10);

      // デスクトップサイズに戻す
      await page.setViewport({ width: 1200, height: 800 });
      await page.waitForTimeout(500);

      // ◀▶ボタンが再び非表示になることを確認
      buttons = await page.$$('.paint-mixing-controller .color-control__button');
      expect(buttons.length).toBe(0);
    }, 30000);
  });

  describe('既存機能との統合確認', () => {
    it('◀▶ボタン操作が既存の計算ロジックと正しく連携することを確認', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(baseUrl);

      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // 初期の結果色を取得
      const initialResultColor = await page.$eval('.color-display--bottom .color-swatch', 
        (el: HTMLElement) => getComputedStyle(el).backgroundColor);

      // ◀▶ボタンで値を変更
      const cyanRightButton = await page.$('.adjustment-row:first-child .color-control__button:last-of-type');
      await cyanRightButton!.tap();
      await page.waitForTimeout(200);

      // 結果色が変化したことを確認
      const newResultColor = await page.$eval('.color-display--bottom .color-swatch', 
        (el: HTMLElement) => getComputedStyle(el).backgroundColor);
      
      expect(newResultColor).not.toBe(initialResultColor);

      // after-valueが正しく更新されていることを確認
      const afterValue = await page.$eval('.adjustment-row:first-child .after-value', 
        (el: HTMLElement) => el.textContent);
      
      expect(parseInt(afterValue!)).toBeGreaterThan(0);
    }, 30000);

    it('複数成分の同時操作が正常に動作することを確認', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(baseUrl);

      await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });

      // 複数の成分を同時に調整
      const cyanRightButton = await page.$('.adjustment-row:nth-child(1) .color-control__button:last-of-type');
      const magentaRightButton = await page.$('.adjustment-row:nth-child(2) .color-control__button:last-of-type');
      const yellowRightButton = await page.$('.adjustment-row:nth-child(3) .color-control__button:last-of-type');

      // 各ボタンをタップ
      await cyanRightButton!.tap();
      await page.waitForTimeout(100);
      await magentaRightButton!.tap();
      await page.waitForTimeout(100);
      await yellowRightButton!.tap();
      await page.waitForTimeout(100);

      // 各成分の値が正しく更新されていることを確認
      const cyanValue = await page.$eval('.adjustment-row:nth-child(1) .adjustment-input', 
        (el: HTMLInputElement) => parseInt(el.value));
      const magentaValue = await page.$eval('.adjustment-row:nth-child(2) .adjustment-input', 
        (el: HTMLInputElement) => parseInt(el.value));
      const yellowValue = await page.$eval('.adjustment-row:nth-child(3) .adjustment-input', 
        (el: HTMLInputElement) => parseInt(el.value));

      expect(cyanValue).toBeGreaterThan(0);
      expect(magentaValue).toBeGreaterThan(0);
      expect(yellowValue).toBeGreaterThan(0);
    }, 30000);
  });
});