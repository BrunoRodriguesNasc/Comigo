"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconMenu, IconScan, IconX } from "./icons";
import { ButtonLink, Logo, cx } from "./ui";

const NAV = [
  { href: "/painel", label: "Início", match: ["/painel"] },
  { href: "/escanear", label: "Analisar", match: ["/escanear", "/colar"] },
  { href: "/historico", label: "Meus produtos", match: ["/historico", "/analise", "/comparar"] },
  { href: "/favoritos", label: "Favoritos", match: ["/favoritos"] },
  { href: "/perfil", label: "Meu perfil", match: ["/perfil"] },
];

export interface ProfileSummary {
  exists: boolean;
  title: string;
  detail: string;
}

export function AppFrame({ children, profile }: { children: ReactNode; profile: ProfileSummary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <header className="sticky top-0 z-30 border-b border-line bg-ground">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo href="/painel" />

          <nav aria-label="Navegação principal" className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => {
              const active = isActive(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative py-2 text-sm transition", active ? "text-ink" : "text-ink-soft hover:text-ink")}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose" />}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/perfil" className="text-right text-xs leading-snug transition hover:opacity-80">
              <span className="block text-muted">{profile.exists ? "Sua pele" : "Seu perfil"}</span>
              <span className={profile.exists ? "text-ink" : "text-rose"}>{profile.exists ? profile.title : "criar agora"}</span>
            </Link>
            <ButtonLink href="/escanear" className="px-5 py-2.5">
              Analisar produto
            </ButtonLink>
          </div>

          <button onClick={() => setOpen(true)} className="-mr-2 rounded-full p-2 text-ink md:hidden" aria-label="Abrir menu" aria-expanded={open}>
            <IconMenu />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ground px-6 py-5 md:hidden">
          <div className="flex items-center justify-between">
            <Logo href="/painel" />
            <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 text-ink" aria-label="Fechar menu">
              <IconX />
            </button>
          </div>
          <nav aria-label="Menu" className="mt-14 flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx("font-display text-[42px] leading-tight", isActive(item.match) ? "text-ink" : "text-ink-soft")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-line pt-6">
            <Link href="/perfil" className="block text-sm text-ink-soft">
              {profile.exists ? `Sua pele: ${profile.title}` : "Criar meu perfil →"}
            </Link>
            <p className="text-xs leading-relaxed text-muted">Informação educativa. Não substitui a orientação de um dermatologista.</p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-32 pt-10 sm:px-8 md:pb-24 lg:pt-16">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pb-28 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 md:pb-8">
          <p>Informação educativa sobre compatibilidade de cosméticos. Não substitui a orientação de um dermatologista.</p>
          <Link href="/" className="transition hover:text-ink">
            Sobre o comigo
          </Link>
        </div>
      </footer>

      {!pathname.startsWith("/escanear") && (
        <Link
          href="/escanear"
          className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-ground shadow-[0_12px_30px_-14px_rgba(58,42,34,0.55)] md:hidden"
        >
          <IconScan className="h-4 w-4" />
          Analisar produto
        </Link>
      )}
    </div>
  );
}
