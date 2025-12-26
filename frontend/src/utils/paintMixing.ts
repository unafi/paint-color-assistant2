import type { ColorModel } from '../types/color';

/**
 * 塗料混合結果の型定義
 */
export interface MixingResult {
  /** 追加する塗料の指示 */
  instructions: MixingInstruction[];
  /** 表示用文字列 */
  displayText: string;
}

/**
 * 塗料混合指示の型定義
 */
export interface MixingInstruction {
  /** 塗料名 */
  pigmentName: string;
  /** 追加量（常に正の値） */
  amount: number;
  /** 表示色 */
  displayColor: string;
  /** 説明 */
  description: string;
}

/**
 * 塗料混合計算サービス
 */
export class PaintMixingCalculator {
  /**
   * 塗料調整の逆算結果色を計算
   * 「必要な塗料調整」の値を使用して算出色を計算
   * @param baseColor 出発色
   * @param targetColor 目的色
   * @returns 逆算結果色（必要な塗料調整を適用した結果）
   */
  static calculateReverseMixingColor(baseColor: ColorModel, targetColor: ColorModel): ColorModel {
    // 必要な塗料調整を取得
    const mixingResult = this.calculateMixingRatio(baseColor, targetColor);
    
    // 調整値を初期化
    const adjustments = {
      cyan: 0,
      magenta: 0,
      yellow: 0,
      black: 0,
      white: 0
    };
    
    // 必要な塗料調整の指示から調整値を設定
    mixingResult.instructions.forEach(instruction => {
      switch (instruction.pigmentName) {
        case 'シアン':
          adjustments.cyan = instruction.amount;
          break;
        case 'マゼンタ':
          adjustments.magenta = instruction.amount;
          break;
        case 'イエロー':
          adjustments.yellow = instruction.amount;
          break;
        case '黒':
          adjustments.black = instruction.amount;
          break;
        case '白':
          adjustments.white = instruction.amount;
          break;
      }
    });
    
    // 白と黒の相互作用計算
    const whiteAmount = adjustments.white;
    const blackAmount = adjustments.black;
    const grayEffect = Math.min(whiteAmount, blackAmount);
    const netWhite = whiteAmount - grayEffect;
    const netBlack = blackAmount - grayEffect;
    
    // 塗料調整値を適用（「必要な塗料調整」の表示値を使用）
    let adjustedCmyk = {
      c: Math.max(0, Math.min(100, Math.round(baseColor.c) + adjustments.cyan)),
      m: Math.max(0, Math.min(100, Math.round(baseColor.m) + adjustments.magenta)),
      y: Math.max(0, Math.min(100, Math.round(baseColor.y) + adjustments.yellow)),
      k: Math.max(0, Math.min(100, Math.round(baseColor.k) + netBlack))
    };
    
    // 白の効果（K値を減少させる）
    if (netWhite > 0) {
      adjustedCmyk.k = Math.max(0, adjustedCmyk.k - netWhite);
    }
    
    // グレー効果による彩度低下（CMY値を減少）
    if (grayEffect > 0) {
      const saturationReduction = grayEffect * 0.3; // 30%の彩度低下
      adjustedCmyk.c = Math.max(0, adjustedCmyk.c - saturationReduction);
      adjustedCmyk.m = Math.max(0, adjustedCmyk.m - saturationReduction);
      adjustedCmyk.y = Math.max(0, adjustedCmyk.y - saturationReduction);
    }
    
    // CMYK→RGB変換（標準的な変換式）
    const k = adjustedCmyk.k / 100;
    const c = adjustedCmyk.c / 100 * (1 - k);
    const m = adjustedCmyk.m / 100 * (1 - k);
    const y = adjustedCmyk.y / 100 * (1 - k);
    
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    
    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
      ...adjustedCmyk
    };
  }
  /**
   * 色A→色Bの混合比率計算
   * @param colorA 出発色（画像Aの結果色）
   * @param colorB 目標色（画像Bの結果色）
   * @returns 混合結果
   */
  static calculateMixingRatio(colorA: ColorModel, colorB: ColorModel): MixingResult {
    const instructions: MixingInstruction[] = [];
    
    // CMYK差分計算（整数に四捨五入）
    const cyanDelta = Math.round(colorB.c) - Math.round(colorA.c);
    const magentaDelta = Math.round(colorB.m) - Math.round(colorA.m);
    const yellowDelta = Math.round(colorB.y) - Math.round(colorA.y);
    const blackDelta = Math.round(colorB.k) - Math.round(colorA.k);
    
    // シアン処理
    if (cyanDelta > 0) {
      instructions.push({
        pigmentName: 'シアン',
        amount: cyanDelta,
        displayColor: '#00FFFF',
        description: 'シアンを追加'
      });
    } else if (cyanDelta < 0) {
      // シアンを減らす = マゼンタ+イエローを追加（補色理論）
      const neutralizeAmount = Math.abs(cyanDelta);
      instructions.push({
        pigmentName: 'マゼンタ',
        amount: neutralizeAmount,
        displayColor: '#FF00FF',
        description: 'シアンを中和するためマゼンタを追加'
      });
      instructions.push({
        pigmentName: 'イエロー',
        amount: neutralizeAmount,
        displayColor: '#FFFF00',
        description: 'シアンを中和するためイエローを追加'
      });
    }
    
    // マゼンタ処理
    if (magentaDelta > 0) {
      instructions.push({
        pigmentName: 'マゼンタ',
        amount: magentaDelta,
        displayColor: '#FF00FF',
        description: 'マゼンタを追加'
      });
    } else if (magentaDelta < 0) {
      // マゼンタを減らす = シアン+イエローを追加（補色理論）
      const neutralizeAmount = Math.abs(magentaDelta);
      instructions.push({
        pigmentName: 'シアン',
        amount: neutralizeAmount,
        displayColor: '#00FFFF',
        description: 'マゼンタを中和するためシアンを追加'
      });
      instructions.push({
        pigmentName: 'イエロー',
        amount: neutralizeAmount,
        displayColor: '#FFFF00',
        description: 'マゼンタを中和するためイエローを追加'
      });
    }
    
    // イエロー処理
    if (yellowDelta > 0) {
      instructions.push({
        pigmentName: 'イエロー',
        amount: yellowDelta,
        displayColor: '#FFFF00',
        description: 'イエローを追加'
      });
    } else if (yellowDelta < 0) {
      // イエローを減らす = シアン+マゼンタを追加（補色理論）
      const neutralizeAmount = Math.abs(yellowDelta);
      instructions.push({
        pigmentName: 'シアン',
        amount: neutralizeAmount,
        displayColor: '#00FFFF',
        description: 'イエローを中和するためシアンを追加'
      });
      instructions.push({
        pigmentName: 'マゼンタ',
        amount: neutralizeAmount,
        displayColor: '#FF00FF',
        description: 'イエローを中和するためマゼンタを追加'
      });
    }
    
    // 黒/白処理
    if (blackDelta > 0) {
      instructions.push({
        pigmentName: '黒',
        amount: blackDelta,
        displayColor: '#000000',
        description: '黒を追加して暗くする'
      });
    } else if (blackDelta < 0) {
      instructions.push({
        pigmentName: '白',
        amount: Math.abs(blackDelta),
        displayColor: '#FFFFFF',
        description: '白を追加して明るくする'
      });
    }
    
    // 同じ塗料の統合処理
    const consolidatedInstructions = this.consolidateInstructions(instructions);
    
    // 表示用文字列生成
    const displayText = this.formatMixingText(consolidatedInstructions);
    
    return {
      instructions: consolidatedInstructions,
      displayText
    };
  }
  
  /**
   * 同じ塗料の指示を統合する
   */
  private static consolidateInstructions(instructions: MixingInstruction[]): MixingInstruction[] {
    const consolidated = new Map<string, MixingInstruction>();
    
    for (const instruction of instructions) {
      const existing = consolidated.get(instruction.pigmentName);
      if (existing) {
        // 同じ塗料が既に存在する場合は量を合計
        existing.amount += instruction.amount;
        existing.description = `${instruction.pigmentName}を追加`;
      } else {
        // 新しい塗料の場合はそのまま追加
        consolidated.set(instruction.pigmentName, { ...instruction });
      }
    }
    
    // CMYK + 白の順序で並び替え
    const sortedInstructions = Array.from(consolidated.values());
    const colorOrder = ['シアン', 'マゼンタ', 'イエロー', '黒', '白'];
    
    return sortedInstructions.sort((a, b) => {
      const indexA = colorOrder.indexOf(a.pigmentName);
      const indexB = colorOrder.indexOf(b.pigmentName);
      return indexA - indexB;
    });
  }
  
  /**
   * 混合指示の表示用文字列生成
   */
  private static formatMixingText(instructions: MixingInstruction[]): string {
    if (instructions.length === 0) {
      return '調整不要（色がほぼ同じです）';
    }
    
    return instructions
      .map(inst => `${inst.pigmentName}: +${Math.round(inst.amount)}%`)
      .join(', ');
  }
}