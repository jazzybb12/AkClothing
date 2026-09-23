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


const SESSION_KEYS = ["admin-access-token", "customer-access-token"];
export const SESSION_EVENT = "auth-session-changed";
const renewals = new Map<string, Promise<string>>();

function subject(token: string): string | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "="))).sub ?? null;
  } catch { return null; }
}

function expireSession(token: string) {
  for (const key of SESSION_KEYS) {
    if (window.localStorage.getItem(key) === token) window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

async function renewSession(token: string): Promise<string> {
  const pending = renewals.get(token);
  if (pending) return pending;
  const operation = (async () => {
    const keys = SESSION_KEYS.filter(key => window.localStorage.getItem(key) === token);
    if (!keys.length) throw new ApiError(401, "Your session ended. Please sign in again.");
    const response = await fetch(API_URL + "/auth/refresh", {
      method: "POST", credentials: "include", cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) expireSession(token);
      throw new ApiError(response.status, response.status >= 500
        ? "Could not renew your session. Please try again."
        : "Your session expired. Please sign in again.");
    }
    const result = await response.json();
    // The shared cookie may belong to another account logged in in this browser.
    if (typeof result.accessToken !== "string" || !subject(token) ||
        subject(result.accessToken) !== subject(token)) {
      expireSession(token);
      throw new ApiError(401, "Your session changed. Please sign in again.");
    }
    const currentKeys = keys.filter(key => window.localStorage.getItem(key) === token);
    if (!currentKeys.length) throw new ApiError(401, "Your session ended. Please sign in again.");
    currentKeys.forEach(key => window.localStorage.setItem(key, result.accessToken));
    window.dispatchEvent(new Event(SESSION_EVENT));
    return result.accessToken as string;
  })();
  renewals.set(token, operation);
  try { return await operation; } finally { renewals.delete(token); }
}

async function sessionFetch(path: string, options: RequestOptions, json: boolean): Promise<Response> {
  const { token, headers, ...rest } = options;
  const send = (accessToken?: string) => {
    const requestHeaders = new Headers(headers);
    if (json && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
    if (accessToken) requestHeaders.set("Authorization", "Bearer " + accessToken);
    return fetch(API_URL + path, { ...rest, credentials: "include", headers: requestHeaders, cache: "no-store" });
  };
  const response = await send(token);
  if (response.status !== 401 || !token || typeof window === "undefined" ||
      path === "/auth/refresh" || options.signal?.aborted) return response;
  // Another request may already have renewed this account's access token.
  const newer = SESSION_KEYS.map(key => window.localStorage.getItem(key))
    .find(value => value && value !== token && subject(value) === subject(token));
  const replacement = newer || await renewSession(token);
  if (options.signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  const retried = await send(replacement);
  if (retried.status === 401) expireSession(replacement);
  return retried;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await sessionFetch(path, options, true);

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
  const response = await sessionFetch(path, options, false);

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, extractErrorMessage(body));
  }

  return response.blob();
}
