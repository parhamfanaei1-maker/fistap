import type { FastifyInstance } from 'fastify';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { MessageModel } from '../../models/Message.js';
import { ConversationModel } from '../../models/Conversation.js';
import type { MediaService } from './media.service.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const presignSchema = z.object({
  kind: z.enum(['image', 'video', 'audio', 'file']),
  mime: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive(),
  fileName: z.string().max(255).optional(),
});

const downloadSchema = z.object({ objectKey: z.string().min(10).max(500) });

/**
 * REST رسانه — Task 3.3 (FEAT-03)
 * POST /media/presign-upload  → مجوز آپلود مستقیم به Storage (rate-limit ضد سوءاستفاده)
 * POST /media/presign-download → لینک موقت دانلود (فقط کاربر احرازشده)
 */
export async function mediaRoutes(app: FastifyInstance, opts: { mediaService: MediaService }): Promise<void> {
  const { mediaService } = opts;

  app.post(
    '/media/presign-upload',
    { preHandler: [app.authenticate], config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const body = presignSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'مشخصات فایل نامعتبر است'));

      const res = await mediaService.presignUpload({ userId: request.userId, ...body.data });
      if (!res.ok) {
        const msg =
          res.code === 'FILE_TOO_LARGE'
            ? 'حجم فایل بیش از حد مجاز است (حداکثر ۵۰ مگابایت)'
            : 'نوع فایل پشتیبانی نمی‌شود';
        return reply.code(res.code === 'FILE_TOO_LARGE' ? 413 : 415).send(err(res.code, msg));
      }
      return {
        ok: true,
        data: {
          uploadUrl: res.uploadUrl,
          objectKey: res.objectKey,
          expiresInSeconds: res.expiresInSeconds,
          maxSizeBytes: res.maxSizeBytes,
        },
      };
    },
  );

  app.post('/media/presign-download', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = downloadSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'کلید فایل نامعتبر است'));

    // ISS-004 (defense-in-depth): دسترسی فقط برای آپلودکننده یا عضو گفتگویی که این فایل در آن پیام شده
    if (mongoose.connection.readyState === 1) {
      const isUploader = body.data.objectKey.includes(`/${request.userId}/`);
      if (!isUploader) {
        const message = await MessageModel.findOne({ content: body.data.objectKey }).select('conversationId');
        if (!message) return reply.code(403).send(err('MEDIA_FORBIDDEN', 'دسترسی به فایل ممکن نیست'));
        const conv = await ConversationModel.findById(message.conversationId).select('participants');
        const isMember = conv?.participants.some((p: Types.ObjectId) => String(p) === request.userId) ?? false;
        if (!isMember) return reply.code(403).send(err('MEDIA_FORBIDDEN', 'دسترسی به فایل ممکن نیست'));
      }
    }

    const res = await mediaService.presignDownload(body.data.objectKey);
    if (!res.ok) return reply.code(400).send(err(res.code, 'دسترسی به فایل ممکن نیست'));
    return { ok: true, data: { downloadUrl: res.downloadUrl, expiresInSeconds: res.expiresInSeconds } };
  });
}
