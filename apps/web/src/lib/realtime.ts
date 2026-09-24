import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase.js";
import { useAuth } from "./authContext.js";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (!user || isDemo) return;

    // Listen for changes to messages table for this user
    const messageChannel = supabase
      .channel(`public:messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();

    // Listen for changes to daily_actions table
    const actionsChannel = supabase
      .channel(`public:daily_actions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_actions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["actions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(actionsChannel);
    };
  }, [user, isDemo, queryClient]);
}
