import React from 'react';
import './ImageSwapButton.css';

interface ImageSwapButtonProps {
  /** ボタンクリック時のハンドラ */
  onClick: () => void;
  /** ボタンの無効化状態 */
  disabled?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 画像交換ボタンコンポーネント
 * 色調コントローラAとBの画像を交換するためのボタン
 */
export const ImageSwapButton: React.FC<ImageSwapButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`image-swap-container ${className}`}>
      <button
        type="button"
        className="image-swap-button"
        onClick={onClick}
        disabled={disabled}
        aria-label="画像を交換"
      >
        画像を交換
      </button>
    </div>
  );
};