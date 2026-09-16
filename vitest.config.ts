import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Measure every source file, not just the ones a test happens to import,
      // so the reported number covers the whole app.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        '.claude/',
        '.agents/',
        'vitest.setup.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        // Entry file: bootstrapping only, no logic to assert.
        'src/main.tsx',
      ],
    },
  },
});
