import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { ColorModel } from '../../types/color';
import { colorToCss } from '../../utils/colorUtils';
import { PaintMixingCalculator } from '../../utils/paintMixing';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useLongPress } from '../../hooks/useLongPress';
import './PaintMixingController.css';

/**
 * 混色調整の増分値
 */
interface MixingAdjustments {
  /** シアン増分 (0-100%) */
  cyan: number;
  /** マゼンタ増分 (0-100%) */
  magenta: number;
  /** イエロー増分 (0-100%) */
  yellow: number;
  /** 黒増分 (0-100%) */
  black: number;
  /** 白増分 (0-100%) */
  white: number;
}

/**
 * 混色コントローラのプロパティ
 */
interface PaintMixingControllerProps {
  /** 出発色（画像Aの結果色） */
  baseColor: ColorModel;
  /** 目的色（画像Bの結果色） */
  targetColor: ColorModel;
  /** 算出色（塗料調整の逆算結果） */
  calculatedColor: ColorModel;
  /** 結果色変更時のコールバック */
  onChange: (resultColor: ColorModel) => void;
}

/**
 * 統一された塗料混合計算クラス
 * 算出色と同じロジックを使用してCMYK加算方式で計算
 */
class UnifiedPaintMixer {
  /**
   * CMYK→RGB変換（標準的な変換式）
   */
  static cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
    // CMYK値を0-1の範囲に正規化
    const cNorm = c / 100;
    const mNorm = m / 100;
    const yNorm = y / 100;
    const kNorm = k / 100;
    
    // CMYK→RGB変換
    const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
    const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
    const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));
    
    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b))
    };
  }

  /**
   * RGB→CMYK変換（標準的な変換式）
   */
  static rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - rNorm - k) / (1 - k);
    const m = (1 - gNorm - k) / (1 - k);
    const y = (1 - bNorm - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  /**
   * 塗料混合計算（必要な塗料調整の値で算出色と一致させる）
   * 補色理論に基づく実際の塗料混合を再現
   */
  static calculateMixing(baseColor: ColorModel, adjustments: MixingAdjustments): ColorModel {
    // 1. ベース色のCMYK値を取得
    const baseCmyk = {
      c: Math.round(baseColor.c),
      m: Math.round(baseColor.m),
      y: Math.round(baseColor.y),
      k: Math.round(baseColor.k)
    };

    // 2. 白と黒の相互作用計算
    const whiteAmount = adjustments.white;
    const blackAmount = adjustments.black;
    
    // グレー効果（白と黒の最小値）
    const grayEffect = Math.min(whiteAmount, blackAmount);
    const netWhite = whiteAmount - grayEffect;
    const netBlack = blackAmount - grayEffect;

    // 3. 塗料調整値を適用（補色理論に基づく）
    // 注意: これは「必要な塗料調整」の表示値を使用して算出色と一致させる
    let adjustedCmyk = {
      c: Math.max(0, Math.min(100, baseCmyk.c + adjustments.cyan)),
      m: Math.max(0, Math.min(100, baseCmyk.m + adjustments.magenta)),
      y: Math.max(0, Math.min(100, baseCmyk.y + adjustments.yellow)),
      k: Math.max(0, Math.min(100, baseCmyk.k + netBlack))
    };

    // 4. 白の効果（K値を減少させる）
    if (netWhite > 0) {
      adjustedCmyk.k = Math.max(0, adjustedCmyk.k - netWhite);
    }

    // 5. グレー効果による彩度低下（CMY値を減少）
    if (grayEffect > 0) {
      const saturationReduction = grayEffect * 0.3; // 30%の彩度低下
      adjustedCmyk.c = Math.max(0, adjustedCmyk.c - saturationReduction);
      adjustedCmyk.m = Math.max(0, adjustedCmyk.m - saturationReduction);
      adjustedCmyk.y = Math.max(0, adjustedCmyk.y - saturationReduction);
    }

    // 6. CMYK→RGB変換
    const newRgb = this.cmykToRgb(adjustedCmyk.c, adjustedCmyk.m, adjustedCmyk.y, adjustedCmyk.k);

    return {
      ...newRgb,
      ...adjustedCmyk
    };
  }
}

