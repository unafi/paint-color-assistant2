/**
 * プロパティテスト: 画像交換後の状態同期
 * Feature: paint-color-assistant, Property 12: 画像交換後の状態同期
 * 
 * 任意の画像交換操作後において、交換されたデータが即座に画面に反映される
 * 
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property 12: 画像交換後の状態同期', () => {
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
    
    // デスクトップモードに設定
    await page.setViewport({
      width: 1200,
      height: 800
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

  /**
   * UI要素の表示状態を取得
   */
  async function getUIDisplayState(): Promise<{
    imageADisplay: {
      previewVisible: boolean;
      colorInputsVisible: boolean;
      colorSwatchVisible: boolean;
      previewSrc: string | null;
      rgbValues: { r: number; g: number; b: number } | null;
      cmykValues: { c: number; m: number; y: number; k: number } | null;
    };
    imageBDisplay: {
      previewVisible: boolean;
      colorInputsVisible: boolean;
      colorSwatchVisible: boolean;
      previewSrc: string | null;
      rgbValues: { r: number; g: number; b: number } | null;
      cmykValues: { c: number; m: number; y: number; k: number } | null;
    };
    paintMixingDisplay: {
      visible: boolean;
      baseColorVisible: boolean;
      targetColorVisible: boolean;
      resultColorVisible: boolean;
    };
  }> {
    return await page.evaluate(() => {
      // 画像A表示状態の取得
      const getImageDisplayState = (selector: string) => {
        const container = document.querySelector(selector);
        if (!container) return null;
        
        const preview = container.querySelector('img') || container.querySelector('.image-preview');
        const colorInputs = container.querySelectorAll('input[type="number"]');
        const colorSwatch = container.querySelector('.color-swatch') || container.querySelector('.color-display');
        
        const previewVisible = preview ? window.getComputedStyle(preview).display !== 'none' : false;
        const colorInputsVisible = colorInputs.length > 0 && 
          Array.from(colorInputs).some(input => window.getComputedStyle(input).display !== 'none');
        const colorSwatchVisible = colorSwatch ? window.getComputedStyle(colorSwatch).display !== 'none' : false;
        
        const previewSrc = preview?.src || preview?.style.backgroundImage || null;
        
        // RGB値の取得
        const rgbInputs = Array.from(colorInputs).slice(0, 3);
        const rgbValues = rgbInputs.length === 3 ? {
          r: parseInt((rgbInputs[0] as HTMLInputElement).value) || 0,
          g: parseInt((rgbInputs[1] as HTMLInputElement).value) || 0,
          b: parseInt((rgbInputs[2] as HTMLInputElement).value) || 0
        } : null;
        
        // CMYK値の取得
        const cmykInputs = Array.from(colorInputs).slice(3, 7);
        const cmykValues = cmykInputs.length === 4 ? {
          c: parseInt((cmykInputs[0] as HTMLInputElement).value) || 0,
          m: parseInt((cmykInputs[1] as HTMLInputElement).value) || 0,
          y: parseInt((cmykInputs[2] as HTMLInputElement).value) || 0,
          k: parseInt((cmykInputs[3] as HTMLInputElement).value) || 0
        } : null;
        
        return {
          previewVisible,
          colorInputsVisible,
          colorSwatchVisible,
          previewSrc,
          rgbValues,
          cmykValues
        };
      };
      
      // 画像A・Bの表示状態を取得
      const imageADisplay = getImageDisplayState('.color-controller:first-child') || 
                          getImageDisplayState('[data-testid="image-a-container"]') ||
                          getImageDisplayState('.image-upload-container:first-child');
      
      const imageBDisplay = getImageDisplayState('.color-controller:last-child') || 
                          getImageDisplayState('[data-testid="image-b-container"]') ||
                          getImageDisplayState('.image-upload-container:last-child');
      
      // 塗料混合表示の状態を取得
      const paintMixingContainer = document.querySelector('.paint-mixing-controller');
      const paintMixingDisplay = {
        visible: paintMixingContainer ? window.getComputedStyle(paintMixingContainer).display !== 'none' : false,
        baseColorVisible: false,
        targetColorVisible: false,
        resultColorVisible: false
      };
      
      if (paintMixingContainer) {
        const baseColorSwatch = paintMixingContainer.querySelector('.color-display--top .color-swatch');
        const targetColorSwatch = paintMixingContainer.querySelector('.color-display--bottom .color-swatch');
        const resultColorSwatch = paintMixingContainer.querySelector('.paint-mixing-controller__right-column .color-swatch');
        
        paintMixingDisplay.baseColorVisible = baseColorSwatch ? window.getComputedStyle(baseColorSwatch).display !== 'none' : false;
        paintMixingDisplay.targetColorVisible = targetColorSwatch ? window.getComputedStyle(targetColorSwatch).display !== 'none' : false;
        paintMixingDisplay.resultColorVisible = resultColorSwatch ? window.getComputedStyle(resultColorSwatch).display !== 'none' : false;
      }
      
      return {
        imageADisplay: imageADisplay || {
          previewVisible: false,
          colorInputsVisible: false,
          colorSwatchVisible: false,
          previewSrc: null,
          rgbValues: null,
          cmykValues: null
        },
        imageBDisplay: imageBDisplay || {
          previewVisible: false,
          colorInputsVisible: false,
          colorSwatchVisible: false,
          previewSrc: null,
          rgbValues: null,
          cmykValues: null
        },
        paintMixingDisplay
      };
    });
  }

  /**
   * 画像交換操作を実行
   */
  async function performImageSwap(): Promise<boolean> {
    try {
      const swapButton = await page.$('.image-swap-button') || 
                        await page.$('[data-testid="image-swap-button"]') ||
                        await page.$('button[aria-label="画像を交換"]');
      
      if (!swapButton) {
        return false;
      }
      
      await swapButton.click();
      
      // 状態同期の完了を待機（短時間）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 状態同期の即座性を検証
   */
  function validateImmediateSync(beforeState: any, afterState: any): {
    isValid: boolean;
    details: {
      imageADataChanged: boolean;
      imageBDataChanged: boolean;
      imageADisplayUpdated: boolean;
      imageBDisplayUpdated: boolean;
      paintMixingUpdated: boolean;
      allUpdated: boolean;
    };
  } {
    // データの変化確認
    const imageADataChanged = 
      JSON.stringify(beforeState.imageADisplay.rgbValues) !== JSON.stringify(afterState.imageADisplay.rgbValues) ||
      JSON.stringify(beforeState.imageADisplay.cmykValues) !== JSON.stringify(afterState.imageADisplay.cmykValues) ||
      beforeState.imageADisplay.previewSrc !== afterState.imageADisplay.previewSrc;
    
    const imageBDataChanged = 
      JSON.stringify(beforeState.imageBDisplay.rgbValues) !== JSON.stringify(afterState.imageBDisplay.rgbValues) ||
      JSON.stringify(beforeState.imageBDisplay.cmykValues) !== JSON.stringify(afterState.imageBDisplay.cmykValues) ||
      beforeState.imageBDisplay.previewSrc !== afterState.imageBDisplay.previewSrc;
    
    // 表示の更新確認
    const imageADisplayUpdated = 
      afterState.imageADisplay.previewVisible &&
      afterState.imageADisplay.colorInputsVisible &&
      afterState.imageADisplay.colorSwatchVisible;
    
    const imageBDisplayUpdated = 
      afterState.imageBDisplay.previewVisible &&
      afterState.imageBDisplay.colorInputsVisible &&
      afterState.imageBDisplay.colorSwatchVisible;
    
    // 塗料混合表示の更新確認
    const paintMixingUpdated = 
      afterState.paintMixingDisplay.visible &&
      afterState.paintMixingDisplay.baseColorVisible &&
      afterState.paintMixingDisplay.targetColorVisible &&
      afterState.paintMixingDisplay.resultColorVisible;
    
    const allUpdated = imageADisplayUpdated && imageBDisplayUpdated && paintMixingUpdated;
    
    return {
      isValid: (imageADataChanged || imageBDataChanged) && allUpdated,
      details: {
        imageADataChanged,
        imageBDataChanged,
        imageADisplayUpdated,
        imageBDisplayUpdated,
        paintMixingUpdated,
        allUpdated
      }
    };
  }

  /**
   * Feature: paint-color-assistant, Property 12: 画像交換後の状態同期
   * 
   * 任意の画像交換操作後において、交換されたデータが即座に画面に反映される
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 12: 任意の画像交換操作後に状態が即座に画面に反映される', async () => {
    const testIterations = 50; // 50回の反復テスト
    let successCount = 0;
    const failures: Array<{
      iteration: number;
      beforeState: any;
      afterState: any;
      swapExecuted: boolean;
      syncValidation: any;
    }> = [];

    for (let i = 0; i < testIterations; i++) {
      try {
        // 交換前の表示状態を取得
        const beforeState = await getUIDisplayState();
        
        // 画像交換操作を実行
        const swapExecuted = await performImageSwap();
        
        if (!swapExecuted) {
          console.log(`反復 ${i + 1}: 画像交換操作が実行できませんでした`);
          continue;
        }
        
        // 交換後の表示状態を即座に取得（同期性をテスト）
        const afterState = await getUIDisplayState();
        
        // 状態同期の検証
        const syncValidation = validateImmediateSync(beforeState, afterState);
        
        if (syncValidation.isValid) {
          successCount++;
        } else {
          failures.push({
            iteration: i + 1,
            beforeState,
            afterState,
            swapExecuted: true,
            syncValidation
          });
        }
        
        // 次の反復のために少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // エラーは失敗として記録
        failures.push({
          iteration: i + 1,
          beforeState: null,
          afterState: null,
          swapExecuted: false,
          syncValidation: { error: (error as Error).message }
        });
      }
    }

    // 成功率の検証（80%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 12 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 80) {
      console.error(`Property 12 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の3件）:');
      failures.slice(0, 3).forEach((failure, index) => {
        console.error(`失敗 ${index + 1} (反復${failure.iteration}):`, {
          swapExecuted: failure.swapExecuted,
          syncDetails: failure.syncValidation.details || failure.syncValidation
        });
      });
    } else {
      console.log('✅ Property 12: 画像交換後の状態同期 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(80);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.8));
  }, 120000); // 120秒タイムアウト

  it('Property 12 補助テスト: 状態同期の即座性確認', async () => {
    // 状態同期の即座性を詳細に確認
    const timingTests = [
      { delay: 0, name: '即座（0ms）' },
      { delay: 50, name: '50ms後' },
      { delay: 100, name: '100ms後' },
      { delay: 200, name: '200ms後' }
    ];

    for (const timingTest of timingTests) {
      // 交換前の状態を取得
      const beforeState = await getUIDisplayState();
      
      // 画像交換操作を実行
      const swapButton = await page.$('.image-swap-button');
      if (!swapButton) {
        console.log(`${timingTest.name}: 画像交換ボタンが見つかりません`);
        continue;
      }
      
      await swapButton.click();
      
      // 指定された遅延後に状態を確認
      await new Promise(resolve => setTimeout(resolve, timingTest.delay));
      
      const afterState = await getUIDisplayState();
      
      // 状態同期の検証
      const syncValidation = validateImmediateSync(beforeState, afterState);
      
      console.log(`${timingTest.name}の状態同期:`, {
        dataChanged: syncValidation.details.imageADataChanged || syncValidation.details.imageBDataChanged,
        displayUpdated: syncValidation.details.allUpdated,
        isValid: syncValidation.isValid
      });
      
      // 即座性の確認（200ms以内には確実に同期されているべき）
      if (timingTest.delay <= 200) {
        expect(syncValidation.isValid).toBe(true);
      }
    }
  });

  it('Property 12 補助テスト: 表示要素の可視性確認', async () => {
    // 各表示要素の可視性を確認
    const displayState = await getUIDisplayState();
    
    console.log('表示要素の可視性:', {
      imageA: {
        preview: displayState.imageADisplay.previewVisible,
        colorInputs: displayState.imageADisplay.colorInputsVisible,
        colorSwatch: displayState.imageADisplay.colorSwatchVisible
      },
      imageB: {
        preview: displayState.imageBDisplay.previewVisible,
        colorInputs: displayState.imageBDisplay.colorInputsVisible,
        colorSwatch: displayState.imageBDisplay.colorSwatchVisible
      },
      paintMixing: {
        container: displayState.paintMixingDisplay.visible,
        baseColor: displayState.paintMixingDisplay.baseColorVisible,
        targetColor: displayState.paintMixingDisplay.targetColorVisible,
        resultColor: displayState.paintMixingDisplay.resultColorVisible
      }
    });
    
    // 基本的な表示要素が存在することを確認
    expect(displayState.imageADisplay.colorInputsVisible || displayState.imageBDisplay.colorInputsVisible).toBe(true);
    expect(displayState.paintMixingDisplay.visible).toBe(true);
  });
});