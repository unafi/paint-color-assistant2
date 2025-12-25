import React, { useState, useCallback } from 'react';
import type { ColorModel } from '../../types/color';
import { ColorController } from '../ColorController/ColorController';
import { createColorModel } from '../../utils/colorUtils';
import './ColorPreviewController.css';

/**
 * 色プレビューコントローラのプロパティ
 */
interface ColorPreviewControllerProps {
  /** 基準色（画像Aの結果色） */
  baseColor: ColorModel;
}

/**
 * 色プレビューコントローラ
 * 混合結果の確認用色調整コンポーネント
 */
export const ColorPreviewController: React.FC<ColorPreviewControllerProps> = ({
  baseColor
}) => {
  // 出発色は基準色に連動、結果色は独立して調整可能
  const [resultColor, setResultColor] = useState<ColorModel>(baseColor);

  /**
   * 基準色変更時の結果色同期
   */
  React.useEffect(() => {
    setResultColor(baseColor);
  }, [baseColor]);

  /**
   * 結果色変更ハンドラ
   */
  const handleColorChange = useCallback((color: ColorModel) => {
    setResultColor(color);
  }, []);

  return (
    <div className="color-preview-controller">
      <h3 className="color-preview-controller__title">🔬 混合結果確認</h3>
      
      <div className="color-preview-controller__description">
        <p>上記の塗料混合を適用した場合の色を確認できます</p>
      </div>
      
      <div className="color-preview-controller__content">
        <ColorController
          originalColor={baseColor}
          resultColor={resultColor}
          onChange={handleColorChange}
          label="混合結果確認用コントローラ"
        />
      </div>
      
      <div className="color-preview-controller__note">
        ℹ️ このコントローラの操作は上部の色比較には影響しません
      </div>
    </div>
  );
};