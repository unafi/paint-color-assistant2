# 塗装色混合アシスタント v2.0 - アーキテクチャ概要

## システム全体構成（実装済み）

### 技術スタック概要
```
┌─────────────────────────────────────────────────────────────┐
│              Electron Desktop App (Optional)               │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Frontend Layer ✅ 実装済み                  │
│  │  React 18 + TypeScript + Vite + 独自色処理               │
│  ├─────────────────────────────────────────────────────────┤
│  │           クライアント完結型 ✅ 実装済み                  │
│  │  Canvas API + 色変換ユーティリティ + GitHub Pages       │
│  └─────────────────────────────────────────────────────────┤
│              Native OS Integration ✅ 実装済み              │
│  File System Access + Native Dialogs + IPC                │
└─────────────────────────────────────────────────────────────┘
```

### 配布形態（実装済み）
1. **GitHub Pages Webアプリ**: メイン配布形態（ブラウザ制約あり） ✅ 実装済み
2. **Electronデスクトップアプリ**: オプション機能（ローカルファイルアクセス対応） ✅ 実装済み

### 設計哲学
- **Web-First**: ブラウザでの利用を主軸とした設計 ✅ 実装済み
- **Electron Optional**: デスクトップ機能は追加オプション ✅ 実装済み
- **クライアント完結**: サーバー依存を最小化した処理 ✅ 実装済み

## フロントエンド アーキテクチャ

### ディレクトリ構造（実装済み）
```
frontend/src/
├── components/ ✅ 実装済み      # UIコンポーネント
│   ├── ImageUpload/            # 画像アップロード・プレビュー
│   ├── ColorController/        # RGB/CMYK色調整
│   ├── ColorMixingDisplay/     # 色比較表示
│   ├── PaintMixingController/  # 塗料混合結果
│   └── CompactMixingBar/       # コンパクト混合バー ✅ 実装済み
├── hooks/ ✅ 実装済み          # カスタムフック
│   └── useResponsiveLayout.ts  # レスポンシブ対応
├── utils/ ✅ 実装済み          # ユーティリティ関数
│   ├── colorUtils.ts           # 色空間変換・計算
│   ├── paintMixing.ts          # 塗料混合計算
│   └── electronUtils.ts        # Electron統合
├── types/ ✅ 実装済み          # TypeScript型定義
│   ├── color.ts                # 色関連型
│   ├── image.ts                # 画像関連型
│   └── ui.ts                   # UI関連型 ✅ 実装済み
└── App.tsx ✅ 実装済み         # メインアプリケーション
```

### 状態管理パターン（実装済み）
```typescript
// メインアプリケーション状態（App.tsx） ✅ 実装済み
interface AppState {
  // 色管理（出発色と結果色を分離）
  originalColorA: ColorModel;    // 画像A出発色（不変）
  resultColorA: ColorModel;      // 画像A調整結果色
  originalColorB: ColorModel;    // 画像B出発色（不変）
  resultColorB: ColorModel;      // 画像B調整結果色
  
  // 計算結果
  mixingResultColor: ColorModel; // 混色コントローラー結果
  calculatedColor: ColorModel;   // 逆算結果色（自動計算）
  
  // UI状態
  deviceType: DeviceType;        // 'mobile' | 'tablet' | 'desktop'
  isDesktop: boolean;           // レイアウト切り替え用
}
```

### コンポーネント設計原則
1. **単一責任**: 各コンポーネントは明確な責任を持つ
2. **Props型安全性**: 全てのPropsにTypeScript型定義
3. **状態の局所化**: 必要最小限の状態のみ保持
4. **再利用性**: 汎用的なコンポーネント設計

## バックエンド アーキテクチャ

### API設計
```typescript
// Express サーバー構成
const app = express();

// ミドルウェア層
app.use(cors());              // CORS対応
app.use(express.json());      // JSON解析
app.use(multer());           // ファイルアップロード
app.use('/uploads', static); // 静的ファイル配信

// API エンドポイント
app.get('/api/health');           // ヘルスチェック
app.post('/api/upload');          // 画像アップロード
app.post('/api/load-image-path'); // PATH画像読み込み（制限付き）
app.post('/api/color/convert');   // 色変換（将来拡張用）
app.post('/api/paint/mixing');    // 塗料混合（将来拡張用）
```

### 現在の役割
- **画像アップロード処理**: Multerによるファイル受信・保存
- **静的ファイル配信**: アップロード画像の配信
- **将来拡張準備**: Mixboxライブラリ統合用エンドポイント

