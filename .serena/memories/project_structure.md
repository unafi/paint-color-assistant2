# プロジェクト構造

## ディレクトリ構成
```
paint-color-assistant2/
├── .git/                  # Git管理
├── .github/               # GitHub Actions設定
├── .serena/               # Serena MCP設定
├── backend/               # Express APIサーバー
├── electron-example/      # Electron版サンプル
├── frontend/              # Reactアプリケーション (メイン)
│   ├── dist/              # ビルド出力
│   ├── node_modules/      # 依存関係
│   ├── public/            # 静的ファイル
│   ├── src/               # ソースコード
│   │   ├── assets/        # アセット
│   │   ├── components/    # UIコンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── styles/        # スタイル定義
│   │   ├── test/          # テストファイル
│   │   ├── types/         # TypeScript型定義
│   │   └── utils/         # ユーティリティ関数
│   ├── package.json       # 依存関係・スクリプト
│   └── vite.config.ts     # Vite設定
├── shared/                # 共通型定義
├── reference/             # 旧版参考ファイル
├── specs/                 # 仕様書
└── README.md              # プロジェクト説明
```

## 主要コンポーネント
```
src/components/
├── ColorController/       # RGB/CMYK色調整
├── ColorMixingDisplay/    # 色混合結果表示
├── PaintMixingController/ # 塗料混合コントローラ
├── ImageUpload/           # 画像アップロード
├── CompactMixingBar/      # コンパクト混色バー
├── ColorComparison/       # 色比較表示
├── ColorPreviewController/# 色プレビュー
├── ImageSwapButton/       # 画像切り替え
├── NumericInputWithButtons/ # 数値入力+ボタン
└── TouchButton/           # タッチ対応ボタン
```

## 設定ファイル
- **package.json**: 依存関係・NPMスクリプト
- **tsconfig.json**: TypeScript設定 (参照設定)
- **tsconfig.app.json**: アプリケーション用TS設定
- **vite.config.ts**: Vite設定 (GitHub Pages対応)
- **vitest.config.ts**: テスト設定

## エントリーポイント
- **src/main.tsx**: Reactアプリケーション起動
- **src/App.tsx**: メインアプリケーションコンポーネント
- **index.html**: HTMLテンプレート