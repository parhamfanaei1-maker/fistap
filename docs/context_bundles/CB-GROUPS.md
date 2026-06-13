# 📦 Context Bundle — GROUPS (گروه/کانال/نقش‌ها/پین)

## مستندات مرجع
- `user_roles.md` — owner > admin > member · `high_level_use_cases.md` use case ۲/۳
- UI: **UI-COMP-16/18/20/21** + صفحه `page_map.md §3` group-settings

## ماتریس مجوزها (منبع: conversation.service.ts — UI آینه همین است)
addMembers: admin+ · removeMember: admin+ (admin↛admin، owner حذف‌نشدنی، selfLeave آزاد) · setAdmin: فقط owner · updateInfo: admin+ · pin: private=همه، group/channel=admin+ · پست کانال: admin+ (`CHANNEL_READONLY`)

## فایل‌های کد
`server/src/modules/conversations/{conversation.service,conversations.routes}.ts` · `client/src/components/groups/{CreateGroupModal,GroupSettingsPanel}.tsx` · `client/src/components/chat/{PinnedBar,ForwardModal}.tsx` · `client/src/services/groups.ts` · `app/app/group-settings/[id]/page.tsx`

## قراردادها
`project_state.md` بخش «Groups & Channels» + «Pin Contract» — سقف ۲۰۰ عضو · PinNotifier (lazy ref به io)

## تست‌ها: ۱۳ (نقش‌ها) + ۷ (پین) = ۲۰ تست
