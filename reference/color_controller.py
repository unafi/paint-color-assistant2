"""
色調コントローラーコンポーネント

RGB/CMYK値の詳細調整機能を提供
"""

import streamlit as st
from typing import Optional, Tuple, Callable
from .models import ColorModel, ColorPoint
from .color_space_converter import ColorSpaceConverter


class ColorControllerComponent:
    """
    色調コントローラーコンポーネント
    
    RGB/CMYK値の詳細調整UI（0-255範囲、矢印ボタン）
    CMYK値詳細調整UI（パーセンテージ、相互変換）
    単色見本表示機能
    リアルタイム色プレビュー更新
    """
    
    def __init__(self, initial_color: Optional[ColorModel] = None):
        self.color = initial_color or ColorModel()
        self.converter = ColorSpaceConverter()
    
    def render(self, label: str, key_prefix: str) -> Optional[ColorModel]:
        """
        色調コントローラーUIを描画
        
        Args:
            label: 表示ラベル（例: "色A", "色B"）
            key_prefix: Streamlitキーのプレフィックス
            
        Returns:
            調整された色モデル、色が設定されていない場合はNone
        """
        if not self.color or (self.color.r == 0 and self.color.g == 0 and self.color.b == 0):
            st.info(f"🔍 {label}が選択されていません\n\n画像上をクリックして色を選択してください")
            return None
        
        st.markdown(f"#### 🎨 {label} 色調コントローラー")
        
        # 図のイメージに合わせたレイアウト：目的色（左）+ RGB/CMYK調整（中央・右）
        col1, col2, col3 = st.columns([2, 3, 2])
        
        with col1:
            # 目的色表示（緑のエリア）
            st.markdown("**目的色**")
            self._render_color_preview_large()
        
        with col2:
            # RGB/CMYK調整（同時表示）
            st.markdown("**色調整**")
            updated_color = self._render_combined_controls(key_prefix)
            if updated_color:
                self.color = updated_color
        
        with col3:
            # 結果色表示（右側の色見本）
            st.markdown("**結果色**")
            self._render_result_color_bars()
        
        # リセットボタン（下部中央）
        col_reset1, col_reset2, col_reset3 = st.columns([1, 1, 1])
        with col_reset2:
            if st.button(f"🔄 {label}をリセット", key=f"{key_prefix}_reset", use_container_width=True):
                return None
        
        return self.color
    
    def _render_color_preview_large(self):
        """大きな色見本プレビューを表示（緑エリア風）"""
        color_hex = self.color.to_hex()
        
        # 大きめの色見本（緑の枠）
        st.markdown(f"""
        <div style="width: 150px; height: 200px; background-color: {color_hex}; 
                   border: 4px solid #90EE90; border-radius: 8px; margin: 10px auto;
                   box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>
        """, unsafe_allow_html=True)
        
        # 16進数表示
        st.caption(f"**HEX**: {color_hex}")
    
    def _render_combined_controls(self, key_prefix: str) -> Optional[ColorModel]:
        """RGB/CMYK調整コントロールを同時表示"""
        
        # RGB値の現在値を取得
        current_r, current_g, current_b = self.color.to_rgb_tuple()
        current_c, current_m, current_y, current_k = self.color.to_cmyk_tuple()
        
        # RGB調整
        st.markdown("**RGB**")
        new_r = self._render_compact_adjuster("R", current_r, 0, 255, f"{key_prefix}_r", "#ff0000")
        new_g = self._render_compact_adjuster("G", current_g, 0, 255, f"{key_prefix}_g", "#00ff00")
        new_b = self._render_compact_adjuster("B", current_b, 0, 255, f"{key_prefix}_b", "#0000ff")
        
        st.markdown("**CMYK**")
        new_c = self._render_compact_adjuster("C", current_c, 0.0, 100.0, f"{key_prefix}_c", "#00ffff", is_float=True)
        new_m = self._render_compact_adjuster("M", current_m, 0.0, 100.0, f"{key_prefix}_m", "#ff00ff", is_float=True)
        new_y = self._render_compact_adjuster("Y", current_y, 0.0, 100.0, f"{key_prefix}_y", "#ffff00", is_float=True)
        new_k = self._render_compact_adjuster("K", current_k, 0.0, 100.0, f"{key_prefix}_k", "#000000", is_float=True)
        
        # 値が変更された場合の処理（RGB優先）
        if (new_r, new_g, new_b) != (current_r, current_g, current_b):
            return ColorModel.from_rgb(new_r, new_g, new_b)
        elif (new_c, new_m, new_y, new_k) != (current_c, current_m, current_y, current_k):
            return ColorModel.from_cmyk(new_c, new_m, new_y, new_k)
        
        return None
    
    def _render_compact_adjuster(
        self, 
        label: str, 
        current_value: float, 
        min_val: float, 
        max_val: float, 
        key: str, 
        color: str,
        is_float: bool = False
    ) -> float:
        """
        コンパクトな値調整UI（図のイメージに合わせて）
        """
        col1, col2, col3, col4 = st.columns([1, 1, 2, 1])
        
        # 色見本（100%の単色）
        with col1:
            st.markdown(f"""
            <div style="width: 20px; height: 20px; background-color: {color}; 
                       border: 1px solid #333; margin: 2px;"></div>
            """, unsafe_allow_html=True)
        
        # ラベル
        with col2:
            st.markdown(f"**{label}**")
        
        # 矢印ボタンと値表示
        with col3:
            step = 0.1 if is_float else 1
            
            # 矢印ボタン
            btn_col1, btn_col2, btn_col3 = st.columns([1, 2, 1])
            
            with btn_col1:
                if st.button("◀", key=f"{key}_dec", help=f"{label}を減少"):
                    current_value = max(min_val, current_value - step)
            
            with btn_col2:
                # 値表示
                if is_float:
                    st.markdown(f"<div style='text-align: center; padding: 5px; border: 1px solid #ccc;'>{current_value:.1f}</div>", 
                               unsafe_allow_html=True)
                else:
                    st.markdown(f"<div style='text-align: center; padding: 5px; border: 1px solid #ccc;'>{int(current_value)}</div>", 
                               unsafe_allow_html=True)
            
            with btn_col3:
                if st.button("▶", key=f"{key}_inc", help=f"{label}を増加"):
                    current_value = min(max_val, current_value + step)
        
        # 単色表示（仕様に従って）
        with col4:
            single_color = self._get_single_color_for_component(label, current_value, is_float)
            st.markdown(f"""
            <div style="width: 30px; height: 30px; background-color: {single_color}; 
                       border: 1px solid #333; margin: 2px;"></div>
            """, unsafe_allow_html=True)
        
        return current_value
    
    def _render_result_color_bars(self):
        """結果色をバー形式で表示（右側）- 実際の混合色を表示"""
        # 実際の混合色（R:215, G:178, B:69のような色）
        color_hex = self.color.to_hex()
        
        # 結果色の大きな四角を表示（目的色と同じサイズ）
        st.markdown(f"""
        <div style="width: 150px; height: 200px; background-color: {color_hex}; 
                   border: 2px solid #333; border-radius: 8px; margin: 10px auto;
                   box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>
        """, unsafe_allow_html=True)
        
        # RGB値表示
        rgb = self.color.to_rgb_tuple()
        st.caption(f"**RGB**: {rgb[0]}, {rgb[1]}, {rgb[2]}")
    
    def _get_single_color_for_component(self, label: str, value: float, is_float: bool) -> str:
        """
        各コンポーネントの単色を取得
        例：R:215なら R:215, G:0, B:0の色
        """
        if is_float:
            # CMYK値の場合
            if label == "C":
                # C:value, M:0, Y:0, K:残%
                k_remaining = 100.0 - value
                return self.converter.cmyk_to_hex(value, 0.0, 0.0, k_remaining)
            elif label == "M":
                # C:0, M:value, Y:0, K:残%
                k_remaining = 100.0 - value
                return self.converter.cmyk_to_hex(0.0, value, 0.0, k_remaining)
            elif label == "Y":
                # C:0, M:0, Y:value, K:残%
                k_remaining = 100.0 - value
                return self.converter.cmyk_to_hex(0.0, 0.0, value, k_remaining)
            elif label == "K":
                # C:0, M:0, Y:0, K:value
                return self.converter.cmyk_to_hex(0.0, 0.0, 0.0, value)
        else:
            # RGB値の場合
            int_value = int(value)
            if label == "R":
                # R:value, G:0, B:0
                return f"rgb({int_value}, 0, 0)"
            elif label == "G":
                # R:0, G:value, B:0
                return f"rgb(0, {int_value}, 0)"
            elif label == "B":
                # R:0, G:0, B:value
                return f"rgb(0, 0, {int_value})"
        
        return "#000000"  # デフォルト
    def _render_rgb_controls(self, key_prefix: str) -> Optional[ColorModel]:
        """RGB調整コントロールを描画（レガシー - 使用しない）"""
        pass
    
    def _render_cmyk_controls(self, key_prefix: str) -> Optional[ColorModel]:
        """CMYK調整コントロールを描画（レガシー - 使用しない）"""
        pass
    
    def _render_value_adjuster(self, *args, **kwargs) -> float:
        """値調整UIを描画（レガシー - 使用しない）"""
        pass
    
    def update_color(self, color_point: ColorPoint):
        """ColorPointから色を更新"""
        if color_point:
            self.color = color_point.to_color_model()
    
    def update_color_model(self, color_model: ColorModel):
        """ColorModelから色を更新"""
        if color_model:
            self.color = color_model.copy()
    
    def get_current_color(self) -> Optional[ColorModel]:
        """現在の色を取得"""
        return self.color.copy() if self.color else None