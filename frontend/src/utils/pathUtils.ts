/**
 * パス処理ユーティリティ
 */

/**
 * エクスプローラーからコピーしたパスをクリーンアップ
 * ダブルクォーテーションで括られたパスを正しく処理
 * @param rawPath - 生のパス文字列
 * @returns クリーンアップされたパス
 */
export function cleanFilePath(rawPath: string): string {
  if (!rawPath) return '';
  
  let cleanPath = rawPath.trim();
  
  // ダブルクォーテーションで括られている場合は除去
  if (cleanPath.startsWith('"') && cleanPath.endsWith('"')) {
    cleanPath = cleanPath.slice(1, -1);
  }
  
  // シングルクォーテーションで括られている場合も除去
  if (cleanPath.startsWith("'") && cleanPath.endsWith("'")) {
    cleanPath = cleanPath.slice(1, -1);
  }
  
  return cleanPath.trim();
}

/**
 * ファイルパスが有効かチェック
 * @param filePath - ファイルパス
 * @returns 有効性チェック結果
 */
export function validateFilePath(filePath: string): { isValid: boolean; error?: string } {
  const cleanPath = cleanFilePath(filePath);
  
  if (!cleanPath) {
    return { isValid: false, error: 'ファイルパスが入力されていません' };
  }
  
  // 基本的なパス形式チェック
  const windowsPathPattern = /^[a-zA-Z]:\\.*$/;
  const unixPathPattern = /^\/.*$/;
  const relativePathPattern = /^\.\.?[\/\\].*$/;
  
  if (!windowsPathPattern.test(cleanPath) && 
      !unixPathPattern.test(cleanPath) && 
      !relativePathPattern.test(cleanPath) &&
      !cleanPath.includes('/') && 
      !cleanPath.includes('\\')) {
    return { isValid: false, error: '有効なファイルパス形式ではありません' };
  }
  
  return { isValid: true };
}

/**
 * ファイル拡張子を取得
 * @param filePath - ファイルパス
 * @returns ファイル拡張子（ドット付き）
 */
export function getFileExtension(filePath: string): string {
  const cleanPath = cleanFilePath(filePath);
  const lastDotIndex = cleanPath.lastIndexOf('.');
  
  if (lastDotIndex === -1 || lastDotIndex === cleanPath.length - 1) {
    return '';
  }
  
  return cleanPath.substring(lastDotIndex).toLowerCase();
}

/**
 * 対応している画像拡張子かチェック
 * @param filePath - ファイルパス
 * @returns 対応している拡張子かどうか
 */
export function isSupportedImageExtension(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  const supportedExtensions = [
    '.jpg', '.jpeg', '.png', '.heic', '.heif', 
    '.bmp', '.tiff', '.tif', '.webp', '.pdf'
  ];
  
  return supportedExtensions.includes(extension);
}