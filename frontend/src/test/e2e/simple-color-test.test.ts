import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

/**
 * シンプルな色選択テスト
 */
describe('🎨 シンプル色選択テスト', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5173';
  const TEST_IMAGE_PATH = path.resolve(__dirname, '../../../test_red.png'); // 確実に存在する画像

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // 実際のブラウザを表示
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  }, 30000);

  afterAll(async () => {
    // 10秒間ブラウザを開いたままにして手動確認
    console.log('⏳ 10秒間ブラウザを開いたままにします...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (browser) {
      await browser.close();
    }
  });

  it('画像クリックで色が変更される', async () => {
    // アプリにアクセス
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロード
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    
    // 画像読み込み待機（より長く）
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Canvas要素の存在確認
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.image-upload__canvas');
      console.log('Canvas要素:', canvas);
      return !!canvas;
    });
    
    console.log('Canvas存在確認:', canvasExists);
    
    if (!canvasExists) {
      console.log('❌ Canvas要素が見つかりません。画像が読み込まれていない可能性があります。');
      
      // 画像アップロード状態を確認
      const uploadState = await page.evaluate(() => {
        const imageUpload = document.querySelector('.image-upload');
        const errorElement = document.querySelector('.image-upload__error');
        const loadingElement = document.querySelector('.image-upload__loading');
        const previewElement = document.querySelector('.image-upload__preview');
        
        return {
          imageUploadExists: !!imageUpload,
          hasError: !!errorElement,
          isLoading: !!loadingElement,
          hasPreview: !!previewElement,
          errorText: errorElement?.textContent || null
        };
      });
      
      console.log('アップロード状態:', uploadState);
      expect(false).toBe(true); // テスト失敗
      return;
    }
    
    // 初期RGB値を取得
    const initialRgb = await page.evaluate(() => {
      const firstController = document.querySelector('.color-controller');
      if (!firstController) return { r: 0, g: 0, b: 0 };
      
      const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
      return {
        r: parseInt(rgbInputs[0]?.value || '0'),
        g: parseInt(rgbInputs[1]?.value || '0'),
        b: parseInt(rgbInputs[2]?.value || '0')
      };
    });
    
    console.log('初期RGB:', initialRgb);
    
    // Canvas要素をクリック
    const canvas = await page.$('canvas.image-upload__canvas');
    // Canvas存在確認は上で行っているのでここでは省略
    
    // 複数の位置をクリックしてテスト
    const positions = [
      { x: 50, y: 50, name: '左上' },
      { x: 150, y: 50, name: '右上' },
      { x: 100, y: 100, name: '中央' }
    ];
    
    for (const pos of positions) {
      console.log(`${pos.name}をクリック...`);
      
      await page.evaluate((position) => {
        const canvas = document.querySelector('canvas.image-upload__canvas') as HTMLCanvasElement;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const event = new MouseEvent('click', {
            clientX: rect.left + position.x,
            clientY: rect.top + position.y,
            bubbles: true
          });
          canvas.dispatchEvent(event);
        }
      }, pos);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // RGB値を確認
      const currentRgb = await page.evaluate(() => {
        const firstController = document.querySelector('.color-controller');
        if (!firstController) return { r: 0, g: 0, b: 0 };
        
        const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
        return {
          r: parseInt(rgbInputs[0]?.value || '0'),
          g: parseInt(rgbInputs[1]?.value || '0'),
          b: parseInt(rgbInputs[2]?.value || '0')
        };
      });
      
      console.log(`${pos.name}クリック後RGB:`, currentRgb);
      
      // 色が変更されているかチェック
      const colorChanged = 
        currentRgb.r !== initialRgb.r ||
        currentRgb.g !== initialRgb.g ||
        currentRgb.b !== initialRgb.b;
      
      if (colorChanged) {
        console.log('✅ 色変更確認！');
        expect(colorChanged).toBe(true);
        return; // 成功したらテスト終了
      }
    }
    
    // どの位置でも色が変更されなかった場合
    console.log('❌ どの位置でも色が変更されませんでした');
    expect(false).toBe(true); // テスト失敗
  }, 60000);
});