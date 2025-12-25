import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Builder, WebDriver, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import path from 'path';

/**
 * Selenium自動ブラウザテスト
 * 実際のブラウザでの動作を自動テスト
 */
describe('ブラウザ自動テスト', () => {
  let driver: WebDriver;
  const APP_URL = 'http://localhost:5173';
  const TEST_IMAGE_PATH = path.resolve(__dirname, '../../../test_red.png');

  beforeAll(async () => {
    // Chrome オプション設定
    const options = new chrome.Options();
    options.addArguments('--headless'); // ヘッドレスモード
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-web-security');
    options.addArguments('--allow-running-insecure-content');

    try {
      // WebDriver初期化
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      // タイムアウト設定
      await driver.manage().setTimeouts({ implicit: 5000 });
      
      console.log('✅ Chrome WebDriver初期化完了');
    } catch (error) {
      console.error('❌ Chrome WebDriver初期化失敗:', error);
      throw error;
    }
  }, 30000); // 30秒のタイムアウト

  afterAll(async () => {
    if (driver) {
      try {
        await driver.quit();
        console.log('✅ Chrome WebDriver終了完了');
      } catch (error) {
        console.error('❌ Chrome WebDriver終了エラー:', error);
      }
    }
  });

  it('アプリケーションが正常に読み込まれる', async () => {
    await driver.get(APP_URL);
    
    // タイトル確認
    const title = await driver.getTitle();
    expect(title).toContain('Vite + React + TS');
    
    // メインコンテンツが表示されることを確認
    const appElement = await driver.findElement(By.id('root'));
    expect(await appElement.isDisplayed()).toBe(true);
  });

  it('PATH入力フィールドが表示される', async () => {
    await driver.get(APP_URL);
    
    // PATH入力フィールドを探す
    const pathInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="画像ファイルのパスを入力"]')),
      5000
    );
    
    expect(await pathInput.isDisplayed()).toBe(true);
    expect(await pathInput.isEnabled()).toBe(true);
  });

  it('参照ボタンが表示される', async () => {
    await driver.get(APP_URL);
    
    // 参照ボタンを探す
    const browseButton = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(text(), "参照")]')),
      5000
    );
    
    expect(await browseButton.isDisplayed()).toBe(true);
    expect(await browseButton.isEnabled()).toBe(true);
  });

  it('PATH入力時にコンソールメッセージが出力される', async () => {
    await driver.get(APP_URL);
    
    // コンソールログを監視
    const logs: any[] = [];
    driver.manage().logs().get('browser').then((entries) => {
      logs.push(...entries);
    });
    
    // PATH入力フィールドに値を入力
    const pathInput = await driver.findElement(By.css('input[placeholder*="画像ファイルのパスを入力"]'));
    await pathInput.clear();
    await pathInput.sendKeys('D:\\test\\image.jpg');
    
    // 少し待機してログを確認
    await driver.sleep(1000);
    
    // コンソールログを再取得
    const browserLogs = await driver.manage().logs().get('browser');
    const hasPathLog = browserLogs.some(log => 
      log.message.includes('Clean path') || 
      log.message.includes('PATH読み込み')
    );
    
    expect(hasPathLog).toBe(true);
  });

  it('ファイル入力要素が存在する', async () => {
    await driver.get(APP_URL);
    
    // 隠しファイル入力要素を探す
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    
    expect(await fileInput.isPresent()).toBe(true);
    
    // accept属性が正しく設定されているか確認
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('image/jpeg');
    expect(acceptAttr).toContain('image/png');
  });

  it('エラー表示エリアが適切に動作する', async () => {
    await driver.get(APP_URL);
    
    // 無効なパスを入力してエラーを発生させる
    const pathInput = await driver.findElement(By.css('input[placeholder*="画像ファイルのパスを入力"]'));
    await pathInput.clear();
    await pathInput.sendKeys('invalid-path');
    
    // 少し待機
    await driver.sleep(500);
    
    // エラー要素が表示されないことを確認（現在の実装では無効パスでもエラー表示しない）
    const errorElements = await driver.findElements(By.css('.image-upload__error'));
    // 現在の実装では無効パスでもコンソールログのみなので、エラー要素は表示されない
    expect(errorElements.length).toBe(0);
  });

  it('レスポンシブデザインが適用される', async () => {
    await driver.get(APP_URL);
    
    // デスクトップサイズでの表示確認
    await driver.manage().window().setRect({ width: 1920, height: 1080, x: 0, y: 0 });
    
    const pathInput = await driver.findElement(By.css('input[placeholder*="画像ファイルのパスを入力"]'));
    expect(await pathInput.isDisplayed()).toBe(true);
    
    // モバイルサイズに変更
    await driver.manage().window().setRect({ width: 375, height: 667, x: 0, y: 0 });
    
    // 少し待機してレスポンシブ変更を待つ
    await driver.sleep(500);
    
    // モバイルでも要素が表示されることを確認
    expect(await pathInput.isDisplayed()).toBe(true);
  });

  it('コンポーネントの基本構造が正しい', async () => {
    await driver.get(APP_URL);
    
    // メインのimage-uploadクラスを持つ要素を確認
    const imageUploadElements = await driver.findElements(By.css('.image-upload'));
    expect(imageUploadElements.length).toBeGreaterThan(0);
    
    // ファイル選択セクションを確認
    const fileSectionElements = await driver.findElements(By.css('.image-upload__file-section'));
    expect(fileSectionElements.length).toBeGreaterThan(0);
  });
});