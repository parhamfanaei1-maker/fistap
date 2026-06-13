import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

/** اتصال MongoDB — database_schema.md */
export async function registerMongo(app: FastifyInstance): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    app.log.info('✅ MongoDB connected');
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      app.log.warn({ err }, '⚠️ MongoDB unavailable (dev mode: continuing without DB)');
    } else {
      throw err;
    }
  }
  app.addHook('onClose', async () => { await mongoose.disconnect(); });
}
