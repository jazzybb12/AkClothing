"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  // Pass a server-fetched value (e.g. from the root layout) to skip the internal fetch;
  // omit it to have this component fetch Settings.logoUrl itself (used by components that
  // aren't wrapped in that server-side fetch, e.g. the admin shell/login).
  logoUrl?: string | null;
  size?: number;
  className?: string;
  // Rendered instead of the image when no logo is set, so the brand mark is never
  // left completely blank before one is uploaded. The image fully replaces this when
  // a logo exists — the two are never shown together.
  fallback?: React.ReactNode;
}

export default function BrandMark({ logoUrl: providedLogoUrl, size = 28, className = "", fallback = null }: Props) {
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  // Server-provided value is known immediately; a self-fetch needs a tick to resolve —
  // tracked separately so the fallback text doesn't flash before the fetch finishes.
  const [selfFetchDone, setSelfFetchDone] = useState(providedLogoUrl !== undefined);
  const logoUrl = providedLogoUrl !== undefined ? providedLogoUrl : fetchedLogoUrl;

  useEffect(() => {
    if (providedLogoUrl !== undefined) return;
    apiFetch<{ logoUrl: string | null }>("/settings")
      .then((s) => setFetchedLogoUrl(s.logoUrl))
      .catch(() => {})
      .finally(() => setSelfFetchDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!logoUrl) return selfFetchDone ? <>{fallback}</> : null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="ak.shop" width={size} height={size} className={`rounded object-contain ${className}`} />
  );
}
