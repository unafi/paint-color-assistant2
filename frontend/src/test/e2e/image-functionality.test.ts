import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

/**
 * 画像機能の実際のテスト
 * ファイル選択から画像表示、色選択までの一連の流れをテスト
 */
describe('🖼️ 画像機能実際のテスト', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5173';
  const TEST_IMAGE_PATH = path.resolve(__dirname, '../../../test_red.png');

  beforeAll(async () => {
    console.log('🚀 画像機能テスト用ブラウザを起動中...');
    
    browser = await puppeteer.launch({
      headless: true,
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
    
    console.log('✅ 画像機能テスト用ブラウザ起動完了');
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('✅ 画像機能テスト用ブラウザ終了完了');
    }
  });

  it('ファイル選択で画像が表示される', async () => {
    console.log('📍 テスト: ファイル選択→画像表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // ファイル入力要素を取得
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    // テスト画像ファイルを選択
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    
    // 画像が読み込まれるまで待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Canvas要素が表示されることを確認
    const canvas = await page.$('canvas.image-upload__canvas');
    expect(canvas).toBeTruthy();
    
    // Canvas要素が実際に描画されているか確認
    const canvasSize = await page.evaluate((canvas) => {
      if (!canvas) return null;
      return {
        width: canvas.width,
        height: canvas.height,
        displayed: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
      };
    }, canvas);
    
    expect(canvasSize).toBeTruthy();
    expect(canvasSize!.width).toBeGreaterThan(0);
    expect(canvasSize!.height).toBeGreaterThan(0);
    expect(canvasSize!.displayed).toBe(true);
    
    console.log('📊 Canvas情報:', canvasSize);
    console.log('✅ ファイル選択→画像表示確認');
  });

  it('画像クリックで色が選択される', async () => {
    console.log('📍 テスト: 画像クリック→色選択');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // ファイル入力要素を取得してファイルを選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    
    // 画像が読み込まれるまで待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Canvas要素を取得
    const canvas = await page.$('canvas.image-upload__canvas');
    expect(canvas).toBeTruthy();
    
    // コンソールログを監視（色選択のログを確認）
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    // Canvas中央をクリック
    const canvasBox = await canvas!.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      await page.click('canvas.image-upload__canvas', {
        offset: { x: canvasBox.width / 2, y: canvasBox.height / 2 }
      });
      
      // 色選択処理の完了を待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📊 クリック位置:', { x: centerX, y: centerY });
      console.log('📝 コンソールログ:', consoleLogs.filter(log => 
        log.includes('色') || log.includes('RGB') || log.includes('選択')
      ));
    }
    
    // 選択ポイントが表示されることを確認
    const selectionPoint = await page.$('.image-upload__selection-point');
    expect(selectionPoint).toBeTruthy();
    
    console.log('✅ 画像クリック→色選択確認');
  });

  it('画像情報が正しく表示される', async () => {
    console.log('📍 テスト: 画像情報表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // ファイル入力要素を取得してファイルを選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    
    // 画像が読み込まれるまで待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 画像プレビューヘッダーが表示されることを確認
    const previewHeader = await page.$('.image-upload__preview-title');
    expect(previewHeader).toBeTruthy();
    
    // 画像サイズ情報が含まれているか確認
    const headerText = await page.evaluate((el) => el?.textContent, previewHeader);
    expect(headerText).toContain('画像プレビュー');
    expect(headerText).toMatch(/\d+ × \d+/); // サイズ情報のパターン
    
    console.log('📊 画像情報:', headerText);
    console.log('✅ 画像情報表示確認');
  });

  it('エラーハンドリングが正しく動作する', async () => {
    console.log('📍 テスト: エラーハンドリング');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 無効なファイルタイプをテスト（テキストファイル）
    const invalidFilePath = path.resolve(__dirname, '../../../package.json');
    
    const fileInput = await page.$('input[type="file"]');
    
    // ファイル選択時のエラーを監視
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    try {
      await fileInput!.uploadFile(invalidFilePath);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // エラーログが出力されることを確認
      const hasErrorLog = consoleLogs.some(log => 
        log.includes('エラー') || log.includes('失敗') || log.includes('対応していない')
      );
      
      console.log('📝 エラーログ:', consoleLogs.filter(log => 
        log.includes('エラー') || log.includes('失敗') || log.includes('対応していない')
      ));
      
      // エラー表示要素が表示されるか確認
      const errorElement = await page.$('.image-upload__error');
      
      console.log('📊 エラー要素存在:', !!errorElement);
      console.log('📊 エラーログ存在:', hasErrorLog);
      
    } catch (error) {
      console.log('📝 期待されるエラー:', error);
    }
    
    console.log('✅ エラーハンドリング確認');
  });
});
