import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useProfile, useUpdateProfile, useGenerateTelegramLink } from "../lib/queries.js";
import { toast } from "sonner";

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const generateLink = useGenerateTelegramLink();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
  );
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    if (profileData?.profile?.name) {
      setName(profileData.profile.name);
    }
    if (profileData?.profile?.timezone) {
      setTimezone(profileData.profile.timezone);
    }
  }, [profileData]);

  const handleGenerateTelegramLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await generateLink.mutateAsync();
      if (res?.url) {
        setTelegramUrl(res.url);
        toast.success("Telegram link generated! Opening bot in new tab...");
        window.open(res.url, "_blank");
      } else {
        toast.error("No Telegram URL returned by the server.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate Telegram deep link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || "Mio",
        timezone,
        onboardingDone: true,
      });
      toast.success("Welcome aboard! Workspace activated.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile setup");
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm">Preparing onboarding...</p>
      </div>
    );
  }

  const isTelegramLinked = profileData?.telegramLinked;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome to Murmur</h1>
            <p className="text-xs text-slate-400">Configure your companion in two quick steps</p>
          </div>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-6">
          {/* Step 1: Personal Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <User className="w-4 h-4" />
              <span>Step 1: Your Profile</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Preferred Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Primary Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST - UTC+00:00)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET - UTC+01:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST - UTC+09:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Your morning micro-action and weekly Sunday reviews will arrive according to this
                schedule.
              </p>
            </div>
          </div>

          {/* Step 2: Telegram Connection */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Send className="w-4 h-4" />
                <span>Step 2: Connect Telegram Bot</span>
              </div>
              {isTelegramLinked && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Linked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Murmur sends its morning nudges through Telegram. Connect your bot now, or link it
              anytime later from your settings.
            </p>

            {isTelegramLinked ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your Telegram account is connected and ready to receive prompts!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGenerateTelegramLink}
                  disabled={isGeneratingLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4 text-indigo-400" />
                  {isGeneratingLink ? "Generating Link..." : "Generate Telegram Deep Link"}
                </button>

                {telegramUrl && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2 text-xs">
                    <p className="text-slate-300 font-medium">
                      Open Telegram and click <code className="text-indigo-300 font-mono">Start</code>:
                    </p>
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
                    >
                      <span>Open in Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-60"
            >
              <span>{updateProfile.isPending ? "Activating..." : "Enter Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
