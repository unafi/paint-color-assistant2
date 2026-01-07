# コードスタイル・規約

## TypeScript設定
- **Target**: ES2022
- **Module**: ESNext (bundler mode)
- **JSX**: react-jsx
- **Strict**: true (厳格モード有効)
- **未使用変数チェック**: 無効化 (noUnusedLocals: false)

## コンポーネント設計パターン

### ファイル構成
```
ComponentName/
├── ComponentName.tsx    # メインコンポーネント
├── ComponentName.css    # スタイル定義
└── ComponentName.test.tsx # テストファイル (オプション)
```

### コンポーネント定義パターン
```typescript
/**
 * コンポーネントの説明
 * 機能の詳細説明
 */
export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  disabled = false // デフォルト値
}) => {
  // フック使用
  const { deviceType } = useResponsiveLayout();
  
  // コールバック定義
  const handleChange = useCallback((value: Type) => {
    // 処理
  }, [dependencies]);
  
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};
```

### Props型定義
```typescript
export interface ComponentProps {
  /** 必須プロパティの説明 */
  requiredProp: Type;
  /** オプショナルプロパティの説明 */
  optionalProp?: Type;
  /** 無効化フラグ */
  disabled?: boolean;
}
```

## CSS命名規則 (BEM風)
- **ブロック**: `.component-name`
- **エレメント**: `.component-name__element`
- **モディファイア**: `.component-name--modifier`

## インポート順序
1. React関連
2. 型定義 (type imports)
3. 内部コンポーネント
4. フック
5. ユーティリティ
6. CSS

## コメント規約
- **JSDoc**: 全ての関数・コンポーネントに説明
- **インライン**: 複雑なロジックに日本語コメント
- **型定義**: プロパティに詳細説明

## 状態管理パターン
- **useState + useCallback**: 基本パターン
- **useMemo**: 計算結果のキャッシュ
- **useEffect**: 副作用処理
- **カスタムフック**: 再利用可能なロジック