/**
 * 混色コントローラコンポーネント
 * 「必要な塗料調整」の値を使用して実際の塗料混合を再現
 * 補色理論に基づく加算のみの塗料調整で算出色と完全一致を実現
 */
export const PaintMixingController: React.FC<PaintMixingControllerProps> = ({
  baseColor,
  targetColor,
  calculatedColor,
  onChange
}) => {
  const { isMobile } = useResponsiveLayout();

  // 混色調整値（増分）
  const [adjustments, setAdjustments] = useState<MixingAdjustments>({
    cyan: 0,
    magenta: 0,
    yellow: 0,
    black: 0,
    white: 0
  });

  // 出発色が変更された時は「必要な塗料調整」の値を初期値として設定
  useEffect(() => {
    // PaintMixingCalculatorから必要な塗料調整を取得
    const mixingResult = PaintMixingCalculator.calculateMixingRatio(baseColor, targetColor);
    
    // 調整値を初期化（必要な塗料調整の表示値を使用）
    const initialAdjustments: MixingAdjustments = {
      cyan: 0,
      magenta: 0,
      yellow: 0,
      black: 0,
      white: 0
    };
    
    // 必要な塗料調整の指示から調整値を設定
    mixingResult.instructions.forEach(instruction => {
      switch (instruction.pigmentName) {
        case 'シアン':
          initialAdjustments.cyan = instruction.amount;
          break;
        case 'マゼンタ':
          initialAdjustments.magenta = instruction.amount;
          break;
        case 'イエロー':
          initialAdjustments.yellow = instruction.amount;
          break;
        case '黒':
          initialAdjustments.black = instruction.amount;
          break;
        case '白':
          initialAdjustments.white = instruction.amount;
          break;
      }
    });
    
    setAdjustments(initialAdjustments);
  }, [baseColor, targetColor]);

  // 結果色の計算（統一されたロジックを使用）
  const resultColor = useMemo(() => {
    return UnifiedPaintMixer.calculateMixing(baseColor, adjustments);
  }, [baseColor, adjustments]);

  // 結果色変更時のコールバック実行
  useEffect(() => {
    onChange(resultColor);
  }, [resultColor, onChange]);

  /**
   * 調整値変更ハンドラ（0-100%の範囲）
   */
  const handleAdjustmentChange = useCallback((
    type: keyof MixingAdjustments,
    value: number
  ) => {
    // 入力値の検証
    if (isNaN(value) || !isFinite(value)) {
      // 無効な値の場合は0にリセット
      value = 0;
    }
    
    // 実際の塗料は加算のみ可能（0-100%）
    const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
    
    setAdjustments(prev => ({
      ...prev,
      [type]: clampedValue
    }));
  }, []);

  /**
   * 各塗料成分用の長押しハンドラを事前に生成
   */
  const cyanHandlers = useLongPress({
    currentValue: adjustments.cyan,
    onValueChange: (newValue: number) => {
      handleAdjustmentChange('cyan', newValue);
    },
    adjustValue: (currentValue: number, delta: number) => {
      return Math.max(0, Math.min(100, currentValue + delta));
    },
    disabled: false
  });

  const magentaHandlers = useLongPress({
    currentValue: adjustments.magenta,
    onValueChange: (newValue: number) => {
      handleAdjustmentChange('magenta', newValue);
    },
    adjustValue: (currentValue: number, delta: number) => {
      return Math.max(0, Math.min(100, currentValue + delta));
    },
    disabled: false
  });

  const yellowHandlers = useLongPress({
    currentValue: adjustments.yellow,
    onValueChange: (newValue: number) => {
      handleAdjustmentChange('yellow', newValue);
    },
    adjustValue: (currentValue: number, delta: number) => {
      return Math.max(0, Math.min(100, currentValue + delta));
    },
    disabled: false
  });

  const blackHandlers = useLongPress({
    currentValue: adjustments.black,
    onValueChange: (newValue: number) => {
      handleAdjustmentChange('black', newValue);
    },
    adjustValue: (currentValue: number, delta: number) => {
      return Math.max(0, Math.min(100, currentValue + delta));
    },
    disabled: false
  });

  const whiteHandlers = useLongPress({
    currentValue: adjustments.white,
    onValueChange: (newValue: number) => {
      handleAdjustmentChange('white', newValue);
    },
    adjustValue: (currentValue: number, delta: number) => {
      return Math.max(0, Math.min(100, currentValue + delta));
    },
    disabled: false
  });

  /**
   * 白黒相互作用の計算
   */
  const grayEffect = useMemo(() => {
    return Math.min(adjustments.white, adjustments.black);
  }, [adjustments.white, adjustments.black]);

  return (
    <div className="paint-mixing-controller">
      <h3 className="paint-mixing-controller__title">🎨 混色コントローラ</h3>
      
      {/* 左列：出発色（上）+ 算出色（下） */}
      <div className="paint-mixing-controller__left-column">
        <div className="color-display color-display--top">
          <h4>出発色</h4>
          <div 
            className="color-swatch color-swatch--large"
            style={{ backgroundColor: colorToCss(baseColor) }}
            title={`RGB(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`}
          />
        </div>
        
        <div className="color-display color-display--bottom">
          <h4>算出色</h4>
          <div 
            className="color-swatch color-swatch--large"
            style={{ backgroundColor: colorToCss(calculatedColor) }}
            title={`RGB(${calculatedColor.r}, ${calculatedColor.g}, ${calculatedColor.b})`}
          />
        </div>
      </div>

      {/* 中央列：CMYK調整（固定幅、調整前後の値を含む） */}
      <div className="paint-mixing-controller__center-column">
        <h4 className="center-column-title">CMYK調整</h4>
        
        <div className="color-controls">
          {/* シアン */}
          <div className="color-control">
            <div 
              className="color-control__full-sample"
              style={{ backgroundColor: '#00FFFF' }}
              title="シアン:100%の色"
            />
            <span className="color-control__label">C</span>
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressStart(-1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.cyan <= 0}
                title="1%減らす（長押しで連続）"
              >
                ◀
              </button>
            )}
            <input
              type="number"
              min="0"
              max="100"
              value={adjustments.cyan}
              onChange={(e) => handleAdjustmentChange('cyan', parseInt(e.target.value) || 0)}
              className="color-control__input"
            />
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressStart(1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  cyanHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.cyan >= 100}
                title="1%増やす（長押しで連続）"
              >
                ▶
              </button>
            )}
            <div 
              className="color-control__current-sample"
              style={{ backgroundColor: '#00FFFF' }}
              title={`シアン:${adjustments.cyan}%の色`}
            />
          </div>

          {/* マゼンタ */}
          <div className="color-control">
            <div 
              className="color-control__full-sample"
              style={{ backgroundColor: '#FF00FF' }}
              title="マゼンタ:100%の色"
            />
            <span className="color-control__label">M</span>
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressStart(-1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.magenta <= 0}
                title="1%減らす（長押しで連続）"
              >
                ◀
              </button>
            )}
            <input
              type="number"
              min="0"
              max="100"
              value={adjustments.magenta}
              onChange={(e) => handleAdjustmentChange('magenta', parseInt(e.target.value) || 0)}
              className="color-control__input"
            />
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressStart(1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  magentaHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.magenta >= 100}
                title="1%増やす（長押しで連続）"
              >
                ▶
              </button>
            )}
            <div 
              className="color-control__current-sample"
              style={{ backgroundColor: '#FF00FF' }}
              title={`マゼンタ:${adjustments.magenta}%の色`}
            />
          </div>

          {/* イエロー */}
          <div className="color-control">
            <div 
              className="color-control__full-sample"
              style={{ backgroundColor: '#FFFF00' }}
              title="イエロー:100%の色"
            />
            <span className="color-control__label">Y</span>
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressStart(-1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.yellow <= 0}
                title="1%減らす（長押しで連続）"
              >
                ◀
              </button>
            )}
            <input
              type="number"
              min="0"
              max="100"
              value={adjustments.yellow}
              onChange={(e) => handleAdjustmentChange('yellow', parseInt(e.target.value) || 0)}
              className="color-control__input"
            />
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressStart(1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  yellowHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.yellow >= 100}
                title="1%増やす（長押しで連続）"
              >
                ▶
              </button>
            )}
            <div 
              className="color-control__current-sample"
              style={{ backgroundColor: '#FFFF00' }}
              title={`イエロー:${adjustments.yellow}%の色`}
            />
          </div>

          {/* 黒 */}
          <div className="color-control">
            <div 
              className="color-control__full-sample"
              style={{ backgroundColor: '#000000' }}
              title="黒:100%の色"
            />
            <span className="color-control__label">K</span>
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressStart(-1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.black <= 0}
                title="1%減らす（長押しで連続）"
              >
                ◀
              </button>
            )}
            <input
              type="number"
              min="0"
              max="100"
              value={adjustments.black}
              onChange={(e) => handleAdjustmentChange('black', parseInt(e.target.value) || 0)}
              className="color-control__input"
            />
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressStart(1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  blackHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.black >= 100}
                title="1%増やす（長押しで連続）"
              >
                ▶
              </button>
            )}
            <div 
              className="color-control__current-sample"
              style={{ backgroundColor: '#000000' }}
              title={`黒:${adjustments.black}%の色`}
            />
          </div>

          {/* 白 */}
          <div className="color-control">
            <div 
              className="color-control__full-sample"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #ccc' }}
              title="白:100%の色"
            />
            <span className="color-control__label">W</span>
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressStart(-1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.white <= 0}
                title="1%減らす（長押しで連続）"
              >
                ◀
              </button>
            )}
            <input
              type="number"
              min="0"
              max="100"
              value={adjustments.white}
              onChange={(e) => handleAdjustmentChange('white', parseInt(e.target.value) || 0)}
              className="color-control__input"
            />
            {isMobile && (
              <button
                className="color-control__button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressStart(1);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  whiteHandlers.handleLongPressEnd();
                }}
                disabled={adjustments.white >= 100}
                title="1%増やす（長押しで連続）"
              >
                ▶
              </button>
            )}
            <div 
              className="color-control__current-sample"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #ccc' }}
              title={`白:${adjustments.white}%の色`}
            />
          </div>
        </div>
      </div>

      {/* 右列：目的色（上）+ 結果色（下） */}
      <div className="paint-mixing-controller__right-column">
        <div className="color-display color-display--top">
          <h4>目的色</h4>
          <div 
            className="color-swatch color-swatch--large"
            style={{ backgroundColor: colorToCss(targetColor) }}
            title={`RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`}
          />
        </div>
        
        <div className="color-display color-display--bottom">
          <h4>結果色</h4>
          <div 
            className="color-swatch color-swatch--large"
            style={{ backgroundColor: colorToCss(resultColor) }}
            title={`RGB(${resultColor.r}, ${resultColor.g}, ${resultColor.b})`}
          />
        </div>
      </div>

      {/* 白黒相互作用の表示 */}
      {grayEffect > 0 && (
        <div className="gray-effect-warning">
          ⚠️ 白{adjustments.white}% + 黒{adjustments.black}% = グレー効果{grayEffect}%で彩度が低下します
        </div>
      )}
    </div>
  );
};