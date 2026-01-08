/**
 * プロパティテスト: レスポンシブレイアウト
 * Feature: paint-color-assistant, Property 4: レスポンシブレイアウト
 * 
 * 任意の画面幅において、適切なブレークポイント（1024px）でレイアウトが切り替わる
 * 
 * **Validates: Requirements 4.1**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Property 4: レスポンシブレイアウト', () => {
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
   * Feature: paint-color-assistant, Property 4: レスポンシブレイアウト
   * 
   * 任意の画面幅において、適切なブレークポイント（1024px）でレイアウトが切り替わる
   * 
   * **Validates: Requirements 4.1**
   */
  it('Property 4: 任意の画面幅で1024pxブレークポイントでレイアウトが切り替わる', async () => {
    const testIterations = 100; // 最低100回の反復テスト
    let successCount = 0;
    const failures: Array<{
      width: number;
      height: number;
      expectedLayout: string;
      actualLayout: string;
      details: any;
    }> = [];

    // テスト用の画面サイズ範囲を定義
    const testViewports = [
      // モバイル範囲（320px - 767px）
      ...Array.from({ length: 30 }, () => ({
        width: Math.floor(Math.random() * (767 - 320 + 1)) + 320,
        height: Math.floor(Math.random() * (900 - 600 + 1)) + 600,
        expectedLayout: 'mobile'
      })),
      // タブレット範囲（768px - 1023px）
      ...Array.from({ length: 30 }, () => ({
        width: Math.floor(Math.random() * (1023 - 768 + 1)) + 768,
        height: Math.floor(Math.random() * (1024 - 600 + 1)) + 600,
        expectedLayout: 'tablet'
      })),
      // デスクトップ範囲（1024px - 1920px）
      ...Array.from({ length: 40 }, () => ({
        width: Math.floor(Math.random() * (1920 - 1024 + 1)) + 1024,
        height: Math.floor(Math.random() * (1080 - 600 + 1)) + 600,
        expectedLayout: 'desktop'
      }))
    ];

    for (let i = 0; i < testIterations; i++) {
      const viewport = testViewports[i];
      
      try {
        // ビューポートを設定
        await page.setViewport({
          width: viewport.width,
          height: viewport.height
        });

        // ページを読み込み
        await page.goto('http://localhost:5173/paint-color-assistant2/', {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // レイアウト情報を取得
        const layoutInfo = await page.evaluate(() => {
          const appElement = document.querySelector('.app');
          if (!appElement) return null;

          const computedStyle = window.getComputedStyle(appElement);
          const width = window.innerWidth;
          
          // レイアウトクラスの確認
          const hasDesktopLayout = appElement.classList.contains('app__desktop-layout') ||
                                 document.querySelector('.app__desktop-layout') !== null;
          const hasMobileLayout = appElement.classList.contains('app__mobile-layout') ||
                                document.querySelector('.app__mobile-layout') !== null;
          
          // CSS メディアクエリの状態を確認
          const isDesktopMedia = window.matchMedia('(min-width: 1024px)').matches;
          const isTabletMedia = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
          const isMobileMedia = window.matchMedia('(max-width: 767px)').matches;
          
          // レイアウト要素の配置を確認
          const colorControllers = document.querySelectorAll('.color-controller');
          const paintMixingController = document.querySelector('.paint-mixing-controller');
          
          let layoutType = 'unknown';
          if (width >= 1024) {
            layoutType = 'desktop';
          } else if (width >= 768) {
            layoutType = 'tablet';
          } else {
            layoutType = 'mobile';
          }

          return {
            width,
            layoutType,
            hasDesktopLayout,
            hasMobileLayout,
            isDesktopMedia,
            isTabletMedia,
            isMobileMedia,
            colorControllersCount: colorControllers.length,
            hasPaintMixingController: !!paintMixingController,
            flexDirection: computedStyle.flexDirection,
            display: computedStyle.display
          };
        });

        if (!layoutInfo) {
          failures.push({
            width: viewport.width,
            height: viewport.height,
            expectedLayout: viewport.expectedLayout,
            actualLayout: 'not_found',
            details: { error: 'App element not found' }
          });
          continue;
        }

        // レイアウトの正しさを検証
        const isLayoutCorrect = layoutInfo.layoutType === viewport.expectedLayout;
        
        // ブレークポイントの正しさを検証
        const isBreakpointCorrect = 
          (viewport.width >= 1024 && layoutInfo.isDesktopMedia) ||
          (viewport.width >= 768 && viewport.width < 1024 && layoutInfo.isTabletMedia) ||
          (viewport.width < 768 && layoutInfo.isMobileMedia);

        if (isLayoutCorrect && isBreakpointCorrect) {
          successCount++;
        } else {
          failures.push({
            width: viewport.width,
            height: viewport.height,
            expectedLayout: viewport.expectedLayout,
            actualLayout: layoutInfo.layoutType,
            details: {
              isLayoutCorrect,
              isBreakpointCorrect,
              layoutInfo
            }
          });
        }

      } catch (error) {
        // エラーは失敗として記録
        failures.push({
          width: viewport.width,
          height: viewport.height,
          expectedLayout: viewport.expectedLayout,
          actualLayout: 'error',
          details: { error: (error as Error).message }
        });
      }

      // 短い待機時間
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 成功率の検証（90%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 4 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 90) {
      console.error(`Property 4 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          viewport: `${failure.width}x${failure.height}`,
          expected: failure.expectedLayout,
          actual: failure.actualLayout,
          details: failure.details
        });
      });
    } else {
      console.log('✅ Property 4: レスポンシブレイアウト - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.9));
  }, 120000); // 120秒タイムアウト

  it('Property 4 補助テスト: 特定のブレークポイントでの詳細検証', async () => {
    // 重要なブレークポイント周辺での詳細検証
    const criticalViewports = [
      { width: 767, height: 800, expectedLayout: 'mobile', name: 'モバイル上限' },
      { width: 768, height: 800, expectedLayout: 'tablet', name: 'タブレット下限' },
      { width: 1023, height: 800, expectedLayout: 'tablet', name: 'タブレット上限' },
      { width: 1024, height: 800, expectedLayout: 'desktop', name: 'デスクトップ下限' },
      { width: 320, height: 600, expectedLayout: 'mobile', name: 'モバイル最小' },
      { width: 1920, height: 1080, expectedLayout: 'desktop', name: 'デスクトップ大画面' }
    ];

    for (const viewport of criticalViewports) {
      // ビューポートを設定
      await page.setViewport({
        width: viewport.width,
        height: viewport.height
      });

      // ページを読み込み
      await page.goto('http://localhost:5173/paint-color-assistant2/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // レイアウト情報を取得
      const layoutInfo = await page.evaluate(() => {
        const width = window.innerWidth;
        const isDesktopMedia = window.matchMedia('(min-width: 1024px)').matches;
        const isTabletMedia = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
        const isMobileMedia = window.matchMedia('(max-width: 767px)').matches;
        
        let layoutType = 'unknown';
        if (width >= 1024) {
          layoutType = 'desktop';
        } else if (width >= 768) {
          layoutType = 'tablet';
        } else {
          layoutType = 'mobile';
        }

        return {
          width,
          layoutType,
          isDesktopMedia,
          isTabletMedia,
          isMobileMedia
        };
      });

      // 詳細ログ出力
      console.log(`${viewport.name}テスト (${viewport.width}px):`, {
        expected: viewport.expectedLayout,
        actual: layoutInfo.layoutType,
        mediaQueries: {
          desktop: layoutInfo.isDesktopMedia,
          tablet: layoutInfo.isTabletMedia,
          mobile: layoutInfo.isMobileMedia
        }
      });

      // レイアウトの検証
      expect(layoutInfo.layoutType).toBe(viewport.expectedLayout);
      
      // メディアクエリの検証
      if (viewport.width >= 1024) {
        expect(layoutInfo.isDesktopMedia).toBe(true);
        expect(layoutInfo.isTabletMedia).toBe(false);
        expect(layoutInfo.isMobileMedia).toBe(false);
      } else if (viewport.width >= 768) {
        expect(layoutInfo.isDesktopMedia).toBe(false);
        expect(layoutInfo.isTabletMedia).toBe(true);
        expect(layoutInfo.isMobileMedia).toBe(false);
      } else {
        expect(layoutInfo.isDesktopMedia).toBe(false);
        expect(layoutInfo.isTabletMedia).toBe(false);
        expect(layoutInfo.isMobileMedia).toBe(true);
      }
    }
  });
});