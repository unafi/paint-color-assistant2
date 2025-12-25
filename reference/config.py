"""
アプリケーション設定

デバッグ情報表示やその他の設定を管理
"""

import os
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

# デバッグ情報表示設定（.envから取得、デフォルトはFalse）
def get_debug_setting() -> bool:
    """DEBUG環境変数を取得してbooleanに変換"""
    debug_str = os.getenv('DEBUG', 'False').lower()
    return debug_str in ('true', '1', 'yes', 'on')

DEBUG_INFO_ENABLED = get_debug_setting()

# UI設定
UI_CONFIG = {
    "show_debug_info": DEBUG_INFO_ENABLED,
    "show_click_coordinates": DEBUG_INFO_ENABLED,  # クリック座標表示
    "show_color_extraction_info": DEBUG_INFO_ENABLED,  # 色抽出情報表示
    "compact_layout": True,  # コンパクトレイアウト使用
}

# レスポンシブ設定
RESPONSIVE_CONFIG = {
    "enable_device_selector": DEBUG_INFO_ENABLED,  # デバイス選択UI表示
}

# その他の環境変数設定
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
MAX_IMAGE_SIZE_MB = int(os.getenv('MAX_IMAGE_SIZE_MB', '10'))
MAX_DISPLAY_WIDTH = int(os.getenv('MAX_DISPLAY_WIDTH', '800'))
MAX_DISPLAY_HEIGHT = int(os.getenv('MAX_DISPLAY_HEIGHT', '600'))
DEFAULT_CALCULATION_METHOD = os.getenv('DEFAULT_CALCULATION_METHOD', 'mixbox')
FALLBACK_METHOD = os.getenv('FALLBACK_METHOD', 'cmyk')
CALCULATION_PRECISION = float(os.getenv('CALCULATION_PRECISION', '0.01'))
THEME = os.getenv('THEME', 'light')
LANGUAGE = os.getenv('LANGUAGE', 'ja')