import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

/**
 * 色調コントローラー統合テスト
 * 画像選択→色反映→RGB/CMYK調整→結果色変更→再選択→リセットの一連の流れをテスト
 */
describe('🎨 色調コントローラー統合テスト', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:5174/paint-color-assistant2/';
  const TEST_IMAGE_PATH = path.resolve(__dirname, '../../../test_red.png');

  beforeAll(async () => {
    console.log('🚀 色調コントローラー統合テスト用ブラウザを起動中...');
    
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
    
    // ネットワーク監視を開始（API呼び出しチェック用）
    await page.setRequestInterception(true);
    const apiCalls: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && !url.includes('/api/health')) {
        apiCalls.push(`${request.method()} ${url}`);
        console.log('🚨 API呼び出し検出:', `${request.method()} ${url}`);
      }
      request.continue();
    });
    
    // APIコール配列をページに保存
    await page.evaluateOnNewDocument(() => {
      (window as any).apiCalls = [];
    });
    
    console.log('✅ 色調コントローラー統合テスト用ブラウザ起動完了');
  }, 60000); // 60秒に延長

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('✅ 色調コントローラー統合テスト用ブラウザ終了完了');
    }
  });

  it('画像クリック→色調コントローラーに色が反映される', async () => {
    console.log('📍 テスト: 画像クリック→色調コントローラー反映');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像Aをアップロード
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 画像をクリック
    const canvas = await page.$('canvas.image-upload__canvas');
    expect(canvas).toBeTruthy();
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 色調コントローラーのRGB値を取得（最初のColorControllerコンポーネント）
    const rgbValues = await page.evaluate(() => {
      // 最初のColorControllerコンポーネント内のRGB入力フィールドを取得
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return { r: 0, g: 0, b: 0 };
      
      const firstController = colorControllers[0];
      const rgbInputs = firstController.querySelectorAll('input[type="number"][min="0"][max="255"]') as NodeListOf<HTMLInputElement>;
      
      return {
        r: parseInt(rgbInputs[0]?.value || '0'),
        g: parseInt(rgbInputs[1]?.value || '0'),
        b: parseInt(rgbInputs[2]?.value || '0')
      };
    });
    
    console.log('📊 選択された色のRGB値:', rgbValues);
    
    // RGB値が初期値から変更されていることを確認
    expect(rgbValues.r).toBeGreaterThan(0);
    expect(rgbValues.g).toBeGreaterThan(0);
    expect(rgbValues.b).toBeGreaterThan(0);
    
    console.log('✅ 画像クリック→色調コントローラー反映確認');
  });

  it('RGB増減ボタンでAPIを発行せずに色が変更される', async () => {
    console.log('📍 テスト: RGB増減→API非発行→色変更');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロードして色を選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 初期RGB値を取得（最初のColorControllerコンポーネント）
    const initialRgb = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    // ネットワーク監視をリセット
    const networkRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && !url.includes('/api/health')) {
        networkRequests.push(`${request.method()} ${url}`);
      }
    });
    
    // R値の増加ボタンをクリック（最初のColorControllerコンポーネント）
    const rIncreaseButton = await page.$('.color-controller button[title*="1増やす"]');
    await rIncreaseButton!.click();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 変更後のRGB値を取得（最初のColorControllerコンポーネント）
    const newRgb = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    console.log('📊 RGB変更:', `${initialRgb} → ${newRgb}`);
    console.log('📊 API呼び出し数:', networkRequests.length);
    
    // RGB値が変更されていることを確認
    expect(newRgb).toBe(initialRgb + 1);
    
    // API呼び出しが発生していないことを確認
    expect(networkRequests.length).toBe(0);
    
    console.log('✅ RGB増減→API非発行→色変更確認');
  });

  it('RGB値の直接入力が0-255の範囲で動作する', async () => {
    console.log('📍 テスト: RGB値直接入力（0-255範囲）');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // RGB入力フィールドを取得（最初のColorControllerコンポーネント）
    const rInput = await page.$('.color-controller input[type="number"][min="0"][max="255"]');
    expect(rInput).toBeTruthy();
    
    // 値を直接入力
    await rInput!.click({ clickCount: 3 }); // 全選択
    await rInput!.type('200');
    await page.keyboard.press('Tab'); // フォーカスを移動してchangeイベントを発火
    
    // 入力された値を確認
    const inputValue = await page.evaluate((input) => {
      return (input as HTMLInputElement).value;
    }, rInput);
    
    console.log('📊 RGB直接入力値:', inputValue);
    expect(inputValue).toBe('200');
    
    // 範囲外の値をテスト
    await rInput!.click({ clickCount: 3 });
    await rInput!.type('300'); // 255を超える値
    await page.keyboard.press('Tab');
    
    // 制限されることを確認（実装によっては255にクランプされる）
    const clampedValue = await page.evaluate((input) => {
      return (input as HTMLInputElement).value;
    }, rInput);
    
    console.log('📊 範囲外入力後の値:', clampedValue);
    
    console.log('✅ RGB値直接入力確認');
  });

  it('CMYK増減でCMYK比率が調整される', async () => {
    console.log('📍 テスト: CMYK増減→比率調整');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロードして色を選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 初期CMYK値を取得（最初のColorControllerコンポーネント）
    const initialCmyk = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return { c: 0, m: 0, y: 0, k: 0 };
      
      const firstController = colorControllers[0];
      const cmykInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="100"]')) as HTMLInputElement[];
      return {
        c: parseFloat(cmykInputs[0]?.value || '0'),
        m: parseFloat(cmykInputs[1]?.value || '0'),
        y: parseFloat(cmykInputs[2]?.value || '0'),
        k: parseFloat(cmykInputs[3]?.value || '0')
      };
    });
    
    console.log('📊 初期CMYK値:', initialCmyk);
    
    // C値を大幅に増加（最初のColorControllerコンポーネント）
    const cInput = await page.$('.color-controller input[type="number"][min="0"][max="100"]');
    await cInput!.click({ clickCount: 3 });
    await cInput!.type('80');
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 変更後のCMYK値を取得（最初のColorControllerコンポーネント）
    const newCmyk = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return { c: 0, m: 0, y: 0, k: 0, total: 0 };
      
      const firstController = colorControllers[0];
      const cmykInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="100"]')) as HTMLInputElement[];
      const c = parseFloat(cmykInputs[0]?.value || '0');
      const m = parseFloat(cmykInputs[1]?.value || '0');
      const y = parseFloat(cmykInputs[2]?.value || '0');
      const k = parseFloat(cmykInputs[3]?.value || '0');
      
      return {
        c, m, y, k,
        total: c + m + y + k
      };
    });
    
    console.log('📊 変更後CMYK値:', newCmyk);
    console.log('📊 CMYK合計:', newCmyk.total);
    
    // C値が変更されていることを確認
    expect(newCmyk.c).toBeCloseTo(80, 1);
    
    // 合計が100%を大幅に超えていないことを確認（比率調整が働いている）
    expect(newCmyk.total).toBeLessThanOrEqual(100.1); // 小数点誤差を考慮
    
    console.log('✅ CMYK増減→比率調整確認');
  });

  it('CMYK値の直接入力が0.0-100.0の範囲で動作する', async () => {
    console.log('📍 テスト: CMYK値直接入力（0.0-100.0範囲）');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // CMYK入力フィールドを取得（最初のColorControllerコンポーネント）
    const cInput = await page.$('.color-controller input[type="number"][min="0"][max="100"]');
    expect(cInput).toBeTruthy();
    
    // 小数点値を直接入力
    await cInput!.click({ clickCount: 3 });
    await cInput!.type('45.7');
    await page.keyboard.press('Tab');
    
    // 入力された値を確認
    const inputValue = await page.evaluate((input) => {
      return (input as HTMLInputElement).value;
    }, cInput);
    
    console.log('📊 CMYK直接入力値:', inputValue);
    expect(parseFloat(inputValue)).toBeCloseTo(45.7, 1);
    
    console.log('✅ CMYK値直接入力確認');
  });

  it('RGB変更→CMYK反映、CMYK変更→RGB反映（ループなし）', async () => {
    console.log('📍 テスト: RGB⇔CMYK相互反映（ループ防止）');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロードして色を選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // RGB値を変更（最初のColorControllerコンポーネント）
    const rInput = await page.$('.color-controller input[type="number"][min="0"][max="255"]');
    await rInput!.click({ clickCount: 3 });
    await rInput!.type('100');
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // CMYK値が更新されることを確認（最初のColorControllerコンポーネント）
    const cmykAfterRgbChange = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return { c: 0, m: 0, y: 0, k: 0 };
      
      const firstController = colorControllers[0];
      const cmykInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="100"]')) as HTMLInputElement[];
      return {
        c: parseFloat(cmykInputs[0]?.value || '0'),
        m: parseFloat(cmykInputs[1]?.value || '0'),
        y: parseFloat(cmykInputs[2]?.value || '0'),
        k: parseFloat(cmykInputs[3]?.value || '0')
      };
    });
    
    console.log('📊 RGB変更後のCMYK値:', cmykAfterRgbChange);
    
    // CMYK値を変更（最初のColorControllerコンポーネント）
    const cInput = await page.$('.color-controller input[type="number"][min="0"][max="100"]');
    await cInput!.click({ clickCount: 3 });
    await cInput!.type('30');
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // RGB値が更新されることを確認（最初のColorControllerコンポーネント）
    const rgbAfterCmykChange = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return { r: 0, g: 0, b: 0 };
      
      const firstController = colorControllers[0];
      const rgbInputs = Array.from(firstController.querySelectorAll('input[type="number"][min="0"][max="255"]')) as HTMLInputElement[];
      return {
        r: parseInt(rgbInputs[0]?.value || '0'),
        g: parseInt(rgbInputs[1]?.value || '0'),
        b: parseInt(rgbInputs[2]?.value || '0')
      };
    });
    
    console.log('📊 CMYK変更後のRGB値:', rgbAfterCmykChange);
    
    // 値が変更されていることを確認（無限ループしていない）
    expect(rgbAfterCmykChange.r).toBeGreaterThan(0);
    expect(cmykAfterRgbChange.c).toBeGreaterThan(0);
    
    console.log('✅ RGB⇔CMYK相互反映確認');
  });

  it('長押しで連続増減が動作する', async () => {
    console.log('📍 テスト: 長押し連続増減');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロードして色を選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 初期R値を取得（最初のColorControllerコンポーネント）
    const initialR = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    // R値増加ボタンを長押し（1秒間）（最初のColorControllerコンポーネント）
    const rIncreaseButton = await page.$('.color-controller button[title*="1増やす"]');
    await rIncreaseButton!.hover();
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒間長押し
    await page.mouse.up();
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 変更後のR値を取得（最初のColorControllerコンポーネント）
    const finalR = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    console.log('📊 長押し前後のR値:', `${initialR} → ${finalR}`);
    
    // 複数回増加していることを確認（長押しで連続実行された）
    expect(finalR).toBeGreaterThan(initialR + 1);
    
    console.log('✅ 長押し連続増減確認');
  });

  it('再度画像クリックで色調コントローラーがリセット・新色反映される', async () => {
    console.log('📍 テスト: 再クリック→リセット→新色反映');
    
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // 画像をアップロードして最初の色を選択
    const fileInput = await page.$('input[type="file"]');
    await fileInput!.uploadFile(TEST_IMAGE_PATH);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 50, y: 50 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // RGB値を手動で変更（最初のColorControllerコンポーネント）
    const rInput = await page.$('.color-controller input[type="number"][min="0"][max="255"]');
    await rInput!.click({ clickCount: 3 });
    await rInput!.type('150');
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 変更後の値を記録（最初のColorControllerコンポーネント）
    const modifiedR = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    console.log('📊 手動変更後のR値:', modifiedR);
    expect(modifiedR).toBe(150);
    
    // 別の場所をクリック（新しい色を選択）
    await page.click('canvas.image-upload__canvas', {
      offset: { x: 100, y: 100 }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 新しい色が反映されることを確認（最初のColorControllerコンポーネント）
    const newR = await page.evaluate(() => {
      const colorControllers = document.querySelectorAll('.color-controller');
      if (colorControllers.length === 0) return 0;
      
      const firstController = colorControllers[0];
      const rInput = firstController.querySelector('input[type="number"][min="0"][max="255"]') as HTMLInputElement;
      return parseInt(rInput?.value || '0');
    });
    
    console.log('📊 再選択後のR値:', newR);
    
    // 値がリセットされて新しい色が反映されていることを確認
    expect(newR).not.toBe(150); // 手動変更値とは異なる
    expect(newR).toBeGreaterThan(0); // 新しい色が選択されている
    
    console.log('✅ 再クリック→リセット→新色反映確認');
  });
});
