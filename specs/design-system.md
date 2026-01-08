---
inclusion: always
---

# Paint Color Assistant Design System Rules

このドキュメントは、Figma MCPを使用してデザインからコードへの変換を行う際のルールとガイドラインを定義します。

## プロジェクト構造

### フレームワーク & ライブラリ
- **UI Framework**: React 19.2.0 + TypeScript
- **Build System**: Vite 7.2.4
- **Styling**: CSS Modules + Tailwind CSS 3.4.17
- **Color Processing**: カスタム実装（ColorSpaceConverter）
- **Testing**: Vitest + Testing Library

### コンポーネントアーキテクチャ
```
src/components/
├── ColorController/          # RGB/CMYK色調整コンポーネント
├── ColorMixingDisplay/       # 色混合結果表示
├── PaintMixingController/    # 塗料混合コントローラ
├── ImageUpload/             # 画像アップロード機能
├── CompactMixingBar/        # コンパクト混色バー
└── [ComponentName]/
    ├── ComponentName.tsx    # メインコンポーネント
    ├── ComponentName.css    # スタイル定義
    └── ComponentName.test.tsx # テストファイル
```

## デザイントークン定義

### カラーシステム
```typescript
// 主要カラーパレット（App.css基準）
const colors = {
  // 背景色
  background: {
    primary: '#f9fafb',      // アプリ全体背景
    secondary: '#ffffff',    // カード・ヘッダー背景
    accent: '#e0f2fe',      // 情報表示背景
  },
  
  // テキスト色
  text: {
    primary: '#1f2937',     // メインテキスト
    secondary: '#6b7280',   // サブテキスト
    accent: '#0369a1',      // アクセントテキスト
  },
  
  // ボーダー色
  border: {
    light: '#e5e7eb',       // 軽いボーダー
    medium: '#d1d5db',      // 中程度ボーダー
  },
  
  // 機能別カラー
  functional: {
    success: '#166534',     // 成功状態
    warning: '#92400e',     // 警告状態
    info: '#5b21b6',       // 情報状態
  }
};
```

### タイポグラフィ
```css
/* フォントファミリー */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* フォントサイズスケール */
.text-xs { font-size: 0.75rem; }    /* 12px */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-3xl { font-size: 2rem; }      /* 32px */

/* フォントウェイト */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### スペーシングシステム
```css
/* 基本スペーシング（0.25rem = 4px基準） */
.p-1 { padding: 0.25rem; }    /* 4px */
.p-2 { padding: 0.5rem; }     /* 8px */
.p-3 { padding: 0.75rem; }    /* 12px */
.p-4 { padding: 1rem; }       /* 16px */
.p-6 { padding: 1.5rem; }     /* 24px */
.p-8 { padding: 2rem; }       /* 32px */

/* マージンも同様 */
.m-1, .m-2, .m-3, .m-4, .m-6, .m-8 { /* 同じ値 */ }

/* ギャップ（Flexbox/Grid用） */
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
```

## レスポンシブデザインシステム

### ブレークポイント
```css
/* モバイル優先設計 */
@media (max-width: 767px) {    /* Mobile */
  /* スマートフォン向けスタイル */
}

@media (min-width: 768px) and (max-width: 1023px) {  /* Tablet */
  /* タブレット向けスタイル */
}

@media (min-width: 1024px) {   /* Desktop */
  /* デスクトップ向けスタイル */
}

@media (min-width: 1400px) {   /* Large Desktop */
  /* 大画面向けスタイル */
}
```

### レイアウトパターン
```typescript
// useResponsiveLayout フックを使用
const { deviceType, isDesktop } = useResponsiveLayout();

// デバイス別レイアウト切り替え
{isDesktop ? (
  <div className="app__desktop-layout">
    {/* 2カラムレイアウト */}
  </div>
) : (
  <div className="app__mobile-layout">
    {/* 縦積みレイアウト */}
  </div>
)}
```

## コンポーネント設計原則

### 1. Props インターフェース
```typescript
interface ComponentProps {
  // 必須プロパティ
  color: ColorModel;
  onChange: (color: ColorModel) => void;
  
  // オプショナルプロパティ
  label?: string;
  disabled?: boolean;
  deviceType?: DeviceType;
  
