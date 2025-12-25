import React, { useMemo } from 'react';
import type { ColorModel } from '../../types/color';
import { PaintMixingCalculator, type MixingResult } from '../../utils/paintMixing';
import './ColorMixingDisplay.css';

/**
 * 塗料混合表示コンポーネントのプロパティ
 */
interface ColorMixingDisplayProps {
  /** 出発色（画像Aの結果色） */
  colorA: ColorModel;
  /** 目標色（画像Bの結果色） */
  colorB: ColorModel;
}

/**
 * 塗料混合表示コンポーネント
 * 色A→色Bに必要な塗料混合比率を視覚的に表示
 */
export const ColorMixingDisplay: React.FC<ColorMixingDisplayProps> = ({
  colorA,
  colorB
}) => {
  // 混合比率計算
  const mixingResult: MixingResult = useMemo(() => {
    return PaintMixingCalculator.calculateMixingRatio(colorA, colorB);
  }, [colorA, colorB]);

  /**
   * バーグラフの幅を計算（最大100%表示）
   */
  const getBarWidth = (value: number): number => {
    const absValue = Math.abs(value);
    return Math.min(absValue, 100);
  };

  return (
    <div className="color-mixing-display">
      <h3 className="color-mixing-display__title">🎨 必要な塗料調整</h3>
      
      <div className="color-mixing-display__content">
        <p className="color-mixing-display__description">
          画像Aの結果色から画像Bの結果色に変更するために必要な塗料
        </p>
        
        {mixingResult.instructions.length === 0 ? (
          <div className="color-mixing-display__no-change">
            <p>✅ 調整不要（色がほぼ同じです）</p>
          </div>
        ) : (
          <div className="color-mixing-display__bars">
            {mixingResult.instructions.map((instruction, index) => (
              <div key={index} className="mixing-bar">
                <div className="mixing-bar__header">
                  <span className="mixing-bar__label">{instruction.pigmentName}</span>
                  <span className="mixing-bar__value">
                    +{instruction.amount.toFixed(1)}%
                  </span>
                </div>
                <div className="mixing-bar__container">
                  <div 
                    className="mixing-bar__fill"
                    style={{
                      width: `${getBarWidth(instruction.amount)}%`,
                      backgroundColor: instruction.displayColor,
                      opacity: instruction.displayColor === '#FFFFFF' ? 1 : 0.8,
                      border: instruction.displayColor === '#FFFFFF' ? '1px solid #CCCCCC' : 'none'
                    }}
                  />
                </div>
                <div className="mixing-bar__description">
                  {instruction.description}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="color-mixing-display__explanation">
          💡 解説：上記の塗料を混合することで、画像Aの色から画像Bの色に近づけることができます
          <br />
          <small>※ マイナス値は補色を使って中和します（例：黄色を減らす→紫を追加）</small>
        </div>
      </div>
    </div>
  );
};