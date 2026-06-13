# 🛠️ مشخصات تکنولوژی (Tech Stack Spec) - پروژه Fistap

## ۱. Frontend (Client Side)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **PWA:** Next-PWA (Service Workers, Manifest.json)
- **Real-time:** Socket.io-client

## ۲. Backend (Server Side)
- **Runtime:** Node.js (LTS)
- **Language:** TypeScript
- **API Framework:** Fastify (به دلیل سرعت بالاتر نسبت به Express)
- **Real-time Engine:** Socket.io
- **Authentication:** JWT (JSON Web Tokens) + OTP via SMS Gateway

## ۳. Database & Caching
- **Primary DB:** MongoDB (Atlas) - برای ذخیره پیام‌ها و کاربران.
- **Cache/Session:** Redis - برای وضعیت آنلاین/آفلاین و Rate Limiting.

## ۴. DevOps & Infrastructure
- **Containerization:** Docker
- **Orchestration:** Kubernetes (برای مقیاس‌پذیری آینده)
- **Web Server:** Nginx
- **CI/CD:** GitHub Actions
