import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Puppeteer自動ブラウザテスト
 * 実際のブラウザでの動作を自動テスト
 */
describe('🧪 ブラウザ自動テスト (Puppeteer)', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5174/paint-color-assistant2/';

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
  }, 60000); // 60秒に延長

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
    
    // デスクトップサイズでPATH入力フィールドを確認
    const pathInput = await page.$('input[placeholder*="画像ファイルのパスを入力"]');
    expect(pathInput).toBeTruthy();
    
    console.log('✅ PATH入力フィールド表示確認');
  });

  it('参照ボタンが表示される', async () => {
    console.log('📍 テスト: 参照ボタン表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 参照ボタンを探す
    const buttons = await page.$$('button');
    let browseButton = null;
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('参照')) {
        browseButton = button;
        break;
      }
    }
    expect(browseButton).toBeTruthy();
    
    console.log('✅ 参照ボタン表示確認');
  });

  it('ファイル入力要素が存在する', async () => {
    console.log('📍 テスト: ファイル入力要素存在確認');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    console.log('✅ ファイル入力要素存在確認');
  });

  it('レスポンシブデザインが適用される', async () => {
    console.log('📍 テスト: レスポンシブデザイン');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // デスクトップサイズでの表示確認
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // デスクトップでは◀▶ボタンが非表示であることを確認
    const desktopButtons = await page.$$('button');
    const desktopArrowButtons = [];
    for (const button of desktopButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text === '◀' || text === '▶') {
        desktopArrowButtons.push(button);
      }
    }
    expect(desktopArrowButtons.length).toBe(0);
    
    // モバイルサイズに変更
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // モバイルでは◀▶ボタンが表示されることを確認
    const mobileButtons = await page.$$('button');
    const mobileArrowButtons = [];
    for (const button of mobileButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text === '◀' || text === '▶') {
        mobileArrowButtons.push(button);
      }
    }
    expect(mobileArrowButtons.length).toBeGreaterThan(0);
    
    console.log('✅ レスポンシブデザイン確認');
  });

  it('コンポーネントの基本構造が正しい', async () => {
    console.log('📍 テスト: コンポーネント基本構造');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // メインのimage-uploadクラスを持つ要素を確認
    const imageUploadElements = await page.$$('.image-upload');
    expect(imageUploadElements.length).toBeGreaterThan(0);
    
    console.log('✅ コンポーネント基本構造確認');
  });

  it('モバイル環境での◀▶ボタン表示確認', async () => {
    console.log('📍 テスト: モバイル◀▶ボタン表示');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // モバイルサイズに設定
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ◀▶ボタンが表示されることを確認
    const buttons = await page.$$('button');
    const arrowButtons = [];
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text === '◀' || text === '▶') {
        arrowButtons.push(button);
      }
    }
    
    expect(arrowButtons.length).toBeGreaterThan(0);
    console.log(`✅ モバイル環境で◀▶ボタンが${arrowButtons.length}個表示されています`);
    
    // ボタンがクリック可能であることを確認
    if (arrowButtons.length > 0) {
      const firstButton = arrowButtons[0];
      const isEnabled = await firstButton.evaluate(el => !el.disabled);
      expect(isEnabled).toBe(true);
      console.log('✅ ◀▶ボタンがクリック可能です');
    }
    
    console.log('✅ モバイル◀▶ボタン表示確認');
  });
});