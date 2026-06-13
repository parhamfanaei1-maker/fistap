# 🎨 Visual Assets Library — Fistap Messenger

> **نسخه:** 1.0 | **لایه:** ۲ (Visual Assets) | **تاریخ:** ۲۰۲۶-۰۶-۱۰
> **ایده‌پرداز:** Agent 6 | **مبنا:** لوگوی رسمی Fistap

---

## ۱. فلسفه زبان بصری

| اصل | توضیح |
|---|---|
| **سرعت** | خطوط سیال، زوایای تیز در جهت حرکت |
| **اعتماد** | رنگ‌های آبی-سبزآبی، شفافیت و عمق |
| **وضوح** | آیکون‌های قابل تشخیص در اندازه ۱۶px تا ۴۸px |
| **یکپارچگی** | تمام المان‌ها از یک سیستم Stroke و Corner Radius پیروی می‌کنند |

---

## ۲. پالت رنگی اصلی (برگرفته از لوگو)

### رنگ‌های برند

| نام | HEX | RGB | کاربرد |
|---|---|---|---|
| `brand-blue` | `#1E3A8A` | 30, 58, 138 | المان‌های اصلی، دکمه‌ها |
| `brand-teal` | `#0D9488` | 13, 148, 136 | گرادیانت، هایلایت‌ها |
| `brand-cyan` | `#06B6D4` | 6, 182, 212 | Glow effect، Accent |
| `brand-glow` | `#67E8F9` | 103, 232, 249 | Border glow، Shadow |

### گرادیانت اصلی (لوگو)

```css
linear-gradient(135deg, #1E3A8A 0%, #0D9488 50%, #06B6D4 100%)
```

### رنگ‌های آیکون‌ها

| حالت | رنگ | HEX |
|---|---|---|
| Active / Primary | Primary Blue | `#2563EB` |
| Inactive / Secondary | Slate Gray | `#64748B` |
| Success | Emerald | `#10B981` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#EF4444` |
| Online | Green | `#22C55E` |

---

## ۳. سیستم آیکون (Icon System)

### مشخصات فنی

| ویژگی | مقدار |
|---|---|
| **Grid** | 24×24px (viewBox) |
| **Stroke Width** | 2px (استاندارد) |
| **Corner Radius** | 2px (خطوط)، 50% (دایره‌ها) |
| **Stroke Cap** | round |
| **Stroke Join** | round |
| **Fill** | none (خطی) / solid (توپُر) |

### دسته‌بندی آیکون‌ها

| دسته | شناسه | تعداد | پیشوند فایل |
|---|---|---|---|
| ناوبری | NAV | ۶ | `nav-*.svg` |
| دکمه‌ها و اکشن‌ها | ACT | ۸ | `btn-*.svg` |
| وضعیت پیام | MSG | ۵ | `msg-*.svg` |
| وضعیت کاربر | STATUS | ۴ | `status-*.svg` |
| فایل و رسانه | FILE | ۴ | `file-*.svg` |
| رابط کاربری | UI | ۱۲ | `ui-*.svg` |
| **مجموع** | — | **۳۹** | — |

---

## ۴. راهنمای استفاده

### در HTML/Tailwind

```html
<img src="/icons/nav-chats.svg" class="w-6 h-6" alt="چت‌ها" />
```

### در CSS

```css
.icon-primary {
  filter: invert(37%) sepia(83%) saturate(1847%) hue-rotate(202deg) brightness(97%) contrast(101%);
}
```

### در React

```tsx
import { ReactComponent as IconSend } from './icons/btn-send.svg';
<IconSend className="w-5 h-5 text-blue-600" />
```

---

## ۵. لیست کامل آیکون‌ها

### ۵.۱ ناوبری (Navigation)

| فایل | شناسه | توضیح |
|---|---|---|
| `nav-chats.svg` | NAV-01 | حباب پیام — صفحه چت‌ها |
| `nav-contacts.svg` | NAV-02 | دو نفر — صفحه مخاطبین |
| `nav-channels.svg` | NAV-03 | بلندگو — صفحه کانال‌ها |
| `nav-search.svg` | NAV-04 | ذره‌بین — جستجو |
| `nav-settings.svg` | NAV-05 | چرخ‌دنده — تنظیمات |
| `nav-profile.svg` | NAV-06 | آیکون پروفایل کاربر |

### ۵.۲ دکمه‌ها و اکشن‌ها (Action Buttons)

