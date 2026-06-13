/** قرارداد پاسخ یکنواخت REST API */
export interface ApiOk<T> { ok: true; data: T; }
export interface ApiErr { ok: false; error: { code: string; message: string }; }
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/** Auth flow contracts (Task 1.2 / 1.4) */
export interface RequestOtpBody { phone: string; }
export interface VerifyOtpBody { phone: string; code: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; }
export interface VerifyOtpResult { tokens: AuthTokens; isNewUser: boolean; }
