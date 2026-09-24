import React from "react";
import {
  BarChart3,
  Calendar,
  Sparkles,
  Database,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useSummaries, useMemories, useActions } from "../lib/queries.js";

export const InsightsPage: React.FC = () => {
  const { data: summariesData, isLoading: summariesLoading } = useSummaries();
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories();
  const { data: actionsData } = useActions();

  const summaries = summariesData?.summaries || [];
  const memories = memoriesData?.memories || [];
  const actions = actionsData?.actions || [];

  // Compute daily completion data for past 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = days[d.getDay()];
    const dateStr = d.toISOString().split("T")[0] || "";

    const dayActions = actions.filter((a) => a.scheduledFor && a.scheduledFor.startsWith(dateStr));
    const completed = dayActions.filter((a) => a.status === "done").length;
    const pending = dayActions.filter((a) => a.status === "pending").length;

    return {
      day: dayName,
      completed,
      pending,
      total: dayActions.length,
    };
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Weekly Insights & Long-Term Memory</span>
          <BarChart3 className="w-6 h-6 text-purple-400 inline" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Visual analytics on your daily momentum, Sunday reports, and contextual facts.
        </p>
      </div>

      {/* Completion Chart (Recharts) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">7-Day Micro-Action Activity</h2>
            <p className="text-xs text-slate-400">Comparing completed vs pending actions</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Realtime Analytics
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#334155" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Sunday Summaries & Memory Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sunday Summaries Archive */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Sunday Weekly Reports</h2>
          </div>

          {summariesLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-xs">Loading summaries...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
              No weekly summaries yet. Murmur generates Sunday reports every week at 6:00 PM in your
              timezone.
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Week of {new Date(summary.weekStart).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500">
                      {new Date(summary.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    {summary.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memory Bank */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Contextual Memory Bank</h2>
          </div>

          <p className="text-xs text-slate-400">
            Facts extracted by Gemini during background reflections and stored in PostgreSQL.
          </p>

          {memoriesLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
              <p className="text-xs">Accessing memories...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
              No structured facts recorded yet. Chat with Murmur about your career goals, projects,
              or habits to build its memory!
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80">
              {memories.map((mem) => (
                <div key={mem.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300 font-mono">{mem.key}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(mem.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{mem.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
