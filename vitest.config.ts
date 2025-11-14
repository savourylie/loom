import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'apps/web') },
      {
        find: 'react/jsx-dev-runtime',
        replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      },
      {
        find: 'react/jsx-runtime',
        replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      },
      {
        find: 'react-dom/test-utils',
        replacement: path.resolve(__dirname, 'node_modules/react-dom/test-utils.js'),
      },
      {
        find: 'react-dom',
        replacement: path.resolve(__dirname, 'node_modules/react-dom/index.js'),
      },
      {
        find: 'react',
        replacement: path.resolve(__dirname, 'node_modules/react/index.js'),
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['**/src/**/*.{test,spec}.{ts,tsx}', 'node'],
      ['**/src/**/__tests__/**/*.{ts,tsx}', 'node'],
    ],
    setupFiles: ['apps/web/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    include: [
      'src/**/*.{test,spec}.ts',
      'src/**/__tests__/**/*.{ts,tsx}',
      'apps/web/**/*.{test,spec}.{ts,tsx}',
      'apps/web/**/__tests__/**/*.{ts,tsx}',
    ],
    includeSource: ['src/**/*.{ts,tsx}', 'apps/web/**/*.{ts,tsx}'],
  },
});
