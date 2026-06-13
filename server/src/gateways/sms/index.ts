import { env } from '../../config/env.js';
import type { SmsGateway } from './SmsGateway.js';
import { MockSmsDriver } from './MockSmsDriver.js';

export function createSmsGateway(): SmsGateway {
  switch (env.SMS_DRIVER) {
    case 'mock':
      return new MockSmsDriver();
    default:
      // درایورهای kavenegar / smsir در فاز استقرار اضافه می‌شوند (تصمیم D-1)
      throw new Error(`SMS driver not implemented yet: ${env.SMS_DRIVER}`);
  }
}
export type { SmsGateway };
