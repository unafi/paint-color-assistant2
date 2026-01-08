/**
 * ColorControllerのiPhoneでの長押し問題分析テスト
 * 
 * 目的：
 * 1. iPhoneエミュレータモードでの◀▶ボタンの動作確認
 * 2. 長押し時のテキスト選択問題の再現
 * 3. 問題の原因特定
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('ColorController iPhone Bug Analysis', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // デバッグのため表示
      devtools: true,  // DevToolsを開く
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    page = await browser.newPage();
    
    // iPhoneエミュレータモードに設定
    await page.emulate({
      name: 'iPhone 12',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false
      }
    });

    // ローカル開発サーバーにアクセス
    await page.goto('http://localhost:5173/paint-color-assistant2/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('ColorControllerが表示されることを確認', async () => {
    // ColorControllerの存在確認
    const colorController = await page.$('.color-controller');
    expect(colorController).toBeTruthy();

    // ◀▶ボタンの存在確認（テキスト内容で検索）
    const decreaseButtons = await page.$$eval('.color-control__button', buttons => 
      buttons.filter(btn => btn.textContent?.trim() === '◀')
    );
    const increaseButtons = await page.$$eval('.color-control__button', buttons => 
      buttons.filter(btn => btn.textContent?.trim() === '▶')
    );
    
    console.log(`減少ボタン数: ${decreaseButtons.length}`);
    console.log(`増加ボタン数: ${increaseButtons.length}`);
    
    expect(decreaseButtons.length).toBeGreaterThan(0);
    expect(increaseButtons.length).toBeGreaterThan(0);
  }, 30000);

  it('◀ボタンの短押し動作を確認', async () => {
    // 最初のRGB Rコンポーネントの減少ボタンを取得
    const decreaseButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('.color-control__button'));
      return buttons.find(btn => btn.textContent?.trim() === '◀');
    });
    expect(decreaseButton).toBeTruthy();

    // 現在の値を取得
    const input = await page.$('.color-control:first-child .color-control__input');
    const initialValue = await page.evaluate(el => parseInt(el.value), input);
    
    console.log(`初期値: ${initialValue}`);

    // 短押し（タップ）
    await decreaseButton.asElement()?.tap();
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    // 値が1減少したことを確認
    const newValue = await page.evaluate(el => parseInt(el.value), input);
    console.log(`短押し後の値: ${newValue}`);
    
    expect(newValue).toBe(initialValue - 1);
  }, 30000);

  it('◀ボタンの長押し時のテキスト選択問題を確認', async () => {
    // 最初のRGB Rコンポーネントの減少ボタンを取得
    const decreaseButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('.color-control__button'));
      return buttons.find(btn => btn.textContent?.trim() === '◀');
    });
    expect(decreaseButton).toBeTruthy();

    // 現在の値を取得
    const input = await page.$('.color-control:first-child .color-control__input');
    const initialValue = await page.evaluate(el => parseInt(el.value), input);
    
    console.log(`長押し前の値: ${initialValue}`);

    // 長押し開始（touchstart）
    const buttonElement = decreaseButton.asElement();
    await buttonElement?.touchstart();
    
    // 1秒間長押し
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 長押し終了（touchend）
    await buttonElement?.touchend();

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 200));

    // 値が連続的に減少したことを確認
    const newValue = await page.evaluate(el => parseInt(el.value), input);
    console.log(`長押し後の値: ${newValue}`);
    
    expect(newValue).toBeLessThan(initialValue);

    // テキスト選択状態をチェック
    const selectedText = await page.evaluate(() => {
      const selection = window.getSelection();
      return selection ? selection.toString() : '';
    });
    
    console.log(`選択されたテキスト: "${selectedText}"`);
    
    // テキスト選択問題の確認
    if (selectedText.includes('◀') || selectedText.includes('▶')) {
      console.log('❌ 問題確認: ボタンテキストが選択されています');
      expect(selectedText).not.toContain('◀');
      expect(selectedText).not.toContain('▶');
    } else {
      console.log('✅ テキスト選択問題は発生していません');
    }
  }, 30000);

  it('CSS user-selectプロパティの確認', async () => {
    // ボタンのCSS user-selectプロパティを確認
    const decreaseButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('.color-control__button'));
      return buttons.find(btn => btn.textContent?.trim() === '◀');
    });
    
    const userSelect = await page.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        userSelect: styles.userSelect,
        webkitUserSelect: styles.webkitUserSelect,
        mozUserSelect: styles.MozUserSelect,
        msUserSelect: styles.msUserSelect
      };
    }, decreaseButton);
    
    console.log('ボタンのuser-selectプロパティ:', userSelect);
    
    // user-selectが適切に設定されているかチェック
    const hasUserSelectNone = Object.values(userSelect).some(value => value === 'none');
    console.log(`user-select: none が設定されているか: ${hasUserSelectNone}`);
  }, 30000);

  it('タッチイベントのデフォルト動作確認', async () => {
    // ボタンにイベントリスナーが適切に設定されているかチェック
    const buttonInfo = await page.evaluate(() => {
      const button = document.querySelector('.color-control__button');
      if (!button) return null;
      
      return {
        hasOnTouchStart: button.ontouchstart !== null,
        hasOnTouchEnd: button.ontouchend !== null,
        hasOnMouseDown: button.onmousedown !== null,
        hasOnMouseUp: button.onmouseup !== null,
        tagName: button.tagName,
        className: button.className
      };
    });
    
    console.log('ボタンのイベント設定:', buttonInfo);
    expect(buttonInfo).toBeTruthy();
  }, 30000);
});
