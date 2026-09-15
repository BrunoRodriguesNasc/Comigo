"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconClock, IconCompare, IconGrid, IconHeart, IconMenu, IconScan, IconUser, IconX } from "./icons";
import { ButtonLink, Logo, cx, type Tone } from "./ui";

const NAV: { href: string; label: string; icon: typeof IconGrid; match: string[]; tone: Tone }[] = [
  { href: "/painel", label: "Painel", icon: IconGrid, match: ["/painel"], tone: "lilac" },
  { href: "/escanear", label: "Analisar produto", icon: IconScan, match: ["/escanear", "/colar"], tone: "peach" },
  { href: "/historico", label: "Histórico", icon: IconClock, match: ["/historico", "/analise"], tone: "butter" },
  { href: "/favoritos", label: "Favoritos", icon: IconHeart, match: ["/favoritos"], tone: "blush" },
  { href: "/comparar", label: "Comparar", icon: IconCompare, match: ["/comparar"], tone: "sage" },
  { href: "/perfil", label: "Meu perfil", icon: IconUser, match: ["/perfil"], tone: "lilac" },
];

const CHIP: Record<Tone, string> = {
  lilac: "bg-lilac text-accent-strong",
  peach: "bg-peach text-[#9a5a3c]",
  sage: "bg-sage text-good",
  butter: "bg-butter text-caution",
  blush: "bg-blush text-bad",
};

export interface ProfileSummary {
  exists: boolean;
  title: string;
  detail: string;
}

export function AppFrame({ children, profile }: { children: ReactNode; profile: ProfileSummary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 shrink-0 items-center justify-between px-6">
        <Logo href="/painel" />
        <button onClick={() => setOpen(false)} className="rounded-full p-2 text-muted hover:bg-accent-soft lg:hidden" aria-label="Fechar menu">
          <IconX />
        </button>
      </div>
      <div className="px-5 pb-5">
        <ButtonLink href="/escanear" className="w-full py-3">
          <IconScan className="h-4 w-4" />
          Analisar produto
        </ButtonLink>
      </div>
      <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-4">
        {NAV.map((item) => {
          const active = item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-semibold transition",
                active ? "bg-surface text-ink shadow-[0_6px_18px_-10px_rgba(124,90,147,0.45)]" : "text-ink-soft hover:bg-surface/70 hover:text-ink",
              )}
            >
              <span className={cx("flex h-8 w-8 items-center justify-center rounded-xl", active ? CHIP[item.tone] : "bg-transparent")}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 p-5">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-lilac/80 via-blush/70 to-peach/80 p-3 ring-1 ring-white transition hover:brightness-[1.02]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg" aria-hidden>
            🌸
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink">{profile.title}</span>
            <span className={cx("block truncate text-xs", profile.exists ? "text-ink-soft" : "font-bold text-accent-strong")}>{profile.detail}</span>
          </span>
        </Link>
        <p className="px-1 text-[11px] leading-relaxed text-muted">
          Informação educativa. Não substitui a orientação de um dermatologista.{" "}
          <Link href="/" className="underline hover:text-accent">
            Sobre o COMIGO
          </Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ground lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line/70 bg-[#faf3ee] lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line/70 bg-ground/85 px-4 backdrop-blur lg:hidden">
        <Logo href="/painel" />
        <button onClick={() => setOpen(true)} className="rounded-full p-2 text-ink-soft hover:bg-accent-soft" aria-label="Abrir menu" aria-expanded={open}>
          <IconMenu />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[88vw] rounded-r-3xl bg-[#faf3ee] shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-12 lg:pb-14 lg:pt-12">{children}</main>

      {!pathname.startsWith("/escanear") && (
        <Link
          href="/escanear"
          className="fixed bottom-5 right-5 z-20 flex h-14 items-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(124,90,147,0.8)] lg:hidden"
        >
          <IconScan className="h-5 w-5" />
          Analisar
        </Link>
      )}
    </div>
  );
}
