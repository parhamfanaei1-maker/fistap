import type { Config } from 'tailwindcss';
// پریست تولیدشده از docs/design_tokens.json — قانون حافظه
import tokensPreset from './design-tokens.preset.cjs';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [tokensPreset as Partial<Config>],
  theme: {
    extend: {
      animation: {
        typing: 'typing 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
