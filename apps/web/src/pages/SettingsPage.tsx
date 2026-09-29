import React, { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  Send,
  User,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  Shield,
  Loader2,
  GraduationCap,
  Briefcase,
  Target,
  Moon,
  Sun,
  Bell,
} from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useUpdatePreferences,
  useGenerateTelegramLink,
} from "../lib/queries.js";
import { toast } from "sonner";

export const SettingsPage: React.FC = () => {
  const { data: profileData, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const updatePreferences = useUpdatePreferences();
  const generateLink = useGenerateTelegramLink();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [branch, setBranch] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [timeline, setTimeline] = useState("2026 Batch");
  const [primaryGoal, setPrimaryGoal] = useState("");

  const [morningHour, setMorningHour] = useState(8);
  const [eveningHour, setEveningHour] = useState(20);
  const [eveningNotificationEnabled, setEveningNotificationEnabled] = useState(false);
  const [tone, setTone] = useState<"friendly" | "direct" | "encouraging">("friendly");
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileData?.profile) {
      setName(profileData.profile.name || "");
      setTimezone(profileData.profile.timezone || "Asia/Kolkata");
      setBranch(profileData.profile.branch || "");
      setTargetRole(profileData.profile.targetRole || "");
      setFocusArea(profileData.profile.focusArea || "");
      setTimeline(profileData.profile.timeline || "2026 Batch");
      setPrimaryGoal(profileData.profile.primaryGoal || "");
    }
    if (profileData?.preferences) {
      setMorningHour(profileData.preferences.morningHour ?? 8);
      setEveningHour(profileData.preferences.eveningHour ?? 20);
      setEveningNotificationEnabled(profileData.preferences.eveningNotificationEnabled ?? false);
      setTone(profileData.preferences.tone || "friendly");
    }
  }, [profileData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        updateProfile.mutateAsync({
          name,
          timezone,
          branch: branch.trim() || null,
          targetRole: targetRole.trim() || null,
          focusArea: focusArea.trim() || null,
          timeline: timeline.trim() || null,
          primaryGoal: primaryGoal.trim() || null,
        }),
        updatePreferences.mutateAsync({
          morningHour,
          eveningHour,
          eveningNotificationEnabled,
          tone,
        }),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    }
  };

  const handleGenerateTelegram = async () => {
    try {
      const res = await generateLink.mutateAsync();
      if (res?.url) {
        setTelegramUrl(res.url);
        toast.success("New Telegram link generated! Opening bot...");
        window.open(res.url, "_blank");
      } else {
        toast.error("No Telegram URL returned by the server.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate link");
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isTelegramLinked = profileData?.telegramLinked;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Account & Companion Settings</span>
          <Settings className="w-6 h-6 text-indigo-400 inline" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize your placement profile, notification frequency, and companion personality.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Placement Profile & Background</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Branch / Degree
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. 4th Year ECE, CSE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Target Role / Domain
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Embedded Systems, Frontend Developer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Current Focus Area
              </label>
              <input
                type="text"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="e.g. Resume & Projects, DSA, Aptitude"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Placement Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Immediate / Ongoing">Immediate / Ongoing Placements</option>
                <option value="2026 Batch">2026 Batch (Next few months)</option>
                <option value="6+ Months">6+ Months out (Early Prep)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Primary Goal / Expectation
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Build daily consistency without feeling overwhelmed"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Schedule & Notification Hours */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Notification Schedule</span>
            </div>

            {/* Twice a day toggle */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-300">
                Twice-a-Day Check-in
              </span>
              <button
                type="button"
                onClick={() => setEveningNotificationEnabled(!eveningNotificationEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  eveningNotificationEnabled ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    eveningNotificationEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Morning Micro-Action Delivery
                </span>
                <span className="text-indigo-400 font-semibold">{morningHour}:00 AM</span>
              </label>
              <input
                type="range"
                min={5}
                max={12}
                value={morningHour}
                onChange={(e) => setMorningHour(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Your focused 15-minute daily micro-action arrives at this hour.
              </p>
            </div>

            <div className={eveningNotificationEnabled ? "opacity-100 transition" : "opacity-40 transition"}>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  Evening Reflection Delivery
                </span>
                <span className="text-purple-400 font-semibold">
                  {eveningHour > 12 ? eveningHour - 12 : eveningHour}:00 {eveningHour >= 12 ? "PM" : "AM"}
                </span>
              </label>
              <input
                type="range"
                min={17}
                max={23}
                disabled={!eveningNotificationEnabled}
                value={eveningHour}
                onChange={(e) => setEveningHour(Number(e.target.value))}
                className="w-full accent-purple-500 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {eveningNotificationEnabled
                  ? "Gentle end-of-day check-in to celebrate small wins or unwind."
                  : "Turn on Twice-a-Day Check-in above to activate evening reflections."}
              </p>
            </div>
          </div>
        </div>

        {/* Assistant Tone */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Assistant Personality & Tone</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "friendly",
                title: "Friendly",
                desc: "Warm, empathetic, conversational, and gentle.",
              },
              {
                id: "direct",
                title: "Direct",
                desc: "Concise, action-first, no fluff, straight to execution.",
              },
              {
                id: "encouraging",
                title: "Encouraging",
                desc: "Motivational, reinforcing agency and small wins.",
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id as any)}
                className={`p-4 rounded-xl border text-left transition ${
                  tone === t.id
                    ? "bg-indigo-600/20 border-indigo-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{t.title}</span>
                  {tone === t.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Telegram Integration Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Telegram Integration</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isTelegramLinked
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {isTelegramLinked ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Telegram powers the conversational chat loop and scheduled morning action deliveries.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerateTelegram}
              disabled={generateLink.isPending}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              {generateLink.isPending
                ? "Generating..."
                : isTelegramLinked
                ? "Re-link Telegram Account"
                : "Connect Telegram"}
            </button>

            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <span>Launch Bot in Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateProfile.isPending || updatePreferences.isPending}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {updateProfile.isPending || updatePreferences.isPending
                ? "Saving Changes..."
                : "Save Preferences"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
