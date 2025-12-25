import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

/**
 * 塗装色混合アシスタント バックエンドサーバー
 * Express + TypeScript構成
 */
const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite開発サーバーとReact開発サーバー
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静的ファイル配信（アップロードされた画像用）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer設定（画像アップロード用）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB制限
  },
  fileFilter: (req, file, cb) => {
    // 対応画像フォーマットのチェック
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('対応していない画像フォーマットです'));
    }
  }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '塗装色混合アシスタント バックエンドサーバーが正常に動作しています',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 画像アップロードエンドポイント
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'ファイルがアップロードされていません'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.json({
      message: '画像のアップロードが完了しました',
      file: fileInfo
    });

  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({
      error: '画像のアップロードに失敗しました'
    });
  }
});

// PATH指定画像読み込みエンドポイント
app.post('/api/load-image-path', (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        error: 'ファイルパスが指定されていません'
      });
    }

    // クラウド配置時はローカルファイルアクセス不可のため、
    // ファイル選択ダイアログの使用を案内
    res.status(501).json({
      error: 'PATH指定による画像読み込みは対応していません',
      message: 'セキュリティ上の制限により、Webアプリケーションから直接ローカルファイルにアクセスできません。',
      suggestion: '参照ボタンまたはドラッグ&ドロップでファイルを選択してください',
      reason: 'browser_security_limitation'
    });

  } catch (error) {
    console.error('PATH画像読み込みエラー:', error);
    res.status(500).json({
      error: 'PATH画像読み込みに失敗しました'
    });
  }
});

// 色変換エンドポイント（将来の拡張用）
app.post('/api/color/convert', (req, res) => {
  try {
    const { r, g, b, c, m, y, k, type } = req.body;

    // 今後、サーバーサイドでの色変換が必要になった場合の準備
    res.json({
      message: '色変換はクライアント側で実行されます',
      clientSide: true
    });

  } catch (error) {
    console.error('色変換エラー:', error);
    res.status(500).json({
      error: '色変換に失敗しました'
    });
  }
});

// 塗料混合計算エンドポイント（将来の拡張用）
app.post('/api/paint/mixing', (req, res) => {
  try {
    const { colorA, colorB } = req.body;

    // 今後、Mixboxなどのサーバーサイド計算が必要になった場合の準備
    res.json({
      message: '塗料混合計算はクライアント側で実行されます',
      clientSide: true
    });

  } catch (error) {
    console.error('塗料混合計算エラー:', error);
    res.status(500).json({
      error: '塗料混合計算に失敗しました'
    });
  }
});

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    path: req.originalUrl
  });
});

// エラーハンドリングミドルウェア
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('サーバーエラー:', error);
  
  res.status(500).json({
    error: 'サーバー内部エラーが発生しました',
    message: error.message
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 塗装色混合アシスタント バックエンドサーバーが起動しました`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 ヘルスチェック: http://localhost:${PORT}/api/health`);
  console.log(`📁 アップロード: http://localhost:${PORT}/api/upload`);
});

export default app;