| فایل | شناسه | توضیح |
|---|---|---|
| `btn-send.svg` | ACT-01 | فلش ارسال پیام |
| `btn-attach.svg` | ACT-02 | گیره کاغذ — پیوست فایل |
| `btn-camera.svg` | ACT-03 | دوربین — عکس/ویدیو |
| `btn-mic.svg` | ACT-04 | میکروفون — ضبط صدا |
| `btn-emoji.svg` | ACT-05 | ایموجی — انتخاب شکلک |
| `btn-voice.svg` | ACT-06 | تماس صوتی |
| `btn-video.svg` | ACT-07 | تماس تصویری |
| `btn-new-chat.svg` | ACT-08 | پیام جدید (FAB) |

### ۵.۳ وضعیت پیام (Message Status)

| فایل | شناسه | توضیح |
|---|---|---|
| `msg-sent.svg` | MSG-01 | تیک واحد — ارسال شده |
| `msg-delivered.svg` | MSG-02 | دو تیک — تحویل داده شده |
| `msg-read.svg` | MSG-03 | دو تیک آبی — خوانده شده |
| `msg-reply.svg` | MSG-04 | فلش بازگشت — پاسخ |
| `msg-forward.svg` | MSG-05 | فلش جلو — فوروارد |

### ۵.۴ وضعیت کاربر (User Status)

| فایل | شناسه | توضیح |
|---|---|---|
| `status-online.svg` | STATUS-01 | دایره سبز — آنلاین |
| `status-offline.svg` | STATUS-02 | دایره خاکستری — آفلاین |
| `status-typing.svg` | STATUS-03 | سه نقطه — در حال تایپ |
| `status-dnd.svg` | STATUS-04 | خط روی زنگ — عدم مزاحمت |

### ۵.۵ فایل و رسانه (File & Media)

| فایل | شناسه | توضیح |
|---|---|---|
| `file-image.svg` | FILE-01 | تصویر — عکس |
| `file-video.svg` | FILE-02 | ویدیو — فیلم |
| `file-audio.svg` | FILE-03 | صوت — ویس/موزیک |
| `file-doc.svg` | FILE-04 | سند — PDF/DOC |

### ۵.۶ رابط کاربری (UI Elements)

| فایل | شناسه | توضیح |
|---|---|---|
| `ui-back.svg` | UI-01 | فلش بازگشت |
| `ui-menu.svg` | UI-02 | سه نقطه عمودی — منو |
| `ui-close.svg` | UI-03 | ضربدر — بستن |
| `ui-pin.svg` | UI-04 | سنجاق — پین پیام |
| `ui-delete.svg` | UI-05 | سطل زباله — حذف |
| `ui-verified.svg` | UI-06 | تیک در دایره — تأیید شده |

### ۵.۷ تکمیلی (Additional)

| فایل | شناسه | توضیح |
|---|---|---|
| `ui-hamburger.svg` | UI-07 | سه خط افقی — منوی همبرگر |
| `ui-logout.svg` | UI-08 | خروج از حساب |
| `ui-info.svg` | UI-09 | اطلاعات / درباره |
| `ui-share.svg` | UI-10 | اشتراک‌گذاری |
| `ui-download.svg` | UI-11 | دانلود فایل |
| `ui-add.svg` | UI-12 | افزودن / ایجاد جدید |

---

## ۶. انیمیشن‌های پیشنهادی

| آیکون | انیمیشن | مدت |
|---|---|---|
| `status-typing.svg` | bounce متناوب سه نقطه | 1.2s loop |
| `btn-send.svg` | scale up در hover | 200ms |
| `msg-read.svg` | رنگ از خاکستری به آبی | 300ms |
| `status-online.svg` | pulse ring | 2s loop |
| `btn-mic.svg` | waveform animation در حالت ضبط | real-time |

---

## ۷. فایل‌های خروجی نهایی

| مسیر | توضیح | تعداد |
|---|---|---|
| `/icons/nav-*.svg` | آیکون‌های ناوبری | ۶ |
| `/icons/btn-*.svg` | آیکون‌های دکمه و اکشن | ۸ |
| `/icons/msg-*.svg` | آیکون‌های وضعیت پیام | ۵ |
| `/icons/status-*.svg` | آیکون‌های وضعیت کاربر | ۴ |
| `/icons/file-*.svg` | آیکون‌های فایل و رسانه | ۴ |
| `/icons/ui-*.svg` | آیکون‌های رابط کاربری | ۱۲ |
| **مجموع کل** | **تمام آیکون‌های SVG** | **۳۹** |

---

> **پایان Visual Assets Library**
> **تمام ۳۹ فایل SVG در پوشه `02-visual-assets/icons/` تولید شده‌اند.**
