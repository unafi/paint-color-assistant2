/**
 * 手動視覚比較テスト
 * 混色コントローラと色調コントローラの見た目比較
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('視覚比較テスト - 混色コントローラ vs 色調コントローラ', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // ヘッドレスモードを無効にして実際のブラウザを表示
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  }, 30000);

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  it('PC表示での比較確認', async () => {
    // デスクトップビューポートに設定
    await page.setViewport({ width: 1024, height: 768 });
    
    // 混色コントローラが表示されるまで待機
    await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
    
    // 色調コントローラBテストページに移動
    await page.goto(`${baseUrl}/#/color-controller-b-test`, { waitUntil: 'networkidle0' });
    
    // 色調コントローラが表示されるまで待機
    await page.waitForSelector('.color-controller', { timeout: 10000 });
    
    console.log('PC表示での比較確認完了');
    console.log('1. 混色コントローラでは◀▶ボタンが表示されていないことを確認');
    console.log('2. 色調コントローラでも◀▶ボタンが表示されていないことを確認');
    
    // 手動確認のため5秒待機
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  it('iPhone表示での比較確認', async () => {
    // iPhoneビューポートに設定
    await page.setViewport({ width: 375, height: 667 });
    
    // 混色コントローラが表示されるまで待機
    await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
    
    console.log('混色コントローラ（iPhone表示）');
    console.log('1. 各塗料成分に◀▶ボタンが表示されていることを確認');
    console.log('2. ボタンの配置が「[色見本] ラベル ◀ [入力欄] ▶ [色見本]」形式であることを確認');
    
    // 手動確認のため5秒待機
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 色調コントローラBテストページに移動
    await page.goto(`${baseUrl}/#/color-controller-b-test`, { waitUntil: 'networkidle0' });
    
    // 色調コントローラが表示されるまで待機
    await page.waitForSelector('.color-controller', { timeout: 10000 });
    
    console.log('色調コントローラBテスト（iPhone表示）');
    console.log('1. RGB/CMYK調整に◀▶ボタンが表示されていることを確認');
    console.log('2. ボタンのサイズ・配置・余白が混色コントローラと一致していることを確認');
    
    // 手動確認のため5秒待機
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  it('ボタン動作テスト', async () => {
    // iPhoneビューポートに設定
    await page.setViewport({ width: 375, height: 667 });
    
    // 混色コントローラが表示されるまで待機
    await page.waitForSelector('.paint-mixing-controller', { timeout: 10000 });
    
    console.log('混色コントローラのボタン動作テスト');
    
    // 最初の入力欄（シアン）の初期値を取得
    const input = await page.$('.paint-mixing-controller .color-control__input');
    const initialValue = await input!.evaluate(el => (el as HTMLInputElement).value);
    
    console.log(`シアンの初期値: ${initialValue}`);
    
    // 最初の色調整行の▶ボタンを取得
    const firstColorControl = await page.$('.paint-mixing-controller .color-control');
    const buttons = await firstColorControl!.$$('.color-control__button');
    
    if (buttons.length >= 2) {
      // ▶ボタンをクリック
      await buttons[1].evaluate((button) => {
        const touchStartEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [new Touch({
            identifier: 0,
            target: button,
            clientX: 0,
            clientY: 0
          })]
        });
        const touchEndEvent = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: []
        });
        
        button.dispatchEvent(touchStartEvent);
        setTimeout(() => button.dispatchEvent(touchEndEvent), 50);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newValue = await input!.evaluate(el => (el as HTMLInputElement).value);
      console.log(`▶ボタンクリック後のシアン値: ${newValue}`);
      console.log(`値の変化: ${initialValue} → ${newValue}`);
    }
    
    // 手動確認のため3秒待機
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
});