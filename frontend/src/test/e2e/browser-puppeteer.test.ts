import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Puppeteer自動ブラウザテスト
 * 実際のブラウザでの動作を自動テスト
 */
describe('🧪 ブラウザ自動テスト (Puppeteer)', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5173';

  beforeAll(async () => {
    console.log('🚀 Puppeteerブラウザを起動中...');
    
    browser = await puppeteer.launch({
      headless: true, // ヘッドレスモード
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
    
    console.log('✅ Puppeteerブラウザ起動完了');
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('✅ Puppeteerブラウザ終了完了');
    }
  });

  it('アプリケーションが正常に読み込まれる', async () => {
    console.log('📍 テスト: アプリケーション読み込み');
    
    const response = await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    expect(response?.status()).toBe(200);
    
    const title = await page.title();
    expect(title).toContain('塗装色混合アシスタント');
    
    // メインコンテンツが表示されることを確認
    const appElement = await page.$('#root');
    expect(appElement).toBeTruthy();
    
    console.log('✅ アプリケーション正常読み込み確認');
  });

  it('PATH入力フィールドが表示される', async () => {
    console.log('📍 テスト: PATH入力フィールド表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // PATH入力フィールドを探す
    const pathInput = await page.waitForSelector('input[placeholder*="画像ファイルのパスを入力"]', {
      timeout: 5000
    });
    
    expect(pathInput).toBeTruthy();
    
    const isVisible = await pathInput?.isIntersectingViewport();
    expect(isVisible).toBe(true);
    
    console.log('✅ PATH入力フィールド表示確認');
  });

  it('参照ボタンが表示される', async () => {
    console.log('📍 テスト: 参照ボタン表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 参照ボタンを探す
    const browseButton = await page.waitForSelector('button.image-upload__browse-button', {
      timeout: 5000
    });
    
    expect(browseButton).toBeTruthy();
    
    const isVisible = await browseButton?.isIntersectingViewport();
    expect(isVisible).toBe(true);
    
    console.log('✅ 参照ボタン表示確認');
  });

  it('PATH入力時にコンソールメッセージが出力される', async () => {
    console.log('📍 テスト: PATH入力時のコンソールメッセージ');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // コンソールログを監視
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    // PATH入力フィールドに値を入力
    const pathInput = await page.waitForSelector('input[placeholder*="画像ファイルのパスを入力"]');
    await pathInput?.click();
    await pathInput?.type('D:\\test\\image.jpg');
    
    // 少し待機してログを確認
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const hasPathLog = consoleLogs.some(log => 
      log.includes('Clean path') || 
      log.includes('PATH読み込み')
    );
    
    expect(hasPathLog).toBe(true);
    console.log('📝 コンソールログ:', consoleLogs.filter(log => log.includes('path') || log.includes('PATH')));
    console.log('✅ PATH入力時のコンソールメッセージ確認');
  });

  it('ファイル入力要素が存在する', async () => {
    console.log('📍 テスト: ファイル入力要素存在確認');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 隠しファイル入力要素を探す
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    // accept属性が正しく設定されているか確認
    const acceptAttr = await page.evaluate((el) => el.getAttribute('accept'), fileInput);
    expect(acceptAttr).toContain('image/jpeg');
    expect(acceptAttr).toContain('image/png');
    
    console.log('✅ ファイル入力要素存在確認');
  });

  it('参照ボタンクリックでファイル選択がトリガーされる', async () => {
    console.log('📍 テスト: 参照ボタンクリック動作');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 参照ボタンをクリック
    const browseButton = await page.waitForSelector('button.image-upload__browse-button');
    
    // ファイル選択ダイアログの監視
    let fileChooserTriggered = false;
    page.on('filechooser', () => {
      fileChooserTriggered = true;
    });
    
    await browseButton?.click();
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(fileChooserTriggered).toBe(true);
    console.log('✅ 参照ボタンクリック動作確認');
  });

  it('レスポンシブデザインが適用される', async () => {
    console.log('📍 テスト: レスポンシブデザイン');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // デスクトップサイズでの表示確認
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pathInputDesktop = await page.$('input[placeholder*="画像ファイルのパスを入力"]');
    expect(pathInputDesktop).toBeTruthy();
    
    // モバイルサイズに変更
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // モバイルでも要素が表示されることを確認
    const pathInputMobile = await page.$('input[placeholder*="画像ファイルのパスを入力"]');
    expect(pathInputMobile).toBeTruthy();
    
    console.log('✅ レスポンシブデザイン確認');
  });

  it('コンポーネントの基本構造が正しい', async () => {
    console.log('📍 テスト: コンポーネント基本構造');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // メインのimage-uploadクラスを持つ要素を確認
    const imageUploadElements = await page.$$('.image-upload');
    expect(imageUploadElements.length).toBeGreaterThan(0);
    
    // ファイル選択セクションを確認
    const fileSectionElements = await page.$$('.image-upload__file-section');
    expect(fileSectionElements.length).toBeGreaterThan(0);
    
    console.log('✅ コンポーネント基本構造確認');
  });
});