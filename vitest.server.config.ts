import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node', // Use Node.js environment for server tests
    globals: true,
    include: [
      'api/**/*.test.ts',
      'api/**/*.test.js'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'api/**/*.ts'
      ],
      exclude: [
        'api/**/*.test.ts',
        'api/**/*.d.ts',
        'api/database/init.ts' // Exclude database initialization
      ]
    },
    setupFiles: ['./api/test-setup.ts']
  },
  resolve: {
    alias: {
      '@server': resolve(__dirname, './api'),
      '@': resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'node16'
  }
});