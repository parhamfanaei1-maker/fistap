# 🎨 Design System — Fistap Messenger

> **نسخه:** 1.0 | **لایه:** ۲ (UI Design System) | **تاریخ:** ۲۰۲۶-۰۶-۱۰
> **ایده‌پرداز:** Agent 7 | **مبنا:** لوگو رسمی Fistap + Visual Assets Library
> **فریمورک CSS:** Tailwind CSS v3.x

---

## فهرست مطالب

| بخش | شناسه | توضیح |
|---|---|---|
| ۱. پالت رنگی | DS-COLOR | Light Mode + Dark Mode |
| ۲. تایپوگرافی | DS-TYPE | فونت، سایز، وزن |
| ۳. Spacing | DS-SPACE | مقیاس فاصله‌ها |
| ۴. Border Radius | DS-RADIUS | گوشه‌های گرد |
| ۵. سایه‌ها | DS-SHADOW | Elevation levels |
| ۶. حباب پیام | DS-BUBBLE | Message Bubble Styles |
| ۷. دکمه‌ها | DS-BTN | Button Variants |
| ۸. Input Fields | DS-INPUT | فرم‌ها و ورودی‌ها |
| ۹. ناوبری | DS-NAV | Sidebar, Bottom Nav |
| ۱۰. کارت‌ها | DS-CARD | Card Components |
| ۱۱. وضعیت‌ها | DS-STATUS | Badges, Indicators |
| ۱۲. Tailwind Config | DS-TW | ngاشت به Tailwind |

---

## 🔵 ۱. پالت رنگی (Color Palette)

### ۱.۱ رنگ‌های برند (Brand Colors)

| Token | Light Mode | Dark Mode | کاربرد |
|---|---|---|---|
| `brand.50` | `#EFF6FF` | `#0C1A3A` | Background بسیار روشن |
| `brand.100` | `#DBEAFE` | `#1E3A5F` | Background روشن |
| `brand.200` | `#BFDBFE` | `#2D5A8E` | Border روشن |
| `brand.300` | `#93C5FD` | `#3B82F6` | Accent ثانویه |
| `brand.400` | `#60A5FA` | `#60A5FA` | Accent اصلی |
| `brand.500` | `#3B82F6` | `#93C5FD` | Primary Button |
| `brand.600` | `#2563EB` | `#BFDBFE` | Primary Hover |
| `brand.700` | `#1D4ED8` | `#DBEAFE` | Primary Active |
| `brand.800` | `#1E40AF` | `#EFF6FF` | متن تیره |
| `brand.900` | `#1E3A8A` | `#FFFFFF` | متن خیلی تیره |

### ۱.۲ رنگ‌های خنثی (Neutral)

| Token | Light Mode | Dark Mode | کاربرد |
|---|---|---|---|
| `neutral.50` | `#F8FAFC` | `#0F172A` | Background اصلی |
| `neutral.100` | `#F1F5F9` | `#1E293B` | Background سطح ۲ |
| `neutral.200` | `#E2E8F0` | `#334155` | Border |
| `neutral.300` | `#CBD5E1` | `#475569` | Divider |
| `neutral.400` | `#94A3B8` | `#64748B` | متن غیرفعال |
| `neutral.500` | `#64748B` | `#94A3B8` | متن ثانویه |
| `neutral.600` | `#475569` | `#CBD5E1` | متن اصلی |
| `neutral.700` | `#334155` | `#E2E8F0` | متن تیره |
| `neutral.800` | `#1E293B` | `#F1F5F9` | Heading |
| `neutral.900` | `#0F172A` | `#F8FAFC` | متن خیلی تیره |

### ۱.۳ رنگ‌های حباب پیام

| Token | Light Mode | Dark Mode | کاربرد |
|---|---|---|---|
| `bubble.sent` | `#2563EB` | `#1E40AF` | حباب ارسالی |
| `bubble.sentText` | `#FFFFFF` | `#FFFFFF` | متن حباب ارسالی |
| `bubble.received` | `#F1F5F9` | `#1E293B` | حباب دریافتی |
| `bubble.receivedText` | `#1E293B` | `#F1F5F9` | متن حباب دریافتی |
| `bubble.time` | `#64748B` | `#94A3B8` | زمان پیام |

