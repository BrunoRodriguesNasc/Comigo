type IconProps = { className?: string };

function icon(d: string) {
  return function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    );
  };
}

export const IconGrid = icon("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z");
export const IconScan = icon("M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10");
export const IconClock = icon("M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");
export const IconHeart = icon("M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z");
export const IconCompare = icon("M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4");
export const IconUser = icon("M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9a7 7 0 0 1 14 0");
export const IconMenu = icon("M4 6h16M4 12h16M4 18h16");
export const IconX = icon("M6 6l12 12M18 6 6 18");
export const IconArrowRight = icon("M5 12h14M13 6l6 6-6 6");
export const IconCheck = icon("M5 12.5l4.5 4.5L19 7");
export const IconShield = icon("M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z");
export const IconList = icon("M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01");
export const IconClipboard = icon("M9 4h6v3H9zM7 5H5v15h14V5h-2M8 12h8M8 16h5");
export const IconSpark = icon("M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6");
export const IconEye = icon("M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z");
