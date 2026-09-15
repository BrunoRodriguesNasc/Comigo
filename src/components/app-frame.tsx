"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconMenu, IconScan, IconX } from "./icons";
import { ButtonLink, Logo } from "./ui";

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
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-surface">
      <header className="sticky top-0 z-30 border-b border-powder bg-surface">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
          <Logo href="/painel" />

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => {
              const active = isActive(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm underline-offset-[10px] transition-colors",
                    active ? "text-ink underline decoration-accent decoration-2" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/perfil" className="text-xs text-muted transition-colors hover:text-ink">
              {profile.exists ? profile.title : "Criar perfil"}
            </Link>
            <ButtonLink href="/escanear" className="px-5 py-2.5">
              Analisar produto
            </ButtonLink>
          </div>

          <button onClick={() => setOpen(true)} className="-mr-2 p-2 text-ink md:hidden" aria-label="Abrir menu" aria-expanded={open}>
            <IconMenu />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-powder px-5">
            <Logo href="/painel" />
            <button onClick={() => setOpen(false)} className="-mr-2 p-2 text-ink" aria-label="Fechar menu">
              <IconX />
            </button>
          </div>
          <nav aria-label="Menu" className="flex flex-col px-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("border-b border-powder py-5 text-[36px] font-light leading-[1.08]", isActive(item.match) ? "text-ink" : "text-muted")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 px-5 pb-8 pt-6">
            <ButtonLink href="/escanear" className="w-full">
              Analisar produto
            </ButtonLink>
            <p className="text-xs text-muted">Informação educativa. Não substitui a orientação de um dermatologista.</p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-32 pt-12 sm:px-8 md:pb-24 lg:pt-16">{children}</main>

      <footer className="bg-powder">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 pb-28 pt-8 text-xs text-ink sm:flex-row sm:items-center sm:justify-between sm:px-8 md:pb-8">
          <p>Informação educativa sobre compatibilidade de cosméticos. Não substitui a orientação de um dermatologista.</p>
          <Link href="/" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            Sobre o comigo
          </Link>
        </div>
      </footer>

      {!pathname.startsWith("/escanear") && (
        <Link
          href="/escanear"
          className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-ink md:hidden"
        >
          <IconScan className="h-4 w-4" />
          Analisar produto
        </Link>
      )}
    </div>
  );
}