---

## 🔤 ۲. تایپوگرافی (Typography)

### ۲.۱ فونت‌ها

| نقش | فونت | Weight |
|---|---|---|
| **فونت اصلی (فارسی)** | `Vazirmatn` | 400, 500, 700, 900 |
| **فونت لاتین** | `Inter` | 400, 500, 600, 700 |
| **فونت Mono** | `JetBrains Mono` | 400, 500 |

### ۲.۲ مقیاس تایپوگرافی

| Style | Font Size | Line Height | Weight | کاربرد | Tailwind |
|---|---|---|---|---|---|
| `display-xl` | 2.5rem (40px) | 1.1 | 900 | عنوان اصلی | `text-4xl font-black` |
| `display-lg` | 2rem (32px) | 1.2 | 700 | عنوان صفحه | `text-3xl font-bold` |
| `heading-1` | 1.5rem (24px) | 1.3 | 700 | هدر بخش | `text-2xl font-bold` |
| `heading-2` | 1.25rem (20px) | 1.4 | 600 | زیرعنوان | `text-xl font-semibold` |
| `heading-3` | 1.125rem (18px) | 1.4 | 600 | عنوان کوچک | `text-lg font-semibold` |
| `body-lg` | 1rem (16px) | 1.5 | 400 | متن اصلی | `text-base` |
| `body-md` | 0.875rem (14px) | 1.5 | 400 | متن ثانویه | `text-sm` |
| `body-sm` | 0.75rem (12px) | 1.4 | 400 | کپشن، زمان | `text-xs` |
| `button` | 0.875rem (14px) | 1 | 600 | دکمه‌ها | `text-sm font-semibold` |
| `caption` | 0.6875rem (11px) | 1.4 | 400 | ریزترین متن | `text-[11px]` |

---

## 📏 ۳. Spacing Scale

| Token | REM | PX | کاربرد | Tailwind |
|---|---|---|---|---|
| `space-1` | 0.25rem | 4px | فاصله بسیار کوچک | `p-1` |
| `space-2` | 0.5rem | 8px | فاصله کوچک داخلی | `p-2` |
| `space-3` | 0.75rem | 12px | فاصله آیکون تا متن | `p-3` |
| `space-4` | 1rem | 16px | Padding استاندارد | `p-4` |
| `space-5` | 1.25rem | 20px | فاصله المان‌ها | `p-5` |
| `space-6` | 1.5rem | 24px | Gutter گرید | `p-6` |
| `space-8` | 2rem | 32px | فاصله بخش‌ها | `p-8` |
| `space-10` | 2.5rem | 40px | فاصله بزرگ | `p-10` |
| `space-12` | 3rem | 48px | فاصله خیلی بزرگ | `p-12` |
| `space-16` | 4rem | 64px | فاصله Header | `p-16` |

---

## 🔘 ۴. Border Radius

| Token | REM | PX | کاربرد | Tailwind |
|---|---|---|---|---|
| `radius-none` | 0 | 0px | المان‌های تیز | `rounded-none` |
| `radius-sm` | 0.25rem | 4px | Input fields | `rounded` |
| `radius-md` | 0.5rem | 8px | دکمه‌ها، کارت‌ها | `rounded-lg` |
| `radius-lg` | 0.75rem | 12px | Modal، Dropdown | `rounded-xl` |
| `radius-xl` | 1rem | 16px | کارت‌های بزرگ | `rounded-2xl` |
| `radius-2xl` | 1.5rem | 24px | حباب پیام | `rounded-3xl` |
| `radius-full` | 9999px | 100% | آواتار، دایره | `rounded-full` |

### Border Radius حباب پیام

```css
/* حباب ارسالی (سمت چپ در RTL) */
.bubble-sent { border-radius: 1.5rem 1.5rem 0.25rem 1.5rem; }
/* حباب دریافتی (سمت راست در RTL) */
.bubble-received { border-radius: 1.5rem 1.5rem 1.5rem 0.25rem; }
```

---

