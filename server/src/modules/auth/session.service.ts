import { createHash, randomBytes } from 'node:crypto';
import type { SessionStore } from './session.store.js';

export interface AccessTokenSigner {
  /** امضای JWT دسترسی — توسط @fastify/jwt تزریق می‌شود */
  sign(payload: { sub: string }): string;
}

export interface SessionConfig {
  refreshTtlSeconds: number; // JWT_REFRESH_TTL=30d
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export type RefreshOutcome =
  | { status: 'rotated'; tokens: IssuedTokens; userId: string }
  | { status: 'invalid' };

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * سرویس سشن — Task 1.4 (FEAT-01 / tech_stack_spec.md: JWT + Redis)
 * Access = JWT بدون state (۱۵ دقیقه) · Refresh = توکن مات یک‌بارمصرف با چرخش (۳۰ روز)
 * چرخش (Rotation): هر بار تمدید، توکن قبلی باطل و توکن نو صادر می‌شود — ضد سرقت توکن
 */
export class SessionService {
  constructor(
    private readonly store: SessionStore,
    private readonly signer: AccessTokenSigner,
    private readonly config: SessionConfig,
  ) {}

  async issueTokens(userId: string): Promise<IssuedTokens> {
    const refreshToken = randomBytes(48).toString('hex');
    await this.store.set(
      hashToken(refreshToken),
      { userId, createdAt: Date.now() },
      this.config.refreshTtlSeconds,
    );
    return { accessToken: this.signer.sign({ sub: userId }), refreshToken };
  }

  async refresh(refreshToken: string): Promise<RefreshOutcome> {
    const hash = hashToken(refreshToken);
    const record = await this.store.get(hash);
    if (!record) return { status: 'invalid' };

    await this.store.delete(hash); // یک‌بارمصرف — چرخش
    const tokens = await this.issueTokens(record.userId);
    return { status: 'rotated', tokens, userId: record.userId };
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.store.delete(hashToken(refreshToken));
  }
}
