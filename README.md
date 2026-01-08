# 塗装色混合アシスタント v2.0

React + TypeScript構成による塗装色混合計算アプリケーション

## 🌐 ライブデモ

**GitHub Pages**: https://unafi.github.io/paint-color-assistant2/

## 技術スタック

- **React 18**: UIフレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Vite**: ビルドツール
- **Canvas API**: 画像処理・色抽出
- **GitHub Pages**: 静的サイトホスティング

## 主な機能

1. **リアルタイム色調整**: クライアント側完結のRGB/CMYK調整
2. **画像色抽出**: 画像クリックによる色選択
3. **物理的塗料混合計算**: 科学的根拠に基づく混合比率算出
4. **レスポンシブデザイン**: PC/モバイル対応

## 開発方針

- **クライアント側完結**: 色調整はサーバー通信なしで実現
- **型安全性**: TypeScriptによる堅牢な開発
- **コンポーネント設計**: 再利用可能なReactコンポーネント
- **パフォーマンス**: 最適化されたバンドルサイズ

## ディレクトリ構成

```
paint-color-assistant2/
├── frontend/              # Reactアプリケーション
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── utils/         # ユーティリティ関数
│   │   ├── types/         # TypeScript型定義
│   │   └── test/          # テストファイル
│   ├── public/            # 静的ファイル
│   └── package.json
├── electron-example/      # Electron版サンプル
├── reference/             # 旧版からの参考ファイル
└── specs/                 # 仕様書・設計ドキュメント
```

## 開発開始手順

1. Node.js環境のセットアップ
2. フロントエンドの初期化: `cd frontend && npm install`
3. 開発サーバー起動: `npm run dev`
4. ビルド: `npm run build`
5. GitHub Pagesデプロイ: 自動デプロイ設定済み

## 旧版からの改善点

- **技術的制約の解消**: Streamlitの制限から解放
- **リアルタイム性の向上**: クライアント側での即座な色調整
- **保守性の向上**: 統一された技術スタック
- **拡張性の確保**: モジュラー設計による機能追加の容易さ