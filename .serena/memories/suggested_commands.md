# 推奨コマンド集

## 開発コマンド

### フロントエンド開発 (frontend/ ディレクトリ)
```powershell
# 開発サーバー起動
npm run dev

# ビルド (型チェック付き)
npm run build:check

# 通常ビルド
npm run build

# プレビュー (ビルド後の確認)
npm run preview

# リンター実行
npm run lint
```

### テスト実行
```powershell
# 対話的テスト (watch mode)
npm test

# 自動化テスト (CI用・人間入力なし)
npm run test:run

# E2Eテスト
npm run test:e2e
npm run test:browser

# テストUI
npm run test:ui
```

### デプロイ
```powershell
# GitHub Pagesデプロイ
npm run deploy

# 事前ビルド (自動実行)
npm run predeploy
```

## プロジェクト管理

### 依存関係管理
```powershell
# パッケージインストール
npm install

# パッケージ追加
npm install <package-name>

# 開発依存関係追加
npm install -D <package-name>

# パッケージ更新
npm update
```

### Git操作
```powershell
# 状態確認
git status

# 変更追加
git add .

# コミット
git commit -m "メッセージ"

# プッシュ
git push origin main
```

## Windows固有コマンド

### ファイル・ディレクトリ操作
```powershell
# ディレクトリ一覧
Get-ChildItem (ls)

# ファイル内容表示
Get-Content <file> (cat)

# ファイル検索
Get-ChildItem -Recurse -Name "*pattern*"

# プロセス確認
Get-Process

# 環境変数確認
$env:PATH
```

### 開発環境確認
```powershell
# Node.js バージョン
node --version

# npm バージョン
npm --version

# PowerShell バージョン
$PSVersionTable.PSVersion
```

## トラブルシューティング

### よくある問題
```powershell
# node_modules 再インストール
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# キャッシュクリア
npm cache clean --force

# ポート使用状況確認
netstat -ano | findstr :5173
```