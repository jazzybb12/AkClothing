const SESSION_KEY = "ak-shop-session-id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Fire-and-forget — a tracking failure should never affect the page. Never called for
// /admin/* paths (see PageViewTracker), so admin panel usage never inflates visitor stats.
export function trackPageview(path: string) {
  try {
    const body = JSON.stringify({
      path,
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_URL}/track/pageview`, new Blob([body], { type: "application/json" }));
    } else {
      fetch(`${API_URL}/track/pageview`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // never let tracking break the page
  }
}
