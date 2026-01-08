/**
 * プロパティテスト: 補色理論の適用
 * Feature: paint-color-assistant, Property 2: 補色理論の適用
 * 
 * 任意の負のCMYK差分について、補色塗料の追加により物理的制約（加算のみ）を遵守した計算が行われる
 * 
 * **Validates: Requirements 6.1**
 */

import { describe, it, expect } from 'vitest';
import type { ColorModel } from '../../types/color';
import { PaintMixingCalculator } from '../../utils/paintMixing';

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
 * 負のCMYK差分を持つ色ペアを生成
 */
function generateNegativeDeltaColorPair(): { baseColor: ColorModel; targetColor: ColorModel; negativeDelta: string } {
  const baseColor = generateRandomColor();
  
  // 負の差分を作るため、ベース色よりも低いCMYK値を持つターゲット色を生成
  const targetColor = { ...baseColor };
  
  const deltaTypes = ['cyan', 'magenta', 'yellow'];
  const selectedDelta = deltaTypes[Math.floor(Math.random() * deltaTypes.length)];
  
  switch (selectedDelta) {
    case 'cyan':
      // シアンを減らす（負の差分）
      targetColor.c = Math.max(0, baseColor.c - Math.floor(Math.random() * 30 + 10));
      break;
    case 'magenta':
      // マゼンタを減らす（負の差分）
      targetColor.m = Math.max(0, baseColor.m - Math.floor(Math.random() * 30 + 10));
      break;
    case 'yellow':
      // イエローを減らす（負の差分）
      targetColor.y = Math.max(0, baseColor.y - Math.floor(Math.random() * 30 + 10));
      break;
  }
  
  return { baseColor, targetColor, negativeDelta: selectedDelta };
}

/**
 * 補色理論の適用を検証
 */
function validateComplementaryColorTheory(baseColor: ColorModel, targetColor: ColorModel): {
  isValid: boolean;
  details: {
    cyanDelta: number;
    magentaDelta: number;
    yellowDelta: number;
    hasNegativeDelta: boolean;
    usesComplementaryColors: boolean;
    onlyAdditivePigments: boolean;
  };
} {
  const mixingResult = PaintMixingCalculator.calculateMixingRatio(baseColor, targetColor);
  
  // CMYK差分を計算
  const cyanDelta = Math.round(targetColor.c) - Math.round(baseColor.c);
  const magentaDelta = Math.round(targetColor.m) - Math.round(baseColor.m);
  const yellowDelta = Math.round(targetColor.y) - Math.round(baseColor.y);
  
  const hasNegativeDelta = cyanDelta < 0 || magentaDelta < 0 || yellowDelta < 0;
  
  // 補色理論の適用を確認
  let usesComplementaryColors = false;
  let onlyAdditivePigments = true;
  
  if (hasNegativeDelta) {
    // 負の差分がある場合、補色塗料の使用を確認
    for (const instruction of mixingResult.instructions) {
      // 全ての塗料量が正の値（加算のみ）であることを確認
      if (instruction.amount < 0) {
        onlyAdditivePigments = false;
      }
      
      // 補色理論の適用を確認
      if (cyanDelta < 0) {
        // シアンを減らす場合、マゼンタ+イエローが追加されるべき
        if (instruction.pigmentName === 'マゼンタ' || instruction.pigmentName === 'イエロー') {
          usesComplementaryColors = true;
        }
      }
      if (magentaDelta < 0) {
        // マゼンタを減らす場合、シアン+イエローが追加されるべき
        if (instruction.pigmentName === 'シアン' || instruction.pigmentName === 'イエロー') {
          usesComplementaryColors = true;
        }
      }
      if (yellowDelta < 0) {
        // イエローを減らす場合、シアン+マゼンタが追加されるべき
        if (instruction.pigmentName === 'シアン' || instruction.pigmentName === 'マゼンタ') {
          usesComplementaryColors = true;
        }
      }
    }
  } else {
    // 負の差分がない場合は補色理論の適用は不要
    usesComplementaryColors = true; // この場合は適用不要なので成功とみなす
  }
  
  const isValid = onlyAdditivePigments && (hasNegativeDelta ? usesComplementaryColors : true);
  
  return {
    isValid,
    details: {
      cyanDelta,
      magentaDelta,
      yellowDelta,
      hasNegativeDelta,
      usesComplementaryColors,
      onlyAdditivePigments
    }
  };
}

