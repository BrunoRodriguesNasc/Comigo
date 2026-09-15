/** Ilustrações de traço fino, em tons de marca. Decorativas (aria-hidden). */
type P = { className?: string };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Sprig({ className }: P) {
  return (
    <svg viewBox="0 0 120 160" className={className} {...stroke} aria-hidden>
      <path d="M58 156C60 120 64 80 86 14" />
      <path d="M61 124c-16-2-27-12-31-28 15 1 27 10 31 28Z" fill="var(--color-sage)" />
      <path d="M65 99c14-5 22-16 23-31-13 3-22 13-23 31Z" fill="var(--color-sage)" />
      <path d="M70 73c-14-3-23-13-26-27 13 1 23 10 26 27Z" fill="var(--color-sage)" />
      <path d="M77 49c11-6 17-16 16-28-11 4-17 14-16 28Z" fill="var(--color-sage)" />
    </svg>
  );
}

export function Bottle({ className }: P) {
  return (
    <svg viewBox="0 0 120 190" className={className} {...stroke} aria-hidden>
      <path d="M50 14c0-5 4-8 10-8s10 3 10 8v20H50V14Z" fill="var(--color-peach)" />
      <path d="M46 34h28v16H46z" fill="var(--color-sand)" />
      <path d="M34 66c0-9 7-16 16-16h20c9 0 16 7 16 16v104c0 7-6 13-13 13H47c-7 0-13-6-13-13V66Z" fill="var(--color-blush)" />
      <path d="M46 104h28M50 116h20" />
      <path d="M52 90c3 3 13 3 16 0" />
    </svg>
  );
}

export function Jar({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} {...stroke} aria-hidden>
      <rect x="20" y="30" width="80" height="22" rx="9" fill="var(--color-sand)" />
      <path d="M26 52h68v38c0 11-9 20-20 20H46c-11 0-20-9-20-20V52Z" fill="var(--color-peach)" />
      <circle cx="48" cy="74" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="72" cy="74" r="1.6" fill="currentColor" stroke="none" />
      <path d="M52 84c4 4 12 4 16 0" />
    </svg>
  );
}

export function Droplet({ className }: P) {
  return (
    <svg viewBox="0 0 40 52" className={className} {...stroke} aria-hidden>
      <path d="M20 4C14 16 6 24 6 33a14 14 0 0 0 28 0c0-9-8-17-14-29Z" fill="var(--color-blush)" />
    </svg>
  );
}

export function Sparkle({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Z" />
    </svg>
  );
}

export function HeartMark({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-8-4.9-8-11A4.6 4.6 0 0 1 12 7.2 4.6 4.6 0 0 1 20 10c0 6.1-8 11-8 11Z" />
    </svg>
  );
}
