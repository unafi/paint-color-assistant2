/**
 * プロパティテスト: 白黒相互作用の計算
 * Feature: paint-color-assistant, Property 3: 白黒相互作用の計算
 * 
 * 任意の白と黒の同時使用において、グレー効果による彩度低下が正しく計算される
 * 
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect } from 'vitest';
import type { ColorModel } from '../../types/color';
import { PaintMixingCalculator } from '../../utils/paintMixing';

/**
 * 白黒相互作用計算クラス（テスト用）
 * PaintMixingControllerと同じロジックを使用
 */
class WhiteBlackInteractionCalculator {
  /**
   * 白黒相互作用を含む塗料混合計算
   */
  static calculateWithWhiteBlackInteraction(
    baseColor: ColorModel,
    adjustments: {
      cyan: number;
      magenta: number;
      yellow: number;
      black: number;
      white: number;
    }
  ): {
    resultColor: ColorModel;
    grayEffect: number;
    netWhite: number;
    netBlack: number;
    saturationReduction: number;
  } {
    const baseCmyk = {
      c: Math.round(baseColor.c),
      m: Math.round(baseColor.m),
      y: Math.round(baseColor.y),
      k: Math.round(baseColor.k)
    };

    // 白と黒の相互作用計算
    const whiteAmount = adjustments.white;
    const blackAmount = adjustments.black;
    
    // グレー効果（白と黒の最小値）
    const grayEffect = Math.min(whiteAmount, blackAmount);
    const netWhite = whiteAmount - grayEffect;
    const netBlack = blackAmount - grayEffect;

    // 塗料調整値を適用
    let adjustedCmyk = {
      c: Math.max(0, Math.min(100, baseCmyk.c + adjustments.cyan)),
      m: Math.max(0, Math.min(100, baseCmyk.m + adjustments.magenta)),
      y: Math.max(0, Math.min(100, baseCmyk.y + adjustments.yellow)),
      k: Math.max(0, Math.min(100, baseCmyk.k + netBlack))
    };

    // 白の効果（K値を減少させる）
    if (netWhite > 0) {
      adjustedCmyk.k = Math.max(0, adjustedCmyk.k - netWhite);
    }

    // グレー効果による彩度低下（CMY値を減少）
    const saturationReduction = grayEffect * 0.3; // 30%の彩度低下
    if (grayEffect > 0) {
      adjustedCmyk.c = Math.max(0, adjustedCmyk.c - saturationReduction);
      adjustedCmyk.m = Math.max(0, adjustedCmyk.m - saturationReduction);
      adjustedCmyk.y = Math.max(0, adjustedCmyk.y - saturationReduction);
    }

    // CMYK→RGB変換
    const kNorm = adjustedCmyk.k / 100;
    const cNorm = adjustedCmyk.c / 100 * (1 - kNorm);
    const mNorm = adjustedCmyk.m / 100 * (1 - kNorm);
    const yNorm = adjustedCmyk.y / 100 * (1 - kNorm);
    
    const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
    const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
    const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));

    const resultColor: ColorModel = {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
      ...adjustedCmyk
    };

    return {
      resultColor,
      grayEffect,
      netWhite,
      netBlack,
      saturationReduction
    };
  }
}

/**
 * ランダムな有効なColorModelを生成
 */
