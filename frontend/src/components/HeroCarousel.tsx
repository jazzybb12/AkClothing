"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Banner, BannerGradientKey } from "@/lib/types";

const GRADIENT_CLASSES: Record<BannerGradientKey, string> = {
  brand: "from-brand-dark via-brand to-plum",
  emerald: "from-jade via-brand to-plum",
  accent: "from-accent-dark via-accent to-brand",
};

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const slide = banners[active % banners.length];
  const hasImage = !!slide.imageUrl;

  return (
    <section
      className={`font-rang relative overflow-hidden rounded-[22px] border-2 border-ink px-8 py-20 text-center text-white transition-colors duration-700 sm:py-28 ${
        hasImage ? "bg-ink" : `bg-gradient-to-br ${GRADIENT_CLASSES[slide.gradientKey]}`
      }`}
    >
      {hasImage && (
        <>
          <Image
            src={slide.imageUrl!}
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </>
      )}
      {!hasImage && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "repeating-radial-gradient(circle at 15% 20%, rgba(255,255,255,.6) 0 3px, transparent 3px 30px)",
          }}
        />
      )}
      <div key={active} className="relative animate-fade-in">
        {slide.eyebrow && (
          <span className="rang-eyebrow mb-2 inline-block">✦ {slide.eyebrow}</span>
        )}
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{slide.heading}</h1>
        {slide.subtext && <p className="mx-auto mt-4 max-w-xl text-white/85">{slide.subtext}</p>}
        {slide.ctaLabel && slide.ctaHref && (
          <Link href={slide.ctaHref} className="rang-btn-accent mt-8 inline-flex">
            {slide.ctaLabel}
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <div className="relative mt-10 flex items-center justify-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
