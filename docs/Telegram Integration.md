# Telegram Integration

Primary user communication channel via **Grammy** bot.

## Link Flow
1. Authenticated user clicks "Connect Telegram" on web
2. `POST /me/telegram/link` creates signed token (15 min TTL)
3. User opens `t.me/YourBot?start=link_<TOKEN>`
4. Bot receives `/start link_<TOKEN>` via webhook
5. Server verifies token, saves `telegram_user_id` + `chat_id` to [[Database]]
6. Bot sends confirmation message

## Inbound Messages
1. User sends text → Telegram webhook → `POST /webhooks/telegram`
2. Check `webhook_events` for duplicate `update_id`
3. Look up user by `telegram_user_id`
4. Load AI context → [[AI and Memory]]
5. Reply via Grammy `ctx.reply()`
6. Store both messages in `messages` table

## Outbound (Cron)
Scheduled jobs use stored `chat_id` to send via Grammy bot instance.

## Local Development
- **Polling mode:** Grammy `bot.start()` — no ngrok needed
- **Webhook mode:** ngrok tunnel → set webhook URL

## Security
- Validate `X-Telegram-Bot-Api-Secret-Token` header on webhook
- Never expose raw user IDs in deep links — use signed tokens only

## Related Docs
- [[Authentication]]
- [[APIs]]
- [[Scheduling]]
- [[AI and Memory]]
