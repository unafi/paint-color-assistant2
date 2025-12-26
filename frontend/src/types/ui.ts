/**
 * UI表示改善に関する型定義
 */

/**
 * UI表示設定の型定義
 */
export interface UILayoutModel {
  /** モバイル表示フラグ */
  isMobile: boolean;
  /** 画面幅 */
  screenWidth: number;
  /** ブレークポイント（1024px） */
  breakpoint: number;
  /** 色比較表示モード（横並び/縦並び） */
  comparisonLayout: 'horizontal' | 'vertical';
}

/**
 * 1行化塗料調整バーの型定義
 */
export interface CompactMixingBarModel {
  /** 色名（シアン、マゼンタ等） */
  label: string;
  /** 増減量（+/-） */
  value: number;
  /** バーグラフ文字列（■の連続） */
  barGraph: string;
  /** 表示用文字列（+44%等） */
  displayValue: string;
  /** 色コード（バー表示用） */
  colorCode: string;
}

/**
 * 不要コメント削除設定の型定義
 */
export interface UIContentFilterModel {
  /** 削除対象パターン1: 「画像Aの結果...」 */
  removeImageResultComment: boolean;
  /** 削除対象パターン2: 「解説：上記の塗料を...」 */
  removeExplanationComment: boolean;
  /** 削除対象の正規表現パターン */
  removePatterns: RegExp[];
}

/**
 * コンパクト塗料調整バーコンポーネントのプロパティ
 */
export interface CompactMixingBarProps {
  /** 色名（シアン、マゼンタ等） */
  label: string;
  /** 増減量（+/-） */
  value: number;
  /** バーグラフの最大値（デフォルト100） */
  maxValue?: number;
}