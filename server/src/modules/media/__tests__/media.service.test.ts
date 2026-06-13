import { describe, expect, it } from 'vitest';
import { MediaService } from '../media.service.js';

const svc = new MediaService();
const USER = 'a1b2c3d4e5f6a1b2c3d4e5f6'; // 24-hex مثل ObjectId
const MB = 1024 * 1024;

describe('MediaService.presignUpload — Task 3.3 (FEAT-03)', () => {
  it('issues presigned PUT for valid image', async () => {
    const res = await svc.presignUpload({ userId: USER, kind: 'image', mime: 'image/jpeg', sizeBytes: 2 * MB });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.uploadUrl).toContain('fistap-media');
    expect(res.uploadUrl).toContain('X-Amz-Signature');
    expect(res.objectKey).toMatch(/^media\/image\/a1b2c3d4e5f6a1b2c3d4e5f6\/\d+-[a-f0-9]{16}\.jpg$/);
  });

  it('maps mime to safe extension (never trusts filename)', async () => {
    const res = await svc.presignUpload({
      userId: USER, kind: 'image', mime: 'image/png', sizeBytes: MB, fileName: 'evil.php.exe',
    });
    if (res.ok) expect(res.objectKey.endsWith('.png')).toBe(true);
  });

  it('rejects file over 50MB (MEDIA_MAX_SIZE_MB)', async () => {
    const res = await svc.presignUpload({ userId: USER, kind: 'video', mime: 'video/mp4', sizeBytes: 51 * MB });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FILE_TOO_LARGE');
  });

  it('rejects mime not matching kind (whitelist security)', async () => {
    expect((await svc.presignUpload({ userId: USER, kind: 'image', mime: 'video/mp4', sizeBytes: MB })).ok).toBe(false);
    expect((await svc.presignUpload({ userId: USER, kind: 'image', mime: 'image/svg+xml', sizeBytes: MB })).ok).toBe(false); // XSS via SVG
    expect((await svc.presignUpload({ userId: USER, kind: 'bad', mime: 'image/png', sizeBytes: MB })).ok).toBe(false);
  });

  it('rejects zero/negative size', async () => {
    expect((await svc.presignUpload({ userId: USER, kind: 'file', mime: 'application/pdf', sizeBytes: 0 })).ok).toBe(false);
    expect((await svc.presignUpload({ userId: USER, kind: 'file', mime: 'application/pdf', sizeBytes: -5 })).ok).toBe(false);
  });
});

describe('MediaService.presignDownload — Task 3.3', () => {
  it('issues GET url for well-formed key', async () => {
    const up = await svc.presignUpload({ userId: USER, kind: 'image', mime: 'image/webp', sizeBytes: MB });
    if (!up.ok) throw new Error('setup');
    const res = await svc.presignDownload(up.objectKey);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.downloadUrl).toContain('X-Amz-Signature');
  });

  it('rejects malformed/traversal keys', async () => {
    expect((await svc.presignDownload('../../etc/passwd')).ok).toBe(false);
    expect((await svc.presignDownload('media/image/short/x.jpg')).ok).toBe(false);
    expect((await svc.presignDownload('other/path/file.bin')).ok).toBe(false);
  });
});
