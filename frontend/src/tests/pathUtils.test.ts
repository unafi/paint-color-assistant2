/**
 * パス処理ユーティリティのテスト
 */

import { cleanFilePath, validateFilePath, isSupportedImageExtension } from '../utils/pathUtils';

describe('pathUtils', () => {
  describe('cleanFilePath', () => {
    test('ダブルクォーテーション付きパスを正しく処理', () => {
      expect(cleanFilePath('"C:\\Users\\test\\image.jpg"')).toBe('C:\\Users\\test\\image.jpg');
    });

    test('シングルクォーテーション付きパスを正しく処理', () => {
      expect(cleanFilePath("'C:\\Users\\test\\image.jpg'")).toBe('C:\\Users\\test\\image.jpg');
    });

    test('通常のパスはそのまま返す', () => {
      expect(cleanFilePath('C:\\Users\\test\\image.jpg')).toBe('C:\\Users\\test\\image.jpg');
    });

    test('空文字列は空文字列を返す', () => {
      expect(cleanFilePath('')).toBe('');
    });

    test('前後の空白を除去', () => {
      expect(cleanFilePath('  C:\\Users\\test\\image.jpg  ')).toBe('C:\\Users\\test\\image.jpg');
    });
  });

  describe('validateFilePath', () => {
    test('有効なWindowsパスを認識', () => {
      const result = validateFilePath('C:\\Users\\test\\image.jpg');
      expect(result.isValid).toBe(true);
    });

    test('有効なUnixパスを認識', () => {
      const result = validateFilePath('/home/user/image.jpg');
      expect(result.isValid).toBe(true);
    });

    test('空のパスは無効', () => {
      const result = validateFilePath('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ファイルパスが入力されていません');
    });
  });

  describe('isSupportedImageExtension', () => {
    test('JPEG拡張子を認識', () => {
      expect(isSupportedImageExtension('image.jpg')).toBe(true);
      expect(isSupportedImageExtension('image.jpeg')).toBe(true);
    });

    test('HEIC拡張子を認識', () => {
      expect(isSupportedImageExtension('image.heic')).toBe(true);
      expect(isSupportedImageExtension('image.heif')).toBe(true);
    });

    test('PDF拡張子を認識', () => {
      expect(isSupportedImageExtension('document.pdf')).toBe(true);
    });

    test('非対応拡張子を拒否', () => {
      expect(isSupportedImageExtension('document.txt')).toBe(false);
      expect(isSupportedImageExtension('video.mp4')).toBe(false);
    });

    test('大文字小文字を区別しない', () => {
      expect(isSupportedImageExtension('IMAGE.JPG')).toBe(true);
      expect(isSupportedImageExtension('IMAGE.HEIC')).toBe(true);
    });
  });
});