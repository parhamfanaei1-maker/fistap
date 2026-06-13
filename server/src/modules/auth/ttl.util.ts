/** تبدیل TTL متنی ("15m"، "30d"، "12h"، "45s") به ثانیه — fail-fast در ورودی نامعتبر */
export function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) throw new Error(`Invalid TTL format: "${ttl}" (expected e.g. 15m, 30d)`);
  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return value * factor;
}
