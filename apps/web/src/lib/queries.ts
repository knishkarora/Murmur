import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api.js";
import { toast } from "sonner";

export interface ProfileData {
  status: string;
  profile: {
    id: string;
    userId: string;
    name: string | null;
    timezone: string;
    onboardingDone: boolean;
    conversationSummary: string | null;
    createdAt: string;
  };
  preferences: {
    userId: string;
    morningHour: number;
    eveningHour: number;
    weeklyDay: number;
    tone: "friendly" | "direct" | "encouraging";
  };
  telegramLinked: boolean;
  telegramLinkedAt: string | null;
}

export interface ActionItem {
  id: string;
  userId: string;
  content: string;
  status: "pending" | "done" | "skipped";
  scheduledFor: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SummaryItem {
  id: string;
  userId: string;
  weekStart: string;
  content: string;
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: string;
}

// Profile & Preferences
export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => apiRequest<ProfileData>("/me/profile"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string | null; timezone?: string; onboardingDone?: boolean }) =>
      apiRequest("/me/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { morningHour?: number; eveningHour?: number; weeklyDay?: number; tone?: string }) =>
      apiRequest("/me/preferences", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Preferences updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update preferences");
    },
  });
}

// Daily Actions
export function useActions() {
  return useQuery<{ status: string; actions: ActionItem[] }>({
    queryKey: ["actions"],
    queryFn: () => apiRequest<{ status: string; actions: ActionItem[] }>("/me/actions"),
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; scheduledFor?: string }) =>
      apiRequest("/me/actions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Action added!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create action");
    },
  });
}

export function useToggleAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      apiRequest(`/me/actions/${actionId}/complete`, {
        method: "POST",
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      const isDone = res.action?.status === "done";
      if (isDone) {
        toast.success("Great job! Action completed 🎉");
      } else {
        toast.info("Action marked pending");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle action status");
    },
  });
}

// Messages & Conversations
export function useMessages() {
  return useQuery<{ status: string; messages: MessageItem[] }>({
    queryKey: ["messages"],
    queryFn: () => apiRequest<{ status: string; messages: MessageItem[] }>("/me/messages"),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiRequest("/me/messages", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    },
  });
}

// Weekly Summaries
export function useSummaries() {
  return useQuery<{ status: string; summaries: SummaryItem[] }>({
    queryKey: ["summaries"],
    queryFn: () => apiRequest<{ status: string; summaries: SummaryItem[] }>("/me/summaries"),
  });
}

// Memory Facts
export function useMemories() {
  return useQuery<{ status: string; memories: MemoryItem[] }>({
    queryKey: ["memories"],
    queryFn: () => apiRequest<{ status: string; memories: MemoryItem[] }>("/me/memories"),
  });
}

// Telegram Link
export function useGenerateTelegramLink() {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ url: string; expiresAt: string }>("/me/telegram/link", {
        method: "POST",
      }),
  });
}
