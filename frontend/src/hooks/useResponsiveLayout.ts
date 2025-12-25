import { useState, useEffect } from 'react';

/**
 * デバイスタイプの定義
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * レスポンシブレイアウトの設定
 */
export interface ResponsiveConfig {
  deviceType: DeviceType;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * ブレークポイントの定義
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
} as const;

/**
 * レスポンシブレイアウト管理フック
 * 画面サイズに応じてデバイスタイプを判定し、適切なレイアウト情報を提供
 */
export function useResponsiveLayout(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    // 初期値（SSR対応）
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        isDesktop: true,
        isTablet: false,
        isMobile: false,
        screenWidth: 1920,
        screenHeight: 1080
      };
    }

    return calculateResponsiveConfig(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    /**
     * ウィンドウリサイズハンドラ
     */
    const handleResize = () => {
      const newConfig = calculateResponsiveConfig(window.innerWidth, window.innerHeight);
      setConfig(newConfig);
    };

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', handleResize);

    // 初期値を設定（クライアントサイドでの正確な値）
    handleResize();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return config;
}

/**
 * 画面サイズからレスポンシブ設定を計算
 * @param width - 画面幅
 * @param height - 画面高さ
 * @returns ResponsiveConfig
 */
function calculateResponsiveConfig(width: number, height: number): ResponsiveConfig {
  let deviceType: DeviceType;
  
  if (width < BREAKPOINTS.mobile) {
    deviceType = 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  return {
    deviceType,
    isDesktop: deviceType === 'desktop',
    isTablet: deviceType === 'tablet',
    isMobile: deviceType === 'mobile',
    screenWidth: width,
    screenHeight: height
  };
}

/**
 * デバイス別のスタイルクラスを取得
 * @param deviceType - デバイスタイプ
 * @returns CSSクラス名
 */
export function getDeviceStyleClass(deviceType: DeviceType): string {
  const baseClass = 'responsive-layout';
  return `${baseClass} ${baseClass}--${deviceType}`;
}

/**
 * デバイス別の画像表示サイズを取得
 * @param deviceType - デバイスタイプ
 * @param screenWidth - 画面幅
 * @returns 最大表示サイズ
 */
export function getImageDisplaySize(deviceType: DeviceType, screenWidth: number): { maxWidth: number; maxHeight: number } {
  switch (deviceType) {
    case 'mobile':
      return {
        maxWidth: Math.min(screenWidth - 32, 400), // 左右16pxのマージンを考慮
        maxHeight: 300
      };
    case 'tablet':
      return {
        maxWidth: Math.min(screenWidth / 2 - 48, 500), // 2カラム時の幅を考慮
        maxHeight: 400
      };
    case 'desktop':
    default:
      return {
        maxWidth: Math.min(screenWidth / 2 - 48, 600), // 2カラム時の幅を考慮
        maxHeight: 500
      };
  }
}

/**
 * デバイス別のファイル選択UIタイプを取得
 * @param deviceType - デバイスタイプ
 * @returns ファイル選択UIタイプ
 */
export function getFileInputType(deviceType: DeviceType): 'path-input' | 'photo-button' {
  return deviceType === 'mobile' ? 'photo-button' : 'path-input';
}