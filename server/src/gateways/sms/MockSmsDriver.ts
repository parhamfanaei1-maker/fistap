import type { SmsGateway } from './SmsGateway.js';

/** درایور توسعه: کد OTP را فقط در لاگ سرور چاپ می‌کند */
export class MockSmsDriver implements SmsGateway {
  async sendOtp(phone: string, code: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`📱 [MockSMS] OTP for ${phone}: ${code}`);
  }
}
