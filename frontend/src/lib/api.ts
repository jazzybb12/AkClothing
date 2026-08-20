const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

// Backend validation failures (zod) come back as { error: "Validation failed", details:
// { fieldErrors: { field: ["reason"] }, formErrors: [...] } }. Surface the specific
// reason instead of the generic wrapper string, so e.g. a rejected new password says
// why ("Password must include a number") instead of just "Validation failed".
function extractErrorMessage(body: { error?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } }): string {
  const fieldErrors = body.details?.fieldErrors ? Object.values(body.details.fieldErrors).flat() : [];
  const formErrors = body.details?.formErrors ?? [];
  const specific = [...fieldErrors, ...formErrors].filter(Boolean);
  if (specific.length > 0) return specific.join(" ");
  return body.error ?? "Request failed";
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, extractErrorMessage(body));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Sibling to apiFetch for endpoints that return a file (CSV export) instead of JSON —
// apiFetch can't be reused since it unconditionally parses the body as JSON.
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, extractErrorMessage(body));
  }

  return response.blob();
}
