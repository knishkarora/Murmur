import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://riyzydfvosbumpfqolcs.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeXp5ZGZ2b3NidW1wZnFvbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDM5MjUsImV4cCI6MjEwNTgxOTkyNX0.FtSmjc8n3CdauAfoztKXUL7ghJi1sw34f08cfE6PTpc";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
