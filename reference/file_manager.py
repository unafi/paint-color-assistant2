"""
ファイル管理機能

画像ファイルの読み込み、形式変換、EXIF処理を担当
"""

import os
import logging
from typing import Optional, Tuple, Dict, Any
from PIL import Image, ExifTags
import streamlit as st


class FileManager:
    """画像ファイル管理クラス"""
    
    # サポートする画像形式
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.heic', '.heif'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_DISPLAY_SIZE = (800, 600)     # 表示用最大サイズ
    
    def __init__(self):
        """初期化"""
        self._setup_heif_support()
        self._setup_logging()
    
    def _setup_logging(self):
        """ログ設定"""
        self.logger = logging.getLogger(__name__)
    
    def _setup_heif_support(self):
        """HEIF/HEIC形式のサポートを設定"""
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
            self.heif_supported = True
        except ImportError:
            self.heif_supported = False
            st.warning("⚠️ HEIC/HEIF形式のサポートが利用できません。pillow-heifをインストールしてください。")
    
    def is_supported_format(self, file_path: str) -> bool:
        """
        ファイル形式がサポートされているかチェック
        
        Args:
            file_path: ファイルパス
            
        Returns:
            サポートされている場合True
        """
        _, ext = os.path.splitext(file_path.lower())
        return ext in self.SUPPORTED_FORMATS
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """
        ファイルの妥当性をチェック
        
        Args:
            file_path: ファイルパス
            
        Returns:
            (is_valid, error_message)
        """
        if not file_path or not file_path.strip():
            return False, "ファイルパスが指定されていません"
        
        if not os.path.exists(file_path):
            return False, "ファイルが見つかりません"
        
        if not os.path.isfile(file_path):
            return False, "指定されたパスはファイルではありません"
        
        # ファイルサイズチェック
        try:
            file_size = os.path.getsize(file_path)
            if file_size > self.MAX_FILE_SIZE:
                size_mb = self.MAX_FILE_SIZE // (1024*1024)
                return False, f"ファイルサイズが大きすぎます（最大{size_mb}MB）"
        except OSError as e:
            return False, f"ファイルサイズの取得に失敗しました: {str(e)}"
        
        # 拡張子チェック
        if not self.is_supported_format(file_path):
            supported = ', '.join(sorted(self.SUPPORTED_FORMATS))
            return False, f"サポートされていない形式です。対応形式: {supported}"
        
        # HEIC/HEIF形式の特別チェック
        _, ext = os.path.splitext(file_path.lower())
        if ext in {'.heic', '.heif'} and not self.heif_supported:
            return False, "HEIC/HEIF形式のサポートが無効です。pillow-heifをインストールしてください。"
        
        return True, ""
    
    def load_image(self, file_path: str) -> Optional[Image.Image]:
        """
        画像ファイルを読み込み
        
        Args:
            file_path: 画像ファイルパス
            
        Returns:
            PIL Image オブジェクト、エラー時はNone
        """
        try:
            # ファイル妥当性チェック
            is_valid, error_msg = self.validate_file(file_path)
            if not is_valid:
                st.error(f"❌ ファイル読み込みエラー: {error_msg}")
                self.logger.error(f"File validation failed: {error_msg} for {file_path}")
                return None
            
            # 画像読み込み
            self.logger.info(f"Loading image: {file_path}")
            image = Image.open(file_path)
            
            # EXIF情報に基づく回転補正
            image = self._fix_image_orientation(image)
            
            # RGBモードに変換（透明度情報を削除）
            if image.mode != 'RGB':
                original_mode = image.mode
                image = image.convert('RGB')
                self.logger.info(f"Converted image mode from {original_mode} to RGB")
            
            self.logger.info(f"Successfully loaded image: {image.size}")
            return image
            
        except Exception as e:
            error_msg = f"画像読み込みエラー: {str(e)}"
            st.error(f"❌ {error_msg}")
            self.logger.error(f"Failed to load image {file_path}: {str(e)}")
            return None
    
    def _fix_image_orientation(self, image: Image.Image) -> Image.Image:
        """
        EXIF情報に基づいて画像の向きを補正
        
        Args:
            image: PIL Image オブジェクト
            
        Returns:
            回転補正された画像
        """
        try:
            # EXIF情報を取得
            exif = image._getexif()
            if exif is not None:
                # Orientation タグを探す
                for tag, value in exif.items():
                    if tag in ExifTags.TAGS and ExifTags.TAGS[tag] == 'Orientation':
                        self.logger.info(f"EXIF Orientation found: {value}")
                        # 回転補正を適用
                        if value == 3:
                            image = image.rotate(180, expand=True)
                            self.logger.info("Applied 180° rotation")
                        elif value == 6:
                            image = image.rotate(270, expand=True)
                            self.logger.info("Applied 270° rotation")
                        elif value == 8:
                            image = image.rotate(90, expand=True)
                            self.logger.info("Applied 90° rotation")
                        break
        except (AttributeError, KeyError, TypeError) as e:
            # EXIF情報がない場合やエラーの場合はそのまま返す
            self.logger.debug(f"No EXIF orientation data or error: {str(e)}")
        
        return image
    
    def resize_for_display(self, image: Image.Image) -> Image.Image:
        """
        表示用にリサイズ
        
        Args:
            image: PIL Image オブジェクト
            
        Returns:
            リサイズされた画像
        """
        # アスペクト比を保持してリサイズ
        image.thumbnail(self.MAX_DISPLAY_SIZE, Image.Resampling.LANCZOS)
        return image
    
    def get_image_info(self, image: Image.Image, file_path: str = "") -> Dict[str, Any]:
        """
        画像の基本情報を取得
        
        Args:
            image: PIL Image オブジェクト
            file_path: ファイルパス（オプション）
            
        Returns:
            画像情報の辞書
        """
        info = {
            'サイズ': f"{image.width} x {image.height}",
            'モード': image.mode,
            'フォーマット': image.format or '不明'
        }
        
        # ファイルサイズ情報を追加
        if file_path and os.path.exists(file_path):
            try:
                file_size = os.path.getsize(file_path)
                if file_size < 1024:
                    info['ファイルサイズ'] = f"{file_size} B"
                elif file_size < 1024 * 1024:
                    info['ファイルサイズ'] = f"{file_size / 1024:.1f} KB"
                else:
                    info['ファイルサイズ'] = f"{file_size / (1024 * 1024):.1f} MB"
            except OSError:
                info['ファイルサイズ'] = '不明'
        
        return info
    
    def get_supported_formats_display(self) -> str:
        """
        サポートされている形式を表示用文字列で取得
        
        Returns:
            サポート形式の文字列
        """
        formats = sorted(self.SUPPORTED_FORMATS)
        return ', '.join(formats)
    
    def clean_file_path(self, file_path: str) -> str:
        """
        ファイルパスをクリーンアップ（ダブルクォート除去など）
        
        Args:
            file_path: 元のファイルパス
            
        Returns:
            クリーンアップされたファイルパス
        """
        if not file_path:
            return ""
        
        # ダブルクォートを除去
        cleaned = file_path.strip().strip('"').strip("'")
        
        # パスの正規化
        try:
            cleaned = os.path.normpath(cleaned)
        except (ValueError, TypeError):
            pass
        
        return cleaned