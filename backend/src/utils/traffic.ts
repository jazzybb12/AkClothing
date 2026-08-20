const SEARCH_ENGINES = ["google.", "bing.", "yahoo.", "duckduckgo.", "baidu."];
const SOCIAL_SITES = ["facebook.", "instagram.", "twitter.", "x.com", "tiktok.", "pinterest.", "linkedin.", "wa.me", "whatsapp."];

// Classifies a pageview into a traffic channel from its referrer + query string.
// An explicit ?utm_source=email always wins (used to tag links in our own emails);
// otherwise it's inferred from the referring domain. `ownHost` lets internal
// navigation (referrer = our own site) count as DIRECT rather than REFERRAL.
export function classifyChannel(
  referrer: string | null | undefined,
  path: string,
  ownHost?: string
): "DIRECT" | "ORGANIC" | "SOCIAL" | "REFERRAL" | "EMAIL" {
  const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
  const utmSource = new URLSearchParams(query).get("utm_source")?.toLowerCase();
  if (utmSource === "email" || utmSource === "newsletter") return "EMAIL";

  if (!referrer) return "DIRECT";

  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "DIRECT";
  }

  if (ownHost && host === ownHost.toLowerCase()) return "DIRECT";
  if (SEARCH_ENGINES.some((s) => host.includes(s))) return "ORGANIC";
  if (SOCIAL_SITES.some((s) => host.includes(s))) return "SOCIAL";
  return "REFERRAL";
}
