const fs = require('fs');
const { createCanvas } = require('canvas');

// 200x200のテスト画像を作成
const canvas = createCanvas(200, 200);
const ctx = canvas.getContext('2d');

// 背景を白で塗りつぶし
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, 200, 200);

// 左上に赤い四角（RGB: 255, 0, 0）
ctx.fillStyle = '#FF0000';
ctx.fillRect(20, 20, 60, 60);

// 右上に緑の四角（RGB: 0, 255, 0）
ctx.fillStyle = '#00FF00';
ctx.fillRect(120, 20, 60, 60);

// 左下に青い四角（RGB: 0, 0, 255）
ctx.fillStyle = '#0000FF';
ctx.fillRect(20, 120, 60, 60);

// 右下に黄色の四角（RGB: 255, 255, 0）
ctx.fillStyle = '#FFFF00';
ctx.fillRect(120, 120, 60, 60);

// 中央に紫の円（RGB: 128, 0, 128）
ctx.fillStyle = '#800080';
ctx.beginPath();
ctx.arc(100, 100, 30, 0, 2 * Math.PI);
ctx.fill();

// 画像を保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('../../../test_colors.png', buffer);

console.log('✅ テスト画像 test_colors.png を作成しました');
console.log('📍 色の配置:');
console.log('  左上 (50, 50): 赤 (255, 0, 0)');
console.log('  右上 (150, 50): 緑 (0, 255, 0)');
console.log('  左下 (50, 150): 青 (0, 0, 255)');
console.log('  右下 (150, 150): 黄 (255, 255, 0)');
console.log('  中央 (100, 100): 紫 (128, 0, 128)');