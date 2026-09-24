import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  ArrowRight,
  Send,
  BarChart3,
  MessageSquare,
  Calendar,
  Clock,
  Flame,
  Check,
  Loader2,
} from "lucide-react";
import { useProfile, useActions, useToggleAction, useCreateAction } from "../lib/queries.js";

export const DashboardPage: React.FC = () => {
  const { data: profileData } = useProfile();
  const { data: actionsData, isLoading: actionsLoading } = useActions();
  const toggleAction = useToggleAction();
  const createAction = useCreateAction();

  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [newActionText, setNewActionText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const actions = actionsData?.actions || [];
  const profile = profileData?.profile;
  const preferences = profileData?.preferences;
  const isTelegramLinked = profileData?.telegramLinked;

  // Filter actions
  const filteredActions = actions.filter((a) => {
    if (filter === "pending") return a.status === "pending";
    if (filter === "done") return a.status === "done";
    return true;
  });

  // Find today's primary action (first pending action, or most recent)
  const todayPrimaryAction = actions.find((a) => a.status === "pending") || actions[0];
  const completedCount = actions.filter((a) => a.status === "done").length;

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    await createAction.mutateAsync({ content: newActionText.trim() });
    setNewActionText("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Good day, {profile?.name || "Explorer"}</span>
            <Sparkles className="w-6 h-6 text-indigo-400 inline" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Focus on one single micro-action today. Progress compounds automatically.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Focus</span>
        </button>
      </div>

      {/* Add Action Modal / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAction}
          className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3"
        >
          <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Define a New Micro-Action
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              placeholder="e.g., Read documentation on Drizzle ORM queries for 15 minutes"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={createAction.isPending || !newActionText.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {createAction.isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Hero Card: Today's Primary Micro-Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              Today's Key Priority
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {todayPrimaryAction && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                todayPrimaryAction.status === "done"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {todayPrimaryAction.status === "done" ? "Completed Today" : "Ready for Action"}
            </span>
          )}
        </div>

        {todayPrimaryAction ? (
          <div className="flex items-start gap-4 mt-2">
            <button
              onClick={() => toggleAction.mutate(todayPrimaryAction.id)}
              disabled={toggleAction.isPending}
              className={`mt-1 p-2 rounded-xl border transition-all ${
                todayPrimaryAction.status === "done"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500"
              }`}
            >
              {todayPrimaryAction.status === "done" ? (
                <Check className="w-5 h-5 stroke-[3]" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1">
              <p
                className={`text-lg sm:text-xl font-medium leading-relaxed ${
                  todayPrimaryAction.status === "done"
                    ? "text-slate-400 line-through decoration-slate-600"
                    : "text-white"
                }`}
              >
                {todayPrimaryAction.content}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Generated based on your recent discussions and ongoing placement objectives.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm">
            <p>No actions pending for today! Enjoy your momentum or define a new micro-action.</p>
          </div>
        )}
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Actions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{completedCount}</p>
          <p className="text-[11px] text-slate-500">Recorded across all days</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Telegram Status</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-white">
            {isTelegramLinked ? "Connected" : "Not Linked"}
          </p>
          <p className="text-[11px] text-slate-500">
            {isTelegramLinked
              ? "Nudges trigger at " + (preferences?.morningHour ?? 8) + ":00 AM"
              : "Connect in settings for morning reminders"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Assistant Tone</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-base font-semibold capitalize text-white">
            {preferences?.tone || "Friendly"}
          </p>
          <p className="text-[11px] text-slate-500">Configurable in account settings</p>
        </div>
      </div>

      {/* Actions Archive List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Actions History</h2>
            <p className="text-xs text-slate-400">Review and toggle your recent micro-commitments</p>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({actions.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === "pending"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pending ({actions.filter((a) => a.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === "done" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {actionsLoading ? (
          <div className="py-8 flex justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No actions found matching current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredActions.map((action) => (
              <div
                key={action.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-800/30 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleAction.mutate(action.id)}
                    className={`p-1.5 rounded-lg border transition ${
                      action.status === "done"
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {action.status === "done" ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span
                    className={`text-sm truncate ${
                      action.status === "done"
                        ? "text-slate-400 line-through decoration-slate-600"
                        : "text-slate-200"
                    }`}
                  >
                    {action.content}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                  <span>{new Date(action.scheduledFor).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      action.status === "done"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {action.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/conversations"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                Conversations Archive
              </h3>
              <p className="text-xs text-slate-400">Review recent bot dialogues and transcripts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition" />
        </Link>

        <Link
          to="/insights"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition">
                Weekly Insights & Stats
              </h3>
              <p className="text-xs text-slate-400">View Sunday reports and completion charts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition" />
        </Link>
      </div>
    </div>
  );
};
