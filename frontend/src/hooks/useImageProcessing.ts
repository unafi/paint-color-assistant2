import { useState, useCallback, useRef } from 'react';
import * as React from 'react';
import type { AppImageData, ImageCoordinate } from '../types/image';
import type { ColorModel } from '../types/color';
import { debugLog } from '../utils/logger';
import { ImageProcessor } from '../utils/imageUtils';

/**
 * 画像処理フックの戻り値
 */
export interface UseImageProcessingReturn {
  /** 選択された画像データ */
  imageData: AppImageData | null;
  /** 選択された座標 */
  selectedCoordinate: ImageCoordinate | null;
  /** 読み込み中フラグ */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** ファイル選択処理 */
  handleFileSelect: (file: File, isExternalUpdate?: boolean) => Promise<void>;
  /** 座標クリック処理 */
  handleCoordinateClick: (coordinate: ImageCoordinate) => ColorModel | null;
  /** Canvas参照 */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 画像データのクリア */
  clearImage: () => void;
  /** エラーのクリア */
  clearError: () => void;
}

/**
 * 画像処理管理フックのオプション
 */
export interface UseImageProcessingOptions {
  /** 画像選択時のコールバック */
  onImageSelect?: (imageData: AppImageData) => void;
  /** 色選択時のコールバック */
  onColorSelect?: (color: ColorModel) => void;
}

/**
 * 画像処理管理フック
 * 画像の読み込み、表示、色抽出機能を提供
 */
export function useImageProcessing(options?: UseImageProcessingOptions): UseImageProcessingReturn {
  const [imageData, setImageData] = useState<AppImageData | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<ImageCoordinate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // optionsを安定化
  const stableOptions = React.useRef(options);
  React.useEffect(() => {
    stableOptions.current = options;
  }, [options]);

  /**
   * ファイル選択処理
   */
  const handleFileSelect = useCallback(async (file: File, isExternalUpdate = false): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // ファイル検証
      const validation = ImageProcessor.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 既存の画像URLをクリーンアップ（現在の状態を直接参照）
      setImageData(prevImageData => {
        if (prevImageData) {
          ImageProcessor.cleanupImageUrl(prevImageData);
        }
        return prevImageData;
      });

      // 新しい画像データを作成
      const newImageData = await ImageProcessor.createImageData(file);
      setImageData(newImageData);
      setSelectedCoordinate(null); // 座標をリセット

      // 外部更新でない場合のみ画像選択コールバックを呼び出し
      if (!isExternalUpdate && stableOptions.current?.onImageSelect) {
        stableOptions.current.onImageSelect(newImageData);
      }

      debugLog('✅ 画像データ設定完了、Canvas描画は useEffect で実行されます');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像の読み込みに失敗しました';
      setError(errorMessage);
      console.error('画像読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Canvas描画用のuseEffect
   * imageDataが更新されたときにCanvas描画を実行
   */
  const drawImageToCanvas = useCallback(() => {
    if (!imageData || !canvasRef.current) {
      debugLog('🔍 Canvas描画スキップ:', {
        hasImageData: !!imageData,
        hasCanvasRef: !!canvasRef.current
      });
      return;
    }

    debugLog('🎯 Canvas描画実行開始');
    
    try {
      // コンテナ幅を取得（50%想定で400px程度）
      const containerWidth = canvasRef.current.parentElement?.clientWidth || 400;
      debugLog('📏 コンテナ幅:', containerWidth);
      
      ImageProcessor.drawImageToCanvas(canvasRef.current, imageData, containerWidth);
    } catch (error) {
      console.error('❌ Canvas描画でエラー:', error);
      setError('画像の表示に失敗しました');
    }
  }, [imageData]);

  // imageDataが変更されたときにCanvas描画を実行
  React.useEffect(() => {
    if (imageData) {
      debugLog('🔄 imageData更新検出、Canvas描画を実行');
      // 少し遅延してCanvas描画（DOM更新を確実に待つ）
      const timeoutId = setTimeout(drawImageToCanvas, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [imageData, drawImageToCanvas]);

  /**
   * 座標クリック処理
   */
  const handleCoordinateClick = useCallback((coordinate: ImageCoordinate): ColorModel | null => {
    debugLog('🖱️ 座標クリック:', coordinate);
    
    if (!canvasRef.current) {
      console.error('❌ Canvas が存在しません');
      setError('画像が読み込まれていません');
      return null;
    }

    try {
      // 座標から色を抽出
      debugLog('🎨 色抽出開始...');
      const color = ImageProcessor.extractColorFromCanvas(canvasRef.current, coordinate);
      debugLog('✅ 抽出された色:', color);
      
      setSelectedCoordinate(coordinate);
      setError(null);
      
      // 色選択コールバックを呼び出し
      if (stableOptions.current?.onColorSelect) {
        debugLog('📞 onColorSelectコールバック呼び出し');
        stableOptions.current.onColorSelect(color);
      } else {
        console.warn('⚠️ onColorSelectコールバックが設定されていません');
      }
      
      return color;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '色の抽出に失敗しました';
      console.error('❌ 色抽出エラー:', err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * 画像データのクリア
   */
  const clearImage = useCallback(() => {
    setImageData(prevImageData => {
      if (prevImageData) {
        ImageProcessor.cleanupImageUrl(prevImageData);
      }
      return null;
    });
    setSelectedCoordinate(null);
    setError(null);
  }, []);

  /**
   * エラーのクリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    imageData,
    selectedCoordinate,
    isLoading,
    error,
    handleFileSelect,
    handleCoordinateClick,
    canvasRef,
    clearImage,
    clearError
  };
}