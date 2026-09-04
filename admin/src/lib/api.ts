const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export { API_URL };

// Client-side in-memory micro-cache
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}
const clientCache = new Map<string, ClientCacheEntry<any>>();
const CLIENT_CACHE_TTL_MS = 15000; // 15 seconds client cache for super-fast navigation

export function clearClientCache(pattern?: string) {
  if (!pattern) {
    clientCache.clear();
    return;
  }
  for (const k of clientCache.keys()) {
    if (k.includes(pattern)) {
      clientCache.delete(k);
    }
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipCache?: boolean; cacheTtlMs?: number } = {}
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const ttl = options.cacheTtlMs ?? CLIENT_CACHE_TTL_MS;

  // Check client-side cache for GET requests
  if (isGet && !options.skipCache) {
    const cached = clientCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("jumarald_admin_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.skipCache) {
    fetchOptions.cache = "no-store";
  }

  const res = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API request failed");
  }

  // Store in cache for GET requests
  if (isGet && !options.skipCache) {
    clientCache.set(endpoint, { data, timestamp: Date.now() });
  } else if (!isGet) {
    // If mutation (POST/PUT/DELETE), invalidate relevant client cache
    const resourcePrefix = endpoint.split("/")[1] || "";
    clearClientCache(resourcePrefix);
  }

  return data as T;
}

export async function apiUpload<T = { url: string; filename: string }>(file: File): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("jumarald_admin_token")
      : null;

  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "File upload failed");
  }

  clearClientCache();
  return data as T;
}
