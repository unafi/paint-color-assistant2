import type { ColorModel, RgbColor, CmykColor, ColorUpdateSource } from '../types/color';

/**
 * 色空間変換ユーティリティクラス
 * RGB⇔CMYK変換と変換ループ防止機能を提供
 */
export class ColorSpaceConverter {
  private static updateInProgress = false;
  private static lastUpdateSource: ColorUpdateSource | null = null;

  /**
   * RGB値からCMYK値への高精度変換（改良版）
   * @param r - 赤成分 (0-255)
   * @param g - 緑成分 (0-255) 
   * @param b - 青成分 (0-255)
   * @returns CMYK値 (0-100%、0.1%精度)
   */
  static rgbToCmyk(r: number, g: number, b: number): CmykColor {
    // 入力値の正規化とクランプ（高精度）
    const rNorm = Math.max(0, Math.min(255, Math.round(r))) / 255;
    const gNorm = Math.max(0, Math.min(255, Math.round(g))) / 255;
    const bNorm = Math.max(0, Math.min(255, Math.round(b))) / 255;

    // 初期CMY値を計算
    let c = 1 - rNorm;
    let m = 1 - gNorm;
    let y = 1 - bNorm;

    // K（黒）成分を計算
    const k = Math.min(c, Math.min(m, y));
    
    // 完全な黒の場合の特殊処理
    if (k >= 0.9999) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    // CMY成分を正規化（改良版：より安全なゼロ除算対策）
    const denominator = 1 - k;
    if (denominator > 0.0001) { // より厳密な閾値
      c = (c - k) / denominator;
      m = (m - k) / denominator;
      y = (y - k) / denominator;
    } else {
      // denominatorが0に近い場合は、CMYを0に設定
      c = 0;
      m = 0;
      y = 0;
    }

    // 値の範囲制限（0-1）
    c = Math.max(0, Math.min(1, c));
    m = Math.max(0, Math.min(1, m));
    y = Math.max(0, Math.min(1, y));

    // 最終段階で0.1%精度に丸め
    return {
      c: Math.round(c * 1000) / 10, // 0.1%精度
      m: Math.round(m * 1000) / 10,
      y: Math.round(y * 1000) / 10,
      k: Math.round(k * 1000) / 10
    };
  }

  /**
   * CMYK値からRGB値への高精度変換（改良版）
   * @param c - シアン成分 (0-100%)
   * @param m - マゼンタ成分 (0-100%)
   * @param y - イエロー成分 (0-100%)
   * @param k - 黒成分 (0-100%)
   * @returns RGB値 (0-255)
   */
  static cmykToRgb(c: number, m: number, y: number, k: number): RgbColor {
    // 入力値の正規化とクランプ（0-100% → 0-1）
    const cNorm = Math.max(0, Math.min(100, c)) / 100;
    const mNorm = Math.max(0, Math.min(100, m)) / 100;
    const yNorm = Math.max(0, Math.min(100, y)) / 100;
    const kNorm = Math.max(0, Math.min(100, k)) / 100;

    // 改良版：より正確なRGB計算
    // 標準的なCMYK→RGB変換式を使用
    const r = 255 * (1 - cNorm) * (1 - kNorm);
    const g = 255 * (1 - mNorm) * (1 - kNorm);
    const b = 255 * (1 - yNorm) * (1 - kNorm);

    // 最終段階で整数に丸め（範囲制限付き）
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b)))
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