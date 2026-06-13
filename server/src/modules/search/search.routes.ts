import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { SearchService } from './search.service.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const querySchema = z.object({ q: z.string().min(2).max(64) });

/** REST جستجو — Task 4.4 (rate-limit ضد scraping کاربران) */
export async function searchRoutes(app: FastifyInstance, opts: { searchService: SearchService }): Promise<void> {
  const { searchService } = opts;

  app.get(
    '/search',
    { preHandler: [app.authenticate], config: { rateLimit: { max: 60, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      if (!searchService.dbReady()) {
        return reply.code(503).send(err('DB_UNAVAILABLE', 'پایگاه داده در دسترس نیست'));
      }
      const query = querySchema.safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send(err('INVALID_QUERY', 'عبارت جستجو باید ۲ تا ۶۴ کاراکتر باشد'));
      }
      const result = await searchService.search({ userId: request.userId, query: query.data.q });
      return { ok: true, data: result };
    },
  );
}
