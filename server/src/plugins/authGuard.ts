import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler محافظ — مسیرهای خصوصی: { preHandler: [app.authenticate] } */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    /** پس از احراز موفق: شناسه کاربر از claim sub */
    userId: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

/** محافظ JWT — Task 1.4: اعتبارسنجی Bearer token و تزریق userId */
export function registerAuthGuard(app: FastifyInstance): void {
  app.decorateRequest('userId', '');
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.userId = request.user.sub;
    } catch {
      await reply.code(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر یا منقضی است' },
      });
    }
  });
}
