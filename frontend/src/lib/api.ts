const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export { API_URL };

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("jumarald_token") || localStorage.getItem("jumarald_admin_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    return data as T;
  } catch (err: any) {
    if (typeof window === "undefined") {
      console.warn(`[SSG Build] API fetch failed for ${endpoint}:`, err.message);
      return [] as unknown as T;
    }
    throw err;
  }
}

export async function apiUpload<T = { url: string; filename: string }>(file: File): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("jumarald_token") || localStorage.getItem("jumarald_admin_token")
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
    throw new Error(data.message || "Upload failed");
  }

  return data as T;
}

