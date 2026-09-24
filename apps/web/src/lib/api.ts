import { supabase } from "./supabase.js";

export async function getAuthToken(): Promise<string | null> {
  // Check for local demo token first
  const demoToken = localStorage.getItem("murmur_demo_token");
  if (demoToken) {
    return demoToken;
  }

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Ensure prefix with /api
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
