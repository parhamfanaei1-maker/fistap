# 📦 Context Bundle — MESSAGING (پیام‌رسانی لحظه‌ای)

## مستندات مرجع
- `system_architecture.md §1/§2` — Hybrid: REST سنگین + Socket.io لحظه‌ای؛ presence در Redis؛ آفلاین → Push
- FEAT-02 — لحظه‌ای، تیک‌ها، Reply/Forward، پین
- UI: **UI-COMP-01..13, 16, 17** (App Shell تا ReplyBar)
- `database_schema.md §2/§3` — conversations/messages

## قرارداد واحد رویدادها (تک‌منبع)
`packages/shared/src/events.ts` — `message:send(+ack tempId)/new/status/read`, `typing:*`, `presence:update`, `conversation:pin`

## فایل‌های کد
| فایل | مسئولیت |
|---|---|
| `server/src/sockets/index.ts` | io + اتاق `user:<id>` + presence + last_seen |
| `server/src/sockets/auth.middleware.ts` | JWT در handshake — ناشناس رد |
| `server/src/sockets/presence.service.ts` | شمارنده چنددستگاهی Redis (TTL 24h) |
| `server/src/sockets/message.handlers.ts` | send/read/typing + delivered خودکار + push آفلاین |
| `server/src/modules/messages/message.service.ts` | send (private upsert با privateKey)، history cursor، sidebar، markDelivered/Read، reply/forward validation |
| `server/src/modules/messages/messages.routes.ts` | GET conversations + messages |
| `client/src/store/chatStore.ts` | پیام خوش‌بین tempId، applyStatus بدون پس‌رفت، typing، pinned، draftRecipient |
| `client/src/components/chat/*` (۱۲ فایل) | کل UI چت با شناسه‌های UI-COMP |
| `client/src/hooks/useSocket.ts` | اتصال خودکار پس از login |

## ثوابت مهم
MESSAGE_MAX_LENGTH=4096 · maxHttpBufferSize=64KB · typing auto-stop 5s · STATUS_RANK سه‌گانه

## تست‌ها
messages (۸) + status (۱۲) + reply/forward (۵) + sockets (۱۰) = ۳۵ تست

## نکات/درس‌ها
LL-004 (Schema.Types.ObjectId) · ISS-001/002 (زنجیره reply/forward — اصلاح‌شده با اعتبارسنجی same-conv و دسترسی مبدأ)