## 🌑 ۵. سایه‌ها (Shadows)

| Level | Light Mode | Dark Mode | کاربرد |
|---|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | آیکون‌ها |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)` | `0 1px 3px rgba(0,0,0,0.4)` | دکمه‌ها |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | `0 4px 6px rgba(0,0,0,0.5)` | کارت‌ها |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.6)` | Modal |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | `0 20px 25px rgba(0,0,0,0.7)` | Sidebar |
| `shadow-glow` | `0 0 15px rgba(6,182,212,0.3)` | `0 0 20px rgba(6,182,212,0.4)` | لوگو |

---

## 💬 ۶. حباب پیام (Message Bubble)

### ۶.۱ حباب ارسالی

```css
.bubble-sent {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  color: #FFFFFF;
  border-radius: 1.5rem 1.5rem 0.25rem 1.5rem;
  padding: 0.625rem 0.875rem;
  max-width: 65%;
}
.dark .bubble-sent { background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); }
```

### ۶.۲ حباب دریافتی

```css
.bubble-received {
  background: #F1F5F9;
  color: #1E293B;
  border-radius: 1.5rem 1.5rem 1.5rem 0.25rem;
  padding: 0.625rem 0.875rem;
  max-width: 65%;
}
.dark .bubble-received { background: #1E293B; color: #F1F5F9; }
```

### ۶.۳ حباب فایل

```css
.bubble-file {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem; border-radius: 1rem;
  background: rgba(255,255,255,0.15); min-width: 16rem;
}
```

### ۶.۴ Reply Bar

```css
.reply-bar {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem; border-left: 3px solid #3B82F6;
  border-radius: 0.5rem; background: rgba(59,130,246,0.08);
}
```

---

## 🔘 ۷. دکمه‌ها (Buttons)

### ۷.۱ دکمه اصلی

```css
.btn-primary {
  padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 600;
  color: #FFFFFF; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-radius: 0.5rem; transition: all 200ms ease;
}
.btn-primary:hover { box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
```

### ۷.۲ دکمه ثانویه

```css
.btn-secondary {
  padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 600;
  color: #2563EB; background: transparent; border: 2px solid #2563EB;
  border-radius: 0.5rem; transition: all 200ms ease;
}
```

### ۷.۳ دکمه Ghost

```css
.btn-ghost {
  padding: 0.5rem 1rem; font-size: 0.875rem; color: #64748B;
  background: transparent; border: none; border-radius: 0.5rem;
}
.btn-ghost:hover { background: rgba(0,0,0,0.05); color: #1E293B; }
```

### ۷.۴ دکمه آیکون

```css
.btn-icon {
  width: 2.5rem; height: 2.5rem; color: #64748B;
  background: transparent; border-radius: 50%;
}
.btn-icon:hover { background: rgba(0,0,0,0.05); }
```

### ۷.۵ دکمه FAB

```css
.btn-fab {
  position: fixed; bottom: 5rem; right: 1.5rem;
  width: 3.5rem; height: 3.5rem; color: #FFFFFF;
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-radius: 50%; box-shadow: 0 4px 12px rgba(37,99,235,0.4);
}
```

---

## 📝 ۸. Input Fields

### ۸.۱ Input استاندارد

```css
.input {
  width: 100%; padding: 0.625rem 0.875rem;
  font-size: 0.875rem; color: #1E293B; background: #FFFFFF;
  border: 2px solid #E2E8F0; border-radius: 0.5rem;
}
.input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.dark .input { color: #F1F5F9; background: #1E293B; border-color: #334155; }
```

### ۸.۲ OTP Input

```css
.otp-input {
  width: 3.5rem; height: 3.5rem; text-align: center;
  font-size: 1.5rem; font-weight: 700;
  background: #FFFFFF; border: 2px solid #E2E8F0;
  border-radius: 0.75rem;
}
.otp-input:focus { border-color: #2563EB; }
```

---

## 🧭 ۹. ناوبری (Navigation)

### ۹.۱ Header

```css
.header { height: 4rem; padding: 0 1rem; background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
.header-mobile { height: 3.5rem; }
.dark .header { background: #0F172A; border-color: #1E293B; }
```

