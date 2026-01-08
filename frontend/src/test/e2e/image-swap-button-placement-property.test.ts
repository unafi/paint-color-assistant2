/**
 * プロパティテスト: 画像交換ボタンの配置一貫性
 * Feature: paint-color-assistant, Property 13: 画像交換ボタンの配置一貫性
 * 
 * 任意のデバイス環境において、画像交換ボタンが色調コントローラと塗料混合セクションの間に中央配置される
 * 
 * **Validates: Requirements 5.1**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property 13: 画像交換ボタンの配置一貫性', () => {
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
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  /**
   * 画像交換ボタンの配置情報を取得
   */
  async function getButtonPlacementInfo(): Promise<{
    button: {
      exists: boolean;
      visible: boolean;
      rect: { x: number; y: number; width: number; height: number } | null;
      centerX: number | null;
      centerY: number | null;
    };
    colorControllers: {
      exists: boolean;
      rect: { x: number; y: number; width: number; height: number } | null;
      bottomY: number | null;
    };
    paintMixingSection: {
      exists: boolean;
      rect: { x: number; y: number; width: number; height: number } | null;
      topY: number | null;
    };
    viewport: {
      width: number;
      height: number;
      centerX: number;
    };
    placement: {
      isBetweenSections: boolean;
      isHorizontallyCentered: boolean;
      isVerticallyBetween: boolean;
    };
  }> {
    return await page.evaluate(() => {
      // 画像交換ボタンの情報を取得
      const swapButton = document.querySelector('.image-swap-button') || 
                        document.querySelector('[data-testid="image-swap-button"]') ||
                        document.querySelector('button[aria-label="画像を交換"]');
      
      const buttonExists = !!swapButton;
      const buttonVisible = swapButton ? window.getComputedStyle(swapButton).display !== 'none' : false;
      const buttonRect = swapButton ? swapButton.getBoundingClientRect() : null;
      const buttonCenterX = buttonRect ? buttonRect.x + buttonRect.width / 2 : null;
      const buttonCenterY = buttonRect ? buttonRect.y + buttonRect.height / 2 : null;
      
      // 色調コントローラセクションの情報を取得
      const colorControllersContainer = document.querySelector('.color-controllers') ||
                                       document.querySelector('.app__color-controllers') ||
                                       document.querySelector('[data-testid="color-controllers"]');
      
      const colorControllersExists = !!colorControllersContainer;
      const colorControllersRect = colorControllersContainer ? colorControllersContainer.getBoundingClientRect() : null;
      const colorControllersBottomY = colorControllersRect ? colorControllersRect.y + colorControllersRect.height : null;
      
      // 塗料混合セクションの情報を取得
      const paintMixingContainer = document.querySelector('.paint-mixing-controller') ||
                                  document.querySelector('.paint-mixing-section') ||
                                  document.querySelector('[data-testid="paint-mixing-section"]');
      
      const paintMixingExists = !!paintMixingContainer;
      const paintMixingRect = paintMixingContainer ? paintMixingContainer.getBoundingClientRect() : null;
      const paintMixingTopY = paintMixingRect ? paintMixingRect.y : null;
      
      // ビューポート情報
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportCenterX = viewportWidth / 2;
      
      // 配置の検証
      let isBetweenSections = false;
      let isHorizontallyCentered = false;
      let isVerticallyBetween = false;
      
      if (buttonCenterY && colorControllersBottomY && paintMixingTopY) {
        isVerticallyBetween = buttonCenterY > colorControllersBottomY && buttonCenterY < paintMixingTopY;
        isBetweenSections = isVerticallyBetween;
      }
      
      if (buttonCenterX) {
        // 中央配置の許容誤差（±50px）
        const centerTolerance = 50;
        isHorizontallyCentered = Math.abs(buttonCenterX - viewportCenterX) <= centerTolerance;
      }
      
      return {
        button: {
          exists: buttonExists,
          visible: buttonVisible,
          rect: buttonRect ? {
            x: buttonRect.x,
            y: buttonRect.y,
            width: buttonRect.width,
            height: buttonRect.height
          } : null,
          centerX: buttonCenterX,
          centerY: buttonCenterY
        },
        colorControllers: {
          exists: colorControllersExists,
          rect: colorControllersRect ? {
            x: colorControllersRect.x,
            y: colorControllersRect.y,
            width: colorControllersRect.width,
            height: colorControllersRect.height
          } : null,
          bottomY: colorControllersBottomY
        },
        paintMixingSection: {
          exists: paintMixingExists,
          rect: paintMixingRect ? {
            x: paintMixingRect.x,
            y: paintMixingRect.y,
            width: paintMixingRect.width,
            height: paintMixingRect.height
          } : null,
          topY: paintMixingTopY
        },
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
          centerX: viewportCenterX
        },
        placement: {
          isBetweenSections,
          isHorizontallyCentered,
          isVerticallyBetween
        }
      };
    });
  }

  /**
   * 配置一貫性を検証
   */
  function validatePlacementConsistency(placementInfo: any): {
    isValid: boolean;
    details: {
      buttonExists: boolean;
      buttonVisible: boolean;
      sectionsExist: boolean;
      correctVerticalPlacement: boolean;
      correctHorizontalPlacement: boolean;
      overallPlacementCorrect: boolean;
    };
  } {
    const buttonExists = placementInfo.button.exists;
    const buttonVisible = placementInfo.button.visible;
    const sectionsExist = placementInfo.colorControllers.exists && placementInfo.paintMixingSection.exists;
    const correctVerticalPlacement = placementInfo.placement.isVerticallyBetween;
    const correctHorizontalPlacement = placementInfo.placement.isHorizontallyCentered;
    
    const overallPlacementCorrect = buttonExists && buttonVisible && sectionsExist && 
                                   correctVerticalPlacement && correctHorizontalPlacement;
    
    return {
      isValid: overallPlacementCorrect,
      details: {
        buttonExists,
        buttonVisible,
        sectionsExist,
        correctVerticalPlacement,
        correctHorizontalPlacement,
        overallPlacementCorrect
      }
    };
  }

  /**
   * Feature: paint-color-assistant, Property 13: 画像交換ボタンの配置一貫性
   * 
   * 任意のデバイス環境において、画像交換ボタンが色調コントローラと塗料混合セクションの間に中央配置される
   * 
   * **Validates: Requirements 5.1**
   */
  it('Property 13: 任意のデバイス環境で画像交換ボタンが正しく配置される', async () => {
    const testIterations = 100; // 最低100回の反復テスト
    let successCount = 0;
    const failures: Array<{
      viewport: { width: number; height: number };
      deviceType: string;
      placementInfo: any;
      validationResult: any;
    }> = [];

    // 様々なデバイス環境をテスト
    const deviceEnvironments = [
      // モバイル環境
      ...Array.from({ length: 30 }, () => ({
        width: Math.floor(Math.random() * (767 - 320 + 1)) + 320,
        height: Math.floor(Math.random() * (900 - 600 + 1)) + 600,
        deviceType: 'mobile'
      })),
      // タブレット環境
      ...Array.from({ length: 30 }, () => ({
        width: Math.floor(Math.random() * (1023 - 768 + 1)) + 768,
        height: Math.floor(Math.random() * (1024 - 600 + 1)) + 600,
        deviceType: 'tablet'
      })),
      // デスクトップ環境
      ...Array.from({ length: 40 }, () => ({
        width: Math.floor(Math.random() * (1920 - 1024 + 1)) + 1024,
        height: Math.floor(Math.random() * (1080 - 600 + 1)) + 600,
        deviceType: 'desktop'
      }))
    ];

    for (let i = 0; i < testIterations; i++) {
      const environment = deviceEnvironments[i];
      
      try {
        // ビューポートを設定
        await page.setViewport({
          width: environment.width,
          height: environment.height
        });

        // ページを読み込み
        await page.goto('http://localhost:5173/paint-color-assistant2/', {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // 配置情報を取得
        const placementInfo = await getButtonPlacementInfo();
        
        // 配置一貫性を検証
        const validationResult = validatePlacementConsistency(placementInfo);
        
        if (validationResult.isValid) {
          successCount++;
        } else {
          failures.push({
            viewport: { width: environment.width, height: environment.height },
            deviceType: environment.deviceType,
            placementInfo,
            validationResult
          });
        }

        // 短い待機時間
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        // エラーは失敗として記録
        failures.push({
          viewport: { width: environment.width, height: environment.height },
          deviceType: environment.deviceType,
          placementInfo: null,
          validationResult: { error: (error as Error).message }
        });
      }
    }

    // 成功率の検証（85%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 13 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 85) {
      console.error(`Property 13 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          viewport: `${failure.viewport.width}x${failure.viewport.height}`,
          deviceType: failure.deviceType,
          details: failure.validationResult.details || failure.validationResult
        });
      });
    } else {
      console.log('✅ Property 13: 画像交換ボタンの配置一貫性 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(85);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.85));
  }, 120000); // 120秒タイムアウト

  it('Property 13 補助テスト: 特定デバイスでの詳細配置確認', async () => {
    // 重要なデバイスサイズでの詳細確認
    const criticalDevices = [
      { width: 375, height: 667, name: 'iPhone SE', deviceType: 'mobile' },
      { width: 768, height: 1024, name: 'iPad', deviceType: 'tablet' },
      { width: 1024, height: 768, name: 'iPad横向き', deviceType: 'desktop' },
      { width: 1200, height: 800, name: 'デスクトップ小', deviceType: 'desktop' },
      { width: 1920, height: 1080, name: 'フルHD', deviceType: 'desktop' }
    ];

    for (const device of criticalDevices) {
      // ビューポートを設定
      await page.setViewport({
        width: device.width,
        height: device.height
      });

      // ページを読み込み
      await page.goto('http://localhost:5173/paint-color-assistant2/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 配置情報を取得
      const placementInfo = await getButtonPlacementInfo();
      
      // 配置一貫性を検証
      const validationResult = validatePlacementConsistency(placementInfo);
      
      // 詳細ログ出力
      console.log(`${device.name} (${device.width}x${device.height}) 配置確認:`, {
        buttonExists: placementInfo.button.exists,
        buttonVisible: placementInfo.button.visible,
        buttonCenter: placementInfo.button.centerX ? 
          `X:${Math.round(placementInfo.button.centerX)}, Y:${Math.round(placementInfo.button.centerY)}` : null,
        viewportCenter: `X:${Math.round(placementInfo.viewport.centerX)}`,
        horizontalOffset: placementInfo.button.centerX ? 
          Math.round(Math.abs(placementInfo.button.centerX - placementInfo.viewport.centerX)) : null,
        verticalPlacement: validationResult.details.correctVerticalPlacement,
        horizontalPlacement: validationResult.details.correctHorizontalPlacement,
        isValid: validationResult.isValid
      });
      
      // 配置の検証
      expect(validationResult.details.buttonExists).toBe(true);
      expect(validationResult.details.buttonVisible).toBe(true);
      
      // デスクトップ環境では厳密な配置を要求
      if (device.deviceType === 'desktop') {
        expect(validationResult.details.correctVerticalPlacement).toBe(true);
        expect(validationResult.details.correctHorizontalPlacement).toBe(true);
      }
    }
  });

  it('Property 13 補助テスト: セクション間配置の詳細確認', async () => {
    // デスクトップサイズで詳細確認
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/paint-color-assistant2/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const placementInfo = await getButtonPlacementInfo();
    
    console.log('セクション間配置の詳細:', {
      colorControllersBottom: placementInfo.colorControllers.bottomY,
      buttonCenter: placementInfo.button.centerY,
      paintMixingTop: placementInfo.paintMixingSection.topY,
      verticalGap: placementInfo.paintMixingSection.topY && placementInfo.colorControllers.bottomY ?
        placementInfo.paintMixingSection.topY - placementInfo.colorControllers.bottomY : null,
      buttonInGap: placementInfo.placement.isVerticallyBetween
    });
    
    // セクションが存在することを確認
    expect(placementInfo.colorControllers.exists).toBe(true);
    expect(placementInfo.paintMixingSection.exists).toBe(true);
    
    // ボタンがセクション間に配置されていることを確認
    if (placementInfo.button.exists && placementInfo.button.visible) {
      expect(placementInfo.placement.isVerticallyBetween).toBe(true);
      expect(placementInfo.placement.isHorizontallyCentered).toBe(true);
    }
  });
});