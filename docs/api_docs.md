# 🔌 مرجع API فیستپ (API Docs) — v0.1.0 — نقش ۲۷ منشور

**Base URL:** `/api/v1` · **احراز:** هدر `Authorization: Bearer <accessToken>` مگر خلافش ذکر شود
**قالب پاسخ یکنواخت:** موفق `{ok:true, data:{...}}` · خطا `{ok:false, error:{code, message}}` (پیام فارسی برای کاربر)
**قرارداد تایپ‌ها:** `packages/shared/src` — تک‌منبع بین کلاینت/سرور

---

## 1) Auth — احراز هویت

### `POST /auth/otp/request` 🔓 *(rate-limit: 5/15min)*
Body: `{ phone: string }` — هر فرمت ایرانی (۰۹/+۹۸/۰۰۹۸/ارقام فارسی)
- **200** `{ phone: "+98...", ttlSeconds: 120 }`
- **400** `INVALID_BODY | INVALID_PHONE` · **429** `OTP_COOLDOWN` (resend <60s)

### `POST /auth/otp/verify` 🔓 *(rate-limit: 10/15min)*
Body: `{ phone, code: "5رقم" }`
- **200** `{ verified:true, userId, isNewUser, tokens:{ accessToken(JWT 15m), refreshToken(96hex, 30d) } }`
- **401** `OTP_INVALID` (+attemptsLeft در پیام) · **410** `OTP_EXPIRED` · **423** `OTP_LOCKED`

### `POST /auth/refresh` 🔓 *(rate-limit: 30/15min)*
Body: `{ refreshToken }` → **200** `{ tokens }` (جفت جدید — قبلی فوراً باطل/ضد replay) · **401** `REFRESH_INVALID`

### `POST /auth/logout` 🔓 *(rate-limit: 30/15min)* — Body: `{ refreshToken }` → **200** `{ loggedOut:true }`

### `GET /auth/me` 🔐 → **200** `{ userId, phone, username|null, displayName }`

## 2) Users

### `PATCH /users/profile` 🔐
Body: `{ username: /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/, displayName: 1..64 }`
- **200** `{ userId, username, displayName }` · **400** `INVALID_PROFILE` · **409** `USERNAME_TAKEN`

## 3) Conversations — گفتگو/گروه/کانال

### `GET /conversations` 🔐 → لیست Sidebar (مرتب: فعالیت اخیر)
`{ conversations: [{ _id, type:'private|group|channel', participants[], title?, lastMessage|null, pinnedMessageId|null, avatarUrl, createdAt }] }`

### `GET /conversations/:id` 🔐 *(فقط اعضا)* → `{ conversation }` شامل `ownerId, admins[]` · **404/403**

### `GET /conversations/:id/messages?limit=1..100&before=ISO` 🔐 — تاریخچه cursor-based، ترتیب زمانی
- **403** `NOT_A_MEMBER` · **404**

### `POST /conversations` 🔐 — ساخت گروه/کانال
Body: `{ type:'group'|'channel', title:1..64, memberIds:[]≤200 }` → سازنده = owner+admin

### `POST /conversations/:id/members` 🔐 `{memberIds[]}` — admin/owner
### `DELETE /conversations/:id/members/:memberId` 🔐 — admin/owner · selfLeave آزاد · admin↛admin (فقط owner) · owner حذف‌نشدنی `CANNOT_REMOVE_OWNER`
### `PATCH /conversations/:id/admins/:memberId` 🔐 `{isAdmin:boolean}` — **فقط owner**
### `PATCH /conversations/:id` 🔐 `{title}` — admin/owner
### `PATCH /conversations/:id/pin` 🔐 `{messageId|null}` — private:همه · group/channel:admin/owner · پیام باید متعلق به همان گفتگو باشد → `{conversation, pinnedMessage|null}` + رویداد لحظه‌ای

## 4) Media — رسانه (الگوی Presigned)

