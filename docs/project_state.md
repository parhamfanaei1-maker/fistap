# 📊 Fistap — Project State Ledger (Single Source of Truth)

> Maintained per AI-DOS Memory Law. Updated at the end of every task. Chat history is NOT memory — this file is.

**Last Updated:** 2026-06-12 (تسک تکمیلی انطباق ۱۰۰٪ — 🏆 PROJECT CLOSED, FULL PROTOCOL COMPLIANCE)
**Current Layer:** 6 ✅ — محصول v0.1.0 + **تمام ۲۰ نقش لایه‌های ۳-۶ دارای خروجی فایلی رسمی**
**Current Phase:** MVP COMPLETE + Compliance COMPLETE. خروجی‌های تکمیلی: `context_bundles/` (۶ بسته) · `knowledge_graph.json` (98 nodes/77 edges) · `unit_test_report.md` (101 تست) · `integration_report.md` (~103 سناریو) · `issue_routing_map.json` · `performance_report.md` (اندازه‌گیری واقعی: ack p95=5.9ms، RSS 81MB، dashboard 125KB) · `user_guide.md` · `api_docs.md` (مرجع کامل ۲۵ endpoint + ۹ رویداد سوکت).

---

## 1. Deep Scan Results (Phase 1 — COMPLETE ✅)

### Layer 1 deliverables verified (The Brain)
| File | Status | Key Decisions Extracted |
|---|---|---|
| `requirements.md` | ✅ Read | PWA messenger, no-VPN access in Iran, <1s message latency, 1,000-user baseline, TLS everywhere |
| `feature_spec.md` | ✅ Read | FEAT-01 Auth/OTP/@username · FEAT-02 Messaging (ticks, reply, forward, pin) · FEAT-03 Media + thumbnails · FEAT-04 PWA + retry mechanism |
| `mvp_definition.md` | ✅ Read | MVP = OTP auth, 1:1/group/channel chat, media, contact sync, PWA+Push, themes. EXCLUDED: calls, bots, mini-apps, secret chats |
| `system_architecture.md` | ✅ Read | Hybrid model: REST (heavy ops) + Socket.io (real-time). Online presence in Redis. Edge servers for no-VPN access |
| `tech_stack_spec.md` | ✅ Read | Next.js + Tailwind + Zustand + next-pwa / Fastify + TypeScript + Socket.io / MongoDB + Redis / Docker + Nginx + GitHub Actions |
| `database_schema.md` | ✅ Read | 3 collections: `users`, `conversations`, `messages` (schemas below) |
| `page_map.md` | ✅ Read | 9 routes: `/auth/welcome`, `/auth/verify`, `/auth/setup`, `/app/dashboard`, `/app/contacts`, `/app/search`, `/app/settings`, `/app/group-settings/:id`, `/app/profile/:id` |
| `page_capabilities.md` | ✅ Read | Dashboard = Sidebar + ChatWindow; Contacts = Picker API + matching + invite; Settings = profile/privacy/notifications |
| `user_roles.md` | ✅ Read | Regular User · Group/Channel Admin · Super Admin |
| `acceptance_criteria.md` | ✅ Read | OTP flow end-to-end · <1s delivery · chunked/background upload · installable PWA · background push · works on Iranian domestic internet |
| `constraints.md` | ✅ Read | Web-based PWA only · SMS gateway dependency · 99.9% uptime |

