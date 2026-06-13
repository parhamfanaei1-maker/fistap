# 📁 ساختار پروژه طراحی Fistap — لایه ۲

> **نسخه:** 1.0 | **تاریخ:** ۲۰۲۶-۰۶-۱۰
> **تیم:** طراحی لایه ۲ — AI-DOS Omnipotent

---

## 📂 ساختار پوشه‌ها

```
fistap-design/
├── README.md                     ← همین فایل
├── INDEX.md                      ← دسترسی سریع به فایل‌ها
├── 01-ux-design/                 ← نقشه UX (Agent 5)
│   ├── user_flow.md              ← ۷ فلو کاربری + ۸ Decision Point
│   └── wireframe_structure.md    ← ۹ وایرفریم (موبایل + دسکتاپ)
├── 02-visual-assets/             ← دارایی‌های بصری (Agent 6)
│   ├── visual_assets_library.md  ← راهنمای زبان بصری + پالت رنگ
│   └── icons/                    ← ۳۹ آیکون SVG
│       ├── nav-*.svg             ← ۶ آیکون ناوبری
│       ├── btn-*.svg             ← ۸ آیکون دکمه
│       ├── msg-*.svg             ← ۵ آیکون وضعیت پیام
│       ├── status-*.svg          ← ۴ آیکون وضعیت کاربر
│       ├── file-*.svg            ← ۴ آیکون فایل
│       └── ui-*.svg              ← ۱۲ آیکون رابط کاربری
├── 03-ui-design-system/          ← Design System (Agent 7)
│   └── design_system.md          ← رنگ، تایپوگرافی، حباب پیام، Tailwind Config
├── 04-handoff/                   ← تحویل طراحی (Agent 8)
│   └── ui_handoff_prompts.json   ← ۲۲ کامپوننت با ID یکتا
└── 05-design-tokens/             ← توکن‌های طراحی (Agent 9)
    └── design_tokens.json        ← ۱۲۰+ توکن رنگ/فاصله/تایپوگرافی
```

---

## 📊 خلاصه خروجی‌ها

| مرحله | پوشه | تعداد فایل | توضیح |
|---|---|---|---|
| ۱ | `01-ux-design/` | ۲ | User Flow + Wireframe |
| ۲ | `02-visual-assets/` | ۴۰ | راهنما + ۳۹ SVG |
| ۳ | `03-ui-design-system/` | ۱ | Design System جامع |
| ۴ | `04-handoff/` | ۱ | ۲۲ پرامپت کامپوننت |
| ۵ | `05-design-tokens/` | ۱ | ۱۲۰+ توکن |
| **مجموع** | — | **۴۵ فایل** | — |

---

## 🚀 راهنمای سریع برای تیم توسعه (لایه ۳)

### شروع سریع:
1. `03-ui-design-system/design_system.md` → استایل‌دهی UI با Tailwind CSS
2. `05-design-tokens/design_tokens.json` → کانفیگ Tailwind
3. `04-handoff/ui_handoff_prompts.json` → ساخت ۲۲ کامپوننت React
4. `02-visual-assets/icons/` → آیکون‌ها را در پوشه `public/icons/` کپی کنید

### رنگ‌های اصلی:
- **Primary:** `#2563EB` (brand.600)
- **Gradient:** `#2563EB → #1D4ED8`
- **Dark Background:** `#0F172A`
- **Success/Online:** `#22C55E`

### فونت‌ها:
- **فارسی:** Vazirmatn
- **لاتین:** Inter
- **Mono:** JetBrains Mono
