"use client";

import { useEffect, useRef, useState } from "react";

export interface DateRangeValue {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  label: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const PRESETS: { label: string; make: () => DateRangeValue }[] = [
  { label: "Today", make: () => ({ from: toISODate(new Date()), to: toISODate(new Date()), label: "Today" }) },
  {
    label: "Last 7 days",
    make: () => ({ from: toISODate(daysAgo(6)), to: toISODate(new Date()), label: "Last 7 days" }),
  },
  {
    label: "Last 30 days",
    make: () => ({ from: toISODate(daysAgo(29)), to: toISODate(new Date()), label: "Last 30 days" }),
  },
  {
    label: "Last 90 days",
    make: () => ({ from: toISODate(daysAgo(89)), to: toISODate(new Date()), label: "Last 90 days" }),
  },
];

export const DEFAULT_RANGE: DateRangeValue = PRESETS[2].make();

interface Props {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCustomFrom(value.from);
    setCustomTo(value.to);
  }, [value.from, value.to]);

  function applyCustom() {
    if (!customFrom || !customTo || customFrom > customTo) return;
    onChange({ from: customFrom, to: customTo, label: `${customFrom} – ${customTo}` });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand transition hover:bg-brand/15"
      >
        {value.label}
        <svg viewBox="0 0 20 20" className={`h-3 w-3 fill-current transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M5 7l5 5 5-5H5z" />
        </svg>
      </button>
      {open && (
        <div className="rang-card absolute right-0 top-full z-20 mt-2 w-64 animate-fade-in bg-surface p-2 shadow-card-hover">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                onChange(p.make());
                setOpen(false);
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-brand/5 ${
                value.label === p.label ? "font-semibold text-brand" : "text-ink-soft"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="mt-1 border-t-2 border-ink/10 px-3 pt-2">
            <p className="pb-1.5 text-xs font-medium text-ink-soft">Custom range</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded border-2 border-ink/25 bg-surface px-2 py-1 text-xs text-ink"
              />
              <span className="text-ink-soft">–</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toISODate(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded border-2 border-ink/25 bg-surface px-2 py-1 text-xs text-ink"
              />
            </div>
            <button onClick={applyCustom} className="rang-btn-primary mt-2 w-full px-3 py-1.5 text-xs">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
