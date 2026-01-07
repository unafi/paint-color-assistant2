/**
 * Figmaデザインシステムから抽出したデザイントークン
 * HTML to Design版 (Yt1SPXhQ6k1OUjOKMnSh2i) より生成
 */

export const designTokens = {
  // カラーパレット（Figmaから抽出）
  colors: {
    // 背景色
    background: {
      primary: '#f9fafb',      // App全体背景
      secondary: '#ffffff',    // カード・ヘッダー背景  
      accent: '#e0f2fe',      // 情報表示背景
      surface: '#f8fafc',     // 入力フィールド背景
    },
    
    // テキスト色
    text: {
      primary: '#1f2937',     // メインテキスト (Ebony Clay)
      secondary: '#6b7280',   // サブテキスト (Pale Sky)
      accent: '#0369a1',      // アクセントテキスト (Bahama Blue)
      muted: '#374151',       // ミュートテキスト (Oxford Blue)
    },
    
    // ボーダー色
    border: {
      light: '#e5e7eb',       // 軽いボーダー (Athens Gray)
      medium: '#d1d5db',      // 中程度ボーダー (Mischka)
      strong: '#ccc',         // 強いボーダー
    },
    
    // 機能別カラー
    functional: {
      success: '#166534',     // 成功状態 (Jewel)
      successBg: '#f0fdf4',   // 成功背景 (Feta)
      successBorder: '#bbf7d0', // 成功ボーダー (Ice Cold)
      
      warning: '#92400e',     // 警告状態 (Korma)
      warningBg: '#fef3c7',   // 警告背景 (Beeswax)
      warningBorder: '#fbbf24', // 警告ボーダー (Lightning Yellow)
      
      info: '#5b21b6',       // 情報状態 (Purple Heart)
      infoBg: '#ddd6fe',     // 情報背景 (Fog)
      infoBorder: '#a78bfa', // 情報ボーダー (Heliotrope)
      
      error: '#dc2626',      // エラー状態 (Alizarin Crimson)
    },
    
    // 色調整用カラー
    colorAdjustment: {
      red: '#ff0000',        // Red
      green: '#00ff00',      // Green  
      blue: '#0000ff',       // Blue
      cyan: '#00ffff',       // Cyan
      magenta: '#ff00ff',    // Magenta
      yellow: '#ffff00',     // Yellow
      black: '#000000',      // Black
      white: '#ffffff',      // White
      gray: '#808080',       // Gray
    }
  },
  
  // タイポグラフィ（Figmaから抽出）
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      secondary: 'Inter, sans-serif',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px  
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: '18px',
      normal: '21px', 
      relaxed: '24px',
      loose: '30px',
      extraLoose: '36px',
      mega: '48px',
    },
    
    // セマンティックタイポグラフィ
    semantic: {
      heading1: {
        fontFamily: 'var(--font-primary)',
        fontSize: '2rem',      // 32px
        fontWeight: 700,
        lineHeight: '48px',
        color: 'var(--color-text-primary)',
      },
      
      heading2: {
        fontFamily: 'var(--font-primary)',
        fontSize: '1.475rem',  // ~23.6px
        fontWeight: 700,
        lineHeight: '36px',
        color: 'var(--color-functional-success)',
      },
      
      heading3: {
        fontFamily: 'var(--font-primary)',
        fontSize: '0.944rem',  // ~15.1px
        fontWeight: 600,
        lineHeight: '24px',
        color: 'var(--color-text-muted)',
      },
      
      heading4: {
        fontFamily: 'var(--font-primary)',
        fontSize: '0.875rem',  // 14px
        fontWeight: 400,
        lineHeight: '21px',
        color: 'var(--color-text-muted)',
      },
      
      body: {
        fontFamily: 'var(--font-primary)',
        fontSize: '1rem',      // 16px
        fontWeight: 400,
        lineHeight: '24px',
        color: 'var(--color-text-primary)',
      },
      
      input: {
        fontFamily: 'var(--font-primary)',
        fontSize: '0.75rem',   // 12px
        fontWeight: 400,
        lineHeight: '18px',
        color: 'var(--color-text-primary)',
      },
      
      button: {
        fontFamily: 'var(--font-primary)',
        fontSize: '0.875rem',  // 14px
        fontWeight: 400,
        lineHeight: '21px',
        color: 'var(--color-text-muted)',
      },
    }
  },
  
  // スペーシング（4px基準）
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    base: '1rem',     // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // ボーダー半径
  borderRadius: {
    sm: '0.25rem',    // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
  },
  
  // シャドウ
  shadow: {
    sm: '0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
    base: '0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
  },
  
  // ブレークポイント
  breakpoints: {
    mobile: '767px',
    tablet: '1023px', 
    desktop: '1024px',
    large: '1400px',
  }
} as const;

// CSS変数として使用するためのヘルパー
export const cssVariables = {
  // カラー変数
  '--color-bg-primary': designTokens.colors.background.primary,
  '--color-bg-secondary': designTokens.colors.background.secondary,
  '--color-bg-accent': designTokens.colors.background.accent,
  '--color-bg-surface': designTokens.colors.background.surface,
  
  '--color-text-primary': designTokens.colors.text.primary,
  '--color-text-secondary': designTokens.colors.text.secondary,
  '--color-text-accent': designTokens.colors.text.accent,
  '--color-text-muted': designTokens.colors.text.muted,
  
  '--color-border-light': designTokens.colors.border.light,
  '--color-border-medium': designTokens.colors.border.medium,
  '--color-border-strong': designTokens.colors.border.strong,
  
  '--color-functional-success': designTokens.colors.functional.success,
  '--color-functional-success-bg': designTokens.colors.functional.successBg,
  '--color-functional-success-border': designTokens.colors.functional.successBorder,
  
  '--color-functional-warning': designTokens.colors.functional.warning,
  '--color-functional-warning-bg': designTokens.colors.functional.warningBg,
  '--color-functional-warning-border': designTokens.colors.functional.warningBorder,
  
  '--color-functional-info': designTokens.colors.functional.info,
  '--color-functional-info-bg': designTokens.colors.functional.infoBg,
  '--color-functional-info-border': designTokens.colors.functional.infoBorder,
  
  '--color-functional-error': designTokens.colors.functional.error,
  
  // フォント変数
  '--font-primary': designTokens.typography.fontFamily.primary,
  '--font-secondary': designTokens.typography.fontFamily.secondary,
  
  // スペーシング変数
  '--spacing-xs': designTokens.spacing.xs,
  '--spacing-sm': designTokens.spacing.sm,
  '--spacing-md': designTokens.spacing.md,
  '--spacing-base': designTokens.spacing.base,
  '--spacing-lg': designTokens.spacing.lg,
  '--spacing-xl': designTokens.spacing.xl,
  '--spacing-2xl': designTokens.spacing['2xl'],
  '--spacing-3xl': designTokens.spacing['3xl'],
  
  // ボーダー半径変数
  '--border-radius-sm': designTokens.borderRadius.sm,
  '--border-radius-base': designTokens.borderRadius.base,
  '--border-radius-md': designTokens.borderRadius.md,
  '--border-radius-lg': designTokens.borderRadius.lg,
  
  // シャドウ変数
  '--shadow-sm': designTokens.shadow.sm,
  '--shadow-base': designTokens.shadow.base,
} as const;

// TypeScript型定義
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type TypographyTokens = typeof designTokens.typography;
export type SpacingTokens = typeof designTokens.spacing;