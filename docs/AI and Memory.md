# AI and Memory

Murmur's conversational backend utilizes Google Gemini with a multi-layered context assembly structure to maintain long-term memory while avoiding context window bloating and token cost overruns.

---

## Models

We utilize Google's Gemini Models via the native SDK `@google/generative-ai`:
- **Primary LLM:** `gemini-2.0-flash`
  - High performance, low latency, generous token limit.
  - Used for daily chat replies, daily actions, weekly planning, structured profiling, and summary generation.
- **Embeddings Model:** `text-embedding-004`
  - Returns a vector dimension of `768`.
  - Used to index messages semantically for similarity queries.

---

## The 4-Layer Memory Architecture

To build a persistent, contextual presence, user prompts are sent alongside four assembled layers of memory:

```
┌────────────────────────────────────────────────────────┐
│                        Gemini                          │
└──────────────────────────▲─────────────────────────────┘
                           │ Assembled Prompt Context
┌──────────────────────────┴─────────────────────────────┐
│ 1. Short-term Buffer (Last 20 messages)                │
├────────────────────────────────────────────────────────┤
│ 2. Rolling Summary (Profiles.conversation_summary)      │
├────────────────────────────────────────────────────────┤
│ 3. Structured Memories (User_memories KV facts)        │
├────────────────────────────────────────────────────────┤
│ 4. Semantic Recall (Top 5 similar historical messages)  │
└────────────────────────────────────────────────────────┘
```

### Layer 1: Short-term Buffer
- **Source:** Last 20 messages from the `messages` table.
- **Purpose:** Tracks the flow of the active conversation.

### Layer 2: Rolling Summary
- **Source:** `profiles.conversation_summary`
- **Purpose:** Concise paragraph summary of the entire chat history. Updated every ~10 messages by prompting `gemini-2.0-flash` to merge recent messages into the existing summary.

### Layer 3: Structured Memories
- **Source:** `user_memories` rows
- **Purpose:** Permanent facts extracted from chats (e.g., goals, timelines, skills, preferences). An LLM parser runs asynchronously every ~5 exchanges to extract keys and values, which are upserted into the table.

### Layer 4: Semantic Recall
- **Source:** `message_embeddings` table + `pgvector` HNSW search.
- **Purpose:** Searches for similar concepts in the user's historical messages. When a message comes in, we embed it and query Supabase using cosine similarity to retrieve the top 5 closest past messages.

---

## Prompt Files & Templates

Prompt templates reside in [prompts/index.ts](file:///e:/Projects/tasks/Murmur/packages/shared/src/prompts/index.ts).

- **`SYSTEM_PROMPT`:** Establishes persona (supportive, agency-focused, career coach for placement-seeking students, no guilt or streaking rules, Indian student context).
- **`DAILY_ACTION_PROMPT`:** Context for generating a daily task (takes 10–30 mins max, specific, achievable today).
- **`WEEKLY_SUMMARY_PROMPT`:** Context for Sunday summaries (focuses on wins/completions, warm encouragement, minimal next-week goals).
- **`MEMORY_EXTRACT_PROMPT`:** Prompt that instructs the LLM to output a JSON list of key-value memories (e.g. `{"memories": [{"key": "goal", "value": " frontend internship"}]}`).

---

## AI Service functions

The API server's [aiService.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/services/aiService.ts) exports the following core methods:

1. **`generateReply(context, userMessage)`**
   - Assembles the 4 memory layers + user prompt, calls Gemini, and returns the response string.
2. **`generateDailyAction(context)`**
   - Combines the user context with `DAILY_ACTION_PROMPT` to output one structured recommendation.
3. **`generateWeeklySummary(context)`**
   - Combines the user context with `WEEKLY_SUMMARY_PROMPT` to write the weekly dashboard summary.
4. **`extractMemories(recentText)`**
   - Asynchronously parses recent messages into key-value pairs, validating the output schema with `Zod`.
5. **`embedText(text)`**
   - Returns a `number[]` array of dimension `768` for the target text.
6. **`summarizeConversation(recentText, existingSummary)`**
   - Generates a merged rolling summary of the chat history.

---

## Guardrails & Security

- **HALLUCINATION GUARD:** We use `Zod` schema parsing (`safeParse`) on all structured JSON outputs (like memory extraction). If the LLM generates malformed JSON, the parser catches the error and falls back safely.
- **MAX OUTPUT LIMITS:** Output tokens are capped in the generation config, and replies are post-sliced to `4096` characters (Telegram's message limit) to avoid payload errors.
- **FALLBACK SAFETY:** If a Gemini API call fails (network error, rate limit, etc.), the service catches the exception and returns a pre-configured, supportive fallback message so the bot does not crash:
  *"I'm having a brief moment — please try again in a minute. Your progress still counts."*
- **SENSITIVE DATA FILTER:** The system prompt instructs Gemini to refuse requests involving financial data, credentials, and passwords.

---

## Related Docs
- [[Database]]
- [[Telegram Integration]]
- [[APIs]]
