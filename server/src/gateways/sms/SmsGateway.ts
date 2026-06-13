/** قرارداد مستقل از سرویس‌دهنده (تصمیم D-1) — درایور واقعی هنگام استقرار وصل می‌شود */
export interface SmsGateway {
  sendOtp(phone: string, code: string): Promise<void>;
}
