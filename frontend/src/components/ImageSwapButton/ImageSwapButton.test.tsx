import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ImageSwapButton } from './ImageSwapButton';

describe('ImageSwapButton', () => {
  it('正常にレンダリングされる', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: '画像を交換' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('画像を交換');
  });

  it('クリック時にonClickハンドラが呼ばれる', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: '画像を交換' });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('画像交換機能が正常に動作する', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: '画像を交換' });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('disabled状態で正しく動作する', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} disabled={true} />);
    
    const button = screen.getByRole('button', { name: '画像を交換' });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('カスタムクラス名が適用される', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} className="custom-class" />);
    
    const container = screen.getByRole('button', { name: '画像を交換' }).parentElement;
    expect(container).toHaveClass('image-swap-container');
    expect(container).toHaveClass('custom-class');
  });

  it('適切なARIA属性が設定されている', () => {
    const mockOnClick = vi.fn();
    render(<ImageSwapButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: '画像を交換' });
    expect(button).toHaveAttribute('aria-label', '画像を交換');
    expect(button).toHaveAttribute('type', 'button');
  });
});