### `POST /media/presign-upload` 🔐 *(rate-limit: 30/15min)*
Body: `{ kind:'image|video|audio|file', mime, sizeBytes≤50MB, fileName? }`
- **200** `{ uploadUrl(PUT مستقیم به Storage، TTL 10min), objectKey, maxSizeBytes }`
- **413** `FILE_TOO_LARGE` · **415** `INVALID_MIME` (لیست سفید؛ SVG ممنوع)
- سپس: `PUT uploadUrl` با هدر `Content-Type: <mime>` و بدنه فایل → پیام با `content=objectKey, type=kind`

### `POST /media/presign-download` 🔐 `{objectKey}` → `{downloadUrl(TTL 1h)}` · **403** `MEDIA_FORBIDDEN` (فقط آپلودکننده یا عضو گفتگوی حامل پیام)

## 5) Contacts

### `POST /contacts/match` 🔐 *(rate-limit: 10/15min)*
Body: `{ phones: string[] ≤500 }` → `{ matched:[{phone,userId,username,displayName,avatarUrl}], notRegistered:[E164], invalid:n }`
(شماره خود کاربر حذف می‌شود؛ فقط شماره‌های ارسالی پاسخ دارند)

## 6) Search

### `GET /search?q=<2..64>` 🔐 *(rate-limit: 60/15min)*
→ `{ users:[...بدون phone], conversations:[فقط گفتگوهای خود کاربر] }` — regex-escaped، `@` اختیاری

## 7) Push

### `GET /push/vapid-public-key` 🔐 → `{publicKey, enabled}`
### `POST /push/subscribe` 🔐 `{endpoint, keys:{p256dh,auth}}` (خروجی `PushSubscription.toJSON()`)
### `POST /push/unsubscribe` 🔐 `{endpoint}` · `GET /push/status` 🔐 → `{subscribed}`

## 8) Health
`GET /health` 🔓 → `{service, version, uptime}`

---

# 🔄 Socket.io Realtime (namespace پیش‌فرض، مسیر `/socket.io/`)

**اتصال:** `io(WS_URL, { auth: { token: <accessToken> } })` — توکن نامعتبر → `connect_error: "UNAUTHORIZED"`

## Client → Server
| رویداد | Payload | پاسخ |
|---|---|---|
| `message:send` | `{ conversationId? \| recipientId?, content, type, tempId, replyToId?, forwardedFromId? }` — recipientId فقط برای اولین پیام خصوصی (گفتگو خودکار ساخته می‌شود) | ack: `{ok:true,tempId,message}` یا `{ok:false,tempId,error:{code}}` — کدها: `INVALID_PAYLOAD/CONTENT/RECIPIENT/REPLY/FORWARD/MEDIA_KEY, NOT_A_MEMBER, CHANNEL_READONLY, CONVERSATION_NOT_FOUND, DB_UNAVAILABLE` |
| `message:read` | `{ conversationId, messageId }` — همه پیام‌های دیگران تا این لنگر read می‌شوند | — |
| `typing:start` / `typing:stop` | `{ conversationId }` — auto-stop سرور پس از 5s | — |

## Server → Client
| رویداد | Payload |
|---|---|
| `message:new` | `Message` کامل — به همه اعضای دیگر + سایر دستگاه‌های فرستنده |
| `message:status` | `{ conversationId, messageId, status:'delivered'\|'read' }` — وضعیت هرگز پس‌رفت نمی‌کند |
| `typing:update` | `{ conversationId, userId, isTyping }` |
| `presence:update` | `{ userId, online, lastSeen }` — فقط اولین اتصال/آخرین قطع هر کاربر |
| `conversation:pin` | `{ conversationId, pinnedMessage\|null, pinnedBy }` |

**رفتار آفلاین:** گیرنده بدون سوکت → Web Push (`{title, body, url, tag:'conv-<id>'}`) به جای تحویل لحظه‌ای.

## مدل Message (قرارداد مشترک)
```ts
{ _id, conversationId, senderId, content /*متن یا objectKey*/, type:'text|image|video|audio|file',
  status:'sent|delivered|read', timestamp:ISO, replyToId|null, forwardedFromId|null }
```