### Layer 2 deliverables verified (The Face) — extracted from `fistap-complete.json`
| Artifact | Extracted To | Contents |
|---|---|---|
| UI Handoff Prompts | `docs/ui_handoff_prompts.json` | 22 components: **UI-COMP-01 … UI-COMP-22** with Tailwind classes, dimensions, variants |
| Design Tokens | `docs/design_tokens.json` | Brand colors (blue/teal/cyan), dark mode palette (#0F172A bg), Vazirmatn+Inter fonts, spacing, radius, shadows, animation |
| Design System | `docs/design_system.md` | Glassmorphism language |
| UX docs | `docs/user_flow.md`, `docs/wireframe_structure.md` | Flows + wireframes |
| SVG Library | `assets/icons/*.svg` (39 files) | nav-*, btn-*, msg-*, file-*, status-*, ui-* icon sets |
| Brand | `assets/branding/logo_premium.png` | Premium 3D glass logo |

### UI Component Registry (for implementation traceability)
| ID | Component | Planned Location |
|---|---|---|
| UI-COMP-01 | App Shell (Desktop Layout) | `client/src/components/layout/AppShell.tsx` |
| UI-COMP-02 | Sidebar Navigation | `client/src/components/layout/SidebarNav.tsx` |
| UI-COMP-03 | Chat List Panel | `client/src/components/chat/ChatListPanel.tsx` |
| UI-COMP-04 | Chat Window (Active) | `client/src/components/chat/ChatWindow.tsx` |
| UI-COMP-05 | Chat List Header & Search | `client/src/components/chat/ChatListHeader.tsx` |
| UI-COMP-06 | Chat List Item | `client/src/components/chat/ChatListItem.tsx` |
| UI-COMP-07 | Chat Header | `client/src/components/chat/ChatHeader.tsx` |
| UI-COMP-08 | Message List Container | `client/src/components/chat/MessageList.tsx` |
| UI-COMP-09 | Message Input Area | `client/src/components/chat/MessageInput.tsx` |
| UI-COMP-10 | Message Bubble | `client/src/components/chat/MessageBubble.tsx` |
| UI-COMP-11 | Date Divider | `client/src/components/chat/DateDivider.tsx` |
| UI-COMP-12 | Typing Indicator | `client/src/components/chat/TypingIndicator.tsx` |
| UI-COMP-13 | Reply Bar | `client/src/components/chat/ReplyBar.tsx` |
| UI-COMP-14 | Primary Button | `client/src/components/ui/PrimaryButton.tsx` |
| UI-COMP-15 | OTP Input Field | `client/src/components/ui/OtpInput.tsx` |
| UI-COMP-16 | Floating Action Button | `client/src/components/ui/Fab.tsx` |
| UI-COMP-17 | Bottom Navigation (Mobile) | `client/src/components/layout/BottomNav.tsx` |
| UI-COMP-18 | Toggle Switch | `client/src/components/ui/ToggleSwitch.tsx` |
| UI-COMP-19 | Profile Avatar with Status | `client/src/components/ui/AvatarWithStatus.tsx` |
| UI-COMP-20 | Modal Overlay | `client/src/components/ui/ModalOverlay.tsx` |
| UI-COMP-21 | Modal Content | `client/src/components/ui/ModalContent.tsx` |
| UI-COMP-22 | Toast Notification | `client/src/components/ui/Toast.tsx` |

---

## 2. Canonical Database Schema (from `database_schema.md`)

```
users:         _id, phone (unique, indexed), username (unique), display_name,
               avatar_url, last_seen, created_at
conversations: _id, type ∈ [private|group|channel], participants[UserID],
               created_at, last_message_id
messages:      _id, conversation_id (indexed), sender_id, content (text|fileURL),
               type ∈ [text|image|video|audio|file], status ∈ [sent|delivered|read],
               timestamp
```

## 3. Agreed Architecture Snapshot

- **Monorepo layout:** `client/` (Next.js PWA) + `server/` (Fastify + Socket.io) + `docs/` + `assets/` + `infra/` (Docker/Nginx/CI).
- **Transport split:** REST = auth, profile, uploads, contact matching. Socket.io = messages, typing, presence, read receipts.
- **State:** Zustand stores in `client/src/store/`. Sessions = JWT (access + refresh) with Redis-backed session/OTP/rate-limit state.
- **Code standards (from `code_standard.md`):** PascalCase components, camelCase functions, SCREAMING_SNAKE_CASE constants, strict TypeScript, Tailwind driven by `design_tokens.json`, Single Responsibility.

## 4. Task Board (Layer 3)

| Task | Description | Status | Gate |
|---|---|---|---|
| 1.1 | Project init: Next.js + Tailwind, Fastify, Docker, env, CI skeleton | ✅ DONE — typecheck/build/run verified | Gate APPROVED (Manager, 2026-06-12) |
| 1.2 | OTP send/verify API | ✅ DONE — 13 unit tests pass + live E2E verified | Gate APPROVED (Manager, 2026-06-12) |
| 1.4 | JWT session management (access+refresh rotation, Redis) | ✅ DONE — 23 unit tests + 9 live E2E pass | Gate APPROVED (Manager, 2026-06-12) |
| 1.3 | Auth pages (UI-COMP-14, UI-COMP-15) + profile API | ✅ DONE — build + live E2E (welcome→verify→setup) verified | Gate APPROVED (Manager, 2026-06-12) |

### API Contract — implemented in Task 1.2 (`server/src/modules/auth/`)
```
POST /api/v1/auth/otp/request  body: {phone}
  200 {ok:true, data:{phone:"+98...", ttlSeconds:120}}
  400 INVALID_BODY | INVALID_PHONE · 429 OTP_COOLDOWN (resend < 60s) · rate-limit: 5/15min
POST /api/v1/auth/otp/verify   body: {phone, code(5-digit)}
  200 {ok:true, data:{verified:true, userId, isNewUser, tokens:null /*Task 1.4*/}}
  401 OTP_INVALID(+attemptsLeft) · 410 OTP_EXPIRED · 423 OTP_LOCKED(5 tries) · rate-limit: 10/15min
Security: کد فقط به صورت SHA-256 hash ذخیره می‌شود · مقایسه timingSafeEqual · یک‌بارمصرف
Storage: RedisOtpStore (production) / MemoryOtpStore (dev fallback) — TTL 120s
Phone: نرمال‌سازی ۰۹/۹۸+/۰۰۹۸/ارقام فارسی-عربی → E.164
```

### API Contract — implemented in Task 1.4 (Sessions)
```
POST /api/v1/auth/otp/verify   → اکنون tokens واقعی برمی‌گرداند:
  data.tokens = {accessToken: JWT(15m, sub=userId), refreshToken: opaque 96-hex}
POST /api/v1/auth/refresh      body: {refreshToken}
  200 {tokens: {...new pair...}} — چرخش: توکن قبلی فوراً باطل (ضد replay)
  401 REFRESH_INVALID · rate-limit: 30/15min
POST /api/v1/auth/logout       body: {refreshToken} → 200 {loggedOut:true}
GET  /api/v1/auth/me           header: Authorization Bearer <access>
  200 {userId, phone, username, displayName} · 401 UNAUTHORIZED
Guard: app.authenticate (preHandler) → request.userId — برای همه مسیرهای خصوصی آینده
Security: refresh فقط به صورت SHA-256 hash در Redis (TTL 30d) · rotation یک‌بارمصرف
Files: session.service.ts · session.store.ts · ttl.util.ts · plugins/authGuard.ts
```

### API Contract — implemented in Task 1.3 (Profile)
```
PATCH /api/v1/users/profile    header: Bearer · body: {username, displayName}
  200 {userId, username, displayName} · 400 INVALID_PROFILE · 409 USERNAME_TAKEN · 401
Files: server/src/modules/users/users.routes.ts
```

### Realtime Contract — implemented in Task 2.1 (Socket.io)
```
Handshake: socket.handshake.auth.token = <accessToken JWT> (همان سکرت REST)
  نامعتبر/خالی → connect_error "UNAUTHORIZED" — هیچ سوکت ناشناسی پذیرفته نمی‌شود
Rooms: هر کاربر join(`user:<userId>`) — مبنای ارسال هدفمند پیام در Task 2.2
Presence (Redis: `presence:<userId>` شمارنده اتصال + TTL 24h):
  اولین اتصال → broadcast presence:update {online:true}
  آخرین قطع → presence:update {online:false, lastSeen} + ذخیره last_seen در Mongo
  چند دستگاه/تب: فقط اولین اتصال «آنلاین» و آخرین قطع «آفلاین» اعلام می‌شود
Server files: sockets/index.ts · sockets/auth.middleware.ts · sockets/presence.service.ts
Client files: services/socket.ts (singleton + reconnection پلکانی) ·
              hooks/useSocket.ts (اتصال خودکار پس از login) · store/presenceStore.ts
```

### Messaging Contract — implemented in Task 2.2
```
Socket (events.ts مشترک — قرارداد تایپ‌سیف):
  message:send {conversationId? | recipientId?, content, type, tempId} + ack:
    ack ok  → {ok:true, tempId, message}   (جایگزینی پیام خوش‌بین)
    ack err → {ok:false, tempId, error:{code}}  codes: INVALID_PAYLOAD|INVALID_CONTENT|
              INVALID_RECIPIENT|NOT_A_MEMBER|CONVERSATION_NOT_FOUND|DB_UNAVAILABLE|MISSING_TARGET
  message:new (server→client) → به اتاق user:<id> همه گیرنده‌ها + سایر دستگاه‌های فرستنده
گفتگوی خصوصی: اولین پیام با recipientId → upsert اتمیک روی privateKey="idA:idB" (sorted, unique index)
REST:
  GET /api/v1/conversations                    → لیست Sidebar (مرتب: updatedAt desc + lastMessage)
  GET /api/v1/conversations/:id/messages?limit&before → تاریخچه cursor-based (max 100)
  403 NOT_A_MEMBER · 404 · 503 DB_UNAVAILABLE — همه با authenticate
DB: Conversation.privateKey (unique sparse) + updatedAt فعال شد · Schema.Types.ObjectId (LL-004)
Files: modules/messages/{message.service,messages.routes}.ts · sockets/message.handlers.ts
Tests: message.service با mongodb-memory-server (8 سناریو شامل امنیت non-member)
```

### Status & Typing Contract — implemented in Task 2.3
```
چرخه وضعیت (database_schema.md §3 — هرگز پس‌رفت نمی‌کند):
  sent → delivered: خودکار وقتی گیرنده سوکت آنلاین دارد (پس از message:send)
  sent|delivered → read: با message:read {conversationId, messageId(anchor)}
    → همه پیام‌های دیگران تا timestamp آن anchor خوانده می‌شوند (idempotent)
  فرستنده دریافت می‌کند: message:status {conversationId, messageId, status}
Typing (بک‌اند UI-COMP-12):
  typing:start/stop {conversationId} → فقط به اعضای دیگر گفتگو: typing:update
  ایمنی: auto-stop سرور پس از 5s · خاموشی خودکار هنگام disconnect وسط تایپ
  غیرعضو → سکوت کامل (نه خطا نه نشت)
Service methods: markDelivered · markRead · isMember · otherParticipants
Tests: message.status.test.ts — 12 سناریو (idempotency، عدم پس‌رفت، امنیت، anchor غلط)
```

### Groups & Channels Contract — implemented in Task 3.1
```
نقش‌ها (user_roles.md): owner > admin > member · سازنده = owner+admin · سقف ۲۰۰ عضو
REST (همه با authenticate · خطاها: 403 FORBIDDEN · 404 · 400):
  POST   /api/v1/conversations                      {type:group|channel, title, memberIds[]}
  POST   /api/v1/conversations/:id/members          {memberIds[]} — فقط admin/owner
  DELETE /api/v1/conversations/:id/members/:memberId — admin/owner؛ selfLeave آزاد؛
         admin نمی‌تواند admin را حذف کند (فقط owner)؛ owner حذف‌نشدنی (CANNOT_REMOVE_OWNER)
  PATCH  /api/v1/conversations/:id/admins/:memberId {isAdmin} — فقط owner
  PATCH  /api/v1/conversations/:id                  {title} — admin/owner
قاعده کانال: member در channel پیام نمی‌فرستد → ack error CHANNEL_READONLY
  (اعمال‌شده در MessageService.send → سوکت و REST هر دو پوشش داده می‌شوند)
پیام گروهی: recipientIds = همه اعضا منهای فرستنده (زیرساخت Task 2.2 بدون تغییر)
DB: Conversation.ownerId + admins[] اضافه شد
Files: modules/conversations/{conversation.service,conversations.routes}.ts
Tests: 13 سناریو (سلسله مجوزها، selfLeave، کانال readonly، outsider)
```

### Search Contract — implemented in Task 4.4
```
REST: GET /api/v1/search?q=<2..64> · authenticate · rate-limit 60/15min (ضد scraping)
  → {users:[{userId,username,displayName,avatarUrl}], conversations:[{_id,type,title,participants,lastMessageContent}]}
امنیت/حریم خصوصی: شماره تلفن هرگز برنمی‌گردد · regex escape (ضد ReDoS/injection)
  · گفتگوها فقط مال خود کاربر · خودِ جستجوگر از نتایج کاربران حذف
@username با یا بدون @ · نام فارسی partial · حداقل ۲ کاراکتر (بدون full-scan)
ایندکس: User.displayName (username از قبل unique index)
Client: app/search — useDebounce(350ms) + دو بخش + شروع چت با draftRecipient (Task 4.1)
  یا پرش مستقیم به گفتگوی موجود با setActiveConversation
Files: server/modules/search/* · client/services/search.ts · client/hooks/useDebounce.ts
```

### Push Contract — implemented in Task 4.3 (system_architecture §2 تکمیل شد)
```
جریان: message:send → گیرنده آنلاین؟ socket+delivered : Web Push (best-effort، خطا جریان را نمی‌شکند)
REST (authenticate):
  GET  /api/v1/push/vapid-public-key → {publicKey, enabled}
  POST /api/v1/push/subscribe   {endpoint, keys{p256dh,auth}} — upsert per endpoint (multi-device)
  POST /api/v1/push/unsubscribe {endpoint} · GET /api/v1/push/status → {subscribed}
سرور: modules/push/push.service.ts — VAPID از env یا تولید خودکار dev (در لاگ)
  · production بدون کلید → push غیرفعال (fail-safe) · اشتراک مرده (404/410) خودکار حذف
  · کالکشن جدید: pushsubscriptions {userId, endpoint(unique), keys}
  · payload: {title, body(پیش‌نمایش/ایموجی نوع رسانه), url, tag:conv-<id>(جایگزینی اعلان)}
کلاینت: services/push.ts (enablePush/disablePush، base64url→ArrayBuffer)
  · src/worker/index.ts → customWorkerSrc در next-pwa → ادغام در sw.js:
    هندلر push (showNotification rtl/fa) + notificationclick (فوکوس یا openWindow)
  · صفحه settings: toggle اعلان (UI-COMP-18) + toggle تم + خروج (logout سشن Task 1.4)
Env جدید: VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY · VAPID_SUBJECT
```

### PWA Contract — implemented in Task 4.2 (FEAT-04 / acceptance §3)
```
Service Worker (next-pwa، فقط production build):
  fonts/images/_next-static → CacheFirst (TTL 1y/30d/30d)
  GET /api/v1/* → NetworkFirst (timeout 4s → کش؛ گفتگوها آفلاین قابل مشاهده)
  ناوبری بدون شبکه → fallback /offline (صفحه اختصاصی + دکمه تلاش دوباره)
  denylist: /api/* و /socket.io/* از navigateFallback
کامپوننت‌ها:
  pwa/InstallPrompt.tsx ← beforeinstallprompt (اندروید) + راهنمای iOS Add-to-Home
    · dismiss در localStorage · در حالت standalone رندر نمی‌شود
  pwa/ConnectionBanner.tsx ← navigator.onLine + presenceStore.connected
    · «آفلاین» (خاکستری) / «در حال اتصال مجدد» (زرد)
manifest: standalone · rtl/fa · آیکون 192/512/maskable · theme #2563EB (همه از Task 1.1)
نکته dev: SW در حالت development غیرفعال است (فقط build/start)
```

### Contacts Contract — implemented in Task 4.1 (page_capabilities §2)
```
REST: POST /api/v1/contacts/match {phones[≤500]} · rate-limit 10/15min (عملیات سنگین)
  → {matched:[{phone,userId,username,displayName,avatarUrl}], notRegistered:[E.164], invalid:n}
  نرمال‌سازی: بازاستفاده normalizePhone از Task 1.2 (ارقام فارسی/۰۹/۹۸+/dedupe)
  حریم خصوصی: شماره خود درخواست‌دهنده حذف می‌شود · فقط شماره‌های ارسالی برگردانده می‌شوند
Client (app/contacts):
  Contact Picker API (navigator.contacts.select) در اندروید + fallback ورود دستی
  Invite: navigator.share یا clipboard (page_capabilities §2)
  شروع چت: chatStore.draftRecipient → ChatWindow حالت پیش‌نویس → اولین پیام با
  recipientId (قرارداد Task 2.2) → پس از ack به گفتگوی واقعی سوییچ می‌شود
  (محدودیت ID دستی Task 3.2 حل شد ✅)
Files: server/modules/contacts/* · client/services/contacts.ts · app/app/contacts/page.tsx
```

### Pin Contract — implemented in Task 3.4 (FEAT-02 / UI-PIN)
```
REST: PATCH /api/v1/conversations/:id/pin {messageId | null}
  مجوز: private = هر دو طرف · group/channel = فقط admin/owner (403 FORBIDDEN)
  پیام باید متعلق به همان گفتگو باشد (404 MESSAGE_NOT_FOUND — ضد پین خارجی)
  پاسخ: {conversation(+pinnedMessageId), pinnedMessage(کامل|null)}
Realtime: conversation:pin {conversationId, pinnedMessage|null, pinnedBy}
  → به اتاق user:<id> همه اعضا (الگوی PinNotifier — lazy ref بین route و io)
Client: chatStore.pinnedByConv + setPinned · PinnedBar (پرش به پیام با data-mid scroll)
  · دکمه pin روی hover حباب (group-hover) · listener در AppShell
ConversationDto حالا pinnedMessageId دارد (toDto + listConversations)
```

### Media Contract — implemented in Task 3.3 (FEAT-03, D-2: S3-compatible)
```
الگو: Presigned URL — کلاینت مستقیم با Storage (MinIO dev / ابر آروان prod) حرف می‌زند؛
       Fastify فقط مجوز صادر می‌کند (acceptance §2: آپلود حجیم بدون فشار روی API)
REST (authenticate + rate-limit 30/15min روی upload):
  POST /api/v1/media/presign-upload   {kind:image|video|audio|file, mime, sizeBytes, fileName?}
    → {uploadUrl(PUT, TTL 10min), objectKey, maxSizeBytes} · 413 FILE_TOO_LARGE · 415 INVALID_MIME
  POST /api/v1/media/presign-download {objectKey} → {downloadUrl(GET, TTL 1h)}
امنیت: لیست سفید MIME per-kind (SVG رد می‌شود — XSS) · پسوند از MIME نه نام فایل ·
  objectKey = media/<kind>/<userId>/<ts>-<rand16>.<ext> (regex-validated در download و در
  MessageService.send برای پیام‌های غیر-text → INVALID_MEDIA_KEY)
پیام رسانه‌ای: content = objectKey · همان جریان message:send/ack/message:new (بدون رویداد جدید)
Client: services/media.ts (kindOfFile/presign/uploadToStorage با XHR progress) ·
  MessageInput: دکمه پیوست + نوار پیشرفت · MediaContent.tsx: img/video/audio/file-download
Env: S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET (از Task 1.1) · MEDIA_MAX_SIZE_MB=50
نکته معماری: thumbnail سمت سرور حذف شد — تصاویر با object-cover پیش‌نمایش می‌شوند؛
  تولید thumbnail واقعی (sharp worker) به فاز ۵ بهینه‌سازی موکول شد (در backlog)
```

### Frontend — implemented in Task 3.2 (Group Management UI)
```
کامپوننت‌های جدید (کلاس‌ها عیناً از handoff):
  ui/Modal.tsx          ← UI-COMP-20 (overlay) + UI-COMP-21 (content + header)
  ui/ToggleSwitch.tsx   ← UI-COMP-18 (checked/thumb states)
  ui/Fab.tsx            ← UI-COMP-16 (موبایل، bottom-20 left-4)
  groups/CreateGroupModal.tsx   ← ساخت گروه/کانال (toggle نوع) + ورود به گفتگوی تازه
  groups/GroupSettingsPanel.tsx ← نام + لیست اعضا با badge نقش + ToggleSwitch ادمین (فقط owner)
                                  + حذف/خروج طبق ماتریس Task 3.1 + مودال افزودن عضو
  app/group-settings/[id]/page.tsx ← صفحه کامل با گارد عضویت (404 سرور)
اتصالات: ChatHeader → دکمه تنظیمات (group/channel) · Dashboard → FAB + دکمه «+ جدید»
services/groups.ts: createConversation/addMembers/removeMember/setAdmin/updateGroupInfo/fetchConversation
سرور (پچ): GET /api/v1/conversations/:id (members-only) + ConversationService.getById
محدودیت دانسته: انتخاب عضو با ID دستی — انتخاب از مخاطبین در Task 4.1
آیکون‌ها: UiDelete/UiAdd به icons/index.tsx افزوده شد (AUTO-GEN قالب)
```

### Frontend — implemented in Task 2.4 (Chat UI — Dashboard)
```
کامپوننت‌ها (کلاس‌های Tailwind عیناً از ui_handoff_prompts.json):
  layout/AppShell.tsx      ← UI-COMP-01 · گارد ورود + اتصال سوکت + لود Sidebar + listener ها
  layout/SidebarNav.tsx    ← UI-COMP-02 (280px دسکتاپ، ۴ آیتم + پروفایل)
  layout/BottomNav.tsx     ← UI-COMP-17 (موبایل، ۵ آیتم + safe-area)
  chat/ChatListPanel.tsx   ← UI-COMP-03+05+06 (جستجوی محلی + آواتار با status dot UI-COMP-19)
  chat/ChatWindow.tsx      ← UI-COMP-04 · chat/ChatHeader.tsx ← UI-COMP-07 (آنلاین/تایپینگ/lastSeen)
  chat/MessageList.tsx     ← UI-COMP-08 (اسکرول خودکار + ارسال read-anchor خودکار)
  chat/MessageBubble.tsx   ← UI-COMP-10 (تیک‌ها از SVGهای msg-sent/delivered/read · دابل‌کلیک=Reply)
  chat/DateDivider.tsx     ← UI-COMP-11 (امروز/دیروز/تاریخ فارسی)
  chat/TypingIndicator.tsx ← UI-COMP-12 · chat/ReplyBar.tsx ← UI-COMP-13
  icons/index.tsx          ← ۱۶ آیکون لایه ۲ به صورت کامپوننت React (AUTO-GEN)
state:
  store/chatStore.ts ← conversations · messagesByConv · پیام خوش‌بین (addPending/resolvePending/
                       failPending با tempId) · applyStatus (بدون پس‌رفت) · typingByConv · replyTo
  services/chat.ts   ← fetchConversations / fetchMessages (REST Task 2.2)
رفتار موبایل: بدون گفتگوی فعال → فقط لیست؛ با گفتگو → فقط پنجره + دکمه بازگشت
نکته build: next.config webpack extensionAlias '.js'→'.ts' (LL-005)
```

### Frontend — implemented in Task 1.3 (Auth UI)
```
client/src/components/ui/PrimaryButton.tsx  ← UI-COMP-14 (کلاس‌ها عیناً از handoff)
client/src/components/ui/OtpInput.tsx       ← UI-COMP-15 (+ paste، ارقام فارسی، a11y)
client/src/components/ui/Toast.tsx          ← UI-COMP-22
client/src/hooks/useCountdown.ts            ← تایمر ۱۲۰s ارسال مجدد
client/src/services/auth.ts                 ← کلاینت تایپ‌سیف همه APIهای auth/profile
client/src/store/authStore.ts               ← Zustand + persist(localStorage) · phaseها: idle→otp-sent→verified→authenticated
client/src/app/auth/{welcome,verify,setup}/page.tsx ← UF-01 کامل + DP-02/DP-04 redirects
```
| 2.1 | Socket.io server (JWT auth) + Presence + client hook | ✅ DONE — 33 unit tests + 6 live socket E2E | Gate APPROVED (Manager, 2026-06-12) |
| 2.2 | ارسال/دریافت پیام تک‌به‌تک (socket + REST history/sidebar) | ✅ DONE — 41 unit tests + 10 live E2E (real Mongo) | Gate APPROVED (Manager, 2026-06-12) |
| 2.3 | وضعیت‌های پیام (Delivered/Read) + Typing backend | ✅ DONE — 51 unit tests + 8 live E2E | Gate APPROVED (Manager, 2026-06-12) |
| 2.4 | UI چت (UI-COMP-01..13, 17) — Dashboard کامل | ✅ DONE — build سبز + رندر زنده + 5 سناریوی جریان UI روی سرور واقعی | Gate APPROVED (Manager, 2026-06-12) |
| 3.1 | منطق ساخت گروه و کانال (REST + نقش‌ها + قاعده کانال) | ✅ DONE — 64 unit tests + 10 live E2E | Gate APPROVED (Manager, 2026-06-12) |
| 3.2 | مدیریت اعضا و ادمین‌ها (UI: group-settings + ساخت از UI) | ✅ DONE — build + 8 live E2E (ماتریس مجوزها از UI) | Gate APPROVED (Manager, 2026-06-12) |
| 3.3 | ارسال رسانه (presigned S3/MinIO + پیام‌های رسانه‌ای + UI) | ✅ DONE — 71 unit tests + 9 live E2E (آپلود/دانلود واقعی MinIO) | Gate APPROVED (Manager, 2026-06-12) |
| 3.4 | پین کردن پیام‌ها (UI-PIN: REST+realtime+PinnedBar) | ✅ DONE — 78 unit tests + 8 live E2E | Gate APPROVED (Manager, 2026-06-12) |
| 4.1 | Contact Picker + تطبیق + دعوت + شروع چت از مخاطب | ✅ DONE — 84 unit tests + 7 live E2E | Gate APPROVED (Manager, 2026-06-12) |
| 4.2 | Service Worker: Offline + Add to Home Screen | ✅ DONE — SW استراتژی‌دار + offline page + InstallPrompt + ConnectionBanner | Gate APPROVED (Manager, 2026-06-12) |
| 4.3 | Push Notifications (Web Push API) | ✅ DONE — 89 unit tests + push واقعی TLS (aes128gcm) تحویل شد | Gate APPROVED (Manager, 2026-06-12) |
| 4.4 | جستجوی جهانی کاربران و چت‌ها | ✅ DONE — 96 unit tests + 8 live E2E | Gate APPROVED (Manager, 2026-06-12) |
| 5.1 | ممیزی لایه ۴: فیچرها + امنیت + پوشش تست | ✅ DONE — 3 سند ممیزی، 9 یافته (0 بحرانی) | Gate APPROVED (Manager, 2026-06-12) |
| 5.2 | اصلاحات لایه ۵: ISS-001 (Reply) + ISS-002 (Forward کامل) + بسته امنیتی 004/005/006/008/009 | ✅ DONE — 101 unit + 7 رگرسیون E2E سبز | تصمیمات مدیر ثبت شد (fix/impl/accept/all) |
| 5.3 | تأیید نهایی و استقرار (لایه ۶): compose.prod + nginx TLS + راهنمای استقرار + release notes | ✅ DONE — راستی‌آزمایی نهایی کامل (101 tests, 3/3 typecheck, builds سبز) | 🏆 GATE 3 APPROVED (Manager, 2026-06-12) — **PROJECT CLOSED** |
| تکمیلی | انطباق ۱۰۰٪ منشور: ۸ خروجی رسمی نقش‌های ۱۲/۱۵/۱۷/۱۸/۲۱/۲۵/۲۷ | ✅ DONE — همه فایل‌ها تولید و راستی‌آزمایی شدند (LL-008 ثبت شد) | Gate APPROVED (Manager, 2026-06-12) |
| 3.x | Groups/Channels/Media | ⬜ | — |
| 4.x | PWA/Contacts/Push/Search | ⬜ | — |
| 5.x | Tests/Optimization/Deploy | ⬜ | — |

## 5. Open Decisions (need Manager input — flagged, NOT assumed)

| # | Question | Default proposal if no preference |
|---|---|---|
| D-1 | SMS gateway provider (Kavenegar / SMS.ir / Ghasedak / mock-first) | Build provider-agnostic `SmsGateway` interface + console/mock driver for dev; pick vendor at deploy |
| D-2 | Object storage for media (ArvanCloud S3-compatible recommended for no-VPN constraint) | S3-compatible SDK + MinIO locally |
| D-3 | Monorepo tooling (pnpm workspaces vs npm workspaces) | pnpm workspaces |

## 6. Lessons Learned

See `lessons_learned.md` (initialized, empty — Zero-Repeat Error law active).
