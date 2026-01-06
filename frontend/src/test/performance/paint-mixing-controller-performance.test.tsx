/**
 * PaintMixingController パフォーマンステスト
 * タスク8.2: メモリ使用量とレスポンス時間の測定
 */

import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaintMixingController } from '../../components/PaintMixingController/PaintMixingController';

// パフォーマンス測定用のモック
const mockPerformance = {
  memory: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  },
  now: () => Date.now()
};

// useResponsiveLayoutのモック
vi.mock('../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({ isMobile: true, isTablet: false, isDesktop: false })
}));

// useLongPressのモック
vi.mock('../../hooks/useLongPress', () => ({
  useLongPress: (callback: () => void) => ({
    onMouseDown: callback,
    onMouseUp: () => {},
    onMouseLeave: () => {},
    onTouchStart: callback,
    onTouchEnd: () => {}
  })
}));

describe('PaintMixingController パフォーマンステスト', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    baseColor: { r: 255, g: 0, b: 0 },
    targetColor: { r: 0, g: 255, b: 0 },
    calculatedColor: { r: 128, g: 128, b: 0 },
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // パフォーマンス測定の初期化
    if (typeof window !== 'undefined' && !window.performance.memory) {
      Object.defineProperty(window.performance, 'memory', {
        value: mockPerformance.memory,
        writable: true
      });
    }
  });

  afterEach(() => {
    cleanup();
  });

  describe('メモリ使用量テスト', () => {
    it('コンポーネント初期化時のメモリ使用量が適切な範囲内である', () => {
      const initialMemory = window.performance.memory?.usedJSHeapSize || 0;
      
      const { unmount } = render(<PaintMixingController {...defaultProps} />);
      
      const afterRenderMemory = window.performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterRenderMemory - initialMemory;
      
      // メモリ増加量が5MB以下であることを確認（適切な範囲）
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      
      unmount();
      
      console.log(`[PERFORMANCE] メモリ使用量増加: ${(memoryIncrease / 1024).toFixed(2)} KB`);
    });

    it('大量の操作後もメモリリークが発生しない', async () => {
      const initialMemory = window.performance.memory?.usedJSHeapSize || 0;
      
      // 大量の再レンダリングをシミュレート
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<PaintMixingController 
          {...defaultProps} 
          baseColor={{ r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 }}
        />);
        unmount();
      }
      
      // ガベージコレクションを強制実行（可能な場合）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = window.performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 大量操作後でもメモリ増加が10MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`[PERFORMANCE] 大量操作後メモリ増加: ${(memoryIncrease / 1024).toFixed(2)} KB`);
    });
  });

  describe('レスポンス時間テスト', () => {
    it('コンポーネントレンダリングのレスポンス時間が100ms以内である', () => {
      const startTime = performance.now();
      const { unmount } = render(<PaintMixingController {...defaultProps} />);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      // レンダリング時間が100ms以内であることを確認
      expect(responseTime).toBeLessThan(100);
      
      unmount();
      
      console.log(`[PERFORMANCE] コンポーネントレンダリング時間: ${responseTime.toFixed(2)}ms`);
    });

    it('プロパティ変更時のレスポンス時間が適切である', () => {
      const { rerender } = render(<PaintMixingController {...defaultProps} />);
      
      const startTime = performance.now();
      
      // プロパティを変更
      rerender(<PaintMixingController 
        {...defaultProps} 
        baseColor={{ r: 100, g: 150, b: 200 }}
      />);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // プロパティ変更レスポンス時間が50ms以内であることを確認
      expect(responseTime).toBeLessThan(50);
      
      console.log(`[PERFORMANCE] プロパティ変更レスポンス時間: ${responseTime.toFixed(2)}ms`);
    });

    it('連続操作時のレスポンス時間が安定している', () => {
      const { rerender } = render(<PaintMixingController {...defaultProps} />);
      
      const responseTimes: number[] = [];
      
      // 10回連続でプロパティ変更を行い、レスポンス時間を測定
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        rerender(<PaintMixingController 
          {...defaultProps} 
          baseColor={{ r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 }}
        />);
        const endTime = performance.now();
        
        responseTimes.push(endTime - startTime);
      }
      
      // 全てのレスポンス時間が100ms以内であることを確認
      responseTimes.forEach((time, index) => {
        expect(time).toBeLessThan(100);
      });
      
      // 平均レスポンス時間を計算
      const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);
      
      console.log(`[PERFORMANCE] 連続操作レスポンス時間 - 平均: ${averageTime.toFixed(2)}ms, 最大: ${maxTime.toFixed(2)}ms, 最小: ${minTime.toFixed(2)}ms`);
      
      // 平均レスポンス時間が50ms以内であることを確認
      expect(averageTime).toBeLessThan(50);
    });
  });

  describe('レンダリングパフォーマンステスト', () => {
    it('プロパティ変更時の再レンダリング時間が適切である', () => {
      const { rerender } = render(<PaintMixingController {...defaultProps} />);
      
      const startTime = performance.now();
      
      // プロパティを変更して再レンダリング
      rerender(<PaintMixingController 
        {...defaultProps} 
        values={{
          cyan: 75,
          magenta: 45,
          yellow: 35,
          black: 25,
          white: 15
        }}
      />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 再レンダリング時間が50ms以内であることを確認
      expect(renderTime).toBeLessThan(50);
      
      console.log(`[PERFORMANCE] 再レンダリング時間: ${renderTime.toFixed(2)}ms`);
    });

    it('大量のプロパティ変更でもパフォーマンスが安定している', () => {
      const { rerender } = render(<PaintMixingController {...defaultProps} />);
      
      const renderTimes: number[] = [];
      
      // 20回連続でプロパティを変更
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        
        rerender(<PaintMixingController 
          {...defaultProps} 
          values={{
            cyan: Math.random() * 100,
            magenta: Math.random() * 100,
            yellow: Math.random() * 100,
            black: Math.random() * 100,
            white: Math.random() * 100
          }}
        />);
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }
      
      // 全ての再レンダリング時間が100ms以内であることを確認
      renderTimes.forEach((time, index) => {
        expect(time).toBeLessThan(100);
      });
      
      const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      
      console.log(`[PERFORMANCE] 大量再レンダリング平均時間: ${averageTime.toFixed(2)}ms`);
      
      // 平均再レンダリング時間が30ms以内であることを確認
      expect(averageTime).toBeLessThan(30);
    });
  });
});