import React, { useMemo } from 'react';
import type { ColorModel } from '../../types/color';
import { PaintMixingCalculator, type MixingResult } from '../../utils/paintMixing';
import { CompactMixingBar } from '../CompactMixingBar/CompactMixingBar';
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

  return (
    <div className="color-mixing-display">
      <h3 className="color-mixing-display__title">🎨 必要な塗料調整</h3>
      
      <div className="color-mixing-display__content">
        {mixingResult.instructions.length === 0 ? (
          <div className="color-mixing-display__no-change">
            <p>✅ 調整不要（色がほぼ同じです）</p>
          </div>
        ) : (
          <div className="color-mixing-display__compact-bars">
            {mixingResult.instructions.map((instruction, index) => (
              <CompactMixingBar
                key={index}
                label={instruction.pigmentName}
                value={instruction.amount}
                maxValue={100}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};