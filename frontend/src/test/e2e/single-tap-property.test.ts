/**
 * プロパティテスト: 単一タップによる数値調整
 * Feature: color-controller-button-fix, Property 1: 単一タップによる数値調整
 * 
 * 任意の◀▶ボタンと任意の有効な数値に対して、ボタンを1回タップすると数値が正確に1だけ増減する
 * 検証: 要件 1.1, 1.2
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property Test: Single Tap Adjustment', () => {
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
    
    // iPhoneエミュレータモードに設定
    await page.emulate({
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
    });

    await page.goto('http://localhost:5173/paint-color-assistant2/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('Property 1: 任意の◀▶ボタンで単一タップ時に数値が正確に1だけ増減する', async () => {
    // 全ての入力フィールドとボタンペアを取得
    const inputButtonPairs = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll('.color-control'));
      return controls.map((control, index) => {
        const input = control.querySelector('.color-control__input') as HTMLInputElement;
        const decreaseBtn = Array.from(control.querySelectorAll('.color-control__button'))
          .find(btn => btn.textContent?.trim() === '◀');
        const increaseBtn = Array.from(control.querySelectorAll('.color-control__button'))
          .find(btn => btn.textContent?.trim() === '▶');
        
        return {
          index,
          hasInput: !!input,
          hasDecreaseBtn: !!decreaseBtn,
          hasIncreaseBtn: !!increaseBtn,
          initialValue: input ? parseInt(input.value) : 0
        };
      }).filter(pair => pair.hasInput && (pair.hasDecreaseBtn || pair.hasIncreaseBtn));
    });

    console.log(`テスト対象の入力フィールド数: ${inputButtonPairs.length}`);
    expect(inputButtonPairs.length).toBeGreaterThan(0);

    // プロパティテスト: 100回の反復
    for (let iteration = 0; iteration < 100; iteration++) {
      // ランダムに入力フィールドを選択
      const randomPairIndex = Math.floor(Math.random() * inputButtonPairs.length);
      const selectedPair = inputButtonPairs[randomPairIndex];
      
      // ランダムにボタンタイプを選択（減少または増加）
      const buttonTypes = [];
      if (selectedPair.hasDecreaseBtn) buttonTypes.push('decrease');
      if (selectedPair.hasIncreaseBtn) buttonTypes.push('increase');
      
      if (buttonTypes.length === 0) continue;
      
      const randomButtonType = buttonTypes[Math.floor(Math.random() * buttonTypes.length)];
      const expectedDelta = randomButtonType === 'decrease' ? -1 : 1;

      // 現在の値を取得
      const currentValue = await page.evaluate((index) => {
        const controls = Array.from(document.querySelectorAll('.color-control'));
        const input = controls[index]?.querySelector('.color-control__input') as HTMLInputElement;
        return input ? parseInt(input.value) : 0;
      }, selectedPair.index);

      // 境界値チェック（RGB: 0-255, CMYK: 0-100）
      const isRgb = selectedPair.index < 3; // 最初の3つがRGB
      const minValue = 0;
      const maxValue = isRgb ? 255 : 100;
      
      // 境界値での操作をスキップ
      if ((randomButtonType === 'decrease' && currentValue <= minValue) ||
          (randomButtonType === 'increase' && currentValue >= maxValue)) {
        continue;
      }

      // ボタンをタップ
      const buttonElement = await page.evaluateHandle((index, buttonType) => {
        const controls = Array.from(document.querySelectorAll('.color-control'));
        const control = controls[index];
        if (!control) return null;
        
        const buttons = Array.from(control.querySelectorAll('.color-control__button'));
        const targetText = buttonType === 'decrease' ? '◀' : '▶';
        return buttons.find(btn => btn.textContent?.trim() === targetText);
      }, selectedPair.index, randomButtonType);

      if (buttonElement) {
        const element = buttonElement.asElement();
        if (element) {
          // 単一タップ（長押しを避けるため短時間）
          await element.tap();
          await new Promise(resolve => setTimeout(resolve, 10)); // 短縮
        }
      }

      // 新しい値を取得
      const newValue = await page.evaluate((index) => {
        const controls = Array.from(document.querySelectorAll('.color-control'));
        const input = controls[index]?.querySelector('.color-control__input') as HTMLInputElement;
        return input ? parseInt(input.value) : 0;
      }, selectedPair.index);

      // プロパティ検証: 値が正確に1だけ変化したこと
      const actualDelta = newValue - currentValue;
      
      // デバッグ情報を出力
      if (actualDelta !== expectedDelta) {
        console.log(`❌ 異常検出: フィールド${selectedPair.index} ${randomButtonType} ${currentValue} → ${newValue} (期待Δ${expectedDelta}, 実際Δ${actualDelta})`);
        
        // 長押しタイマーが動作している可能性があるため、少し待機してから再確認
        await new Promise(resolve => setTimeout(resolve, 500));
        const finalValue = await page.evaluate((index) => {
          const controls = Array.from(document.querySelectorAll('.color-control'));
          const input = controls[index]?.querySelector('.color-control__input') as HTMLInputElement;
          return input ? parseInt(input.value) : 0;
        }, selectedPair.index);
        
        console.log(`500ms後の値: ${finalValue}`);
      }
      
      expect(actualDelta).toBe(expectedDelta);

      if (iteration % 20 === 0) {
        console.log(`反復 ${iteration + 1}: フィールド${selectedPair.index} ${randomButtonType} ${currentValue} → ${newValue} (Δ${actualDelta})`);
      }
    }

    console.log('✅ プロパティ1検証完了: 全ての◀▶ボタンで単一タップ時に数値が正確に1だけ増減します');
  }, 120000);
});