import React, { useCallback, useRef, useState } from 'react';
import type { ImageUploadProps } from '../../types/image';
import { useImageProcessing } from '../../hooks/useImageProcessing';
import { getFileInputType } from '../../hooks/useResponsiveLayout';
import { cleanFilePath, validateFilePath, isSupportedImageExtension } from '../../utils/pathUtils';
import { isElectronEnvironment, showElectronFileDialog, loadElectronImageFromPath } from '../../utils/electronUtils';
import { isMobileEnvironment, createMobileFileInput, convertHEICToJPEG } from '../../utils/mobileUtils';
import './ImageUpload.css';

/**
 * 画像アップロードコンポーネント
 * デバイス別のファイル選択UIと画像プレビュー機能を提供
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onColorSelect,
  deviceType,
  label
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pathInput, setPathInput] = useState<string>('');
  const {
    imageData,
    selectedCoordinate,
    isLoading,
    error,
    handleFileSelect,
    handleCoordinateClick,
    canvasRef,
    clearImage,
    clearError
  } = useImageProcessing({
    onImageSelect,
    onColorSelect
  });

  const fileInputType = getFileInputType(deviceType);

  /**
   * PATH入力変更ハンドラ
   */
  const handlePathInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawPath = event.target.value;
    console.log('✏️ PATH入力変更:', rawPath);
    setPathInput(rawPath);
  }, []);

  /**
   * PATH入力のフォーカスアウトハンドラ（Electron対応版）
   */
  const handlePathInputBlur = useCallback(async () => {
    console.log('🔍 PATH入力フォーカスアウト:', pathInput);
    
    if (!pathInput.trim()) {
      console.log('⚠️ PATH入力が空です');
      return;
    }

    const cleanPath = cleanFilePath(pathInput);
    const validation = validateFilePath(cleanPath);
    
    console.log('📋 PATH検証結果:', { cleanPath, validation });
    
    if (!validation.isValid) {
      console.error('❌ 無効なファイルパス:', validation.error);
      return;
    }

    if (!isSupportedImageExtension(cleanPath)) {
      console.error('❌ サポートされていない画像形式です');
      return;
    }

    // Electron環境の場合、直接ファイルを読み込み
    if (isElectronEnvironment()) {
      try {
        console.log('🔄 Electron環境でPATH読み込み開始...');
        const file = await loadElectronImageFromPath(cleanPath);
        
        if (file) {
          await handleFileSelect(file);
          console.log('✅ ElectronPATH読み込み完了:', file.name);
          return;
        }
      } catch (error) {
        console.error('❌ ElectronPATH読み込みエラー:', error);
      }
    }

    // Web環境の場合、ファイル選択ダイアログを開く
    console.info('✅ 有効な画像パスが入力されました');
    console.info('🔒 Web環境のため、ファイル選択ダイアログを開きます...');
    fileInputRef.current?.click();
  }, [pathInput, handleFileSelect]);

  /**
   * ファイル選択ハンドラ（モバイル対応版）
   */
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 ファイル選択:', file?.name);
    
    if (!file) {
      console.log('⚠️ ファイルが選択されていません');
      return;
    }

    try {
      console.log('🔄 画像読み込み開始...');
      
      // モバイル環境でHEIC/HEIF形式の場合、変換を試行
      let processedFile = file;
      if (isMobileEnvironment() && (file.type === 'image/heic' || file.type === 'image/heif')) {
        console.log('📱 モバイル環境でHEIC/HEIF変換を実行...');
        processedFile = await convertHEICToJPEG(file);
      }
      
      await handleFileSelect(processedFile);
      setPathInput(processedFile.name);
      
      console.log('✅ ファイル選択完了:', processedFile.name);
    } catch (err) {
      console.error('❌ ファイル選択エラー:', err);
    }
  }, [handleFileSelect]);

  /**
   * 参照ボタンクリックハンドラ（Electron対応版）
   */
  const handleBrowseClick = useCallback(async () => {
    console.log('🔘 参照ボタンクリック');
    
    // Electron環境の場合、ネイティブダイアログを使用
    if (isElectronEnvironment()) {
      try {
        console.log('📂 Electronファイル選択ダイアログを開きます...');
        const file = await showElectronFileDialog();
        
        if (file) {
          await handleFileSelect(file);
          setPathInput(file.name);
          console.log('✅ Electronファイル選択完了:', file.name);
        }
        return;
      } catch (error) {
        console.error('❌ Electronファイル選択エラー:', error);
      }
    }
    
    // Web環境の場合、通常のファイル選択
    console.log('📂 Webファイル選択ダイアログを開きます...');
    fileInputRef.current?.click();
  }, [handleFileSelect]);

  /**
   * Canvasクリックハンドラ
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageData) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const coordinate = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // 色選択処理（コールバックはuseImageProcessing内で処理）
    handleCoordinateClick(coordinate);
  }, [imageData, handleCoordinateClick]);

  /**
   * ドラッグオーバーハンドラ
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * ドロップハンドラ
   */
  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    console.log('📁 ドロップされたファイル:', files.map(f => f.name));
    
    if (files.length > 0) {
      const file = files[0];
      console.log('🔄 ドロップファイル処理開始:', file.name);
      
      try {
        await handleFileSelect(file);
        setPathInput(file.name);
        console.log('✅ ドロップファイル処理完了:', file.name);
      } catch (err) {
        console.error('❌ ドロップファイル処理エラー:', err);
      }
    }
  }, [handleFileSelect]);

  /**
   * 画像クリア処理
   */
  const handleClearImage = useCallback(() => {
    clearImage();
    setPathInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearImage]);

  return (
    <div 
      className={`image-upload image-upload--${deviceType}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className="image-upload__title">{label}</h3>

      {/* ファイル選択UI */}
      <div className="image-upload__file-section">
        {fileInputType === 'path-input' ? (
          // PC版: PATHテキスト欄 + 参照ボタン
          <div className="image-upload__path-input">
            <input
              type="text"
              className="image-upload__path-field"
              value={pathInput}
              onChange={handlePathInputChange}
              onBlur={handlePathInputBlur}
              placeholder="画像ファイルのパスを入力（エクスプローラーからコピー可能）"
            />
            <button
              className="image-upload__browse-button"
              onClick={handleBrowseClick}
              disabled={isLoading}
            >
              参照
            </button>
          </div>
        ) : (
          // スマホ版: 写真選択ボタン
          <button
            className="image-upload__photo-button"
            onClick={handleBrowseClick}
            disabled={isLoading}
          >
            📷 {imageData ? '別の写真を選択' : '写真を選択'}
          </button>
        )}

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          className="image-upload__file-input"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/bmp,image/tiff,image/webp,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="image-upload__error">
          <span className="image-upload__error-text">{error}</span>
          <button
            className="image-upload__error-close"
            onClick={clearError}
            title="エラーを閉じる"
          >
            ×
          </button>
        </div>
      )}

      {/* 読み込み中表示 */}
      {isLoading && (
        <div className="image-upload__loading">
          <div className="image-upload__spinner"></div>
          <span>画像を読み込み中...</span>
        </div>
      )}

      {/* 画像プレビュー */}
      {imageData && !isLoading && (
        <div className="image-upload__preview">
          <div className="image-upload__preview-header">
            <span className="image-upload__preview-title">
              画像プレビュー ({imageData.width} × {imageData.height})
            </span>
            <button
              className="image-upload__clear-button"
              onClick={handleClearImage}
              title="画像をクリア"
            >
              ×
            </button>
          </div>

          <div className="image-upload__canvas-container">
            <canvas
              ref={canvasRef}
              className="image-upload__canvas"
              onClick={handleCanvasClick}
              title="クリックして色を選択"
            />
            
            {/* 選択ポイント表示 */}
            {selectedCoordinate && (
              <div
                className="image-upload__selection-point"
                style={{
                  left: selectedCoordinate.x,
                  top: selectedCoordinate.y
                }}
              />
            )}
          </div>

          <div className="image-upload__instructions">
            {deviceType === 'mobile' ? 
              'タップして色を選択してください' : 
              'クリックして色を選択してください'
            }
          </div>
        </div>
      )}
    </div>
  );
};