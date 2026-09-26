import { supabase } from "./supabase.js";

const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, "") : "";

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

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // If API_BASE is configured (e.g. https://murmur-86lm.onrender.com), target it directly
  const url = API_BASE ? `${API_BASE}${cleanEndpoint}` : `/api${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    throw new Error(
      `Received non-JSON response from ${url} (status ${response.status}). Ensure backend is reachable.`
    );
  }

  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
