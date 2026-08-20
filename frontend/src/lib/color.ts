// Converts an admin-picked hex color into the CSS custom properties that drive
// Tailwind's `brand`/`accent` tokens at runtime (see tailwind.config.ts, which reads
// these as `rgb(var(--brand-rgb) / <alpha-value>)` so opacity modifiers like `bg-brand/10`
// keep working). `dark`/`light` shades are derived here rather than stored separately.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function triple([r, g, b]: [number, number, number]): string {
  return `${r} ${g} ${b}`;
}

function lighten([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt].map(Math.round) as [number, number, number];
}

function darken([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [r * (1 - amt), g * (1 - amt), b * (1 - amt)].map(Math.round) as [number, number, number];
}

export function isValidHex(hex: string | null | undefined): hex is string {
  return !!hex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

// Produces the full set of CSS var declarations for one color token (e.g. "brand"),
// given its base hex. Ratios match the app's original hardcoded light/dark shades.
export function colorTokenVars(varPrefix: string, hex: string): string {
  const rgb = hexToRgb(hex);
  const light = lighten(rgb, 0.35);
  const dark = darken(rgb, 0.25);
  return `--${varPrefix}-rgb:${triple(rgb)};--${varPrefix}-light-rgb:${triple(light)};--${varPrefix}-dark-rgb:${triple(dark)};`;
}
