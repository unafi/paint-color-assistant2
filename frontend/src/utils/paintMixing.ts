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
   * 色A→色Bの混合比率計算
   * @param colorA 出発色（画像Aの結果色）
   * @param colorB 目標色（画像Bの結果色）
   * @returns 混合結果
   */
  static calculateMixingRatio(colorA: ColorModel, colorB: ColorModel): MixingResult {
    const instructions: MixingInstruction[] = [];
    
    // CMYK差分計算
    const cyanDelta = colorB.c - colorA.c;
    const magentaDelta = colorB.m - colorA.m;
    const yellowDelta = colorB.y - colorA.y;
    const blackDelta = colorB.k - colorA.k;
    
    // シアン処理
    if (cyanDelta > 0.1) {
      instructions.push({
        pigmentName: 'シアン',
        amount: cyanDelta,
        displayColor: '#00FFFF',
        description: 'シアンを追加'
      });
    } else if (cyanDelta < -0.1) {
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
    if (magentaDelta > 0.1) {
      instructions.push({
        pigmentName: 'マゼンタ',
        amount: magentaDelta,
        displayColor: '#FF00FF',
        description: 'マゼンタを追加'
      });
    } else if (magentaDelta < -0.1) {
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
    if (yellowDelta > 0.1) {
      instructions.push({
        pigmentName: 'イエロー',
        amount: yellowDelta,
        displayColor: '#FFFF00',
        description: 'イエローを追加'
      });
    } else if (yellowDelta < -0.1) {
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
    if (blackDelta > 0.1) {
      instructions.push({
        pigmentName: '黒',
        amount: blackDelta,
        displayColor: '#000000',
        description: '黒を追加して暗くする'
      });
    } else if (blackDelta < -0.1) {
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
      .map(inst => `${inst.pigmentName}: +${inst.amount.toFixed(1)}%`)
      .join(', ');
  }
}