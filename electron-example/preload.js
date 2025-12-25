// Electronプリロードスクリプト
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Electron preload.js 読み込み開始');

// レンダラープロセスにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ファイル選択ダイアログを開く
  showOpenDialog: () => {
    console.log('📂 showOpenDialog 呼び出し');
    return ipcRenderer.invoke('show-open-dialog');
  },
  
  // PATH指定でファイルを読み込む
  loadImageFromPath: (filePath) => {
    console.log('📁 loadImageFromPath 呼び出し:', filePath);
    return ipcRenderer.invoke('load-image-from-path', filePath);
  },
  
  // プラットフォーム情報
  platform: process.platform,
  isElectron: true
});

console.log('✅ Electron preload.js 読み込み完了');
console.log('🔧 electronAPI が window.electronAPI として公開されました');