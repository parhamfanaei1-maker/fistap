# 📦 Context Bundle — INFRA (محیط/استقرار/CI)

## فایل‌ها
`pnpm-workspace.yaml` · `.env.example` (۱۵ متغیر مستند) · `server/src/config/env.ts` (zod fail-fast؛ prod بدون سکرت dev بالا نمی‌آید) · `infra/docker-compose.yml` (dev: mongo/redis/minio) · `infra/docker-compose.prod.yml` (+nginx TLS، شبکه backend ایزوله، restart+healthcheck) · `infra/nginx/nginx{,.prod}.conf` (WS upgrade، HSTS) · `.github/workflows/ci.yml` · `scripts/generate-tokens.mjs` (design_tokens → Tailwind preset، AUTO-GEN)

## دستورها
dev: `pnpm install && pnpm dev` · build: `pnpm -r build` · prod: `docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d --build`

## نکات/درس‌ها
LL-001 (tsup نه tsc برای بیلد) · LL-002 (noExternal @fistap/shared + تست دودی الزامی) · راهنمای کامل: `docs/deployment_guide.md`
