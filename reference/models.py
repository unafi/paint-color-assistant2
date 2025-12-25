"""
データモデル定義

塗装色混合アシスタントで使用するデータ構造を定義
画面機能拡張要件に対応したColorModel, ImageModelを含む
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Tuple, Dict, Optional, Union, Any
from enum import Enum
import numpy as np
from PIL import Image


class DeviceType(Enum):
    """デバイスタイプ列挙"""
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"


@dataclass
class ColorModel:
    """
    色情報を管理するデータクラス（拡張版）
    RGB/CMYK相互変換と永久ループ防止機能を含む
    """
    r: int = 0  # 0-255
    g: int = 0  # 0-255
    b: int = 0  # 0-255
    c: float = 0.0  # 0.0-100.0
    m: float = 0.0  # 0.0-100.0
    y: float = 0.0  # 0.0-100.0
    k: float = 0.0  # 0.0-100.0
    
    # 変換ループ防止用フラグ
    _updating: bool = field(default=False, init=False)
    
    def to_rgb_tuple(self) -> Tuple[int, int, int]:
        """RGB値をタプルで取得"""
        return (self.r, self.g, self.b)
    
    def to_cmyk_tuple(self) -> Tuple[float, float, float, float]:
        """CMYK値をタプルで取得"""
        return (self.c, self.m, self.y, self.k)
    
    def to_hex(self) -> str:
        """16進数カラーコードを取得"""
        return f"#{self.r:02x}{self.g:02x}{self.b:02x}"
    
    def update_from_rgb(self, r: int, g: int, b: int):
        """RGB値からCMYK値を更新（ループ防止付き）"""
        if self._updating:
            return
        
        self._updating = True
        try:
            # RGB値の範囲チェック
            self.r = max(0, min(255, r))
            self.g = max(0, min(255, g))
            self.b = max(0, min(255, b))
            
            # CMYK値を計算
            self._calculate_cmyk_from_rgb()
        finally:
            self._updating = False
    
    def update_from_cmyk(self, c: float, m: float, y: float, k: float):
        """CMYK値からRGB値を更新（ループ防止付き）"""
        if self._updating:
            return
        
        self._updating = True
        try:
            # CMYK値の範囲チェック
            self.c = max(0.0, min(100.0, c))
            self.m = max(0.0, min(100.0, m))
            self.y = max(0.0, min(100.0, y))
            self.k = max(0.0, min(100.0, k))
            
            # RGB値を計算
            self._calculate_rgb_from_cmyk()
        finally:
            self._updating = False
    
    def _calculate_cmyk_from_rgb(self):
        """RGB値からCMYK値を計算"""
        r_norm = self.r / 255.0
        g_norm = self.g / 255.0
        b_norm = self.b / 255.0
        
        k = 1 - max(r_norm, g_norm, b_norm)
        
        if k == 1:
            self.c = self.m = self.y = 0.0
        else:
            self.c = (1 - r_norm - k) / (1 - k) * 100.0
            self.m = (1 - g_norm - k) / (1 - k) * 100.0
            self.y = (1 - b_norm - k) / (1 - k) * 100.0
        
        self.k = k * 100.0
    
    def _calculate_rgb_from_cmyk(self):
        """CMYK値からRGB値を計算"""
        c_norm = self.c / 100.0
        m_norm = self.m / 100.0
        y_norm = self.y / 100.0
        k_norm = self.k / 100.0
        
        self.r = int(255 * (1 - c_norm) * (1 - k_norm))
        self.g = int(255 * (1 - m_norm) * (1 - k_norm))
        self.b = int(255 * (1 - y_norm) * (1 - k_norm))
    
    def copy(self) -> 'ColorModel':
        """ColorModelのコピーを作成"""
        return ColorModel(
            r=self.r, g=self.g, b=self.b,
            c=self.c, m=self.m, y=self.y, k=self.k
        )
    
    @classmethod
    def from_rgb(cls, r: int, g: int, b: int) -> 'ColorModel':
        """RGB値からColorModelを作成"""
        color = cls()
        color.update_from_rgb(r, g, b)
        return color
    
    @classmethod
    def from_cmyk(cls, c: float, m: float, y: float, k: float) -> 'ColorModel':
        """CMYK値からColorModelを作成"""
        color = cls()
        color.update_from_cmyk(c, m, y, k)
        return color


@dataclass
class ImageModel:
    """
    画像情報を管理するデータクラス
    """
    file_path: str
    image_data: Optional[np.ndarray] = None
    pil_image: Optional[Image.Image] = None
    width: int = 0
    height: int = 0
    format: str = ""
    size_mb: float = 0.0
    
    def __post_init__(self):
        """初期化後の処理"""
        if self.pil_image is not None:
            self.width = self.pil_image.width
            self.height = self.pil_image.height
            self.format = self.pil_image.format or "Unknown"
            
            # 画像データをnumpy配列に変換
            self.image_data = np.array(self.pil_image)
    
    def get_color_at_position(self, x: int, y: int) -> Optional[ColorModel]:
        """指定座標の色を取得"""
        if self.image_data is None:
            return None
        
        # 座標の範囲チェック
        if x < 0 or x >= self.width or y < 0 or y >= self.height:
            return None
        
        try:
            # RGB値を取得
            if len(self.image_data.shape) == 3:
                rgb = self.image_data[y, x, :3]  # RGBチャンネルのみ
            else:
                # グレースケール画像の場合
                gray = self.image_data[y, x]
                rgb = [gray, gray, gray]
            
            return ColorModel.from_rgb(int(rgb[0]), int(rgb[1]), int(rgb[2]))
        
        except (IndexError, ValueError):
            return None
    
    def resize_for_display(self, max_width: int = 800, max_height: int = 600) -> 'ImageModel':
        """表示用にリサイズした新しいImageModelを作成"""
        if self.pil_image is None:
            return self
        
        # アスペクト比を保持してリサイズ
        img_copy = self.pil_image.copy()
        img_copy.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        return ImageModel(
            file_path=self.file_path,
            pil_image=img_copy,
            format=self.format,
            size_mb=self.size_mb
        )
    
    def get_info_dict(self) -> Dict[str, Any]:
        """画像情報を辞書形式で取得"""
        return {
            "サイズ": f"{self.width}x{self.height}",
            "フォーマット": self.format,
            "ファイルサイズ": f"{self.size_mb:.1f}MB" if self.size_mb > 0 else "不明"
        }


@dataclass
class ColorPoint:
    """画像上の色選択点を表すデータクラス（既存との互換性維持）"""
    
    x: int                                      # X座標
    y: int                                      # Y座標
    rgb: Tuple[int, int, int]                  # RGB値 (0-255)
    cmyk: Optional[Tuple[float, float, float, float]] = None  # CMYK値 (0-1)
    lab: Optional[Tuple[float, float, float]] = None          # Lab値
    image_path: str = ""                       # 元画像パス
    timestamp: Optional[datetime] = None       # 選択時刻
    
    def __post_init__(self):
        """初期化後の処理"""
        if self.timestamp is None:
            self.timestamp = datetime.now()
    
    def to_color_model(self) -> ColorModel:
        """ColorModelに変換"""
        return ColorModel.from_rgb(self.rgb[0], self.rgb[1], self.rgb[2])


@dataclass
class MixingResult:
    """混合計算結果を表すデータクラス"""
    
    source_color: ColorPoint                   # 元の色
    target_color: ColorPoint                   # 目標色
    mixing_ratios: Dict[str, float]           # 混合比率
    color_difference: float                    # 色差（ΔE）
    confidence: float                          # 計算信頼度 (0-1)
    method: str                               # 使用した計算手法
    
    # 塗料成分別の追加量 (-1 to 1, 負の値は減算を意味)
    cyan_add: float = 0.0
    magenta_add: float = 0.0
    yellow_add: float = 0.0
    white_add: float = 0.0
    black_add: float = 0.0
    
    def get_paint_adjustments(self) -> Dict[str, float]:
        """塗料調整量を辞書形式で取得"""
        return {
            'シアン': self.cyan_add,
            'マゼンタ': self.magenta_add,
            'イエロー': self.yellow_add,
            '白': self.white_add,
            '黒': self.black_add
        }


@dataclass
class SessionStateManager:
    """
    セッション状態を管理するクラス
    """
    device_type: DeviceType = DeviceType.DESKTOP
    layout_config: Dict[str, Any] = field(default_factory=dict)
    color_update_source: Optional[str] = None
    
    def __post_init__(self):
        """初期化後の処理"""
        if not self.layout_config:
            self.layout_config = self._get_default_layout_config()
    
    def _get_default_layout_config(self) -> Dict[str, Any]:
        """デフォルトレイアウト設定を取得"""
        if self.device_type == DeviceType.DESKTOP:
            return {
                "columns": 2,
                "layout": "horizontal",
                "image_max_width": 400,
                "image_max_height": 300
            }
        else:
            return {
                "columns": 1,
                "layout": "vertical",
                "image_max_width": 350,
                "image_max_height": 250
            }
    
    def update_device_type(self, device_type: DeviceType):
        """デバイスタイプを更新"""
        self.device_type = device_type
        self.layout_config = self._get_default_layout_config()


@dataclass
class AppState:
    """アプリケーションの状態を管理するデータクラス（拡張版）"""
    
    # 既存フィールド（互換性維持）
    image_a_path: Optional[str] = None         # 画像Aのパス
    image_b_path: Optional[str] = None         # 画像Bのパス
    color_a: Optional[ColorPoint] = None       # 選択された色A
    color_b: Optional[ColorPoint] = None       # 選択された色B
    mixing_result: Optional[MixingResult] = None  # 計算結果
    
    # 新規フィールド（機能拡張用）
    image_a_model: Optional[ImageModel] = None  # 画像Aモデル
    image_b_model: Optional[ImageModel] = None  # 画像Bモデル
    adjusted_color_a: Optional[ColorModel] = None  # 調整後の色A
    adjusted_color_b: Optional[ColorModel] = None  # 調整後の色B
    session_manager: Optional[SessionStateManager] = None  # セッション管理
    
    def __post_init__(self):
        """初期化後の処理"""
        if self.session_manager is None:
            self.session_manager = SessionStateManager()
    
    def is_ready_for_calculation(self) -> bool:
        """計算実行可能かチェック"""
        return (self.color_a is not None and 
                self.color_b is not None)
    
    def is_ready_for_advanced_calculation(self) -> bool:
        """高度な計算実行可能かチェック"""
        return (self.adjusted_color_a is not None and 
                self.adjusted_color_b is not None)
    
    def reset_colors(self):
        """色選択をリセット"""
        self.color_a = None
        self.color_b = None
        self.adjusted_color_a = None
        self.adjusted_color_b = None
        self.mixing_result = None
    
    def update_image_a(self, image_model: ImageModel):
        """画像Aを更新"""
        self.image_a_model = image_model
        self.image_a_path = image_model.file_path
        # 色選択をリセット
        self.color_a = None
        self.adjusted_color_a = None
        self.mixing_result = None
    
    def update_image_b(self, image_model: ImageModel):
        """画像Bを更新"""
        self.image_b_model = image_model
        self.image_b_path = image_model.file_path
        # 色選択をリセット
        self.color_b = None
        self.adjusted_color_b = None
        self.mixing_result = None