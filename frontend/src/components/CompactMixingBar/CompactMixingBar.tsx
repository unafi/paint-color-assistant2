import React from 'react';
import type { CompactMixingBarProps } from '../../types/ui';
import './CompactMixingBar.css';

/**
 * 色名に対応する色コードを取得
 */
const getColorForLabel = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'シアン':
    case 'cyan':
    case 'c':
      return '#00FFFF';
    case 'マゼンタ':
    case 'magenta':
    case 'm':
      return '#FF00FF';
    case 'イエロー':
    case 'yellow':
    case 'y':
      return '#FFFF00';
    case '黒':
    case 'black':
    case 'k':
      return '#000000';
    case '白':
    case 'white':
    case 'w':
      return 'transparent'; // 白は透明にして、CSSで白抜きの黒線を表現
    default:
      return '#808080'; // デフォルトはグレー
  }
};

/**
 * コンパクト塗料調整バーコンポーネント
 * 「シアン ■■■■(グラフ) +44%」形式で1行表示
 * 1目盛り = 5%、最大20個の■で100%まで表示
 */
export const CompactMixingBar: React.FC<CompactMixingBarProps> = ({
  label,
  value,
  maxValue = 100
}) => {
  // 値の妥当性チェック
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const safeMaxValue = typeof maxValue === 'number' && maxValue > 0 ? maxValue : 100;
  const safeLabel = typeof label === 'string' && label.length > 0 ? label : '不明';
  
  // バーグラフの長さを計算（5%刻み、最大20個で100%）
  const barLength = Math.min(Math.abs(safeValue), safeMaxValue);
  const blockCount = Math.max(0, Math.min(20, Math.floor(barLength / 5)));
  
  // 色に応じたブロックを生成
  const color = getColorForLabel(safeLabel);
  const isWhite = color === 'transparent';
  
  // 符号付き数値表示
  const sign = safeValue >= 0 ? '+' : '';
  const displayValue = `${sign}${safeValue.toFixed(1)}%`;
  
  // 値に応じたスタイルクラス
  const valueClass = safeValue >= 0 ? 'positive' : 'negative';
  
  return (
    <div className="compact-mixing-bar">
      <span className="bar-label">{safeLabel}</span>
      <span className="bar-graph">
        {Array.from({ length: blockCount }, (_, index) => (
          <span
            key={index}
            className={`bar-block ${isWhite ? 'bar-block--white' : ''}`}
            style={{ 
              color: isWhite ? '#000000' : color,
              backgroundColor: isWhite ? 'transparent' : 'transparent'
            }}
          >
            {isWhite ? '□' : '■'}
          </span>
        ))}
        {blockCount === 0 && <span className="bar-graph-empty">　</span>}
      </span>
      <span className={`bar-value ${valueClass}`}>{displayValue}</span>
    </div>
  );
};