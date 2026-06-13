# 🏗️ Task 1.1 — Project Initialization: Structure Proposal (PENDING GATE APPROVAL)

**Status:** Awaiting final Gate Approval
**Manager decisions locked:** D-1 = Mock-first SMS driver · D-2 = S3-compatible (MinIO local) · D-3 = pnpm workspaces
**Sources:** `implementation_plan.md` (Task 1.1), `code_standard.md`, `tech_stack_spec.md`, `system_architecture.md`

---

## 1. Monorepo Directory Tree

```
fistap/
├── pnpm-workspace.yaml            # workspaces: client, server, packages/*
├── package.json                   # root scripts: dev, build, lint, test
├── .gitignore / .editorconfig
├── .env.example                   # documented template (never commit real .env)
│
├── docs/                          # ← Layer 1+2 docs (already in place)
├── assets/                        # ← icons/ (39 SVG), branding/ (logo)
│
├── packages/
│   └── shared/                    # @fistap/shared — types shared FE↔BE
│       ├── package.json
│       └── src/
│           ├── types/             # User, Conversation, Message, ApiResponse
│           ├── events.ts          # Socket.io event names + payload types (single contract)
│           └── constants.ts       # OTP_TTL, MESSAGE_STATUS, etc.
│
├── client/                        # Next.js 14 PWA (App Router)
│   ├── package.json               # next, react, zustand, socket.io-client,
│   │                              # tailwindcss, @ducanh2912/next-pwa
│   ├── next.config.mjs            # PWA config (service worker, manifest)
│   ├── tailwind.config.ts         # ← generated FROM docs/design_tokens.json
│   ├── tsconfig.json              # strict: true
│   ├── public/
│   │   ├── manifest.json          # Fistap PWA manifest (installability)
│   │   └── icons/                 # app icons derived from logo_premium.png
│   └── src/
│       ├── app/                   # routes per page_map.md
│       │   ├── auth/welcome/  auth/verify/  auth/setup/
│       │   └── app/dashboard/ app/contacts/ app/search/
│       │       app/settings/  app/group-settings/[id]/  app/profile/[id]/
│       ├── components/
│       │   ├── ui/                # Atoms (code_standard.md §1): UI-COMP-14..22
│       │   ├── layout/            # UI-COMP-01, 02, 17
│       │   └── chat/              # UI-COMP-03..13
│       ├── services/              # api.ts (typed fetch), socket.ts (code_standard.md §1)
│       ├── store/                 # Zustand: authStore, chatStore, uiStore
│       ├── hooks/                 # useSocket, useTheme, ...
│       └── styles/globals.css     # token CSS vars, Vazirmatn font, RTL support
│
├── server/                        # Fastify + Socket.io (TypeScript, strict)
│   ├── package.json               # fastify, @fastify/jwt, @fastify/cors,
│   │                              # @fastify/rate-limit, socket.io, mongoose,
│   │                              # ioredis, zod, pino
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # bootstrap: Fastify + Socket.io on one HTTP server
│       ├── config/env.ts          # zod-validated environment loading (fail-fast)
│       ├── plugins/               # mongo.ts, redis.ts, jwt.ts (Fastify plugins)
│       ├── modules/               # feature modules (Single Responsibility)
│       │   ├── auth/              # Task 1.2/1.4: routes, otp.service, session.service
│       │   ├── users/
│       │   ├── conversations/
│       │   ├── messages/
│       │   └── media/             # S3-compatible client (MinIO/Arvan)
│       ├── gateways/
│       │   └── sms/               # SmsGateway interface + MockSmsDriver (D-1)
│       ├── sockets/               # Task 2.1+: connection auth, message handlers
│       └── models/                # Mongoose schemas per database_schema.md
│
├── infra/
│   ├── docker-compose.yml         # mongo:7, redis:7, minio, server, client
│   ├── Dockerfile.client / Dockerfile.server
│   └── nginx/nginx.conf           # reverse proxy + WS upgrade (tech_stack_spec.md §4)
│
└── .github/workflows/ci.yml      # lint → typecheck → test → build (GitHub Actions)
```

## 2. Key Package Versions (LTS-aligned)

| Area | Choice | Why |
|---|---|---|
| Node | 20 LTS | tech_stack_spec.md §2 |
| Next.js | 14.x (App Router) | Stable PWA ecosystem, per spec "Next.js (React)" |
| PWA plugin | @ducanh2912/next-pwa | Maintained next-pwa fork compatible with Next 14 |
| Fastify | 4.x | spec: chosen over Express for speed |
| Socket.io | 4.x (server+client) | spec real-time engine |
| Mongoose | 8.x | MongoDB ODM, schema enforcement matching database_schema.md |
| ioredis | 5.x | Redis sessions/presence/rate-limit |
| zod | 3.x | runtime validation: env + request bodies (security baseline) |
| Zustand | 4.x | spec state management |
| Tailwind | 3.4.x | tokens compiled from design_tokens.json |

## 3. Environment Variables (.env.example)

```
# server
PORT=4000
MONGO_URI=mongodb://localhost:27017/fistap
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
SMS_DRIVER=mock            # mock | kavenegar | smsir (future)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=fistap-media
# client
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## 4. CI Pipeline (skeleton)

`push/PR → install (pnpm) → lint (eslint) → typecheck (tsc --noEmit) → test (vitest) → build (client+server)`

## 5. Compliance Mapping

| Standard | How structure complies |
|---|---|
| `code_standard.md` §1 | `components/ui`, `services`, `store` folders exactly as mandated; `pages` realized as Next.js App Router `app/` (modern equivalent — flagged for Manager awareness) |
| `code_standard.md` §3 | `strict: true` TS everywhere; tokens → Tailwind; one module = one responsibility |
| `system_architecture.md` | REST + Socket.io share one HTTP server; Redis for presence; Nginx WS proxy |
| `database_schema.md` | `server/src/models/` 1:1 with the 3 collections |
| `page_map.md` | all 9 routes scaffolded |

## 6. Out of Scope for Task 1.1 (deferred to their tasks)

- OTP logic (Task 1.2), auth UI (1.3), JWT logic (1.4), sockets (2.x), Kubernetes manifests (post-MVP scale gate).
