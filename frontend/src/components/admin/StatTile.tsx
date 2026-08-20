interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  deltaPct?: number | null;
  deltaLabel?: string;
}

export default function StatTile({ icon, label, value, deltaPct, deltaLabel }: Props) {
  const hasDelta = deltaPct !== undefined;
  const isUp = (deltaPct ?? 0) >= 0;

  return (
    <div className="rang-card min-w-[160px] max-w-[260px] flex-1 basis-[160px] p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          {icon}
        </div>
        <p className="min-w-0 text-sm text-ink-soft">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {hasDelta && (
        <p className={`mt-1 text-xs font-medium ${deltaPct === null ? "text-ink-soft" : isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {deltaPct === null ? (
            "New today"
          ) : (
            <>
              {isUp ? "▲" : "▼"} {Math.abs(deltaPct)}% {deltaLabel}
            </>
          )}
        </p>
      )}
    </div>
  );
}
