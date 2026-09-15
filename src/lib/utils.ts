import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Helper padrão do shadcn: junta classes e resolve conflitos do Tailwind (p-4 + p-0 → p-0). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