### ۹.۲ Sidebar

```css
.sidebar { width: 17.5rem; background: #FFFFFF; border-left: 1px solid #E2E8F0; }
.sidebar-item { padding: 0.75rem 1rem; color: #64748B; border-radius: 0.5rem; }
.sidebar-item.active { background: rgba(37,99,235,0.1); color: #2563EB; }
.dark .sidebar { background: #0F172A; border-color: #1E293B; }
```

### ۹.۳ Bottom Nav

```css
.bottom-nav { height: 3.5rem; background: #FFFFFF; border-top: 1px solid #E2E8F0; }
.bottom-nav-item { flex: 1; color: #94A3B8; }
.bottom-nav-item.active { color: #2563EB; }
```

### ۹.۴ Chat List Item

```css
.chat-list-item { padding: 0.75rem 1rem; cursor: pointer; }
.chat-list-item.active { background: rgba(37,99,235,0.08); border-right: 3px solid #2563EB; }
```

---

## 🃏 ۱۰. کارت‌ها (Cards)

### ۱۰.۱ کارت استاندارد

```css
.card {
  background: #FFFFFF; border: 1px solid #E2E8F0;
  border-radius: 0.75rem; padding: 1rem;
}
.dark .card { background: #1E293B; border-color: #334155; }
```

### ۱۰.۲ Modal

```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.modal { background: #FFFFFF; border-radius: 1rem; padding: 1.5rem; max-width: 28rem; }
```

---

## 🏷️ ۱۱. وضعیت‌ها (Badges & Status)

### ۱۱.۱ Badge

```css
.badge { min-width: 1.25rem; height: 1.25rem; padding: 0 0.375rem; font-size: 0.6875rem; font-weight: 700; color: #FFFFFF; background: #2563EB; border-radius: 9999px; }
```

### ۱۱.۲ Status Dot

```css
.status-online { background: #22C55E; }
.status-offline { background: #9CA3AF; }
.status-busy { background: #EF4444; }
```

### ۱۱.۳ Toggle Switch

```css
.toggle { width: 3rem; height: 1.75rem; background: #CBD5E1; border-radius: 9999px; }
.toggle.checked { background: #2563EB; }
```

---

## 📐 ۱۲. Tailwind CSS Config

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50:'#EFF6FF', 100:'#DBEAFE', 200:'#BFDBFE', 300:'#93C5FD', 400:'#60A5FA', 500:'#3B82F6', 600:'#2563EB', 700:'#1D4ED8', 800:'#1E40AF', 900:'#1E3A8A' },
        teal: { 50:'#F0FDFA', 100:'#CCFBF1', 400:'#2DD4BF', 500:'#14B8A6', 600:'#0D9488' },
        bubble: { sent:'#2563EB', 'sent-text':'#FFFFFF', received:'#F1F5F9', 'received-text':'#1E293B' },
      },
      fontFamily: { sans: ['Vazirmatn','Inter','system-ui','sans-serif'], mono: ['JetBrains Mono','monospace'] },
      borderRadius: { bubble: '1.5rem', 'bubble-tail': '0.25rem' },
      boxShadow: { glow: '0 0 15px rgba(6,182,212,0.3)' },
      animation: { 'pulse-ring': 'pulse 2s infinite', 'modal-in': 'modalIn 200ms ease-out' }
    }
  }
}
```

---

## 📐 خلاصه Quick Reference

| المان | Light | Dark |
|---|---|---|
| Background اصلی | `#F8FAFC` | `#0F172A` |
| Background سطح ۲ | `#F1F5F9` | `#1E293B` |
| Border | `#E2E8F0` | `#334155` |
| متن اصلی | `#1E293B` | `#F1F5F9` |
| متن ثانویه | `#64748B` | `#94A3B8` |
| حباب ارسالی | `#2563EB` | `#1E40AF` |
| حباب دریافتی | `#F1F5F9` | `#1E293B` |
| Primary Button | `#2563EB` | `#3B82F6` |

---

> **پایان Design System**
> **تمام مشخصات طراحی آماده تحویل به Agent 8 (Handoff Specialist) است.**
