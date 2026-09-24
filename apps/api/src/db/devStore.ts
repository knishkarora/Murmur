// In-memory fallback state for development demo mode when local Postgres is not running

export interface MockAction {
  id: string;
  userId: string;
  content: string;
  status: "pending" | "done" | "skipped";
  scheduledFor: string;
  createdAt: string;
}

export interface MockMessage {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface MockMemory {
  id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface MockSummary {
  id: string;
  userId: string;
  weekStart: string;
  content: string;
  createdAt: string;
}

class DevMockStore {
  profile = {
    id: "00000000-0000-0000-0000-000000000002",
    userId: "00000000-0000-0000-0000-000000000001",
    name: "Mio",
    timezone: "Asia/Kolkata",
    onboardingDone: true,
    conversationSummary: "Targeting SDE placements with React, TypeScript, and distributed systems focus.",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  };

  preferences = {
    userId: "00000000-0000-0000-0000-000000000001",
    morningHour: 8,
    eveningHour: 20,
    weeklyDay: 0,
    tone: "friendly" as "friendly" | "direct" | "encouraging",
  };

  telegramLinked = true;
  telegramLinkedAt = new Date(Date.now() - 10 * 86400000).toISOString();

  actions: MockAction[] = [
    {
      id: "act-1",
      userId: "00000000-0000-0000-0000-000000000001",
      content: "Complete 2 LeetCode Sliding Window problems (min window substring)",
      status: "pending",
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "act-2",
      userId: "00000000-0000-0000-0000-000000000001",
      content: "Review PostgreSQL indexing strategies (B-Tree vs HNSW pgvector)",
      status: "done",
      scheduledFor: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "act-3",
      userId: "00000000-0000-0000-0000-000000000001",
      content: "Revise system design trade-offs for distributed cache invalidation",
      status: "done",
      scheduledFor: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "act-4",
      userId: "00000000-0000-0000-0000-000000000001",
      content: "Polish Murmur full-stack monorepo project README for portfolio review",
      status: "done",
      scheduledFor: new Date(Date.now() - 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  messages: MockMessage[] = [
    {
      id: "msg-1",
      userId: "00000000-0000-0000-0000-000000000001",
      role: "assistant",
      content: "Good morning! ☀️ Ready for today's placement progress? One focused action is all we need to keep compounding momentum.",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "msg-2",
      userId: "00000000-0000-0000-0000-000000000001",
      role: "user",
      content: "Hey Murmur! I'm feeling a bit overwhelmed by binary trees and graphs today. Where should I start?",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "msg-3",
      userId: "00000000-0000-0000-0000-000000000001",
      role: "assistant",
      content: "Totally natural feeling! Let's strip away the noise. Don't worry about complex graphs right now — just solve one standard BFS level-order traversal problem today. 20 focused minutes and you're done. You've already got 3 days of consistent streaks behind you!",
      createdAt: new Date(Date.now() - 3600000 * 3 + 15000).toISOString(),
    },
  ];

  memories: MockMemory[] = [
    {
      id: "mem-1",
      userId: "00000000-0000-0000-0000-000000000001",
      key: "target_career_role",
      value: "Software Development Engineer (Full Stack / Backend)",
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "mem-2",
      userId: "00000000-0000-0000-0000-000000000001",
      key: "primary_tech_stack",
      value: "TypeScript, React, Node.js, Express, PostgreSQL",
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "mem-3",
      userId: "00000000-0000-0000-0000-000000000001",
      key: "placement_timeline",
      value: "Campus interviews and off-campus placements in Q4",
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "mem-4",
      userId: "00000000-0000-0000-0000-000000000001",
      key: "current_learning_focus",
      value: "Sliding window algorithms and database indexing internals",
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  summaries: MockSummary[] = [
    {
      id: "sum-1",
      userId: "00000000-0000-0000-0000-000000000001",
      weekStart: new Date(Date.now() - 7 * 86400000).toISOString(),
      content:
        "### Weekly Reflection — Great Consistency!\n\n" +
        "You logged **5 completed micro-actions** this past week, demonstrating strong persistence in data structures and backend fundamentals.\n\n" +
        "- **Key Highlights:** Successfully built out Murmur monorepo foundations and practiced vector indexing algorithms.\n" +
        "- **Next Week Focus:** Continue compounding small wins on algorithm problem sets.\n\n" +
        "Remember: consistency always beats intensity over long horizons.",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];
}

export const devMockStore = new DevMockStore();
