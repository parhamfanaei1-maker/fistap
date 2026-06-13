'use client';

import { useEffect, useState } from 'react';
import type { MessageType } from '@fistap/shared';
import { presignDownload } from '@/services/media';
import { useAuthStore } from '@/store/authStore';
import { UiDownloadIcon, FileDocIcon } from '@/components/icons';

/**
 * رندر محتوای رسانه‌ای در حباب پیام — Task 3.3 (FEAT-03)
 * content = objectKey → presigned download URL (کش در state تا انقضا)
 */
export function MediaContent({ objectKey, type }: { objectKey: string; type: Exclude<MessageType, 'text'> }) {
  const tokens = useAuthStore((s) => s.tokens);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tokens) return;
    let alive = true;
    void presignDownload(tokens.accessToken, objectKey).then((res) => {
      if (!alive) return;
      if (res.ok) setUrl(res.data.downloadUrl);
      else setError(true);
    });
    return () => {
      alive = false;
    };
  }, [tokens, objectKey]);

  if (error) return <p className="text-xs opacity-70">فایل در دسترس نیست</p>;
  if (!url) return <div className="h-32 w-48 animate-pulse rounded-lg bg-slate-200/50 dark:bg-slate-700/50" />;

  switch (type) {
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="تصویر" loading="lazy" className="max-h-72 w-full max-w-xs rounded-lg object-cover" />
      );
    case 'video':
      return <video src={url} controls preload="metadata" className="max-h-72 w-full max-w-xs rounded-lg" />;
    case 'audio':
      return <audio src={url} controls preload="metadata" className="w-56 max-w-full" />;
    default: {
      const name = objectKey.split('/').pop() ?? 'file';
      return (
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm hover:bg-black/20 dark:bg-white/10"
        >
          <FileDocIcon className="h-6 w-6 shrink-0" />
          <span className="max-w-[180px] truncate" dir="ltr">{name}</span>
          <UiDownloadIcon className="h-4 w-4 shrink-0" />
        </a>
      );
    }
  }
}
