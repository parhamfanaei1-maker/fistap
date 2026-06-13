import { z } from 'zod';
import { OTP_LENGTH } from '@fistap/shared';

export const requestOtpSchema = z.object({
  phone: z.string().min(7).max(20),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(7).max(20),
  code: z
    .string()
    .length(OTP_LENGTH)
    .regex(/^\d+$/, 'code must be numeric'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32).max(256),
});
