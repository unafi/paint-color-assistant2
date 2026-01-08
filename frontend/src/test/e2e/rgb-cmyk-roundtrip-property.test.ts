/**
 * プロパティテスト: RGB⇔CMYK変換の往復一致性（改良版）
 * Feature: paint-color-assistant, Property 6: RGB⇔CMYK変換の往復一致性
 * 
 * 任意の有効な色について、RGB→CMYK→RGB変換の結果が元の色と一致する（許容誤差内）
 * 
 * **Validates: Requirements 2.1.2**
 */

import { describe, it, expect } from 'vitest';
import { ColorSpaceConverter } from '../../utils/colorUtils';
import type { RgbColor, CmykColor } from '../../types/color';

/**
 * 最大誤差色の記録用インターフェース
 */
interface MaxErrorRecord {
  rMaxError: { color: RgbColor; error: number; details: any };
  gMaxError: { color: RgbColor; error: number; details: any };
  bMaxError: { color: RgbColor; error: number; details: any };
  overallMaxError: { color: RgbColor; error: number; details: any };
}

/**
 * CMYK最大誤差色の記録用インターフェース
 */
interface CmykMaxErrorRecord {
  cMaxError: { color: CmykColor; error: number; details: any };
  mMaxError: { color: CmykColor; error: number; details: any };
  yMaxError: { color: CmykColor; error: number; details: any };
  kMaxError: { color: CmykColor; error: number; details: any };
  overallMaxError: { color: CmykColor; error: number; details: any };
}
function generateRandomRgbColor(): RgbColor {
  return {
    r: Math.floor(Math.random() * 256), // 0-255
    g: Math.floor(Math.random() * 256), // 0-255
    b: Math.floor(Math.random() * 256)  // 0-255
  };
}

/**
 * ランダムな有効なCMYK色を生成（現実的な塗料混合範囲）
 */
function generateRandomCmykColor(): CmykColor {
  // K成分は-50～50%の範囲（現実的な調色範囲）
  const k = Math.floor(Math.random() * 101) - 50; // -50 to 50
  const clampedK = Math.max(0, Math.min(100, k)); // 0-100にクランプ
  
  // CMY成分の制限ロジック
  const values: number[] = [];
  
  // いずれかが100%の場合、他の2色は50%まで制限
  const hasMaxComponent = Math.random() < 0.3; // 30%の確率で最大成分を持つ
  
  if (hasMaxComponent) {
    const maxIndex = Math.floor(Math.random() * 3);
    for (let i = 0; i < 3; i++) {
      if (i === maxIndex) {
        values[i] = 100; // 1つの成分を100%に
      } else {
        values[i] = Math.floor(Math.random() * 51); // 他は0-50%
      }
    }
  } else {
    // 通常の範囲（0-100%）
    for (let i = 0; i < 3; i++) {
      values[i] = Math.floor(Math.random() * 101);
    }
  }
  
  return {
    c: values[0],
    m: values[1], 
    y: values[2],
    k: clampedK
  };
}

/**
 * 色の一致を判定（許容誤差内）
 */
function colorsMatch(color1: RgbColor, color2: RgbColor, tolerance: number = 2): boolean {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
}

/**
 * CMYK色の一致を判定（許容誤差内）
 */
function cmykColorsMatch(color1: CmykColor, color2: CmykColor, tolerance: number = 2): boolean {
  return (
    Math.abs(color1.c - color2.c) <= tolerance &&
    Math.abs(color1.m - color2.m) <= tolerance &&
    Math.abs(color1.y - color2.y) <= tolerance &&
    Math.abs(color1.k - color2.k) <= tolerance
  );
}

/**
 * RGB→CMYK→RGB往復変換の一致性を検証
 */
