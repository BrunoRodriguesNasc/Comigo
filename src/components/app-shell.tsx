"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Início", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/historico", label: "Histórico", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" },
  { href: "/escanear", label: "Escanear", icon: "" },
  { href: "/favoritos", label: "Favoritos", icon: "M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" },
  { href: "/perfil", label: "Perfil", icon: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9a7 7 0 0 1 14 0" },
];

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className={cx("flex-1 px-4 pt-4", hideNav ? "pb-8" : "pb-28")}>{children}</main>
      {!hideNav && (
        <nav
          aria-label="Navegação principal"
          className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-line bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur"
        >
          <ul className="grid grid-cols-5 items-end">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              if (item.href === "/escanear") {
                return (
                  <li key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      aria-label="Escanear produto"
                      className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 ring-4 ring-ground transition active:scale-95"
                    >
                      <ScanIcon className="h-7 w-7" />
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx("flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium", active ? "text-accent" : "text-muted")}
                    aria-current={active ? "page" : undefined}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function ScanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
    </svg>
  );
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <header className="mb-4 mt-1">
      {back && (
        <Link href={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-soft">
          ← Voltar
        </Link>
      )}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-[15px] text-ink-soft">{subtitle}</p>}
    </header>
  );
}
