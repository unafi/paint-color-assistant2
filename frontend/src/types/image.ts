import type { ColorModel } from './color';

/**
 * デバイスタイプの定義
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * 画像データの型定義
 */
export interface AppImageData {
  /** ファイルオブジェクト */
  file: File;
  /** 画像URL（プレビュー用） */
  url: string;
  /** 画像幅 */
  width: number;
  /** 画像高さ */
  height: number;
  /** ファイルパス（表示用） */
  path?: string;
}

/**
 * 画像上の座標
 */
export interface ImageCoordinate {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
}

/**
 * 画像アップロードコンポーネントのプロパティ
 */
export interface ImageUploadProps {
  /** 画像選択時のコールバック */
  onImageSelect: (image: AppImageData) => void;
  /** 色選択時のコールバック */
  onColorSelect: (color: ColorModel) => void;
  /** デバイスタイプ */
  deviceType: DeviceType;
  /** ラベル */
  label: string;
  /** 外部から設定する画像データ（画像交換用） */
  externalImageData?: AppImageData | null;
  /** 外部から設定するパス（画像交換用） */
  externalPath?: string;
  /** 外部設定の更新キー（再描画トリガー用） */
  externalUpdateKey?: number;
}

/**
 * 画像プレビューコンポーネントのプロパティ
 */
export interface ImagePreviewProps {
  /** 画像データ */
  imageData: AppImageData | null;
  /** 色選択時のコールバック */
  onColorSelect: (color: ColorModel) => void;
  /** デバイスタイプ */
  deviceType: DeviceType;
  /** 選択された座標 */
  selectedCoordinate?: ImageCoordinate;
};