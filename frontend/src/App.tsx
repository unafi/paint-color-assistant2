import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ColorModel } from './types/color';
import type { AppImageData } from './types/image';
import { ColorController } from './components/ColorController/ColorController';
import { ColorMixingDisplay } from './components/ColorMixingDisplay/ColorMixingDisplay';
import { PaintMixingController } from './components/PaintMixingController/PaintMixingController';
import { ImageUpload } from './components/ImageUpload/ImageUpload';
import { ImageSwapButton } from './components/ImageSwapButton/ImageSwapButton';
import { useResponsiveLayout, getDeviceStyleClass } from './hooks/useResponsiveLayout';
import { createColorModel } from './utils/colorUtils';
import { PaintMixingCalculator } from './utils/paintMixing';
import { debugLog } from './utils/logger';
import './App.css';

// 開発者モード判定
const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

/**
 * メインアプリケーションコンポーネント
 * 塗装色混合アシスタントのメイン画面
 */
function App() {
  // レスポンシブレイアウト管理
  const { deviceType, isDesktop } = useResponsiveLayout();
  
  // 状態管理 - 出発色と結果色を分離
  const [originalColorA, setOriginalColorA] = useState<ColorModel>(createColorModel({ r: 128, g: 128, b: 128 }));
  const [resultColorA, setResultColorA] = useState<ColorModel>(createColorModel({ r: 128, g: 128, b: 128 }));
  const [originalColorB, setOriginalColorB] = useState<ColorModel>(createColorModel({ r: 200, g: 150, b: 100 }));
  const [resultColorB, setResultColorB] = useState<ColorModel>(createColorModel({ r: 200, g: 150, b: 100 }));
  
  // 画像状態管理
  const [imageDataA, setImageDataA] = useState<AppImageData | null>(null);
  const [imageDataB, setImageDataB] = useState<AppImageData | null>(null);
  const [imagePathA, setImagePathA] = useState<string>('');
  const [imagePathB, setImagePathB] = useState<string>('');
  const [imageUpdateKeyA, setImageUpdateKeyA] = useState<number>(0);
  const [imageUpdateKeyB, setImageUpdateKeyB] = useState<number>(0);
  
  // 混色コントローラの結果色
  const [mixingResultColor, setMixingResultColor] = useState<ColorModel>(resultColorA);
  
  // 算出色（塗料調整の逆算結果）
  const calculatedColor = useMemo(() => {
    return PaintMixingCalculator.calculateReverseMixingColor(resultColorA, resultColorB);
  }, [resultColorA, resultColorB]);

  // アプリケーション初期化
  useEffect(() => {
    debugLog('🚀 App初期化完了');
  }, []);

  /**
   * 画像A選択ハンドラ
   */
  const handleImageASelect = useCallback((image: AppImageData) => {
    debugLog('Image A selected:', image);
    setImageDataA(image);
    setImagePathA(image.file.name);
  }, []);

  /**
   * 画像B選択ハンドラ
   */
  const handleImageBSelect = useCallback((image: AppImageData) => {
    debugLog('Image B selected:', image);
    setImageDataB(image);
    setImagePathB(image.file.name);
  }, []);

  /**
   * 色A選択ハンドラ（プレビュークリック時）
   */
  const handleColorASelect = useCallback((color: ColorModel) => {
    debugLog('🎨 色A選択 (プレビュークリック):', color);
    // プレビュークリック時は出発色と結果色の両方を同じ色に設定
    setOriginalColorA(color);
    setResultColorA(color);
  }, []);

  /**
   * 色B選択ハンドラ（プレビュークリック時）
   */
  const handleColorBSelect = useCallback((color: ColorModel) => {
    debugLog('🎨 色B選択 (プレビュークリック):', color);
    // プレビュークリック時は出発色と結果色の両方を同じ色に設定
    setOriginalColorB(color);
    setResultColorB(color);
  }, []);

  /**
   * 色A調整ハンドラ（RGB/CMYK調整時）
   */
  const handleColorAChange = useCallback((color: ColorModel) => {
    debugLog('🎨 色A調整 (RGB/CMYK変更):', color);
    // RGB/CMYK調整時は結果色のみ更新
    setResultColorA(color);
  }, []);

  /**
   * 色B調整ハンドラ（RGB/CMYK調整時）
   */
  const handleColorBChange = useCallback((color: ColorModel) => {
    debugLog('🎨 色B調整 (RGB/CMYK変更):', color);
    // RGB/CMYK調整時は結果色のみ更新
    setResultColorB(color);
  }, []);

  /**
   * 混色結果変更ハンドラ
   */
  const handleMixingResultChange = useCallback((color: ColorModel) => {
    debugLog('🎨 混色結果変更:', color);
    setMixingResultColor(color);
  }, []);

  /**
   * 画像交換ハンドラ
   * 色調コントローラAとBの色、画像データ、パスを交換する
   */
  const handleImageSwap = useCallback(() => {
    debugLog('🔄 画像交換実行');
    
    // 出発色と結果色を交換
    const tempOriginalA = originalColorA;
    const tempResultA = resultColorA;
    
    setOriginalColorA(originalColorB);
    setResultColorA(resultColorB);
    setOriginalColorB(tempOriginalA);
    setResultColorB(tempResultA);
    
    // 画像データとパスを交換
    const tempImageDataA = imageDataA;
    const tempImagePathA = imagePathA;
    
    setImageDataA(imageDataB);
    setImagePathA(imagePathB);
    setImageDataB(tempImageDataA);
    setImagePathB(tempImagePathA);
    
    // 更新キーを変更して再描画をトリガー
    setImageUpdateKeyA(prev => prev + 1);
    setImageUpdateKeyB(prev => prev + 1);
    
    debugLog('✅ 画像交換完了 - 色、画像データ、パスを交換しました');
  }, [originalColorA, resultColorA, originalColorB, resultColorB, imageDataA, imageDataB, imagePathA, imagePathB]);

  return (
    <div className={`app ${getDeviceStyleClass(deviceType)}`}>
      <header className="app__header">
        <h1 className="app__title">塗装色混合アシスタント v2.0</h1>
        {isDebugMode && (
          <>
            <p className="app__subtitle">
              Node.js + React + TypeScript版 - クライアント側完結の色調整
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
                🧪 BtoBテスト実行中 - デバイス: {deviceType} | デスクトップ: {isDesktop ? 'Yes' : 'No'}
              </p>
            </div>
          </>
        )}
      </header>

      <main className="app__main">
        {/* 基本表示テスト - デバッグモード時のみ表示 */}
        {isDebugMode && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#166534' }}>✅ 基本表示テスト</h2>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
              <li>React コンポーネント: 正常</li>
              <li>CSS スタイル: 適用済み</li>
              <li>TypeScript: コンパイル成功</li>
              <li>レスポンシブフック: 動作中</li>
            </ul>
          </div>
        )}

        {isDesktop ? (
          // PC版: 左右2カラムレイアウト
          <div className="app__desktop-layout">
            <div className="app__column app__column--left">
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
                {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🖼️ 画像アップロード A テスト</h3>}
                <ImageUpload
                  onImageSelect={handleImageASelect}
                  onColorSelect={handleColorASelect}
                  deviceType={deviceType}
                  label="画像A（現在の色）"
                  externalImageData={imageDataA}
                  externalPath={imagePathA}
                  externalUpdateKey={imageUpdateKeyA}
                />
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: '#ddd6fe', border: '1px solid #a78bfa', borderRadius: '0.5rem' }}>
                {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#5b21b6' }}>🎨 色調コントローラ A テスト</h3>}
                <ColorController
                  originalColor={originalColorA}
                  resultColor={resultColorA}
                  onChange={handleColorAChange}
                  label="色調コントローラA"
                />
              </div>
            </div>

            <div className="app__column app__column--right">
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
                {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🖼️ 画像アップロード B テスト</h3>}
                <ImageUpload
                  onImageSelect={handleImageBSelect}
                  onColorSelect={handleColorBSelect}
                  deviceType={deviceType}
                  label="画像B（目標の色）"
                  externalImageData={imageDataB}
                  externalPath={imagePathB}
                  externalUpdateKey={imageUpdateKeyB}
                />
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: '#ddd6fe', border: '1px solid #a78bfa', borderRadius: '0.5rem' }}>
                {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#5b21b6' }}>🎨 色調コントローラ B テスト</h3>}
                <ColorController
                  originalColor={originalColorB}
                  resultColor={resultColorB}
                  onChange={handleColorBChange}
                  label="色調コントローラB"
                />
              </div>
            </div>
          </div>
        ) : (
          // スマホ版: 縦積みレイアウト
          <div className="app__mobile-layout">
            <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
              {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🖼️ 画像アップロード A テスト</h3>}
              <ImageUpload
                onImageSelect={handleImageASelect}
                onColorSelect={handleColorASelect}
                deviceType={deviceType}
                label="画像A（現在の色）"
                externalImageData={imageDataA}
                externalPath={imagePathA}
                externalUpdateKey={imageUpdateKeyA}
              />
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: '#ddd6fe', border: '1px solid #a78bfa', borderRadius: '0.5rem' }}>
              {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#5b21b6' }}>🎨 色調コントローラ A テスト</h3>}
              <ColorController
                originalColor={originalColorA}
                resultColor={resultColorA}
                onChange={handleColorAChange}
                label="色調コントローラA"
              />
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
              {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🖼️ 画像アップロード B テスト</h3>}
              <ImageUpload
                onImageSelect={handleImageBSelect}
                onColorSelect={handleColorBSelect}
                deviceType={deviceType}
                label="画像B（目標の色）"
                externalImageData={imageDataB}
                externalPath={imagePathB}
                externalUpdateKey={imageUpdateKeyB}
              />
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: '#ddd6fe', border: '1px solid #a78bfa', borderRadius: '0.5rem' }}>
              {isDebugMode && <h3 style={{ margin: '0 0 0.5rem 0', color: '#5b21b6' }}>🎨 色調コントローラ B テスト</h3>}
              <ColorController
                originalColor={originalColorB}
                resultColor={resultColorB}
                onChange={handleColorBChange}
                label="色調コントローラB"
              />
            </div>
          </div>
        )}

        {/* 画像交換ボタンセクション */}
        <div className="app__image-swap-section">
          <ImageSwapButton onClick={handleImageSwap} />
        </div>

        {/* 塗料混合表示と混色コントローラを横並び配置 */}
        <div className="app__mixing-section">
          <div className="app__mixing-display">
            <ColorMixingDisplay
              colorA={resultColorA}
              colorB={resultColorB}
            />
          </div>
          
          <div className="app__mixing-controller">
            <PaintMixingController
              baseColor={resultColorA}
              targetColor={resultColorB}
              calculatedColor={calculatedColor}
              onChange={handleMixingResultChange}
            />
          </div>
        </div>
      </main>

      <footer className="app__footer">
        <p>&copy; 2025 塗装色混合アシスタント - Powered by Kiro AI{isDebugMode ? ' | BtoBテスト実行中' : ''}</p>
      </footer>
    </div>
  );
}

export default App;
