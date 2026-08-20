"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  message?: string;
}

export default function WhatsAppButton({ message }: Props) {
  const [number, setNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");

  useEffect(() => {
    apiFetch<{ whatsappNumber: string | null }>("/settings")
      .then((s) => {
        if (s.whatsappNumber) setNumber(s.whatsappNumber);
      })
      .catch(() => {
        // fall back silently to the env default if the API is unreachable
      });
  }, []);

  if (!number) return null;

  const text = encodeURIComponent(message ?? "Hi! I'd like to order from your store.");
  const href = `https://wa.me/${number}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border-2 border-ink bg-green-500 px-4 py-3 font-rang text-white shadow-lg transition hover:bg-green-600"
      aria-label="Order on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.78 14.16c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.05.09-3.35-.7-2.83-1.11-4.65-4-4.79-4.19-.14-.19-1.15-1.53-1.15-2.92s.72-2.07.98-2.35c.25-.28.55-.35.73-.35h.53c.17 0 .4-.02.62.48.24.55.8 1.9.87 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.14.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.28.75 1.23 1.61 2 1.11.98 2.04 1.29 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.28.38-.24.63-.14.26.1 1.6.76 1.88.9.27.14.46.21.52.32.07.12.07.68-.17 1.36z" />
      </svg>
      <span className="hidden text-sm font-medium sm:inline">Order on WhatsApp</span>
    </a>
  );
}
