import type { ImageData, ImageCoordinate } from '../types/image';
import type { ColorModel } from '../types/color';
import { createColorModel } from './colorUtils';
import { debugLog } from './logger';

/**
 * 画像処理ユーティリティクラス
 */
export class ImageProcessor {
  /**
   * ファイルから画像データを作成
   * @param file - 画像ファイル
   * @returns Promise<ImageData>
   */
  static async createImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const imageData: ImageData = {
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          path: file.name
        };
        resolve(imageData);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('画像の読み込みに失敗しました'));
      };
      
      img.src = url;
    });
  }

  /**
   * Canvas上の指定座標から色を抽出
   * @param canvas - Canvasエレメント
   * @param coordinate - 座標
   * @returns ColorModel
   */
  static extractColorFromCanvas(canvas: HTMLCanvasElement, coordinate: ImageCoordinate): ColorModel {
    debugLog('🎯 色抽出開始 - Canvas:', canvas.width, 'x', canvas.height, '座標:', coordinate);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context の取得に失敗しました');
    }

    // 座標を Canvas のサイズに合わせて調整
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor(coordinate.x * scaleX);
    const y = Math.floor(coordinate.y * scaleY);

    debugLog('📐 座標変換:', {
      original: coordinate,
      rect: { width: rect.width, height: rect.height },
      scale: { x: scaleX, y: scaleY },
      adjusted: { x, y }
    });

    // 座標が Canvas の範囲内かチェック
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      throw new Error(`指定された座標が画像の範囲外です: (${x}, ${y})`);
    }

    // ピクセルデータを取得
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b, a] = imageData.data;

    debugLog('🎨 抽出されたピクセルデータ:', { r, g, b, a });

    const color = createColorModel({ r, g, b });
    debugLog('✅ 作成されたColorModel:', color);
    
    return color;
  }

  /**
   * 画像をCanvasに描画（50%幅制限、スクロール不要サイズ）
   * @param canvas - Canvasエレメント
   * @param imageData - 画像データ
   * @param containerWidth - コンテナ幅（50%想定）
   */
  static drawImageToCanvas(
    canvas: HTMLCanvasElement, 
    imageData: ImageData, 
    containerWidth?: number
  ): void {
    debugLog('🖼️ Canvas描画開始:', {
      canvas: canvas,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      imageData: imageData,
      containerWidth: containerWidth
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Canvas context の取得に失敗');
      throw new Error('Canvas context の取得に失敗しました');
    }

    debugLog('✅ Canvas context 取得成功');

    const img = new Image();
    
    img.onload = () => {
      debugLog('🖼️ 画像読み込み完了:', {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });

      // 50%幅に収まるサイズを計算（デフォルト400px、最大高さ300px）
      const maxWidth = containerWidth || 400;
      const maxHeight = 300;
      
      const { width, height } = this.calculateDisplaySize(
        img.naturalWidth, 
        img.naturalHeight, 
        maxWidth, 
        maxHeight
      );

      debugLog('📐 表示サイズ計算結果:', {
        original: { width: img.naturalWidth, height: img.naturalHeight },
        maxSize: { width: maxWidth, height: maxHeight },
        calculated: { width, height }
      });

      // Canvasサイズを設定
      canvas.width = width;
      canvas.height = height;
      
      debugLog('🎯 Canvasサイズ設定完了:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });

      // 画像を描画
      try {
        ctx.drawImage(img, 0, 0, width, height);
        debugLog('✅ Canvas描画完了');
      } catch (error) {
        console.error('❌ Canvas描画エラー:', error);
      }
    };

    img.onerror = (error) => {
      console.error('❌ 画像読み込みエラー:', error);
    };

    debugLog('🔄 画像読み込み開始:', imageData.url);
    img.src = imageData.url;
  }

  /**
   * 表示サイズを計算（アスペクト比を保持）
   * @param originalWidth - 元の幅
   * @param originalHeight - 元の高さ
   * @param maxWidth - 最大幅
   * @param maxHeight - 最大高さ
   * @returns 計算された表示サイズ
   */
  static calculateDisplaySize(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth?: number, 
    maxHeight?: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // 最大幅の制限
    if (maxWidth && width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    // 最大高さの制限
    if (maxHeight && height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }

    return {
      width: Math.floor(width),
      height: Math.floor(height)
    };
  }

  /**
   * 対応している画像フォーマットかチェック（PDF、HEIC対応）
   * @param file - ファイル
   * @returns 対応フォーマットかどうか
   */
  static isSupportedImageFormat(file: File): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'application/pdf'
    ];

    return supportedTypes.includes(file.type.toLowerCase());
  }

  /**
   * ファイルサイズをチェック
   * @param file - ファイル
   * @param maxSizeMB - 最大サイズ（MB）
   * @returns サイズが制限内かどうか
   */
  static isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * 画像ファイルの検証
   * @param file - ファイル
   * @returns 検証結果
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    if (!this.isSupportedImageFormat(file)) {
      return {
        isValid: false,
        error: '対応していない画像フォーマットです。JPEG, PNG, HEIC/HEIF, BMP, TIFF, WebP, PDFをご利用ください。'
      };
    }

    if (!this.isValidFileSize(file)) {
      return {
        isValid: false,
        error: 'ファイルサイズが大きすぎます。10MB以下のファイルをご利用ください。'
      };
    }

    return { isValid: true };
  }

  /**
   * 画像URLのクリーンアップ
   * @param imageData - 画像データ
   */
  static cleanupImageUrl(imageData: ImageData): void {
    if (imageData.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageData.url);
    }
  }
}