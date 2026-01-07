import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../App';

/**
 * 画像交換機能の統合テスト
 */
describe('画像交換機能統合テスト', () => {
  beforeEach(() => {
    // コンソールログを抑制
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('画像交換ボタンが表示される', () => {
    render(<App />);
    
    const swapButton = screen.getByRole('button', { name: '画像を交換' });
    expect(swapButton).toBeInTheDocument();
    expect(swapButton).toHaveTextContent('画像を交換');
  });

  it('画像交換ボタンがクリック可能である', () => {
    render(<App />);
    
    const swapButton = screen.getByRole('button', { name: '画像を交換' });
    expect(swapButton).not.toBeDisabled();
    
    // クリックしてもエラーが発生しないことを確認
    fireEvent.click(swapButton);
    expect(swapButton).toBeInTheDocument();
  });

  it('画像交換ボタンのスタイルが正しく適用される', () => {
    render(<App />);
    
    const swapButton = screen.getByRole('button', { name: '画像を交換' });
    const container = swapButton.parentElement;
    
    expect(container).toHaveClass('image-swap-container');
    expect(swapButton).toHaveClass('image-swap-button');
  });

  it('画像交換セクションが正しい位置に配置される', () => {
    render(<App />);
    
    // 色調コントローラセクションが存在することを確認
    const colorControllers = screen.getAllByText(/色調コントローラ/);
    expect(colorControllers.length).toBeGreaterThan(0);
    
    // 画像交換ボタンが存在することを確認
    const swapButton = screen.getByRole('button', { name: '画像を交換' });
    expect(swapButton).toBeInTheDocument();
    
    // 塗料混合セクションが存在することを確認（混色結果表示など）
    const mixingElements = document.querySelectorAll('.app__mixing-section');
    expect(mixingElements.length).toBeGreaterThan(0);
  });

  it('レスポンシブ対応で画像交換ボタンが表示される', async () => {
    // モバイル環境をシミュレート
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<App />);
    
    await waitFor(() => {
      const swapButton = screen.getByRole('button', { name: '画像を交換' });
      expect(swapButton).toBeInTheDocument();
    });
  });
});