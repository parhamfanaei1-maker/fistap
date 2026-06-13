import { defineConfig } from 'tsup';

/**
 * بیلد سرور — LL-002: پکیج workspace با سورس TS باید داخل باندل شود
 * (در غیر این صورت Node در runtime با ERR_UNKNOWN_FILE_EXTENSION کرش می‌کند)
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  noExternal: ['@fistap/shared'],
});