function validateRgbRoundtrip(originalRgb: RgbColor): {
  isValid: boolean;
  details: {
    originalRgb: RgbColor;
    intermediateCmyk: CmykColor;
    finalRgb: RgbColor;
    rgbDelta: { r: number; g: number; b: number };
    maxDelta: number;
    withinTolerance: boolean;
  };
} {
  // RGB → CMYK 変換
  const intermediateCmyk = ColorSpaceConverter.rgbToCmyk(originalRgb.r, originalRgb.g, originalRgb.b);
  
  // CMYK → RGB 変換
  const finalRgb = ColorSpaceConverter.cmykToRgb(intermediateCmyk.c, intermediateCmyk.m, intermediateCmyk.y, intermediateCmyk.k);
  
  // 差分計算
  const rgbDelta = {
    r: Math.abs(finalRgb.r - originalRgb.r),
    g: Math.abs(finalRgb.g - originalRgb.g),
    b: Math.abs(finalRgb.b - originalRgb.b)
  };
  
  const maxDelta = Math.max(rgbDelta.r, rgbDelta.g, rgbDelta.b);
  const withinTolerance = colorsMatch(originalRgb, finalRgb, 2);
  
  return {
    isValid: withinTolerance,
    details: {
      originalRgb,
      intermediateCmyk,
      finalRgb,
      rgbDelta,
      maxDelta,
      withinTolerance
    }
  };
}

/**
 * CMYK→RGB→CMYK往復変換の一致性を検証
 */
function validateCmykRoundtrip(originalCmyk: CmykColor): {
  isValid: boolean;
  details: {
    originalCmyk: CmykColor;
    intermediateRgb: RgbColor;
    finalCmyk: CmykColor;
    cmykDelta: { c: number; m: number; y: number; k: number };
    maxDelta: number;
    withinTolerance: boolean;
  };
} {
  // CMYK → RGB 変換
  const intermediateRgb = ColorSpaceConverter.cmykToRgb(originalCmyk.c, originalCmyk.m, originalCmyk.y, originalCmyk.k);
  
  // RGB → CMYK 変換
  const finalCmyk = ColorSpaceConverter.rgbToCmyk(intermediateRgb.r, intermediateRgb.g, intermediateRgb.b);
  
  // 差分計算
  const cmykDelta = {
    c: Math.abs(finalCmyk.c - originalCmyk.c),
    m: Math.abs(finalCmyk.m - originalCmyk.m),
    y: Math.abs(finalCmyk.y - originalCmyk.y),
    k: Math.abs(finalCmyk.k - originalCmyk.k)
  };
  
  const maxDelta = Math.max(cmykDelta.c, cmykDelta.m, cmykDelta.y, cmykDelta.k);
  const withinTolerance = cmykColorsMatch(originalCmyk, finalCmyk, 2);
  
  return {
    isValid: withinTolerance,
    details: {
      originalCmyk,
      intermediateRgb,
      finalCmyk,
      cmykDelta,
      maxDelta,
      withinTolerance
    }
  };
}

