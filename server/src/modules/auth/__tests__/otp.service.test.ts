import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpService } from '../otp.service.js';
import { MemoryOtpStore } from '../otp.store.js';
import type { SmsGateway } from '../../../gateways/sms/index.js';

const PHONE = '+989121234567';

class CaptureSms implements SmsGateway {
  public lastCode = '';
  async sendOtp(_phone: string, code: string): Promise<void> {
    this.lastCode = code;
  }
}

function makeService(overrides?: Partial<{ ttl: number; max: number; cooldown: number }>) {
  const sms = new CaptureSms();
  const service = new OtpService(new MemoryOtpStore(), sms, {
    ttlSeconds: overrides?.ttl ?? 120,
    maxAttempts: overrides?.max ?? 5,
    resendCooldownSeconds: overrides?.cooldown ?? 60,
  });
  return { service, sms };
}

describe('OtpService — FEAT-01 / acceptance_criteria.md §1', () => {
  beforeEach(() => vi.useRealTimers());

  it('sends a 5-digit code and verifies it (happy path)', async () => {
    const { service, sms } = makeService();
    const sent = await service.requestOtp(PHONE);
    expect(sent.status).toBe('sent');
    expect(sms.lastCode).toMatch(/^\d{5}$/);

    const result = await service.verifyOtp(PHONE, sms.lastCode);
    expect(result.status).toBe('verified');
  });

  it('OTP is single-use: second verify fails as expired', async () => {
    const { service, sms } = makeService();
    await service.requestOtp(PHONE);
    await service.verifyOtp(PHONE, sms.lastCode);
    const again = await service.verifyOtp(PHONE, sms.lastCode);
    expect(again.status).toBe('expired');
  });

  it('rejects wrong code and decrements attempts', async () => {
    const { service, sms } = makeService();
    await service.requestOtp(PHONE);
    const wrong = sms.lastCode === '00000' ? '11111' : '00000';
    const r1 = await service.verifyOtp(PHONE, wrong);
    expect(r1).toEqual({ status: 'invalid', attemptsLeft: 4 });
  });

  it('locks after OTP_MAX_ATTEMPTS wrong tries', async () => {
    const { service, sms } = makeService({ max: 3 });
    await service.requestOtp(PHONE);
    const wrong = sms.lastCode === '00000' ? '11111' : '00000';
    await service.verifyOtp(PHONE, wrong);
    await service.verifyOtp(PHONE, wrong);
    const r3 = await service.verifyOtp(PHONE, wrong);
    expect(r3.status).toBe('locked');
    // پس از قفل، حتی کد درست هم نباید کار کند (رکورد حذف شده)
    const r4 = await service.verifyOtp(PHONE, sms.lastCode);
    expect(r4.status).toBe('expired');
  });

  it('enforces resend cooldown', async () => {
    const { service } = makeService({ cooldown: 60 });
    await service.requestOtp(PHONE);
    const second = await service.requestOtp(PHONE);
    expect(second.status).toBe('cooldown');
  });

  it('expired code returns expired', async () => {
    vi.useFakeTimers();
    const { service, sms } = makeService({ ttl: 2 });
    await service.requestOtp(PHONE);
    vi.advanceTimersByTime(3000);
    const result = await service.verifyOtp(PHONE, sms.lastCode);
    expect(result.status).toBe('expired');
  });
});
