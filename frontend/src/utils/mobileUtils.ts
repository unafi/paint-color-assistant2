/**
 * モバイル環境での拡張機能
 */

import { debugLog } from './logger';

/**
 * モバイル環境かどうかを判定
 */
export function isMobileEnvironment(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * iOS環境かどうかを判定
 */
export function isIOSEnvironment(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * カメラアクセス可能かチェック
 */
export async function checkCameraAccess(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    debugLog('カメラアクセス不可:', error);
    return false;
  }
}

/**
 * モバイル用ファイル選択オプション
 */
export interface MobileFileOptions {
  allowCamera?: boolean;
  allowGallery?: boolean;
  quality?: number; // 0.1 - 1.0
}

/**
 * モバイル最適化されたファイル選択
 */
export function createMobileFileInput(options: MobileFileOptions = {}): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  
  // iOS/Android対応のaccept属性
  const acceptTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/heic',  // iOS HEIC形式
    'image/heif'   // iOS HEIF形式
  ];
  
  input.accept = acceptTypes.join(',');
  
  // カメラ使用を許可する場合
  if (options.allowCamera !== false) {
    input.setAttribute('capture', 'environment'); // 背面カメラを優先
  }
  
  return input;
}

/**
 * HEIC/HEIF画像をJPEGに変換（iOS対応）
 */
export async function convertHEICToJPEG(file: File): Promise<File> {
  // HEIC/HEIF形式の場合、ブラウザで自動変換される場合が多い
  // 必要に応じてheic2anyライブラリ等を使用
  
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    debugLog('HEIC/HEIF形式が検出されました。変換処理を実行します。');
    
    // 実際の変換処理はheic2anyライブラリを使用
    // npm install heic2any
    // import heic2any from 'heic2any';
    
    try {
      // const convertedBlob = await heic2any({
      //   blob: file,
      //   toType: 'image/jpeg',
      //   quality: 0.8
      // });
      
      // return new File([convertedBlob as Blob], 
      //   file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
      //   { type: 'image/jpeg' }
      // );
      
      // 暫定的に元ファイルを返す
      debugLog('HEIC変換ライブラリが未実装のため、元ファイルを使用します');
      return file;
    } catch (error) {
      console.error('HEIC変換エラー:', error);
      return file;
    }
  }
  
  return file;
}

/**
 * 画像を指定サイズにリサイズ（モバイル最適化）
 */
export async function resizeImageForMobile(
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // アスペクト比を保持してリサイズ
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blobに変換
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}