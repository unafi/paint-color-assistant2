import { useCallback } from 'react';
import type { ColorModel, RgbColor, CmykColor, ColorUpdateSource } from '../types/color';
import { ColorSpaceConverter, createColorModel, clampRgbValue, clampCmykValue } from '../utils/colorUtils';

/**
 * 色変換フックの戻り値
 */
export interface UseColorConversionReturn {
  /** RGB→CMYK変換 */
  convertRgbToCmyk: (r: number, g: number, b: number) => CmykColor;
  /** CMYK→RGB変換 */
  convertCmykToRgb: (c: number, m: number, y: number, k: number) => RgbColor;
  /** RGB値からColorModelを作成 */
  createColorFromRgb: (r: number, g: number, b: number) => ColorModel;
  /** CMYK値からColorModelを作成 */
  createColorFromCmyk: (c: number, m: number, y: number, k: number) => ColorModel;
  /** RGB値を更新（CMYK値も自動更新） */
  updateRgbValue: (color: ColorModel, component: 'r' | 'g' | 'b', value: number) => ColorModel;
  /** CMYK値を更新（RGB値も自動更新） */
  updateCmykValue: (color: ColorModel, component: 'c' | 'm' | 'y' | 'k', value: number) => ColorModel;
  /** 安全な色更新（ループ防止） */
  safeColorUpdate: (source: ColorUpdateSource, updateFn: () => void) => void;
  /** RGB値の制限 */
  clampRgb: (value: number) => number;
  /** CMYK値の制限 */
  clampCmyk: (value: number) => number;
}

/**
 * 色変換管理フック
 * RGB⇔CMYK変換とループ防止機能を提供
 */
export function useColorConversion(): UseColorConversionReturn {
  /**
   * RGB→CMYK変換
   */
  const convertRgbToCmyk = useCallback((r: number, g: number, b: number): CmykColor => {
    return ColorSpaceConverter.rgbToCmyk(r, g, b);
  }, []);

  /**
   * CMYK→RGB変換
   */
  const convertCmykToRgb = useCallback((c: number, m: number, y: number, k: number): RgbColor => {
    return ColorSpaceConverter.cmykToRgb(c, m, y, k);
  }, []);

  /**
   * RGB値からColorModelを作成
   */
  const createColorFromRgb = useCallback((r: number, g: number, b: number): ColorModel => {
    const clampedR = clampRgbValue(r);
    const clampedG = clampRgbValue(g);
    const clampedB = clampRgbValue(b);
    
    return createColorModel({ r: clampedR, g: clampedG, b: clampedB });
  }, []);

  /**
   * CMYK値からColorModelを作成
   */
  const createColorFromCmyk = useCallback((c: number, m: number, y: number, k: number): ColorModel => {
    const clampedC = clampCmykValue(c);
    const clampedM = clampCmykValue(m);
    const clampedY = clampCmykValue(y);
    const clampedK = clampCmykValue(k);
    
    const rgb = ColorSpaceConverter.cmykToRgb(clampedC, clampedM, clampedY, clampedK);
    
    return {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      c: clampedC,
      m: clampedM,
      y: clampedY,
      k: clampedK
    };
  }, []);

  /**
   * RGB値を更新（CMYK値も自動更新）
   */
  const updateRgbValue = useCallback((
    color: ColorModel, 
    component: 'r' | 'g' | 'b', 
    value: number
  ): ColorModel => {
    const clampedValue = clampRgbValue(value);
    const newRgb = { ...color, [component]: clampedValue };
    
    // CMYK値を再計算
    const cmyk = ColorSpaceConverter.rgbToCmyk(newRgb.r, newRgb.g, newRgb.b);
    
    return {
      ...newRgb,
      c: cmyk.c,
      m: cmyk.m,
      y: cmyk.y,
      k: cmyk.k
    };
  }, []);

  /**
   * CMYK値を更新（RGB値も自動更新）
   */
  const updateCmykValue = useCallback((
    color: ColorModel, 
    component: 'c' | 'm' | 'y' | 'k', 
    value: number
  ): ColorModel => {
    const clampedValue = clampCmykValue(value);
    
    // 通常のCMYK更新（比率調整なし）
    const newCmyk = { ...color, [component]: clampedValue };
    
    // RGB値を再計算
    const rgb = ColorSpaceConverter.cmykToRgb(
      newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k
    );
    
    return {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      c: newCmyk.c,
      m: newCmyk.m,
      y: newCmyk.y,
      k: newCmyk.k
    };
  }, []);

  /**
   * 安全な色更新（ループ防止）
   */
  const safeColorUpdate = useCallback((source: ColorUpdateSource, updateFn: () => void): void => {
    ColorSpaceConverter.safeColorUpdate(source, updateFn);
  }, []);

  /**
   * RGB値の制限
   */
  const clampRgb = useCallback((value: number): number => {
    return clampRgbValue(value);
  }, []);

  /**
   * CMYK値の制限
   */
  const clampCmyk = useCallback((value: number): number => {
    return clampCmykValue(value);
  }, []);

  return {
    convertRgbToCmyk,
    convertCmykToRgb,
    createColorFromRgb,
    createColorFromCmyk,
    updateRgbValue,
    updateCmykValue,
    safeColorUpdate,
    clampRgb,
    clampCmyk
  };
}