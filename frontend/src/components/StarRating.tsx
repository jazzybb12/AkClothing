interface Props {
  value: number;
  size?: "sm" | "md";
  onChange?: (value: number) => void;
}

export default function StarRating({ value, size = "sm", onChange }: Props) {
  const dimension = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <svg viewBox="0 0 20 20" className={`${dimension} ${filled ? "fill-accent" : "fill-gray-200"}`}>
            <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7l-5.2 2.8 1-5.8-4.2-4.1 5.8-.8L10 1.5z" />
          </svg>
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