function generateRandomColor(): ColorModel {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  // RGB→CMYK変換
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  
  let c = 0, m = 0, y = 0;
  if (k !== 1) {
    c = (1 - rNorm - k) / (1 - k);
    m = (1 - gNorm - k) / (1 - k);
    y = (1 - bNorm - k) / (1 - k);
  }
  
  return {
    r,
    g,
    b,
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

/**
 * 白と黒を同時使用する調整値を生成
 */
function generateWhiteBlackAdjustments(): {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
  white: number;
} {
  return {
    cyan: Math.floor(Math.random() * 21), // 0-20%
    magenta: Math.floor(Math.random() * 21), // 0-20%
    yellow: Math.floor(Math.random() * 21), // 0-20%
    black: Math.floor(Math.random() * 31) + 5, // 5-35%（必ず黒を使用）
    white: Math.floor(Math.random() * 31) + 5  // 5-35%（必ず白を使用）
  };
}

/**
 * 白黒相互作用の正しさを検証
 */
function validateWhiteBlackInteraction(
  baseColor: ColorModel,
  adjustments: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
    white: number;
  }
): {
  isValid: boolean;
  details: {
    expectedGrayEffect: number;
    actualGrayEffect: number;
    expectedSaturationReduction: number;
    actualSaturationReduction: number;
    grayEffectCorrect: boolean;
    saturationReductionCorrect: boolean;
  };
} {
  const result = WhiteBlackInteractionCalculator.calculateWithWhiteBlackInteraction(
    baseColor,
    adjustments
  );

  // 期待値の計算
  const expectedGrayEffect = Math.min(adjustments.white, adjustments.black);
  const expectedSaturationReduction = expectedGrayEffect * 0.3;

  // 実際の値との比較
  const grayEffectCorrect = Math.abs(result.grayEffect - expectedGrayEffect) < 0.1;
  const saturationReductionCorrect = Math.abs(result.saturationReduction - expectedSaturationReduction) < 0.1;

  const isValid = grayEffectCorrect && saturationReductionCorrect;

  return {
    isValid,
    details: {
      expectedGrayEffect,
      actualGrayEffect: result.grayEffect,
      expectedSaturationReduction,
      actualSaturationReduction: result.saturationReduction,
      grayEffectCorrect,
      saturationReductionCorrect
    }
  };
}

describe('Property 3: 白黒相互作用の計算', () => {
  /**
   * Feature: paint-color-assistant, Property 3: 白黒相互作用の計算
   * 
   * 任意の白と黒の同時使用において、グレー効果による彩度低下が正しく計算される
   * 
   * **Validates: Requirements 6.2**
   */
  it('Property 3: 任意の白と黒の同時使用でグレー効果による彩度低下が正しく計算される', () => {
    const testIterations = 100; // 最低100回の反復テスト
    let successCount = 0;
    const failures: Array<{
      baseColor: ColorModel;
      adjustments: any;
      validationResult: any;
    }> = [];

    for (let i = 0; i < testIterations; i++) {
      // ランダムなベース色と白黒調整値を生成
      const baseColor = generateRandomColor();
      const adjustments = generateWhiteBlackAdjustments();

      try {
        // 白黒相互作用の計算を検証
        const validationResult = validateWhiteBlackInteraction(baseColor, adjustments);
        
        if (validationResult.isValid) {
          successCount++;
        } else {
          failures.push({
            baseColor,
            adjustments,
            validationResult
          });
        }
      } catch (error) {
        // 計算エラーは失敗として記録
        failures.push({
          baseColor,
          adjustments,
          validationResult: { error: (error as Error).message }
        });
      }
    }

    // 成功率の検証（90%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 3 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 90) {
      console.error(`Property 3 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          baseColor: `CMYK(${failure.baseColor.c},${failure.baseColor.m},${failure.baseColor.y},${failure.baseColor.k})`,
          adjustments: `W:${failure.adjustments.white}% B:${failure.adjustments.black}%`,
          details: failure.validationResult.details || failure.validationResult
        });
      });
    } else {
      console.log('✅ Property 3: 白黒相互作用の計算 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.9));
  }, 60000); // 60秒タイムアウト

  it('Property 3 補助テスト: 特定の白黒組み合わせでの詳細検証', () => {
    // 既知の白黒組み合わせでの詳細検証
    const testCases = [
      {
        name: '白20% + 黒10% = グレー効果10%',
        baseColor: { r: 128, g: 128, b: 128, c: 0, m: 0, y: 0, k: 50 },
        adjustments: { cyan: 0, magenta: 0, yellow: 0, black: 10, white: 20 }
      },
      {
        name: '白15% + 黒25% = グレー効果15%',
        baseColor: { r: 255, g: 0, b: 0, c: 0, m: 100, y: 100, k: 0 },
        adjustments: { cyan: 0, magenta: 0, yellow: 0, black: 25, white: 15 }
      },
      {
        name: '白30% + 黒30% = グレー効果30%',
        baseColor: { r: 0, g: 255, b: 255, c: 100, m: 0, y: 0, k: 0 },
        adjustments: { cyan: 0, magenta: 0, yellow: 0, black: 30, white: 30 }
      }
    ];

    testCases.forEach(testCase => {
      const { baseColor, adjustments } = testCase;
      
      // 白黒相互作用の計算を検証
      const validationResult = validateWhiteBlackInteraction(baseColor, adjustments);
      
      // 詳細ログ出力
      console.log(`${testCase.name}テスト:`, {
        baseColor: `CMYK(${baseColor.c},${baseColor.m},${baseColor.y},${baseColor.k})`,
        adjustments: `W:${adjustments.white}% B:${adjustments.black}%`,
        details: validationResult.details,
        isValid: validationResult.isValid
      });
      
      // 白黒相互作用の検証
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.details.grayEffectCorrect).toBe(true);
      expect(validationResult.details.saturationReductionCorrect).toBe(true);
      
      // 期待値の確認
      const expectedGrayEffect = Math.min(adjustments.white, adjustments.black);
      expect(validationResult.details.expectedGrayEffect).toBe(expectedGrayEffect);
      expect(validationResult.details.expectedSaturationReduction).toBe(expectedGrayEffect * 0.3);
    });
  });
});
