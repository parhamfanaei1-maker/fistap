/** ثوابت مشترک — SCREAMING_SNAKE_CASE طبق code_standard.md §2 */
export const OTP_LENGTH = 5;
export const OTP_TTL_SECONDS_DEFAULT = 120;
export const OTP_MAX_ATTEMPTS_DEFAULT = 5;

export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
/** E.164 با تمرکز بر ایران؛ نرمال‌سازی 0xxx → +98xxx در سرور انجام می‌شود */
export const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

export const MESSAGE_MAX_LENGTH = 4096;
export const MEDIA_MAX_SIZE_MB = 50;

export const MESSAGE_STATUS = ['sent', 'delivered', 'read'] as const;
export const CONVERSATION_TYPES = ['private', 'group', 'channel'] as const;