### 設計思想
- **クライアント側完結**: 主要処理はフロントエンドで実行
- **軽量バックエンド**: 最小限の機能のみ提供
- **拡張性確保**: 将来の機能追加に対応

## Electron統合アーキテクチャ

### プロセス構成
```
┌─────────────────────────────────────────────────────────────┐
│                Main Process (main.js)                      │
│  - ウィンドウ管理                                            │
│  - ファイルシステムアクセス                                    │
│  - OS統合機能                                               │
│  - IPC通信ハンドリング                                       │
└─────────────────────────────────────────────────────────────┘
                              │ IPC
┌─────────────────────────────────────────────────────────────┐
│              Preload Script (preload.js)                   │
│  - セキュアAPI公開 (contextBridge)                           │
│  - レンダラープロセス保護                                      │
└─────────────────────────────────────────────────────────────┘
                              │ contextBridge
┌─────────────────────────────────────────────────────────────┐
│            Renderer Process (React App)                    │
│  - UI表示・操作                                              │
│  - ビジネスロジック実行                                        │
│  - window.electronAPI経由でネイティブ機能利用                  │
└─────────────────────────────────────────────────────────────┘
```

### セキュリティ設計
```javascript
// main.js - セキュア設定
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // Node.js API無効化
    contextIsolation: true,      // コンテキスト分離
    preload: path.join(__dirname, 'preload.js')
  }
});

// preload.js - 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  loadImageFromPath: (path) => ipcRenderer.invoke('load-image-from-path', path),
  platform: process.platform,
  isElectron: true
});
```

### ファイルアクセス設計
1. **ファイル選択ダイアログ**: OS標準ダイアログ → Base64変換
2. **PATH直接指定**: パス検証 → ファイル読み込み → Base64変換
3. **セキュリティ検証**: 拡張子・MIMEタイプ・ファイルサイズ確認

## 色処理アーキテクチャ

### 色空間変換システム
```typescript
class ColorSpaceConverter {
  // 基本変換
  static rgbToCmyk(r: number, g: number, b: number): CmykColor
  static cmykToRgb(c: number, m: number, y: number, k: number): RgbColor
  
  // 安全な更新（ループ防止）
  static safeColorUpdate(source: ColorUpdateSource, updateFn: () => void): void
  
  // 比率調整
  static adjustCmykRatio(c, m, y, k, changedComponent, newValue): CmykColor
}
```

### 塗料混合計算システム
```typescript
class PaintMixingCalculator {
  // メイン計算
  static calculateMixingRatio(colorA: ColorModel, colorB: ColorModel): MixingResult
  
  // 逆算処理
  static calculateReverseMixingColor(base: ColorModel, target: ColorModel): ColorModel
  
  // 内部処理
  private static consolidateInstructions(instructions: MixingInstruction[]): MixingInstruction[]
  private static formatMixingText(instructions: MixingInstruction[]): string
}
```

### 計算アルゴリズム
1. **CMYK差分計算**: `targetCMYK - baseCMYK`
2. **塗料指示生成**: 正の差分→追加、負の差分→補色追加
3. **白・黒処理**: K値変化に基づく明度調整
4. **統合処理**: 同一塗料の指示を合計
5. **逆算適用**: 指示をCMYK値に適用してRGB変換

## レスポンシブ設計アーキテクチャ

### ブレークポイント戦略
```typescript
const BREAKPOINTS = {
  mobile: 768,   // スマートフォン
  tablet: 1024,  // タブレット
  desktop: 1200  // デスクトップ
};

// レイアウト切り替えロジック
const useResponsiveLayout = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isDesktop, setIsDesktop] = useState(true);
  
  // ウィンドウサイズ監視
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // デバイス判定ロジック
    };
  }, []);
};
```

### レイアウトパターン
```css
/* デスクトップ: 2カラムレイアウト */
.app__desktop-layout {
  display: flex;
  gap: 2rem;
}

.app__column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* モバイル: 縦積みレイアウト */
.app__mobile-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 混色セクション: 横並び（デスクトップ）→ 縦積み（モバイル） */
.app__mixing-section {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .app__mixing-section {
    flex-direction: column;
  }
}
```

## データフロー アーキテクチャ

### 色選択フロー
```
画像クリック
    ↓
onColorSelect(color)
    ↓
setOriginalColorA(color) + setResultColorA(color)
    ↓
ColorController 再レンダリング
    ↓
塗料混合計算実行 (useMemo)
    ↓
結果表示更新
```

### 色調整フロー
```
RGB/CMYKスライダー操作
    ↓
onChange(adjustedColor)
    ↓
setResultColorA(adjustedColor) のみ更新
    ↓
ColorSpaceConverter.safeColorUpdate()
    ↓
塗料混合計算実行 (useMemo)
    ↓
結果表示更新
```

