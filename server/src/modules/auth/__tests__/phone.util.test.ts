import { describe, expect, it } from 'vitest';
import { normalizePhone } from '../phone.util.js';

describe('normalizePhone — نرمال‌سازی شماره ایران', () => {
  it('converts 09xxx to +989xxx', () => {
    expect(normalizePhone('09121234567')).toBe('+989121234567');
  });
  it('converts 00989xxx to +989xxx', () => {
    expect(normalizePhone('00989121234567')).toBe('+989121234567');
  });
  it('keeps valid +98 untouched', () => {
    expect(normalizePhone('+989121234567')).toBe('+989121234567');
  });
  it('handles 9xxxxxxxxx (no leading zero)', () => {
    expect(normalizePhone('9121234567')).toBe('+989121234567');
  });
  it('converts Persian digits', () => {
    expect(normalizePhone('۰۹۱۲۱۲۳۴۵۶۷')).toBe('+989121234567');
  });
  it('strips spaces and dashes', () => {
    expect(normalizePhone('0912 123-4567')).toBe('+989121234567');
  });
  it('rejects garbage', () => {
    expect(normalizePhone('abc')).toBeNull();
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });
});
