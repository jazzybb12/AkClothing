function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function OrdersIcon() {
  return (
    <Icon>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

export function RevenueIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2" />
      <path d="M12 6v1.5M12 16.5V18" />
    </Icon>
  );
}

export function CustomersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <path d="M16 4.5c1.7.4 3 1.9 3 3.5s-1.3 3.1-3 3.5" />
      <path d="M19.5 14.3c1.5.7 2.5 2 2.5 3.7" />
    </Icon>
  );
}

export function AovIcon() {
  return (
    <Icon>
      <path d="M20 12l-8 8-9-9V4h7l10 8z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ConversionIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}