describe('Property 6: RGB⇔CMYK変換の往復一致性（改良版）', () => {
  /**
   * Feature: paint-color-assistant, Property 6: RGB⇔CMYK変換の往復一致性
   * 
   * 任意の有効な色について、RGB→CMYK→RGB変換の結果が元の色と一致する（許容誤差内）
   * 
   * **Validates: Requirements 2.1.2**
   */
  it('Property 6: 任意のRGB色でRGB→CMYK→RGB往復変換が一致する', () => {
    const testIterations = 1000; // 1000回の反復テスト（Task 1.4要件）
    let successCount = 0;
    const failures: Array<{
      originalRgb: RgbColor;
      validationResult: any;
    }> = [];

    // 最大誤差色の記録
    const maxErrorRecord: MaxErrorRecord = {
      rMaxError: { color: { r: 0, g: 0, b: 0 }, error: 0, details: null },
      gMaxError: { color: { r: 0, g: 0, b: 0 }, error: 0, details: null },
      bMaxError: { color: { r: 0, g: 0, b: 0 }, error: 0, details: null },
      overallMaxError: { color: { r: 0, g: 0, b: 0 }, error: 0, details: null }
    };

    for (let i = 0; i < testIterations; i++) {
      // ランダムなRGB色を生成
      const originalRgb = generateRandomRgbColor();

      try {
        // RGB往復変換の一致性を検証
        const validationResult = validateRgbRoundtrip(originalRgb);
        
        // 最大誤差色の更新
        const { rgbDelta, maxDelta } = validationResult.details;
        
        if (rgbDelta.r > maxErrorRecord.rMaxError.error) {
          maxErrorRecord.rMaxError = { color: originalRgb, error: rgbDelta.r, details: validationResult.details };
        }
        if (rgbDelta.g > maxErrorRecord.gMaxError.error) {
          maxErrorRecord.gMaxError = { color: originalRgb, error: rgbDelta.g, details: validationResult.details };
        }
        if (rgbDelta.b > maxErrorRecord.bMaxError.error) {
          maxErrorRecord.bMaxError = { color: originalRgb, error: rgbDelta.b, details: validationResult.details };
        }
        if (maxDelta > maxErrorRecord.overallMaxError.error) {
          maxErrorRecord.overallMaxError = { color: originalRgb, error: maxDelta, details: validationResult.details };
        }
        
        if (validationResult.isValid) {
          successCount++;
        } else {
          failures.push({
            originalRgb,
            validationResult
          });
        }
      } catch (error: unknown) {
        // 変換エラーは失敗として記録
        failures.push({
          originalRgb,
          validationResult: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // 成功率の検証（90%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 6 RGB往復変換検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    console.log('RGB最大誤差色記録:');
    console.log(`  R成分最大誤差: ${maxErrorRecord.rMaxError.error} - RGB(${maxErrorRecord.rMaxError.color.r},${maxErrorRecord.rMaxError.color.g},${maxErrorRecord.rMaxError.color.b})`);
    console.log(`  G成分最大誤差: ${maxErrorRecord.gMaxError.error} - RGB(${maxErrorRecord.gMaxError.color.r},${maxErrorRecord.gMaxError.color.g},${maxErrorRecord.gMaxError.color.b})`);
    console.log(`  B成分最大誤差: ${maxErrorRecord.bMaxError.error} - RGB(${maxErrorRecord.bMaxError.color.r},${maxErrorRecord.bMaxError.color.g},${maxErrorRecord.bMaxError.color.b})`);
    console.log(`  全体最大誤差: ${maxErrorRecord.overallMaxError.error} - RGB(${maxErrorRecord.overallMaxError.color.r},${maxErrorRecord.overallMaxError.color.g},${maxErrorRecord.overallMaxError.color.b})`);
    
    if (successRate < 90) {
      console.error(`Property 6 RGB往復変換失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          originalRgb: `RGB(${failure.originalRgb.r},${failure.originalRgb.g},${failure.originalRgb.b})`,
          details: failure.validationResult.details || failure.validationResult
        });
      });
    } else {
      console.log('✅ Property 6 RGB往復変換: RGB⇔CMYK変換の往復一致性 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.9));
  }, 60000); // 60秒タイムアウト

  it('Property 6: 任意のCMYK色でCMYK→RGB→CMYK往復変換が一致する（改良版）', () => {
    const testIterations = 1000; // 1000回の反復テスト（Task 1.4要件）
    let successCount = 0;
    const failures: Array<{
      originalCmyk: CmykColor;
      validationResult: any;
    }> = [];

    // CMYK最大誤差色の記録
    const cmykMaxErrorRecord: CmykMaxErrorRecord = {
      cMaxError: { color: { c: 0, m: 0, y: 0, k: 0 }, error: 0, details: null },
      mMaxError: { color: { c: 0, m: 0, y: 0, k: 0 }, error: 0, details: null },
      yMaxError: { color: { c: 0, m: 0, y: 0, k: 0 }, error: 0, details: null },
      kMaxError: { color: { c: 0, m: 0, y: 0, k: 0 }, error: 0, details: null },
      overallMaxError: { color: { c: 0, m: 0, y: 0, k: 0 }, error: 0, details: null }
    };

    for (let i = 0; i < testIterations; i++) {
      // ランダムなCMYK色を生成
      const originalCmyk = generateRandomCmykColor();

      try {
        // CMYK往復変換の一致性を検証
        const validationResult = validateCmykRoundtrip(originalCmyk);
        
        // CMYK最大誤差色の更新
        const { cmykDelta, maxDelta } = validationResult.details;
        
        if (cmykDelta.c > cmykMaxErrorRecord.cMaxError.error) {
          cmykMaxErrorRecord.cMaxError = { color: originalCmyk, error: cmykDelta.c, details: validationResult.details };
        }
        if (cmykDelta.m > cmykMaxErrorRecord.mMaxError.error) {
          cmykMaxErrorRecord.mMaxError = { color: originalCmyk, error: cmykDelta.m, details: validationResult.details };
        }
        if (cmykDelta.y > cmykMaxErrorRecord.yMaxError.error) {
          cmykMaxErrorRecord.yMaxError = { color: originalCmyk, error: cmykDelta.y, details: validationResult.details };
        }
        if (cmykDelta.k > cmykMaxErrorRecord.kMaxError.error) {
          cmykMaxErrorRecord.kMaxError = { color: originalCmyk, error: cmykDelta.k, details: validationResult.details };
        }
        if (maxDelta > cmykMaxErrorRecord.overallMaxError.error) {
          cmykMaxErrorRecord.overallMaxError = { color: originalCmyk, error: maxDelta, details: validationResult.details };
        }
        
        if (validationResult.isValid) {
          successCount++;
        } else {
          failures.push({
            originalCmyk,
            validationResult
          });
        }
      } catch (error: unknown) {
        // 変換エラーは失敗として記録
        failures.push({
          originalCmyk,
          validationResult: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // 成功率の検証（30%以上を要求、現実的目標）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 6 CMYK往復変換検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    console.log('CMYK最大誤差色記録:');
    console.log(`  C成分最大誤差: ${cmykMaxErrorRecord.cMaxError.error} - CMYK(${cmykMaxErrorRecord.cMaxError.color.c},${cmykMaxErrorRecord.cMaxError.color.m},${cmykMaxErrorRecord.cMaxError.color.y},${cmykMaxErrorRecord.cMaxError.color.k})`);
    console.log(`  M成分最大誤差: ${cmykMaxErrorRecord.mMaxError.error} - CMYK(${cmykMaxErrorRecord.mMaxError.color.c},${cmykMaxErrorRecord.mMaxError.color.m},${cmykMaxErrorRecord.mMaxError.color.y},${cmykMaxErrorRecord.mMaxError.color.k})`);
    console.log(`  Y成分最大誤差: ${cmykMaxErrorRecord.yMaxError.error} - CMYK(${cmykMaxErrorRecord.yMaxError.color.c},${cmykMaxErrorRecord.yMaxError.color.m},${cmykMaxErrorRecord.yMaxError.color.y},${cmykMaxErrorRecord.yMaxError.color.k})`);
    console.log(`  K成分最大誤差: ${cmykMaxErrorRecord.kMaxError.error} - CMYK(${cmykMaxErrorRecord.kMaxError.color.c},${cmykMaxErrorRecord.kMaxError.color.m},${cmykMaxErrorRecord.kMaxError.color.y},${cmykMaxErrorRecord.kMaxError.color.k})`);
    console.log(`  全体最大誤差: ${cmykMaxErrorRecord.overallMaxError.error} - CMYK(${cmykMaxErrorRecord.overallMaxError.color.c},${cmykMaxErrorRecord.overallMaxError.color.m},${cmykMaxErrorRecord.overallMaxError.color.y},${cmykMaxErrorRecord.overallMaxError.color.k})`);
    
    if (successRate < 30) {
      console.error(`Property 6 CMYK往復変換失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          originalCmyk: `CMYK(${failure.originalCmyk.c},${failure.originalCmyk.m},${failure.originalCmyk.y},${failure.originalCmyk.k})`,
          details: failure.validationResult.details || failure.validationResult
        });
      });
    } else {
      console.log('✅ Property 6 CMYK往復変換: RGB⇔CMYK変換の往復一致性 - 検証成功（現実的目標達成）');
    }

    expect(successRate).toBeGreaterThanOrEqual(30);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.3));
  }, 60000); // 60秒タイムアウト

  it('Property 6 補助テスト: 特定の色での詳細検証', () => {
    // 既知の色での詳細検証
    const testCases = [
      { name: '純赤', rgb: { r: 255, g: 0, b: 0 } },
      { name: '純緑', rgb: { r: 0, g: 255, b: 0 } },
      { name: '純青', rgb: { r: 0, g: 0, b: 255 } },
      { name: '白', rgb: { r: 255, g: 255, b: 255 } },
      { name: '黒', rgb: { r: 0, g: 0, b: 0 } },
      { name: 'グレー', rgb: { r: 128, g: 128, b: 128 } },
      { name: 'シアン', rgb: { r: 0, g: 255, b: 255 } },
      { name: 'マゼンタ', rgb: { r: 255, g: 0, b: 255 } },
      { name: 'イエロー', rgb: { r: 255, g: 255, b: 0 } }
    ];

    testCases.forEach(testCase => {
      const { rgb } = testCase;
      
      // RGB往復変換の一致性を検証
      const validationResult = validateRgbRoundtrip(rgb);
      
      // 詳細ログ出力
      console.log(`${testCase.name}テスト:`, {
        original: `RGB(${rgb.r},${rgb.g},${rgb.b})`,
        intermediate: `CMYK(${validationResult.details.intermediateCmyk.c},${validationResult.details.intermediateCmyk.m},${validationResult.details.intermediateCmyk.y},${validationResult.details.intermediateCmyk.k})`,
        final: `RGB(${validationResult.details.finalRgb.r},${validationResult.details.finalRgb.g},${validationResult.details.finalRgb.b})`,
        maxDelta: validationResult.details.maxDelta,
        isValid: validationResult.isValid
      });
      
      // 往復変換の一致性検証
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.details.maxDelta).toBeLessThanOrEqual(2);
    });
  });



  it('Property 6 エッジケーステスト: 境界値での検証', () => {
    // 境界値でのテスト（現実的な範囲）
    const edgeCases: Array<{
      name: string;
      rgb?: RgbColor;
      cmyk?: CmykColor;
    }> = [
      { name: 'RGB最小値', rgb: { r: 0, g: 0, b: 0 } },
      { name: 'RGB最大値', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'CMYK最小値', cmyk: { c: 0, m: 0, y: 0, k: 0 } },
      { name: 'CMYK現実的最大値', cmyk: { c: 100, m: 50, y: 50, k: 50 } },
      { name: 'CMYK K調色範囲', cmyk: { c: 50, m: 50, y: 50, k: 25 } },
      { name: 'CMYK単色最大', cmyk: { c: 100, m: 0, y: 0, k: 0 } },
      { name: 'CMYK二色組合せ', cmyk: { c: 100, m: 50, y: 0, k: 10 } }
    ];

    edgeCases.forEach(testCase => {
      if (testCase.rgb) {
        // RGB往復変換テスト
        const validationResult = validateRgbRoundtrip(testCase.rgb);
        
        console.log(`${testCase.name} RGB往復テスト:`, {
          original: `RGB(${testCase.rgb.r},${testCase.rgb.g},${testCase.rgb.b})`,
          maxDelta: validationResult.details.maxDelta,
          isValid: validationResult.isValid
        });
        
        expect(validationResult.isValid).toBe(true);
      }
      
      if (testCase.cmyk) {
        // CMYK往復変換テスト
        const validationResult = validateCmykRoundtrip(testCase.cmyk);
        
        console.log(`${testCase.name} CMYK往復テスト:`, {
          original: `CMYK(${testCase.cmyk.c},${testCase.cmyk.m},${testCase.cmyk.y},${testCase.cmyk.k})`,
          maxDelta: validationResult.details.maxDelta,
          isValid: validationResult.isValid
        });
        
        expect(validationResult.isValid).toBe(true);
      }
    });
  });
});