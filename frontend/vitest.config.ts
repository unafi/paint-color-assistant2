import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    watch: false,        // デフォルトでwatch無効
    reporter: ['verbose', 'json'],
    testTimeout: 30000,  // 30秒
    hookTimeout: 30000,  // 30秒
    
    // CI環境での設定
    ...(process.env.CI && {
      minThreads: 1,
      maxThreads: 2,
      reporter: ['verbose', 'github-actions']
    })
  },
});