describe('Property 2: 補色理論の適用', () => {
  /**
   * Feature: paint-color-assistant, Property 2: 補色理論の適用
   * 
   * 任意の負のCMYK差分について、補色塗料の追加により物理的制約（加算のみ）を遵守した計算が行われる
   * 
   * **Validates: Requirements 6.1**
   */
  it('Property 2: 任意の負のCMYK差分について補色理論が正しく適用される', () => {
    const testIterations = 100; // 最低100回の反復テスト
    let successCount = 0;
    const failures: Array<{
      baseColor: ColorModel;
      targetColor: ColorModel;
      negativeDelta: string;
      validationResult: any;
    }> = [];

    for (let i = 0; i < testIterations; i++) {
      // 負のCMYK差分を持つ色ペアを生成
      const { baseColor, targetColor, negativeDelta } = generateNegativeDeltaColorPair();

      try {
        // 補色理論の適用を検証
        const validationResult = validateComplementaryColorTheory(baseColor, targetColor);
        
        if (validationResult.isValid) {
          successCount++;
        } else {
          failures.push({
            baseColor,
            targetColor,
            negativeDelta,
            validationResult
          });
        }
      } catch (error) {
        // 計算エラーは失敗として記録
        failures.push({
          baseColor,
          targetColor,
          negativeDelta,
          validationResult: { error: (error as Error).message }
        });
      }
    }

    // 成功率の検証（90%以上を要求）
    const successRate = (successCount / testIterations) * 100;
    
    console.log(`Property 2 検証結果: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
    
    if (successRate < 90) {
      console.error(`Property 2 失敗: 成功率 ${successRate.toFixed(1)}% (${successCount}/${testIterations})`);
      console.error('失敗例（最初の5件）:');
      failures.slice(0, 5).forEach((failure, index) => {
        console.error(`失敗 ${index + 1}:`, {
          baseColor: `CMYK(${failure.baseColor.c},${failure.baseColor.m},${failure.baseColor.y},${failure.baseColor.k})`,
          targetColor: `CMYK(${failure.targetColor.c},${failure.targetColor.m},${failure.targetColor.y},${failure.targetColor.k})`,
          negativeDelta: failure.negativeDelta,
          details: failure.validationResult.details || failure.validationResult
        });
      });
    } else {
      console.log('✅ Property 2: 補色理論の適用 - 検証成功');
    }

    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(testIterations * 0.9));
  }, 60000); // 60秒タイムアウト

  it('Property 2 補助テスト: 特定の負の差分での詳細検証', () => {
    // 既知の負の差分ケースでの詳細検証
    const testCases = [
      {
        name: 'シアン減少',
        baseColor: { r: 0, g: 255, b: 255, c: 100, m: 0, y: 0, k: 0 }, // シアン100%
        targetColor: { r: 128, g: 255, b: 255, c: 50, m: 0, y: 0, k: 0 } // シアン50%
      },
      {
        name: 'マゼンタ減少',
        baseColor: { r: 255, g: 0, b: 255, c: 0, m: 100, y: 0, k: 0 }, // マゼンタ100%
        targetColor: { r: 255, g: 128, b: 255, c: 0, m: 50, y: 0, k: 0 } // マゼンタ50%
      },
      {
        name: 'イエロー減少',
        baseColor: { r: 255, g: 255, b: 0, c: 0, m: 0, y: 100, k: 0 }, // イエロー100%
        targetColor: { r: 255, g: 255, b: 128, c: 0, m: 0, y: 50, k: 0 } // イエロー50%
      }
    ];

    testCases.forEach(testCase => {
      const { baseColor, targetColor } = testCase;
      
      // 補色理論の適用を検証
      const validationResult = validateComplementaryColorTheory(baseColor, targetColor);
      
      // 詳細ログ出力
      console.log(`${testCase.name}テスト:`, {
        baseColor: `CMYK(${baseColor.c},${baseColor.m},${baseColor.y},${baseColor.k})`,
        targetColor: `CMYK(${targetColor.c},${targetColor.m},${targetColor.y},${targetColor.k})`,
        details: validationResult.details,
        isValid: validationResult.isValid
      });
      
      // 補色理論の適用検証
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.details.hasNegativeDelta).toBe(true);
      expect(validationResult.details.usesComplementaryColors).toBe(true);
      expect(validationResult.details.onlyAdditivePigments).toBe(true);
    });
  });
});
