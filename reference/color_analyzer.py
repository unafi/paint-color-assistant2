"""
色分析・抽出機能

画像からの色抽出、色空間変換、色差計算を担当
"""

import logging
from typing import Tuple, Optional
from PIL import Image
import numpy as np
import streamlit as st

from .models import ColorPoint


class ColorAnalyzer:
    """色分析・抽出機能クラス"""
    
    def __init__(self):
        """初期化"""
        self.logger = logging.getLogger(__name__)
        self._setup_colorspacious()
    
    def _setup_colorspacious(self):
        """colorspaciousライブラリの設定"""
        try:
            import colorspacious
            self.colorspacious = colorspacious
            self.colorspacious_available = True
            self.logger.info("colorspacious library loaded successfully")
        except ImportError:
            self.colorspacious = None
            self.colorspacious_available = False
            st.warning("⚠️ colorspaciousライブラリが利用できません。高精度な色空間変換が無効になります。")
    
    def extract_color_at_point(self, image: Image.Image, x: int, y: int, image_path: str = "") -> Optional[ColorPoint]:
        """
        指定座標の色を抽出
        
        Args:
            image: PIL Image オブジェクト
            x: X座標
            y: Y座標
            image_path: 画像パス（オプション）
            
        Returns:
            ColorPoint オブジェクト、エラー時はNone
        """
        try:
            # 座標の妥当性チェック
            if not self._validate_coordinates(image, x, y):
                self.logger.error(f"Invalid coordinates: ({x}, {y}) for image size {image.size}")
                return None
            
            # RGB値を取得
            rgb = image.getpixel((x, y))
            if isinstance(rgb, int):  # グレースケールの場合
                rgb = (rgb, rgb, rgb)
            elif len(rgb) == 4:  # RGBA の場合、アルファチャンネルを除去
                rgb = rgb[:3]
            
            # ColorPointオブジェクトを作成
            color_point = ColorPoint(
                x=x,
                y=y,
                rgb=rgb,
                image_path=image_path
            )
            
            # CMYK値を計算
            color_point.cmyk = self.rgb_to_cmyk(rgb)
            
            # Lab値を計算（colorspaciousが利用可能な場合）
            if self.colorspacious_available:
                color_point.lab = self.rgb_to_lab(rgb)
            
            self.logger.info(f"Extracted color at ({x}, {y}): RGB{rgb}")
            return color_point
            
        except Exception as e:
            self.logger.error(f"Failed to extract color at ({x}, {y}): {str(e)}")
            return None
    
    def _validate_coordinates(self, image: Image.Image, x: int, y: int) -> bool:
        """
        座標の妥当性をチェック
        
        Args:
            image: PIL Image オブジェクト
            x: X座標
            y: Y座標
            
        Returns:
            妥当な場合True
        """
        return 0 <= x < image.width and 0 <= y < image.height
    
    def rgb_to_cmyk(self, rgb: Tuple[int, int, int]) -> Tuple[float, float, float, float]:
        """
        RGB→CMYK変換
        
        Args:
            rgb: RGB値 (0-255)
            
        Returns:
            CMYK値 (0-1)
        """
        try:
            # 正規化 (0-255 → 0-1)
            r, g, b = [c / 255.0 for c in rgb]
            
            # K（黒）成分の計算
            k = 1 - max(r, g, b)
            
            if k == 1:
                return (0.0, 0.0, 0.0, 1.0)
            
            # CMY成分の計算
            c = (1 - r - k) / (1 - k)
            m = (1 - g - k) / (1 - k)
            y = (1 - b - k) / (1 - k)
            
            return (c, m, y, k)
            
        except Exception as e:
            self.logger.error(f"RGB to CMYK conversion failed: {str(e)}")
            return (0.0, 0.0, 0.0, 0.0)
    
    def rgb_to_lab(self, rgb: Tuple[int, int, int]) -> Optional[Tuple[float, float, float]]:
        """
        RGB→Lab変換（colorspacious使用）
        
        Args:
            rgb: RGB値 (0-255)
            
        Returns:
            Lab値、エラー時はNone
        """
        if not self.colorspacious_available:
            return None
        
        try:
            # RGB値を正規化 (0-255 → 0-1)
            rgb_normalized = [c / 255.0 for c in rgb]
            
            # sRGB → Lab変換
            lab = self.colorspacious.cspace_convert(
                rgb_normalized, 
                "sRGB1", 
                "CIELab"
            )
            
            return tuple(lab)
            
        except Exception as e:
            self.logger.error(f"RGB to Lab conversion failed: {str(e)}")
            return None
    
    def calculate_color_difference(self, color1: ColorPoint, color2: ColorPoint) -> Optional[float]:
        """
        色差計算（ΔE2000）
        
        Args:
            color1: 色1
            color2: 色2
            
        Returns:
            色差値、エラー時はNone
        """
        if not self.colorspacious_available:
            # colorspaciousが利用できない場合は簡易的なRGB距離を計算
            return self._calculate_rgb_distance(color1.rgb, color2.rgb)
        
        if color1.lab is None or color2.lab is None:
            return None
        
        try:
            delta_e = self.colorspacious.delta_E(
                color1.lab, 
                color2.lab, 
                input_space="CIELab"
            )
            return float(delta_e)
            
        except Exception as e:
            self.logger.error(f"Color difference calculation failed: {str(e)}")
            return None
    
    def _calculate_rgb_distance(self, rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        """
        簡易的なRGB距離計算
        
        Args:
            rgb1: RGB値1
            rgb2: RGB値2
            
        Returns:
            RGB距離
        """
        return np.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))
    
    def get_color_description(self, color_point: ColorPoint) -> str:
        """
        色の説明文を生成
        
        Args:
            color_point: 色情報
            
        Returns:
            色の説明文
        """
        rgb = color_point.rgb
        
        # 基本的な色名判定
        r, g, b = rgb
        
        if r > 200 and g > 200 and b > 200:
            base_color = "白系"
        elif r < 50 and g < 50 and b < 50:
            base_color = "黒系"
        elif r > g and r > b:
            if g > 100 or b > 100:
                base_color = "ピンク系" if g > b else "紫系"
            else:
                base_color = "赤系"
        elif g > r and g > b:
            base_color = "緑系"
        elif b > r and b > g:
            base_color = "青系"
        elif r > 150 and g > 150 and b < 100:
            base_color = "黄系"
        elif r > 150 and g < 100 and b < 100:
            base_color = "オレンジ系"
        else:
            base_color = "グレー系"
        
        return f"{base_color} RGB({r}, {g}, {b})"