import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';
import type { DeviceType } from '../../types/image';

// モック関数
const mockOnImageSelect = vi.fn();
const mockOnColorSelect = vi.fn();

// useImageProcessingフックのモック
vi.mock('../../hooks/useImageProcessing', () => ({
  useImageProcessing: () => ({
    imageData: null,
    selectedCoordinate: null,
    isLoading: false,
    error: null,
    handleFileSelect: vi.fn(),
    handleCoordinateClick: vi.fn(),
    canvasRef: { current: null },
    clearImage: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// useResponsiveLayoutフックのモック
vi.mock('../../hooks/useResponsiveLayout', () => ({
  getFileInputType: (deviceType: DeviceType) => 
    deviceType === 'desktop' ? 'path-input' : 'photo-button',
}));

// pathUtilsのモック
vi.mock('../../utils/pathUtils', () => ({
  cleanFilePath: (path: string) => path.trim(),
  validateFilePath: (path: string) => ({ isValid: true }),
  isSupportedImageExtension: (path: string) => path.endsWith('.jpg') || path.endsWith('.png'),
}));

describe('ImageUpload', () => {
  const defaultProps = {
    onImageSelect: mockOnImageSelect,
    onColorSelect: mockOnColorSelect,
    deviceType: 'desktop' as DeviceType,
    label: 'テスト画像',
  };

  it('PC版でPATH入力フィールドと参照ボタンが表示される', () => {
    render(<ImageUpload {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/画像ファイルのパスを入力/)).toBeInTheDocument();
    expect(screen.getByText('参照')).toBeInTheDocument();
  });

  it('スマホ版で写真選択ボタンが表示される', () => {
    render(<ImageUpload {...defaultProps} deviceType="mobile" />);
    
    expect(screen.getByText(/写真を選択/)).toBeInTheDocument();
  });

  it('PATH入力時にバックエンドAPIが呼ばれる', async () => {
    // fetchのモック
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 501,
      json: () => Promise.resolve({ message: 'PATH読み込みは実装中です' }),
    });

    render(<ImageUpload {...defaultProps} />);
    
    const pathInput = screen.getByPlaceholderText(/画像ファイルのパスを入力/);
    fireEvent.change(pathInput, { target: { value: 'C:\\test\\image.jpg' } });

    // fetchが呼ばれることを確認（非同期なので少し待つ）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/load-image-path',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'C:\\test\\image.jpg' }),
      })
    );
  });

  it('参照ボタンクリックでファイル入力がトリガーされる', () => {
    render(<ImageUpload {...defaultProps} />);
    
    const browseButton = screen.getByText('参照');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // ファイル入力のclickメソッドをモック
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    
    fireEvent.click(browseButton);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  it('ラベルが正しく表示される', () => {
    render(<ImageUpload {...defaultProps} label="カスタムラベル" />);
    
    expect(screen.getByText('カスタムラベル')).toBeInTheDocument();
  });
});