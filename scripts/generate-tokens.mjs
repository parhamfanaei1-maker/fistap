/**
 * تولید پریست Tailwind از docs/design_tokens.json (قانون حافظه: توکن‌ها منبع حقیقت‌اند)
 * خروجی: client/design-tokens.preset.cjs — هرگز دستی ویرایش نشود.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'docs/design_tokens.json'), 'utf8')).tokens;

const val = (n) => (n && typeof n === 'object' && 'value' in n ? n.value : n);
const flat = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    out[k] = v && typeof v === 'object' && !('value' in v) ? flat(v) : val(v);
  }
  return out;
};

const preset = {
  theme: {
    extend: {
      colors: {
        brand: flat(tokens.colors.brand),
        neutral: flat(tokens.colors.neutral),
        ...flat(tokens.colors.semantic ?? {}),
        dark: flat(tokens.darkMode),
      },
      fontFamily: {
        sans: val(tokens.font.family.sans).split(',').map((s) => s.trim().replace(/'/g, '')),
        mono: val(tokens.font.family.mono).split(',').map((s) => s.trim().replace(/'/g, '')),
      },
      fontSize: flat(tokens.font.size),
      borderRadius: flat(tokens.radius),
      boxShadow: flat(tokens.shadow),
      transitionDuration: flat(tokens.animation.duration),
      transitionTimingFunction: { DEFAULT: val(tokens.animation.easing.default) },
      keyframes: tokens.animation.keyframes ?? {},
    },
  },
};

const out = `// AUTO-GENERATED from docs/design_tokens.json — DO NOT EDIT (run: pnpm tokens:generate)
module.exports = ${JSON.stringify(preset, null, 2)};
`;
writeFileSync(resolve(root, 'client/design-tokens.preset.cjs'), out);
console.log('✅ client/design-tokens.preset.cjs generated');
