"""
色空間変換サービス

RGB⇔CMYK変換と変換ループ防止機能を提供
"""

from typing import Tuple, Optional
import numpy as np
from .models import ColorModel


class ColorSpaceConverter:
    """色空間変換を行うサービスクラス"""
    
    def __init__(self):
        self._conversion_stack = []  # 変換スタック（ループ防止用）
    
    @staticmethod
    def rgb_to_cmyk(r: int, g: int, b: int) -> Tuple[float, float, float, float]:
        """
        RGB値をCMYK値に変換
        
        Args:
            r, g, b: RGB値 (0-255)
            
        Returns:
            CMYK値のタプル (0.0-100.0)
        """
        # 正規化
        r_norm = r / 255.0
        g_norm = g / 255.0
        b_norm = b / 255.0
        
        # K値を計算
        k = 1 - max(r_norm, g_norm, b_norm)
        
        # 黒の場合
        if k == 1:
            return (0.0, 0.0, 0.0, 100.0)
        
        # CMY値を計算
        c = (1 - r_norm - k) / (1 - k) * 100.0
        m = (1 - g_norm - k) / (1 - k) * 100.0
        y = (1 - b_norm - k) / (1 - k) * 100.0
        k = k * 100.0
        
        return (c, m, y, k)
    
    @staticmethod
    def cmyk_to_rgb(c: float, m: float, y: float, k: float) -> Tuple[int, int, int]:
        """
        CMYK値をRGB値に変換
        
        Args:
            c, m, y, k: CMYK値 (0.0-100.0)
            
        Returns:
            RGB値のタプル (0-255)
        """
        # 正規化
        c_norm = c / 100.0
        m_norm = m / 100.0
        y_norm = y / 100.0
        k_norm = k / 100.0
        
        # RGB値を計算
        r = int(255 * (1 - c_norm) * (1 - k_norm))
        g = int(255 * (1 - m_norm) * (1 - k_norm))
        b = int(255 * (1 - y_norm) * (1 - k_norm))
        
        # 範囲制限
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))
        
        return (r, g, b)
    
    @staticmethod
    def cmyk_to_hex(c: float, m: float, y: float, k: float) -> str:
        """
        CMYK値を16進数カラーコードに変換
        
        Args:
            c, m, y, k: CMYK値 (0.0-100.0)
            
        Returns:
            16進数カラーコード (例: "#ff0000")
        """
        r, g, b = ColorSpaceConverter.cmyk_to_rgb(c, m, y, k)
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def prevent_conversion_loop(self, source: str, target: str) -> bool:
        """
        変換ループを防止
        
        Args:
            source: 変換元の色空間 ("rgb" or "cmyk")
            target: 変換先の色空間 ("rgb" or "cmyk")
            
        Returns:
            変換を実行すべきかどうか
        """
        conversion_key = f"{source}->{target}"
        
        # 同じ変換が既にスタックにある場合はループ
        if conversion_key in self._conversion_stack:
            return False
        
        # スタックに追加
        self._conversion_stack.append(conversion_key)
        
        # スタックサイズ制限（安全のため）
        if len(self._conversion_stack) > 10:
            self._conversion_stack = self._conversion_stack[-5:]
        
        return True
    
    def clear_conversion_stack(self):
        """変換スタックをクリア"""
        self._conversion_stack.clear()
    
    def safe_rgb_to_cmyk_conversion(self, color_model: ColorModel) -> bool:
        """
        安全なRGB→CMYK変換
        
        Args:
            color_model: 変換対象のColorModel
            
        Returns:
            変換が実行されたかどうか
        """
        if not self.prevent_conversion_loop("rgb", "cmyk"):
            return False
        
        try:
            c, m, y, k = self.rgb_to_cmyk(color_model.r, color_model.g, color_model.b)
            color_model.c = c
            color_model.m = m
            color_model.y = y
            color_model.k = k
            return True
        finally:
            # スタックから削除
            if "rgb->cmyk" in self._conversion_stack:
                self._conversion_stack.remove("rgb->cmyk")
    
    def safe_cmyk_to_rgb_conversion(self, color_model: ColorModel) -> bool:
        """
        安全なCMYK→RGB変換
        
        Args:
            color_model: 変換対象のColorModel
            
        Returns:
            変換が実行されたかどうか
        """
        if not self.prevent_conversion_loop("cmyk", "rgb"):
            return False
        
        try:
            r, g, b = self.cmyk_to_rgb(color_model.c, color_model.m, color_model.y, color_model.k)
            color_model.r = r
            color_model.g = g
            color_model.b = b
            return True
        finally:
            # スタックから削除
            if "cmyk->rgb" in self._conversion_stack:
                self._conversion_stack.remove("cmyk->rgb")
    
    @staticmethod
    def validate_rgb_values(r: int, g: int, b: int) -> Tuple[int, int, int]:
        """
        RGB値の範囲を検証・修正
        
        Args:
            r, g, b: RGB値
            
        Returns:
            修正されたRGB値
        """
        r = max(0, min(255, int(r)))
        g = max(0, min(255, int(g)))
        b = max(0, min(255, int(b)))
        return (r, g, b)
    
    @staticmethod
    def validate_cmyk_values(c: float, m: float, y: float, k: float) -> Tuple[float, float, float, float]:
        """
        CMYK値の範囲を検証・修正
        
        Args:
            c, m, y, k: CMYK値
            
        Returns:
            修正されたCMYK値
        """
        c = max(0.0, min(100.0, float(c)))
        m = max(0.0, min(100.0, float(m)))
        y = max(0.0, min(100.0, float(y)))
        k = max(0.0, min(100.0, float(k)))
        return (c, m, y, k)
    
    def test_conversion_accuracy(self, color_model: ColorModel, tolerance: float = 2.0) -> dict:
        """
        変換精度をテスト（往復変換）
        
        Args:
            color_model: テスト対象の色
            tolerance: 許容誤差
            
        Returns:
            テスト結果の辞書
        """
        original_rgb = (color_model.r, color_model.g, color_model.b)
        
        # RGB → CMYK → RGB
        c, m, y, k = self.rgb_to_cmyk(color_model.r, color_model.g, color_model.b)
        r_converted, g_converted, b_converted = self.cmyk_to_rgb(c, m, y, k)
        
        # 誤差計算
        error_r = abs(original_rgb[0] - r_converted)
        error_g = abs(original_rgb[1] - g_converted)
        error_b = abs(original_rgb[2] - b_converted)
        max_error = max(error_r, error_g, error_b)
        
        return {
            "original_rgb": original_rgb,
            "converted_cmyk": (c, m, y, k),
            "reconverted_rgb": (r_converted, g_converted, b_converted),
            "errors": (error_r, error_g, error_b),
            "max_error": max_error,
            "within_tolerance": max_error <= tolerance,
            "accuracy_percentage": max(0, 100 - (max_error / 255 * 100))
        }