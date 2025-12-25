// import chroma from 'chroma-js'; // 将来使用予定
import type { ColorModel, RgbColor, CmykColor, ColorUpdateSource } from '../types/color';

/**
 * 色空間変換ユーティリティクラス
 * RGB⇔CMYK変換と変換ループ防止機能を提供
 */
export class ColorSpaceConverter {
  private static updateInProgress = false;
  private static lastUpdateSource: ColorUpdateSource | null = null;

  /**
   * RGB値からCMYK値への変換
   * @param r - 赤成分 (0-255)
   * @param g - 緑成分 (0-255) 
   * @param b - 青成分 (0-255)
   * @returns CMYK値 (0-100%)
   */
  static rgbToCmyk(r: number, g: number, b: number): CmykColor {
    // RGB値を0-1の範囲に正規化
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // K（黒）成分を計算
    const k = 1 - Math.max(rNorm, Math.max(gNorm, bNorm));
    
    // K=1の場合（完全な黒）の処理
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    // CMY成分を計算
    const c = (1 - rNorm - k) / (1 - k);
    const m = (1 - gNorm - k) / (1 - k);
    const y = (1 - bNorm - k) / (1 - k);

    return {
      c: Math.round(c * 100 * 10) / 10, // 小数点以下1桁
      m: Math.round(m * 100 * 10) / 10,
      y: Math.round(y * 100 * 10) / 10,
      k: Math.round(k * 100 * 10) / 10
    };
  }

  /**
   * CMYK値からRGB値への変換
   * @param c - シアン成分 (0-100%)
   * @param m - マゼンタ成分 (0-100%)
   * @param y - イエロー成分 (0-100%)
   * @param k - 黒成分 (0-100%)
   * @returns RGB値 (0-255)
   */
  static cmykToRgb(c: number, m: number, y: number, k: number): RgbColor {
    // CMYK値を0-1の範囲に正規化
    const cNorm = c / 100;
    const mNorm = m / 100;
    const yNorm = y / 100;
    const kNorm = k / 100;

    // RGB値を計算
    const r = 255 * (1 - cNorm) * (1 - kNorm);
    const g = 255 * (1 - mNorm) * (1 - kNorm);
    const b = 255 * (1 - yNorm) * (1 - kNorm);

    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b)))
    };
  }

  /**
   * CMYK値を比率調整（全体で100%になるように調整）
   * @param c - シアン成分 (0-100%)
   * @param m - マゼンタ成分 (0-100%)
   * @param y - イエロー成分 (0-100%)
   * @param k - 黒成分 (0-100%)
   * @param changedComponent - 変更された成分
   * @param newValue - 新しい値
   * @returns 比率調整されたCMYK値
   */
  static adjustCmykRatio(
    c: number, 
    m: number, 
    y: number, 
    k: number,
    changedComponent: 'c' | 'm' | 'y' | 'k',
    newValue: number
  ): CmykColor {
    // 新しい値を設定
    const values = { c, m, y, k };
    values[changedComponent] = Math.max(0, Math.min(100, newValue));
    
    // 合計を計算
    const total = values.c + values.m + values.y + values.k;
    
    // 100%を超えている場合のみ比率調整（通常のCMYK入力では調整しない）
    if (total > 100) {
      const excess = total - 100;
      const otherComponents = (['c', 'm', 'y', 'k'] as const).filter(comp => comp !== changedComponent);
      
      // 他の成分から比例的に減らす
      const otherTotal = otherComponents.reduce((sum, comp) => sum + values[comp], 0);
      
      if (otherTotal > 0) {
        otherComponents.forEach(comp => {
          const reduction = (values[comp] / otherTotal) * excess;
          values[comp] = Math.max(0, values[comp] - reduction);
        });
      } else {
        // 他の成分が0の場合、変更された成分を100に制限
        values[changedComponent] = 100;
      }
    }
    
    return {
      c: Math.round(values.c * 10) / 10,
      m: Math.round(values.m * 10) / 10,
      y: Math.round(values.y * 10) / 10,
      k: Math.round(values.k * 10) / 10
    };
  }

  /**
   * 変換ループ防止機能付きの色更新
   * @param source - 更新ソース
   * @param updateFn - 更新関数
   */
  static safeColorUpdate(source: ColorUpdateSource, updateFn: () => void): void {
    if (this.updateInProgress) {
      return; // ループ防止
    }

    this.updateInProgress = true;
    this.lastUpdateSource = source;

    try {
      updateFn();
    } finally {
      this.updateInProgress = false;
      // 少し遅延してからソースをクリア（連続更新を考慮）
      setTimeout(() => {
        this.lastUpdateSource = null;
      }, 50);
    }
  }

  /**
   * 現在更新中かどうかを確認
   */
  static isUpdating(): boolean {
    return this.updateInProgress;
  }

  /**
   * 最後の更新ソースを取得
   */
  static getLastUpdateSource(): ColorUpdateSource | null {
    return this.lastUpdateSource;
  }
}

/**
 * ColorModelを作成するヘルパー関数
 * @param rgb - RGB値
 * @param cmyk - CMYK値（省略時はRGBから計算）
 * @returns ColorModel
 */
export function createColorModel(rgb: RgbColor, cmyk?: CmykColor): ColorModel {
  const calculatedCmyk = cmyk || ColorSpaceConverter.rgbToCmyk(rgb.r, rgb.g, rgb.b);
  
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    c: calculatedCmyk.c,
    m: calculatedCmyk.m,
    y: calculatedCmyk.y,
    k: calculatedCmyk.k
  };
}

/**
 * RGB値を制限する
 * @param value - RGB値
 * @returns 0-255の範囲に制限されたRGB値
 */
export function clampRgbValue(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * CMYK値を制限する
 * @param value - CMYK値
 * @returns 0-100の範囲に制限されたCMYK値
 */
export function clampCmykValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

/**
 * ColorModelからCSS色文字列を生成
 * @param color - ColorModel
 * @returns CSS rgb() 文字列
 */
export function colorToCss(color: ColorModel): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * 単色見本用の色を生成
 * @param component - 色成分名
 * @param value - 値
 * @returns CSS色文字列
 */
export function createSingleColorSample(component: 'r' | 'g' | 'b', value: number): string {
  switch (component) {
    case 'r':
      return `rgb(${value}, 0, 0)`;
    case 'g':
      return `rgb(0, ${value}, 0)`;
    case 'b':
      return `rgb(0, 0, ${value})`;
    default:
      return 'rgb(0, 0, 0)';
  }
}

/**
 * CMYK単色見本用の色を生成
 * @param component - CMYK成分名
 * @param value - 値 (0-100%)
 * @param baseK - ベースのK値 (0-100%)
 * @returns CSS色文字列
 */
export function createCmykSingleColorSample(
  component: 'c' | 'm' | 'y' | 'k', 
  value: number, 
  baseK: number = 0
): string {
  let c = 0, m = 0, y = 0, k = baseK;
  
  switch (component) {
    case 'c':
      c = value;
      break;
    case 'm':
      m = value;
      break;
    case 'y':
      y = value;
      break;
    case 'k':
      k = value;
      break;
  }
  
  const rgb = ColorSpaceConverter.cmykToRgb(c, m, y, k);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}