const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('🚀 Electronウィンドウ作成開始');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../frontend/public/icon-192.png'), // アイコン設定
    title: '塗装色混合アシスタント',
    show: false // 初期は非表示
  });

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Electronウィンドウ表示準備完了');
    mainWindow.show();
  });

  // コンテンツ読み込み
  console.log('🔧 loadContent呼び出し開始');
  loadContent().catch(error => {
    console.error('❌ loadContentエラー:', error);
    // エラー時のフォールバック
    console.log('🔧 エラー時フォールバック実行');
    mainWindow.loadURL('data:text/html,<h1>Loading Error</h1><p>開発サーバーに接続できませんでした</p>');
  });
}

async function loadContent() {
  console.log('🔧 loadContent関数開始');
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

  // 開発環境では開発サーバーを、本番環境では静的ファイルを読み込み
  const isDev = process.env.NODE_ENV === 'development';
  console.log('🔧 isDev:', isDev);
  
  if (isDev) {
    console.log('🔧 開発モードで実行中');
    // 開発環境：Viteサーバーに接続（ポート5173または5174を試行）
    const tryPorts = [5173, 5174, 5175];
    let connected = false;
    
    for (const port of tryPorts) {
      try {
        console.log(`🔍 ポート ${port} への接続を試行中...`);
        await mainWindow.loadURL(`http://localhost:${port}`);
        console.log(`✅ ポート ${port} への接続成功`);
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ ポート ${port} への接続失敗:`, error.message);
      }
    }
    
    if (!connected) {
      console.error('❌ 開発サーバーに接続できませんでした');
      console.log('💡 npm run dev:frontend を実行してください');
      // フォールバック：直接HTMLファイルを読み込み
      console.log('🔧 フォールバック：静的ファイルを読み込み');
      await mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
    
    // 開発者ツールを開く
    mainWindow.webContents.openDevTools();
  } else {
    console.log('🔧 本番モードで実行中');
    await mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  
  console.log('🔧 loadContent関数完了');
}

// ファイル選択ダイアログ
ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { 
        name: '画像ファイル', 
        extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'heic', 'heif'] 
      },
      { name: 'すべてのファイル', extensions: ['*'] }
    ],
    title: '画像ファイルを選択してください'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase().slice(1);
      
      // HEIC/HEIFの場合はjpegとして扱う
      const mimeType = (ext === 'heic' || ext === 'heif') ? 'jpeg' : ext;
      
      return {
        success: true,
        filePath,
        filename: path.basename(filePath),
        imageData: `data:image/${mimeType};base64,${base64}`
      };
    } catch (error) {
      return {
        success: false,
        error: `ファイル読み込みエラー: ${error.message}`
      };
    }
  }
  
  return { success: false };
});

// PATH指定でファイル読み込み
ipcMain.handle('load-image-from-path', async (event, filePath) => {
  try {
    console.log('Electron: PATH読み込み要求:', filePath);
    
    // ファイル存在確認
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'ファイルが見つかりません' };
    }
    
    // 画像ファイル確認
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic', '.heif'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return { success: false, error: '対応していない画像フォーマットです' };
    }
    
    // ファイル読み込み
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');
    
    // HEIC/HEIFの場合はjpegとして扱う
    const mimeType = (ext === '.heic' || ext === '.heif') ? 'jpeg' : ext.slice(1);
    
    console.log('Electron: PATH読み込み成功:', path.basename(filePath));
    
    return {
      success: true,
      filePath,
      filename: path.basename(filePath),
      imageData: `data:image/${mimeType};base64,${base64}`
    };
    
  } catch (error) {
    console.error('Electron: PATH読み込みエラー:', error);
    return { success: false, error: error.message };
  }
});

// アプリケーション準備完了
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられた時
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('🚀 Electron メインプロセス起動完了');