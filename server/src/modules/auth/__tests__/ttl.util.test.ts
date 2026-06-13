import { describe, expect, it } from 'vitest';
import { ttlToSeconds } from '../ttl.util.js';

describe('ttlToSeconds', () => {
  it('parses minutes', () => expect(ttlToSeconds('15m')).toBe(900));
  it('parses days', () => expect(ttlToSeconds('30d')).toBe(2_592_000));
  it('parses hours', () => expect(ttlToSeconds('12h')).toBe(43_200));
  it('parses seconds', () => expect(ttlToSeconds('45s')).toBe(45));
  it('throws on invalid format', () => {
    expect(() => ttlToSeconds('abc')).toThrow();
    expect(() => ttlToSeconds('15')).toThrow();
    expect(() => ttlToSeconds('15w')).toThrow();
  });
});
