import React, { useCallback } from 'react';
import type { ColorModel, ColorControllerProps } from '../../types/color';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useLongPress } from '../../hooks/useLongPress';
import { ColorSpaceConverter, colorToCss, createSingleColorSample, createCmykSingleColorSample } from '../../utils/colorUtils';
import './ColorController.css';

/**
 * 色調整コンポーネント
 * RGB/CMYK値のリアルタイム調整機能を提供
 * 出発色は外部から制御され、結果色のみを調整する
 */
export const ColorController: React.FC<ColorControllerProps> = ({
  originalColor,
  resultColor,
  onChange,
  label,
  disabled = false
}) => {
  const { isMobile } = useResponsiveLayout();

  /**
   * RGB値変更ハンドラ（結果色のみ変更、CMYKに反映）
   */
  const handleRgbChange = useCallback((component: 'r' | 'g' | 'b', value: number) => {
    if (disabled) return;
    
    // RGB値を制限
    const clampedValue = Math.max(0, Math.min(255, Math.round(value)));
    
    // 新しいRGB値を作成
    const newRgb = {
      r: component === 'r' ? clampedValue : resultColor.r,
      g: component === 'g' ? clampedValue : resultColor.g,
      b: component === 'b' ? clampedValue : resultColor.b
    };
    
    // RGB→CMYK変換
    const newCmyk = ColorSpaceConverter.rgbToCmyk(newRgb.r, newRgb.g, newRgb.b);
    
    // 新しい結果色を作成
    const newResultColor: ColorModel = {
      ...newRgb,
      ...newCmyk
    };
    
    onChange(newResultColor);
  }, [resultColor, onChange, disabled]);

  /**
   * CMYK値変更ハンドラ（結果色のみ変更、RGBに反映）
   */
  const handleCmykChange = useCallback((component: 'c' | 'm' | 'y' | 'k', value: number) => {
    if (disabled) return;
    
    // CMYK値を制限（0-100%、整数に四捨五入）
    const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
    
    // 新しいCMYK値を作成（按分せず、そのまま設定）
    const newCmyk = {
      c: component === 'c' ? clampedValue : resultColor.c,
      m: component === 'm' ? clampedValue : resultColor.m,
      y: component === 'y' ? clampedValue : resultColor.y,
      k: component === 'k' ? clampedValue : resultColor.k
    };
    
    // CMYK→RGB変換
    const newRgb = ColorSpaceConverter.cmykToRgb(
      newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k
    );
    
    // 新しい結果色を作成
    const newResultColor: ColorModel = {
      ...newRgb,
      ...newCmyk
    };
    
    onChange(newResultColor);
  }, [resultColor, onChange, disabled]);

  /**
   * RGB個別コンポーネント用の長押しハンドラを生成
   */
  const createRgbLongPressHandlers = useCallback((component: 'r' | 'g' | 'b') => {
    return useLongPress({
      currentValue: resultColor[component],
      onValueChange: (newValue: number) => {
        const newRgb = {
          r: component === 'r' ? newValue : resultColor.r,
          g: component === 'g' ? newValue : resultColor.g,
          b: component === 'b' ? newValue : resultColor.b
        };
        
        const newCmyk = ColorSpaceConverter.rgbToCmyk(newRgb.r, newRgb.g, newRgb.b);
        
        const newResultColor: ColorModel = {
          ...newRgb,
          ...newCmyk
        };
        
        onChange(newResultColor);
      },
      adjustValue: (currentValue: number, delta: number) => {
        return Math.max(0, Math.min(255, currentValue + delta));
      },
      disabled
    });
  }, [resultColor, onChange, disabled]);

  /**
   * CMYK個別コンポーネント用の長押しハンドラを生成
   */
  const createCmykLongPressHandlers = useCallback((component: 'c' | 'm' | 'y' | 'k') => {
    return useLongPress({
      currentValue: resultColor[component],
      onValueChange: (newValue: number) => {
        const newCmyk = {
          c: component === 'c' ? newValue : resultColor.c,
          m: component === 'm' ? newValue : resultColor.m,
          y: component === 'y' ? newValue : resultColor.y,
          k: component === 'k' ? newValue : resultColor.k
        };
        
        const newRgb = ColorSpaceConverter.cmykToRgb(
          newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k
        );
        
        const newResultColor: ColorModel = {
          ...newRgb,
          ...newCmyk
        };
        
        onChange(newResultColor);
      },
      adjustValue: (currentValue: number, delta: number) => {
        return Math.max(0, Math.min(100, currentValue + delta));
      },
      disabled
    });
  }, [resultColor, onChange, disabled]);

  return (
    <div className={`color-controller ${disabled ? 'disabled' : ''}`}>
      <h3 className="color-controller__title">{label}</h3>
      
      {/* 出発色表示 - 左側 */}
      <div className="color-controller__target-color">
        <h4 className="color-controller__target-label">出発色</h4>
        <div 
          className="color-controller__target-swatch"
          style={{ backgroundColor: colorToCss(originalColor) }}
          title={`RGB(${originalColor.r}, ${originalColor.g}, ${originalColor.b})`}
        />
      </div>

      {/* 操作エリア - 中央 */}
      <div className="color-controller__controls">
        {/* RGB調整 - 縦並び、上下余白0 */}
        <div className="color-controller__section">
          <h4 className="color-controller__section-title">RGB調整</h4>
          <div className="color-controls">
            {(['r', 'g', 'b'] as const).map((component) => {
              const longPressHandlers = createRgbLongPressHandlers(component);
              
              return (
                <div key={component} className="color-control">
                  {/* 左側：フル値の色見本 */}
                  <div 
                    className="color-control__full-sample"
                    style={{ backgroundColor: createSingleColorSample(component, 255) }}
                    title={`${component.toUpperCase()}:255の色`}
                  />
                  
                  {/* ラベル */}
                  <span className="color-control__label">
                    {component.toUpperCase()}
                  </span>
                  
                  {/* 減少ボタン - スマホ時のみ表示 */}
                  {isMobile && (
                    <button
                      className="color-control__button"
                      onTouchStart={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressStart(-1);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      disabled={disabled || resultColor[component] <= 0}
                      title="1減らす（長押しで連続）"
                    >
                      ◀
                    </button>
                  )}
                  
                  {/* 数値入力 */}
                  <input
                    type="number"
                    className="color-control__input"
                    value={resultColor[component]}
                    onChange={(e) => handleRgbChange(component, parseInt(e.target.value) || 0)}
                    min={0}
                    max={255}
                    step={1}
                    disabled={disabled}
                  />
                  
                  {/* 増加ボタン - スマホ時のみ表示 */}
                  {isMobile && (
                    <button
                      className="color-control__button"
                      onTouchStart={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressStart(1);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      disabled={disabled || resultColor[component] >= 255}
                      title="1増やす（長押しで連続）"
                    >
                      ▶
                    </button>
                  )}
                  
                  {/* 右側：現在値の色見本 */}
                  <div 
                    className="color-control__current-sample"
                    style={{ backgroundColor: createSingleColorSample(component, resultColor[component]) }}
                    title={`${component.toUpperCase()}:${resultColor[component]}の色`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* CMYK調整 - 縦並び、上下余白0 */}
        <div className="color-controller__section">
          <h4 className="color-controller__section-title">CMYK調整</h4>
          <div className="color-controls">
            {(['c', 'm', 'y', 'k'] as const).map((component) => {
              const longPressHandlers = createCmykLongPressHandlers(component);
              
              return (
                <div key={component} className="color-control">
                  {/* 左側：フル値の色見本 */}
                  <div 
                    className="color-control__full-sample"
                    style={{ backgroundColor: createCmykSingleColorSample(component, 100, 0) }}
                    title={`${component.toUpperCase()}:100%の色`}
                  />
                  
                  {/* ラベル */}
                  <span className="color-control__label">
                    {component.toUpperCase()}
                  </span>
                  
                  {/* 減少ボタン - スマホ時のみ表示 */}
                  {isMobile && (
                    <button
                      className="color-control__button"
                      onTouchStart={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressStart(-1);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      disabled={disabled || resultColor[component] <= 0}
                      title="1%減らす（長押しで連続）"
                    >
                      ◀
                    </button>
                  )}
                  
                  {/* 数値入力 */}
                  <input
                    type="number"
                    className="color-control__input"
                    value={Math.round(resultColor[component])}
                    onChange={(e) => handleCmykChange(component, parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="1"
                    disabled={disabled}
                  />
                  
                  {/* 増加ボタン - スマホ時のみ表示 */}
                  {isMobile && (
                    <button
                      className="color-control__button"
                      onTouchStart={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressStart(1);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        longPressHandlers.handleLongPressEnd();
                      }}
                      disabled={disabled || resultColor[component] >= 100}
                      title="1%増やす（長押しで連続）"
                    >
                      ▶
                    </button>
                  )}
                  
                  {/* 右側：現在値の色見本 */}
                  <div 
                    className="color-control__current-sample"
                    style={{ backgroundColor: createCmykSingleColorSample(component, resultColor[component], resultColor.k) }}
                    title={`${component.toUpperCase()}:${Math.round(resultColor[component])}%の色`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 結果色表示 - 右側 */}
      <div className="color-controller__result-color">
        <h4 className="color-controller__result-label">結果色</h4>
        <div 
          className="color-controller__result-swatch"
          style={{ backgroundColor: colorToCss(resultColor) }}
          title={`RGB(${resultColor.r}, ${resultColor.g}, ${resultColor.b}) / CMYK(${Math.round(resultColor.c)}, ${Math.round(resultColor.m)}, ${Math.round(resultColor.y)}, ${Math.round(resultColor.k)})`}
        />
      </div>
    </div>
  );
};