  // スタイリング
  className?: string;
  style?: React.CSSProperties;
}
```

### 2. 状態管理パターン
```typescript
// useState + useCallback の組み合わせ
const [state, setState] = useState<StateType>(initialState);

const handleChange = useCallback((newValue: StateType) => {
  setState(newValue);
  onChange?.(newValue);
}, [onChange]);
```

### 3. CSS クラス命名規則（BEM風）
```css
/* ブロック */
.component-name { }

/* エレメント */
.component-name__element { }

/* モディファイア */
.component-name--modifier { }
.component-name__element--modifier { }

/* 例: PaintMixingController */
.paint-mixing-controller { }
.paint-mixing-controller__slider { }
.paint-mixing-controller__slider--disabled { }
```

## Figma統合ガイドライン

### 1. Figmaデザインからコード変換時の原則
- **Tailwind優先**: Figma出力のTailwindクラスを既存のCSSクラスに変換
- **コンポーネント再利用**: 既存コンポーネント（TouchButton、NumericInputWithButtons等）を優先使用
- **デザイントークン適用**: 上記定義のカラー・タイポグラフィ・スペーシングを使用
- **レスポンシブ対応**: デバイス別レイアウトを考慮した実装

### 2. 変換マッピング例
```typescript
// Figma → 既存システム変換例
'bg-blue-500' → 'background-color: #0369a1' // colors.text.accent
'text-lg' → 'font-size: 1.125rem'           // typography scale
'p-4' → 'padding: 1rem'                     // spacing system
'rounded-md' → 'border-radius: 0.375rem'    // border radius
```

### 3. コンポーネントマッピング
```typescript
// Figma要素 → 既存コンポーネント
'Button' → 'TouchButton'
'Input with +/- buttons' → 'NumericInputWithButtons'
'Color Picker' → 'ColorController'
'Image Upload Area' → 'ImageUpload'
```

## アセット管理

### 画像・アイコン
```typescript
// 画像の配置場所
public/
├── icons/          # SVGアイコン
├── images/         # 静的画像
└── favicon.ico     # ファビコン

// 使用方法
<img src="/icons/upload.svg" alt="アップロード" />
```

### カラーユーティリティ
```typescript
// カスタム実装のColorSpaceConverterを使用した色操作
import { ColorSpaceConverter, createColorModel } from '../utils/colorUtils';

// RGB⇔CMYK変換
const cmyk = ColorSpaceConverter.rgbToCmyk(255, 0, 0); // 赤をCMYKに変換
const rgb = ColorSpaceConverter.cmykToRgb(0, 100, 100, 0); // CMYKをRGBに変換

// ColorModel作成
const colorModel = createColorModel({ r: 255, g: 0, b: 0 });

// CSS色文字列生成
const cssColor = colorToCss(colorModel); // "rgb(255, 0, 0)"
```

## テスト戦略

### コンポーネントテスト
```typescript
// Testing Library を使用
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

test('should render correctly', () => {
  render(<ComponentName />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### 自動化テスト
```bash
# テスト実行コマンド
npm run test:automated    # 人間入力なしの自動実行
npm run test:browser      # ブラウザテスト
npm run test:e2e          # E2Eテスト
```

## 今後の拡張指針

### 新機能追加時の考慮事項
1. **既存コンポーネントの再利用**: 新規作成前に既存コンポーネントの活用を検討
2. **レスポンシブ対応**: モバイル・タブレット・デスクトップ全てに対応
3. **アクセシビリティ**: ARIA属性、キーボード操作、色覚対応を考慮
4. **パフォーマンス**: useMemo、useCallback を適切に使用
5. **テスト**: 新機能には必ずテストを追加

### Figma連携ワークフロー
1. **デザイン作成**: Figmaでデザイン作成
2. **Code Connect**: コンポーネントとコードの紐付け
3. **自動変換**: Figma MCPでコード生成
4. **手動調整**: 既存システムに合わせて調整
5. **テスト**: 自動テストで品質確保
6. **デプロイ**: GitHub Pages自動デプロイ

このルールに従うことで、Figmaデザインから一貫性のあるコードを効率的に生成できます。