### 塗料混合計算フロー
```
resultColorA + resultColorB 変更
    ↓
useMemo(() => PaintMixingCalculator.calculateReverseMixingColor())
    ↓
calculatedColor 自動更新
    ↓
PaintMixingController 再レンダリング
```

## パフォーマンス最適化アーキテクチャ

### React最適化
```typescript
// メモ化によるレンダリング最適化
const ColorController = React.memo(({ originalColor, resultColor, onChange, label }) => {
  // コンポーネント実装
});

// コールバック最適化
const handleColorAChange = useCallback((color: ColorModel) => {
  setResultColorA(color);
}, []);

// 計算結果キャッシュ
const calculatedColor = useMemo(() => {
  return PaintMixingCalculator.calculateReverseMixingColor(resultColorA, resultColorB);
}, [resultColorA, resultColorB]);
```

### 画像処理最適化
```typescript
// Canvas描画最適化
useEffect(() => {
  if (imageData && canvasRef.current) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 適切なサイズでの描画
    const img = new Image();
    img.onload = () => {
      // 高品質描画
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
  }
}, [imageData]);
```

## エラーハンドリング アーキテクチャ

### 階層化エラー処理
```typescript
// 1. コンポーネントレベル
const [error, setError] = useState<string | null>(null);

try {
  const result = await processImage(file);
} catch (error) {
  setError('画像処理に失敗しました');
}

// 2. ユーティリティレベル
class ColorSpaceConverter {
  static rgbToCmyk(r: number, g: number, b: number): CmykColor {
    try {
      // 変換処理
    } catch (error) {
      console.error('RGB→CMYK変換エラー:', error);
      // フォールバック値を返す
      return { c: 0, m: 0, y: 0, k: 0 };
    }
  }
}

// 3. Electronレベル
ipcMain.handle('load-image-from-path', async (event, filePath) => {
  try {
    // ファイル処理
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## テストアーキテクチャ

### テスト戦略
```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests                               │
│  Puppeteer/Selenium - ブラウザ自動化テスト                    │
├─────────────────────────────────────────────────────────────┤
│                Integration Tests                           │
│  React Testing Library - コンポーネント統合テスト             │
├─────────────────────────────────────────────────────────────┤
│                  Unit Tests                               │
│  Jest - ユーティリティ関数・ロジックテスト                      │
└─────────────────────────────────────────────────────────────┘
```

### テスト構成
```typescript
// 単体テスト例
describe('ColorSpaceConverter', () => {
  test('RGB to CMYK conversion accuracy', () => {
    const result = ColorSpaceConverter.rgbToCmyk(255, 0, 0);
    expect(result).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });
});

// コンポーネントテスト例
describe('ColorController', () => {
  test('should update color on slider change', () => {
    render(<ColorController {...props} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: 128 } });
    expect(mockOnChange).toHaveBeenCalled();
  });
});

// E2Eテスト例
describe('Image Upload Flow', () => {
  test('should upload and preview image', async () => {
    await page.setInputFiles('input[type="file"]', 'test-image.png');
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });
});
```

## 配布・デプロイ アーキテクチャ

### マルチターゲット配布
```
┌─────────────────────────────────────────────────────────────┐
│                GitHub Pages (Web版)                        │
│  - 制限機能版（ファイル選択のみ）                              │
│  - GitHub Actions自動デプロイ                               │
│  - Vite静的ビルド                                           │
├─────────────────────────────────────────────────────────────┤
│              Electron (デスクトップ版)                       │
│  - フル機能版（PATH入力対応）                                 │
│  - electron-builder パッケージング                          │
│  - Windows/macOS/Linux対応                                 │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD パイプライン
```yaml
# GitHub Actions ワークフロー
name: Build and Deploy
on: [push]

jobs:
  web-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build Frontend
        run: cd frontend && npm run build
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4

  electron-build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - name: Build Electron App
        run: npm run electron:build
```

## 将来拡張アーキテクチャ

### 拡張ポイント
1. **Mixboxライブラリ統合**: 物理的に正確な混合計算
2. **LAB色空間対応**: より精密な色差計算
3. **AI色予測**: 機械学習による色予測機能
4. **データ永続化**: IndexedDB/SQLiteによるデータ保存
5. **プラグインシステム**: サードパーティ拡張対応

### アーキテクチャ拡張性
- **モジュラー設計**: 機能の独立性確保
- **インターフェース統一**: 一貫したAPI設計
- **設定外部化**: 機能の有効/無効切り替え
- **バージョン管理**: 後方互換性の維持