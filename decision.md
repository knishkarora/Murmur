# Architectural Decision Log

## [2026-07-24] Decision: Short-Lived SHA-256 Link Tokens for Telegram Account Linking

* **Context & Scope:** Securely binding web application user sessions (Supabase Auth UUIDs) to Telegram user and chat IDs via `POST /me/telegram/link` and `/start` bot command.
* **Choice Made:** Generate 16-byte random hex tokens with a 15-minute TTL, store SHA-256 token hashes in `link_tokens`, and pass raw tokens via Telegram deep link URLs (`https://t.me/<BotName>?start=link_<RAW_TOKEN>`).
* **Rationale (Why over What):**
  * Storing hashes instead of raw tokens in the database prevents token theft in case of database leak.
  * 15-minute expiration ensures single-use short window, mitigating reuse attacks.
  * Standard SHA-256 string hashing allows constant-time lookup while keeping link parameters clean.
* **Tradeoffs Accepted:** Token generation creates transient database writes in `link_tokens`. Expired tokens remain until cleanup job, accepted for minimal overhead.
* **Immutability Status:** Settled & Immutable.

---

## [2026-07-24] Decision: Webhook Header Verification and Database Idempotency Guard

* **Context & Scope:** Handling incoming Telegram Bot API updates at `POST /webhooks/telegram`.
* **Choice Made:** Secret header validation using `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET`, combined with database table `webhook_events` for idempotency checking on `update_id`.
* **Rationale (Why over What):**
  * Secret token header prevents unauthorized spoofing of webhook calls to the API server.
  * Explicit `update_id` primary key lookup in `webhook_events` guarantees at-most-once processing even if Telegram re-sends webhooks due to network retries.
* **Tradeoffs Accepted:** Extra database query per update packet, accepted for strict idempotency and zero duplicate message processing.
* **Immutability Status:** Settled & Immutable.

---

## [2026-07-24] Decision: 4-Layer Context Memory Assembly & Vector Cosine Recall

* **Context & Scope:** Building persistent, low-latency conversational AI memory for Gemini prompts (`gemini-2.0-flash`).
* **Choice Made:** Combine 4 structured context layers (Short-term Buffer, Rolling Summary, Key-Value Facts, and `pgvector` HNSW Cosine Similarity search over `message_embeddings`).
* **Rationale (Why over What):**
  * Layering avoids sending raw full chat transcripts, minimizing token costs while preserving deep context.
  * Combining vector cosine similarity search with structured KV facts ensures both semantic past context and hard personal facts (e.g. goals) are available to Gemini.
* **Tradeoffs Accepted:** 768-dimension embedding generation adds ~100ms async delay, handled non-blocking in background.
* **Immutability Status:** Settled & Immutable.

---

## [2026-07-24] Decision: Asynchronous Non-Blocking Memory Extraction & Summary Updates

* **Context & Scope:** Extracting structured user facts into `user_memories` and updating `profiles.conversation_summary`.
* **Choice Made:** Trigger memory extraction and conversation summarization asynchronously via background promises after the bot sends the reply to Telegram.
* **Rationale (Why over What):**
  * Prevents user reply latency from bloating. The user gets their AI response immediately without waiting for secondary LLM parsing calls.
  * Extracted facts and summary updates are ready in the database before the user's next message arrives.
* **Tradeoffs Accepted:** Micro-race condition if user messages faster than ~1s (rare in human chat), accepted for instant response delivery.
* **Immutability Status:** Settled & Immutable.

