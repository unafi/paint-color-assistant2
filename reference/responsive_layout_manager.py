"""
レスポンシブレイアウト管理

PC/スマホ/タブレット対応のレイアウト管理機能を提供
"""

import streamlit as st
from typing import Dict, Any, Tuple
from .models import DeviceType, SessionStateManager


class ResponsiveLayoutManager:
    """レスポンシブレイアウトを管理するクラス"""
    
    def __init__(self):
        self.device_type = self.detect_device()
        self.layout_config = self._get_layout_config()
    
    def detect_device(self) -> DeviceType:
        """
        デバイスタイプを検出
        
        Returns:
            検出されたデバイスタイプ
        """
        # Streamlitでは直接的なデバイス検出は困難なため、
        # 画面幅に基づいた推定を行う
        
        # セッション状態からデバイス情報を取得（ユーザー設定があれば）
        if hasattr(st.session_state, 'device_type_override'):
            return st.session_state.device_type_override
        
        # デフォルトはデスクトップ（Streamlitの特性上）
        # 実際のプロダクションでは、JavaScriptを使用してより正確な検出が可能
        return DeviceType.DESKTOP
    
    def _get_layout_config(self) -> Dict[str, Any]:
        """
        デバイスタイプに応じたレイアウト設定を取得
        
        Returns:
            レイアウト設定の辞書
        """
        if self.device_type == DeviceType.DESKTOP:
            return {
                "columns": 2,
                "layout": "horizontal",
                "image_max_width": 400,
                "image_max_height": 300,
                "use_sidebar": False,
                "button_size": "normal",
                "spacing": "normal",
                "file_selector_type": "path_with_browse"
            }
        elif self.device_type == DeviceType.TABLET:
            return {
                "columns": 1,
                "layout": "vertical",
                "image_max_width": 350,
                "image_max_height": 250,
                "use_sidebar": False,
                "button_size": "large",
                "spacing": "compact",
                "file_selector_type": "photo_button"
            }
        else:  # MOBILE
            return {
                "columns": 1,
                "layout": "vertical",
                "image_max_width": 300,
                "image_max_height": 200,
                "use_sidebar": False,
                "button_size": "large",
                "spacing": "compact",
                "file_selector_type": "photo_button"
            }
    
    def get_layout_config(self) -> Dict[str, Any]:
        """レイアウト設定を取得"""
        return self.layout_config.copy()
    
    def is_mobile(self) -> bool:
        """モバイルデバイスかどうか"""
        return self.device_type == DeviceType.MOBILE
    
    def is_desktop(self) -> bool:
        """デスクトップデバイスかどうか"""
        return self.device_type == DeviceType.DESKTOP
    
    def is_tablet(self) -> bool:
        """タブレットデバイスかどうか"""
        return self.device_type == DeviceType.TABLET
    
    def get_columns_config(self) -> Tuple[int, str]:
        """
        カラム設定を取得
        
        Returns:
            (カラム数, レイアウトタイプ)
        """
        return (self.layout_config["columns"], self.layout_config["layout"])
    
    def get_image_size_config(self) -> Tuple[int, int]:
        """
        画像サイズ設定を取得
        
        Returns:
            (最大幅, 最大高さ)
        """
        return (
            self.layout_config["image_max_width"],
            self.layout_config["image_max_height"]
        )
    
    def get_file_selector_type(self) -> str:
        """
        ファイル選択UIタイプを取得
        
        Returns:
            ファイル選択UIタイプ
        """
        return self.layout_config["file_selector_type"]
    
    def create_layout_columns(self):
        """
        レイアウトに応じたカラムを作成
        
        Returns:
            Streamlitカラムオブジェクト
        """
        if self.layout_config["layout"] == "horizontal":
            return st.columns(2)
        else:
            # 縦積みレイアウトの場合は、コンテナを返す
            return [st.container(), st.container()]
    
    def apply_responsive_styles(self):
        """
        レスポンシブスタイルを適用
        """
        if self.is_mobile():
            # モバイル用CSS
            st.markdown("""
            <style>
            .stButton > button {
                width: 100%;
                height: 3rem;
                font-size: 1.1rem;
            }
            .stTextInput > div > div > input {
                font-size: 1rem;
            }
            .stSelectbox > div > div > select {
                font-size: 1rem;
            }
            </style>
            """, unsafe_allow_html=True)
        
        elif self.is_tablet():
            # タブレット用CSS
            st.markdown("""
            <style>
            .stButton > button {
                width: 100%;
                height: 2.5rem;
                font-size: 1rem;
            }
            </style>
            """, unsafe_allow_html=True)
    
    def render_device_selector(self):
        """
        デバイスタイプ選択UI（デバッグ用）
        """
        with st.expander("🔧 デバイス設定（デバッグ用）", expanded=False):
            device_options = {
                "デスクトップ": DeviceType.DESKTOP,
                "タブレット": DeviceType.TABLET,
                "スマートフォン": DeviceType.MOBILE
            }
            
            current_device_name = next(
                name for name, device in device_options.items() 
                if device == self.device_type
            )
            
            selected_device_name = st.selectbox(
                "デバイスタイプを選択",
                options=list(device_options.keys()),
                index=list(device_options.keys()).index(current_device_name),
                key="device_type_selector"
            )
            
            selected_device = device_options[selected_device_name]
            
            if selected_device != self.device_type:
                st.session_state.device_type_override = selected_device
                st.rerun()
            
            # 現在の設定を表示
            st.json(self.layout_config)
    
    def get_button_props(self) -> Dict[str, Any]:
        """
        ボタンのプロパティを取得
        
        Returns:
            ボタンプロパティの辞書
        """
        if self.layout_config["button_size"] == "large":
            return {
                "use_container_width": True,
                "type": "primary"
            }
        else:
            return {}
    
    def get_spacing_config(self) -> str:
        """
        スペーシング設定を取得
        
        Returns:
            スペーシング設定
        """
        return self.layout_config["spacing"]
    
    def add_responsive_spacing(self):
        """レスポンシブスペーシングを追加"""
        if self.get_spacing_config() == "compact":
            st.markdown("<div style='margin: 0.5rem 0;'></div>", unsafe_allow_html=True)
        else:
            st.markdown("<div style='margin: 1rem 0;'></div>", unsafe_allow_html=True)
    
    def update_session_state(self, session_manager: SessionStateManager):
        """
        セッション状態を更新
        
        Args:
            session_manager: セッション管理オブジェクト
        """
        session_manager.device_type = self.device_type
        session_manager.layout_config = self.layout_config