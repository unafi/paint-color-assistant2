import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

/**
 * 色選択機能のデバッグテスト
 * 画像クリック→色調コントローラー反映の詳細な動作確認
 */
describe('🔍 色選択機能デバッグテスト', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5173';
  const TEST_IMAGE_PATH = path.resolve(__dirname, '../../../test_red.png');

  beforeAll(async () => {
    console.log('🚀 デバッグテスト用ブラウザを起動中...');
    
    browser = await puppeteer.launch({
      headless: false, // ヘッドレスモードを無効にして実際のブラウザを表示
      devtools: true,  // DevToolsを開く
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // コンソールログを監視
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.error('🔴 ブラウザエラー:', text);
      } else if (text.includes('🎨') || text.includes('🖱️') || text.includes('✅') || text.includes('❌')) {
        console.log(`📱 ブラウザログ[${type}]:`, text);
      }
    });
    
    console.log('✅ デバッグテスト用ブラウザ起動完了');
  }, 30000);

  afterAll(async () => {
    // テスト終了後、ブラウザを5秒間開いたままにする
    console.log('⏳ 5秒後にブラウザを閉じます...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (browser) {
      await browser.close();
      console.log('✅ デバッグテスト用ブラウザ終了完了');
    }
  });

  it('画像アップロード→クリック→色選択の詳細確認', async () => {
    console.log('📍 デバッグテスト: 画像アップロード→クリック→色選択');
    
    // アプリケーションにアクセス
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    console.log('✅ アプリケーションにアクセス完了');
    
    // 画像ファイルをアップロード
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    console.log('✅ 画像ファイルアップロード完了');
    
    // 画像が読み込まれるまで待機
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Canvas要素の存在確認
    const canvas = await page.$('canvas.image-upload__canvas');
    expect(canvas).toBeTruthy();
    console.log('✅ Canvas要素確認完了');
    
    // Canvas要素の詳細情報を取得
    const canvasInfo = await page.evaluate((canvas) => {
      if (!canvas) return null;
      
      const rect = canvas.getBoundingClientRect();
      return {
        canvasSize: { width: canvas.width, height: canvas.height },
        displaySize: { width: rect.width, height: rect.height },
        position: { x: rect.x, y: rect.y },
        visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
      };
    }, canvas);
    
    console.log('📊 Canvas情報:', canvasInfo);
    expect(canvasInfo?.visible).toBe(true);
    
    // 初期のColorController状態を確認
    const initialColorState = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return null;
      
      const firstController = colorControllers[0];
      const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
      
      return {
        controllerCount: colorControllers.length,
        rgbValues: {
          r: parseInt(rgbInputs[0]?.value || '0'),
          g: parseInt(rgbInputs[1]?.value || '0'),
          b: parseInt(rgbInputs[2]?.value || '0')
        }
      };
    });
    
    console.log('📊 初期ColorController状態:', initialColorState);
    
    // Canvas左上をクリック（赤い部分があるかもしれない）
    console.log('🖱️ Canvas左上をクリック...');
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 20, y: 20 }
    });
    
    // クリック後の処理完了を待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // クリック後のColorController状態を確認
    const afterClickColorState = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return null;
      
      const firstController = colorControllers[0];
      const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
      
      return {
        rgbValues: {
          r: parseInt(rgbInputs[0]?.value || '0'),
          g: parseInt(rgbInputs[1]?.value || '0'),
          b: parseInt(rgbInputs[2]?.value || '0')
        }
      };
    });
    
    console.log('📊 左上クリック後ColorController状態:', afterClickColorState);
    
    // 別の位置もテスト（右下）
    console.log('🖱️ Canvas右下をクリック...');
    await page.click('canvas.image-upload__canvas', {
      offset: { x: canvasInfo!.canvasSize.width - 20, y: canvasInfo!.canvasSize.height - 20 }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterRightBottomClick = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return null;
      
      const firstController = colorControllers[0];
      const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
      
      return {
        rgbValues: {
          r: parseInt(rgbInputs[0]?.value || '0'),
          g: parseInt(rgbInputs[1]?.value || '0'),
          b: parseInt(rgbInputs[2]?.value || '0')
        }
      };
    });
    
    console.log('📊 右下クリック後ColorController状態:', afterRightBottomClick);
    
    // 選択ポイントが表示されているか確認
    const selectionPoint = await page.$('.image-upload__selection-point');
    console.log('📍 選択ポイント表示:', !!selectionPoint);
    
    // 色が変更されているかチェック
    const colorChanged = 
      afterClickColorState?.rgbValues.r !== initialColorState?.rgbValues.r ||
      afterClickColorState?.rgbValues.g !== initialColorState?.rgbValues.g ||
      afterClickColorState?.rgbValues.b !== initialColorState?.rgbValues.b;
    
    const colorChanged2 = 
      afterRightBottomClick?.rgbValues.r !== initialColorState?.rgbValues.r ||
      afterRightBottomClick?.rgbValues.g !== initialColorState?.rgbValues.g ||
      afterRightBottomClick?.rgbValues.b !== initialColorState?.rgbValues.b;
    
    console.log('🎨 色変更確認（左上）:', colorChanged);
    console.log('🎨 色変更確認（右下）:', colorChanged2);
    console.log('📊 変更詳細:', {
      初期: initialColorState?.rgbValues,
      左上クリック後: afterClickColorState?.rgbValues,
      右下クリック後: afterRightBottomClick?.rgbValues
    });
    
    // テスト結果
    expect(selectionPoint).toBeTruthy();
    expect(colorChanged || colorChanged2).toBe(true); // どちらかで色が変更されていればOK
    
    console.log('✅ デバッグテスト完了');
  }, 60000); // 60秒のタイムアウト
});
