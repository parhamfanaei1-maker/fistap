# 🗄️ مدل داده‌ها و ساختار دیتابیس (Database Schema)

## ۱. مجموعه‌ی کاربران (Users Collection)
- `_id`: ObjectId
- `phone`: String (Unique, Indexed)
- `username`: String (Unique)
- `display_name`: String
- `avatar_url`: String
- `last_seen`: DateTime
- `created_at`: DateTime

## ۲. مجموعه‌ی گفتگوها (Conversations Collection)
- `_id`: ObjectId
- `type`: Enum ["private", "group", "channel"]
- `participants`: Array of UserIDs
- `created_at`: DateTime
- `last_message_id`: ObjectId (برای لود سریع آخرین پیام)

## ۳. مجموعه‌ی پیام‌ها (Messages Collection)
- `_id`: ObjectId
- `conversation_id`: ObjectId (Indexed)
- `sender_id`: ObjectId
- `content`: String / FileURL
- `type`: Enum ["text", "image", "video", "audio", "file"]
- `status`: Enum ["sent", "delivered", "read"]
- `timestamp`: DateTime
