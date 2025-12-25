/**
 * 色モデルの型定義
 * RGB値（0-255）とCMYK値（0-100%）を含む統合色モデル
 */
export interface ColorModel {
  /** 赤成分 (0-255) */
  r: number;
  /** 緑成分 (0-255) */
  g: number;
  /** 青成分 (0-255) */
  b: number;
  /** シアン成分 (0-100%) */
  c: number;
  /** マゼンタ成分 (0-100%) */
  m: number;
  /** イエロー成分 (0-100%) */
  y: number;
  /** 黒成分 (0-100%) */
  k: number;
}

/**
 * RGB色の型定義
 */
export interface RgbColor {
  /** 赤成分 (0-255) */
  r: number;
  /** 緑成分 (0-255) */
  g: number;
  /** 青成分 (0-255) */
  b: number;
}

/**
 * CMYK色の型定義
 */
export interface CmykColor {
  /** シアン成分 (0-100%) */
  c: number;
  /** マゼンタ成分 (0-100%) */
  m: number;
  /** イエロー成分 (0-100%) */
  y: number;
  /** 黒成分 (0-100%) */
  k: number;
}

/**
 * 色変換の更新ソース
 */
export type ColorUpdateSource = 'rgb' | 'cmyk' | 'initial';

/**
 * 色調整コンポーネントのプロパティ
 */
export interface ColorControllerProps {
  /** 出発色（基準色） */
  originalColor: ColorModel;
  /** 結果色（調整される色） */
  resultColor: ColorModel;
  /** 色変更時のコールバック（結果色のみ） */
  onChange: (color: ColorModel) => void;
  /** ラベル */
  label: string;
  /** 無効化フラグ */
  disabled?: boolean;
}