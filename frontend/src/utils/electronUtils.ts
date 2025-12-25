/**
 * Electron環境での拡張機能
 */

// Electron APIの型定義
interface ElectronAPI {
  showOpenDialog: () => Promise<{
    success: boolean;
    filePath?: string;
    filename?: string;
    imageData?: string;
  }>;
  loadImageFromPath: (filePath: string) => Promise<{
    success: boolean;
    filePath?: string;
    filename?: string;
    imageData?: string;
    error?: string;
  }>;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Electron環境かどうかを判定
 */
export function isElectronEnvironment(): boolean {
  console.log('🔍 Electron環境チェック開始');
  console.log('🔍 window:', typeof window);
  console.log('🔍 window.electronAPI:', typeof window.electronAPI);
  
  if (typeof window !== 'undefined' && window.electronAPI) {
    console.log('🔍 electronAPI詳細:', {
      showOpenDialog: typeof window.electronAPI.showOpenDialog,
      loadImageFromPath: typeof window.electronAPI.loadImageFromPath,
      platform: window.electronAPI.platform,
      isElectron: window.electronAPI.isElectron
    });
  }
  
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
  console.log('🔍 Electron環境チェック結果:', {
    windowExists: typeof window !== 'undefined',
    electronAPIExists: typeof window.electronAPI !== 'undefined',
    isElectronFlag: window.electronAPI?.isElectron,
    result: isElectron
  });
  return isElectron;
}

/**
 * Electronのファイル選択ダイアログを開く
 */
export async function showElectronFileDialog(): Promise<File | null> {
  if (!isElectronEnvironment()) {
    throw new Error('Electron環境ではありません');
  }

  try {
    const result = await window.electronAPI!.showOpenDialog();
    
    if (result.success && result.imageData && result.filename) {
      // Base64データからBlobを作成
      const base64Data = result.imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const mimeType = result.imageData.split(';')[0].split(':')[1];
      const blob = new Blob([byteArray], { type: mimeType });
      
      return new File([blob], result.filename, { type: mimeType });
    }
    
    return null;
  } catch (error) {
    console.error('Electronファイル選択エラー:', error);
    throw error;
  }
}

/**
 * ElectronでPATH指定ファイル読み込み
 */
export async function loadElectronImageFromPath(filePath: string): Promise<File | null> {
  if (!isElectronEnvironment()) {
    throw new Error('Electron環境ではありません');
  }

  try {
    const result = await window.electronAPI!.loadImageFromPath(filePath);
    
    if (result.success && result.imageData && result.filename) {
      // Base64データからBlobを作成
      const base64Data = result.imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const mimeType = result.imageData.split(';')[0].split(':')[1];
      const blob = new Blob([byteArray], { type: mimeType });
      
      return new File([blob], result.filename, { type: mimeType });
    } else {
      throw new Error(result.error || 'ファイル読み込みに失敗しました');
    }
  } catch (error) {
    console.error('ElectronPATH読み込みエラー:', error);
    throw error;
  }
}