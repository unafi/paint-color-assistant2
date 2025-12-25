import type { ColorModel } from './color';

/**
 * 塗料混合結果の型定義
 */
export interface MixingResult {
  /** シアン追加量 (%) */
  cyan: number;
  /** マゼンタ追加量 (%) */
  magenta: number;
  /** イエロー追加量 (%) */
  yellow: number;
  /** 黒追加量 (%) */
  black: number;
  /** 白追加量 (%) */
  white: number;
  /** 計算信頼度 (0-1) */
  confidence: number;
}

/**
 * 色比較コンポーネントのプロパティ
 */
export interface ColorComparisonProps {
  /** 元の色 */
  colorA: ColorModel;
  /** 目標色 */
  colorB: ColorModel;
}

/**
 * 塗料混合バーのプロパティ
 */
export interface MixingBarProps {
  /** ラベル */
  label: string;
  /** 値 (%) */
  value: number;
  /** 色 */
  color: string;
  /** 最大値 */
  maxValue?: number;
}

/**
 * 色調整コンポーネントのプロパティ
 */
export interface ColorAdjustmentProps {
  /** 初期出発色 */
  initialSourceColor: ColorModel;
  /** 初期目標色 */
  initialTargetColor: ColorModel;
  /** 調整結果のコールバック */
  onAdjustmentChange?: (adjustedColor: ColorModel) => void;
}