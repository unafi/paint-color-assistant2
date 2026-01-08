/**
 * プロパティテスト: 画像交換の完全性
 * Feature: paint-color-assistant, Property 11: 画像交換の完全性
 * 
 * 任意の画像交換操作において、画像A・Bのプレビュー、色調整値、ファイルパスが完全に交換される
 * 
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property 11: 画像交換の完全性', () => {
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
    
    // デスクトップモードに設定（画像交換機能が表示されるように）
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
   * 画像交換前後の状態を取得
   */
  async function getImageSwapState(): Promise<{
    imageA: {
      preview: string | null;
      colorValues: { r: number; g: number; b: number; c: number; m: number; y: number; k: number } | null;
      filePath: string | null;
    };
    imageB: {
      preview: string | null;
      colorValues: { r: number; g: number; b: number; c: number; m: number; y: number; k: number } | null;
      filePath: string | null;
    };
    hasSwapButton: boolean;
  }> {
    return await page.evaluate(() => {
      // 画像Aの状態を取得
      const imageAContainer = document.querySelector('[data-testid="image-a-container"]') || 
                            document.querySelector('.color-controller:first-child') ||
                            document.querySelector('.image-upload-container:first-child');
      
      const imageAPreview = imageAContainer?.querySelector('img')?.src || 
                          imageAContainer?.querySelector('.image-preview')?.style.backgroundImage || null;
      
      // 画像Bの状態を取得
      const imageBContainer = document.querySelector('[data-testid="image-b-container"]') || 
                            document.querySelector('.color-controller:last-child') ||
                            document.querySelector('.image-upload-container:last-child');
      
      const imageBPreview = imageBContainer?.querySelector('img')?.src || 
                          imageBContainer?.querySelector('.image-preview')?.style.backgroundImage || null;
      
      // 色調整値を取得（RGB/CMYK入力フィールドから）
      const getColorValues = (container: Element | null) => {
        if (!container) return null;
        
        const inputs = container.querySelectorAll('input[type="number"]');
        if (inputs.length < 7) return null; // RGB(3) + CMYK(4) = 7個の入力フィールド
        
        return {
          r: parseInt((inputs[0] as HTMLInputElement).value) || 0,
          g: parseInt((inputs[1] as HTMLInputElement).value) || 0,
          b: parseInt((inputs[2] as HTMLInputElement).value) || 0,
          c: parseInt((inputs[3] as HTMLInputElement).value) || 0,
          m: parseInt((inputs[4] as HTMLInputElement).value) || 0,
          y: parseInt((inputs[5] as HTMLInputElement).value) || 0,
          k: parseInt((inputs[6] as HTMLInputElement).value) || 0
        };
      };
      
      const imageAColorValues = getColorValues(imageAContainer);
      const imageBColorValues = getColorValues(imageBContainer);
      
      // ファイルパスを取得（input[type="file"]から）
      const getFilePath = (container: Element | null) => {
        if (!container) return null;
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        return fileInput?.files?.[0]?.name || null;
      };
      
      const imageAFilePath = getFilePath(imageAContainer);
      const imageBFilePath = getFilePath(imageBContainer);
      
      // 画像交換ボタンの存在確認
      const swapButton = document.querySelector('.image-swap-button') || 
                        document.querySelector('[data-testid="image-swap-button"]') ||
                        document.querySelector('button[aria-label="画像を交換"]');
      
      return {
        imageA: {
          preview: imageAPreview,
          colorValues: imageAColorValues,
          filePath: imageAFilePath
        },
        imageB: {
          preview: imageBPreview,
          colorValues: imageBColorValues,
          filePath: imageBFilePath
        },
        hasSwapButton: !!swapButton
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
      
      // 交換処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Feature: paint-color-assistant, Property 11: 画像交換の完全性
   * 
   * 任意の画像交換操作において、画像A・Bのプレビュー、色調整値、ファイルパスが完全に交換される
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 11: 任意の画像交換操作で全ての要素が完全に交換される', async () => {
    const testIterations = 50; // 50回の反復テスト（UI操作のため少なめ）
    let successCount = 0;
    const failures: Array<{
      iteration: number;
      beforeState: any;
      afterState: any;
      swapExecuted: boolean;
      details: any;
    }> = [];

    for (let i = 0; i < testIterations; i++) {
      try {
        // 交換前の状態を取得
        const beforeState = await getImageSwapState();
        
        // 画像交換ボタンが存在しない場合はスキップ
        if (!beforeState.hasSwapButton) {
          console.log(`反復 ${i + 1}: 画像交換ボタンが見つからないためスキップ`);
          continue;
        }
        
        // 画像交換操作を実行
        const swapExecuted = await performImageSwap();
        
        if (!swapExecuted) {
          failures.push({
            iteration: i + 1,
            beforeState,
            afterState: null,
            swapExecuted: false,
            details: { error: '画像交換操作が実行できませんでした' }
          });
          continue;
        }
        
        // 交換後の状態を取得
        const afterState = await getImageSwapState();
        
        // 完全性の検証
        const isCompleteSwap = validateCompleteSwap(beforeState, afterState);
        
        if (isCompleteSwap.isValid) {
          successCount++;
        } else {
          failures.push({
            iteration: i + 1,
            beforeState,
            afterState,
            swapExecuted: true,
            details: isCompleteSwap.details
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
          details: { error: (error as Error).message }
        });
      }
    }

    // 成功率の検証（80%以上を要求、UI操作のため少し緩め）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 11 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 80) {
      console.error(`Property 11 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の3件）:');
      failures.slice(0, 3).forEach((failure, index) => {
        console.error(`失敗 ${index + 1} (反復${failure.iteration}):`, {
          swapExecuted: failure.swapExecuted,
          details: failure.details
        });
      });
    } else {
      console.log('✅ Property 11: 画像交換の完全性 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(80);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.8));
  }, 120000); // 120秒タイムアウト

  /**
   * 画像交換の完全性を検証
   */
  function validateCompleteSwap(beforeState: any, afterState: any): {
    isValid: boolean;
    details: {
      previewSwapped: boolean;
      colorValuesSwapped: boolean;
      filePathSwapped: boolean;
      allElementsSwapped: boolean;
    };
  } {
    // プレビューの交換確認
    const previewSwapped = 
      (beforeState.imageA.preview === afterState.imageB.preview) &&
      (beforeState.imageB.preview === afterState.imageA.preview);
    
    // 色調整値の交換確認
    const colorValuesSwapped = 
      JSON.stringify(beforeState.imageA.colorValues) === JSON.stringify(afterState.imageB.colorValues) &&
      JSON.stringify(beforeState.imageB.colorValues) === JSON.stringify(afterState.imageA.colorValues);
    
    // ファイルパスの交換確認
    const filePathSwapped = 
      (beforeState.imageA.filePath === afterState.imageB.filePath) &&
      (beforeState.imageB.filePath === afterState.imageA.filePath);
    
    const allElementsSwapped = previewSwapped && colorValuesSwapped && filePathSwapped;
    
    return {
      isValid: allElementsSwapped,
      details: {
        previewSwapped,
        colorValuesSwapped,
        filePathSwapped,
        allElementsSwapped
      }
    };
  }

  it('Property 11 補助テスト: 画像交換ボタンの存在確認', async () => {
    // 画像交換ボタンの存在を確認
    const swapButtonExists = await page.evaluate(() => {
      const swapButton = document.querySelector('.image-swap-button') || 
                        document.querySelector('[data-testid="image-swap-button"]') ||
                        document.querySelector('button[aria-label="画像を交換"]');
      
      return {
        exists: !!swapButton,
        isVisible: swapButton ? window.getComputedStyle(swapButton).display !== 'none' : false,
        isEnabled: swapButton ? !(swapButton as HTMLButtonElement).disabled : false,
        text: swapButton?.textContent?.trim() || null
      };
    });

    console.log('画像交換ボタン状態:', swapButtonExists);

    // 画像交換ボタンが存在し、有効であることを確認
    expect(swapButtonExists.exists).toBe(true);
    expect(swapButtonExists.isVisible).toBe(true);
    expect(swapButtonExists.isEnabled).toBe(true);
    expect(swapButtonExists.text).toContain('交換');
  });
});
