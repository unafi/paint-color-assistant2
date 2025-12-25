"""
塗料混合計算機能

Mixboxライブラリを使用した物理的に正確な塗料混合比率計算
フォールバック機能としてCMYKベースの計算も提供
"""

import logging
import numpy as np
from typing import Optional, Dict, Tuple, List
import streamlit as st

from .models import ColorPoint, MixingResult


class PaintMixer:
    """塗料混合計算機能クラス"""
    
    def __init__(self):
        """初期化"""
        self.logger = logging.getLogger(__name__)
        self._setup_mixbox()
        self._setup_calculation_methods()
    
    def _setup_mixbox(self):
        """Mixboxライブラリの設定"""
        try:
            import mixbox
            self.mixbox = mixbox
            self.mixbox_available = True
            self.logger.info("Mixbox library loaded successfully")
            st.success("✅ Mixboxライブラリが利用可能です（物理的に正確な計算）")
        except ImportError:
            self.mixbox = None
            self.mixbox_available = False
            self.logger.warning("Mixbox library not available")
            st.warning("⚠️ Mixboxライブラリが利用できません。CMYKベースの計算を使用します。")
    
    def _setup_calculation_methods(self):
        """計算手法の優先順位を設定"""
        self.calculation_methods = []
        
        if self.mixbox_available:
            self.calculation_methods.append(('mixbox', self._mixbox_calculation))
        
        self.calculation_methods.extend([
            ('cmyk', self._cmyk_calculation),
            ('rgb_weighted', self._rgb_weighted_calculation)
        ])
        
        self.logger.info(f"Available calculation methods: {[m[0] for m in self.calculation_methods]}")
    
    def calculate_mixing_ratio(self, source: ColorPoint, target: ColorPoint) -> Optional[MixingResult]:
        """
        混合比率計算（メイン関数）
        
        Args:
            source: 元の色
            target: 目標色
            
        Returns:
            MixingResult オブジェクト、エラー時はNone
        """
        self.logger.info(f"Calculating mixing ratio: {source.rgb} -> {target.rgb}")
        
        # 各計算手法を順番に試行
        for method_name, method_func in self.calculation_methods:
            try:
                self.logger.info(f"Trying calculation method: {method_name}")
                result = method_func(source, target)
                if result:
                    result.method = method_name
                    self.logger.info(f"Successfully calculated using {method_name}")
                    return result
            except Exception as e:
                self.logger.warning(f"{method_name} calculation failed: {str(e)}")
                continue
        
        self.logger.error("All calculation methods failed")
        return None
    
    def _mixbox_calculation(self, source: ColorPoint, target: ColorPoint) -> Optional[MixingResult]:
        """
        Mixboxを使用した計算
        
        Args:
            source: 元の色
            target: 目標色
            
        Returns:
            MixingResult オブジェクト
        """
        if not self.mixbox_available:
            raise RuntimeError("Mixbox library not available")
        
        # RGB値を使用（Mixboxは0-255の整数を期待）
        source_rgb = list(source.rgb)
        target_rgb = list(target.rgb)
        
        # Mixboxを使用して最適な混合比率を探索
        best_ratio = 0.5
        min_difference = float('inf')
        best_mixed_color = None
        
        # 混合比率を段階的に変化させて最適解を探索
        for ratio in np.linspace(0, 1, 51):  # 計算量を削減
            try:
                # Mixboxで色を混合
                mixed_color = self.mixbox.lerp(source_rgb, target_rgb, ratio)
                
                # 目標色との差を計算
                diff = self._calculate_rgb_distance(mixed_color, target.rgb)
                if diff < min_difference:
                    min_difference = diff
                    best_ratio = ratio
                    best_mixed_color = mixed_color
            except Exception as e:
                self.logger.warning(f"Mixbox lerp failed at ratio {ratio}: {str(e)}")
                continue
        
        if best_mixed_color is None:
            raise RuntimeError("Mixbox calculation failed to find valid result")
        
        # 塗料成分の調整量を計算
        paint_adjustments = self._calculate_paint_adjustments_mixbox(
            source, target, best_ratio
        )
        
        # 結果を作成
        result = MixingResult(
            source_color=source,
            target_color=target,
            mixing_ratios={'mixbox_ratio': best_ratio, 'optimal_mix': best_mixed_color},
            color_difference=min_difference,
            confidence=max(0.0, 1.0 - min_difference / 100.0),  # 0-1の信頼度
            method='mixbox',
            **paint_adjustments
        )
        
        return result
    
    def _calculate_paint_adjustments_mixbox(self, source: ColorPoint, target: ColorPoint, ratio: float) -> Dict[str, float]:
        """
        Mixbox結果から塗料調整量を計算
        
        Args:
            source: 元の色
            target: 目標色
            ratio: 混合比率
            
        Returns:
            塗料調整量の辞書
        """
        # CMYKベースで近似的に調整量を計算
        source_cmyk = source.cmyk or (0, 0, 0, 0)
        target_cmyk = target.cmyk or (0, 0, 0, 0)
        
        # 差分を計算
        c_diff = target_cmyk[0] - source_cmyk[0]
        m_diff = target_cmyk[1] - source_cmyk[1]
        y_diff = target_cmyk[2] - source_cmyk[2]
        k_diff = target_cmyk[3] - source_cmyk[3]
        
        # 混合比率を考慮して調整
        return {
            'cyan_add': c_diff * ratio,
            'magenta_add': m_diff * ratio,
            'yellow_add': y_diff * ratio,
            'white_add': -k_diff * ratio if k_diff < 0 else 0,
            'black_add': k_diff * ratio if k_diff > 0 else 0
        }
    
    def _cmyk_calculation(self, source: ColorPoint, target: ColorPoint) -> Optional[MixingResult]:
        """
        CMYKベースのフォールバック計算
        
        Args:
            source: 元の色
            target: 目標色
            
        Returns:
            MixingResult オブジェクト
        """
        if not source.cmyk or not target.cmyk:
            raise RuntimeError("CMYK values not available")
        
        # CMYK差分を計算
        c_diff = target.cmyk[0] - source.cmyk[0]
        m_diff = target.cmyk[1] - source.cmyk[1]
        y_diff = target.cmyk[2] - source.cmyk[2]
        k_diff = target.cmyk[3] - source.cmyk[3]
        
        # RGB距離を計算
        rgb_distance = self._calculate_rgb_distance(source.rgb, target.rgb)
        
        # 塗料調整量を計算
        paint_adjustments = {
            'cyan_add': c_diff,
            'magenta_add': m_diff,
            'yellow_add': y_diff,
            'white_add': -k_diff if k_diff < 0 else 0,
            'black_add': k_diff if k_diff > 0 else 0
        }
        
        # 混合比率を計算（簡易的）
        total_change = abs(c_diff) + abs(m_diff) + abs(y_diff) + abs(k_diff)
        mixing_ratios = {
            'cyan_ratio': abs(c_diff) / total_change if total_change > 0 else 0,
            'magenta_ratio': abs(m_diff) / total_change if total_change > 0 else 0,
            'yellow_ratio': abs(y_diff) / total_change if total_change > 0 else 0,
            'black_ratio': abs(k_diff) / total_change if total_change > 0 else 0
        }
        
        # 信頼度を計算（RGB距離ベース）
        confidence = max(0.0, 1.0 - rgb_distance / 255.0)
        
        result = MixingResult(
            source_color=source,
            target_color=target,
            mixing_ratios=mixing_ratios,
            color_difference=rgb_distance,
            confidence=confidence,
            method='cmyk',
            **paint_adjustments
        )
        
        return result
    
    def _rgb_weighted_calculation(self, source: ColorPoint, target: ColorPoint) -> Optional[MixingResult]:
        """
        RGB重み付き計算（最後の手段）
        
        Args:
            source: 元の色
            target: 目標色
            
        Returns:
            MixingResult オブジェクト
        """
        # RGB差分を計算
        r_diff = (target.rgb[0] - source.rgb[0]) / 255.0
        g_diff = (target.rgb[1] - source.rgb[1]) / 255.0
        b_diff = (target.rgb[2] - source.rgb[2]) / 255.0
        
        # RGB距離を計算
        rgb_distance = self._calculate_rgb_distance(source.rgb, target.rgb)
        
        # 簡易的な塗料調整量（RGB→CMYK近似）
        paint_adjustments = {
            'cyan_add': -r_diff * 0.5,      # 赤の逆がシアン
            'magenta_add': -g_diff * 0.5,   # 緑の逆がマゼンタ
            'yellow_add': -b_diff * 0.5,    # 青の逆がイエロー
            'white_add': max(r_diff, g_diff, b_diff) if max(r_diff, g_diff, b_diff) > 0 else 0,
            'black_add': -min(r_diff, g_diff, b_diff) if min(r_diff, g_diff, b_diff) < 0 else 0
        }
        
        mixing_ratios = {
            'red_component': abs(r_diff),
            'green_component': abs(g_diff),
            'blue_component': abs(b_diff)
        }
        
        # 信頼度は低め
        confidence = max(0.0, 0.5 - rgb_distance / 255.0)
        
        result = MixingResult(
            source_color=source,
            target_color=target,
            mixing_ratios=mixing_ratios,
            color_difference=rgb_distance,
            confidence=confidence,
            method='rgb_weighted',
            **paint_adjustments
        )
        
        return result
    
    def _calculate_rgb_distance(self, rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        """
        RGB距離計算
        
        Args:
            rgb1: RGB値1
            rgb2: RGB値2
            
        Returns:
            RGB距離
        """
        return np.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))
    
    def get_mixing_instructions(self, result: MixingResult) -> List[str]:
        """
        混合指示を文字列リストで取得
        
        Args:
            result: 計算結果
            
        Returns:
            混合指示のリスト
        """
        instructions = []
        adjustments = result.get_paint_adjustments()
        
        instructions.append(f"計算手法: {result.method.upper()}")
        instructions.append(f"色差: ΔE = {result.color_difference:.2f}")
        instructions.append(f"信頼度: {result.confidence:.1%}")
        instructions.append("")
        
        instructions.append("必要な塗料調整:")
        for paint_name, adjustment in adjustments.items():
            if abs(adjustment) > 0.01:  # 1%以上の調整のみ表示
                direction = "追加" if adjustment > 0 else "減少"
                instructions.append(f"  {paint_name}: {direction} {abs(adjustment):.1%}")
        
        return instructions
    
    def check_mixbox_availability(self) -> Dict[str, any]:
        """
        Mixboxライブラリの利用可能性をチェック
        
        Returns:
            チェック結果の辞書
        """
        result = {
            'available': self.mixbox_available,
            'version': None,
            'license': 'CC BY-NC 4.0 (非商用利用のみ)',
            'installation_notes': []
        }
        
        if self.mixbox_available:
            try:
                # バージョン情報を取得（可能な場合）
                if hasattr(self.mixbox, '__version__'):
                    result['version'] = self.mixbox.__version__
                result['installation_notes'].append("Mixboxが正常に動作しています")
            except Exception as e:
                result['installation_notes'].append(f"Mixbox情報取得エラー: {str(e)}")
        else:
            result['installation_notes'].extend([
                "Mixboxライブラリがインストールされていません",
                "インストール方法: pip install mixbox",
                "注意: 非商用利用のみ（CC BY-NC 4.0ライセンス）"
            ])
        
        return result