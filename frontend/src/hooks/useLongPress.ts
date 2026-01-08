import { useRef, useCallback, useEffect } from 'react';

/**
 * 長押し操作のカスタムフック
 * 状態更新の非同期性を考慮した値追跡機能付き
 */
export interface UseLongPressOptions<T> {
  /** 現在の値 */
  currentValue: T;
  /** 値変更時のコールバック */
  onValueChange: (newValue: T) => void;
  /** 値の増減処理 */
  adjustValue: (currentValue: T, delta: number) => T;
  /** 無効状態 */
  disabled?: boolean;
  /** 長押し判定時間（ms）デフォルト: 500 */
  longPressDelay?: number;
  /** 連続実行間隔（ms）デフォルト: 50 */
  intervalDelay?: number;
}

export interface UseLongPressReturn {
  /** 長押し開始ハンドラ */
  handleLongPressStart: (delta: number) => void;
  /** 長押し終了ハンドラ */
  handleLongPressEnd: () => void;
}

/**
 * 長押し機能のカスタムフック
 * React状態更新の非同期性を考慮して、refで最新値を追跡
 */
export function useLongPress<T>({
  currentValue,
  onValueChange,
  adjustValue,
  disabled = false,
  longPressDelay = 500,
  intervalDelay = 50
}: UseLongPressOptions<T>): UseLongPressReturn {
  // 長押し用のref（NodeJS.Timeout型を使用）
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 現在の値を追跡するref（状態更新の非同期問題を解決）
  const currentValueRef = useRef<T>(currentValue);

  // currentValueが変更されたらrefも更新
  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  /**
   * 長押しタイマーをクリア
   */
  const clearLongPressTimers = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
  }, []);

  /**
   * 値調整処理（refを使用して最新の値を取得）
   */
  const handleValueAdjust = useCallback((delta: number) => {
    if (disabled) return;

    // refから最新の値を取得（状態更新の非同期問題を解決）
    const latestValue = currentValueRef.current;
    const newValue = adjustValue(latestValue, delta);
    
    // 値が変わらない場合は処理しない
    if (newValue === latestValue) return;
    
    // refも即座に更新（次の処理で最新値を使用するため）
    currentValueRef.current = newValue;
    
    onValueChange(newValue);
  }, [disabled, adjustValue, onValueChange]);

  /**
   * 長押し開始ハンドラ
   */
  const handleLongPressStart = useCallback((delta: number) => {
    if (disabled) return;

    // 長押しタイマーをクリア（重複防止）
    clearLongPressTimers();

    // 即座に1回実行（単一タップ対応）
    handleValueAdjust(delta);

    // 長押し判定のためのタイマー（指定時間後に連続実行開始）
    longPressTimerRef.current = setTimeout(() => {
      longPressIntervalRef.current = setInterval(() => {
        handleValueAdjust(delta);
      }, intervalDelay);
    }, longPressDelay);
  }, [handleValueAdjust, disabled, clearLongPressTimers, longPressDelay, intervalDelay]);

  /**
   * 長押し終了ハンドラ
   */
  const handleLongPressEnd = useCallback(() => {
    clearLongPressTimers();
  }, [clearLongPressTimers]);

  // コンポーネントアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      clearLongPressTimers();
    };
  }, [clearLongPressTimers]);

  return {
    handleLongPressStart,
    handleLongPressEnd
  };
}