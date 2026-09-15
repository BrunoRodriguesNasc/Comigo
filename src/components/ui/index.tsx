import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Confidence, Verdict } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * Primitivos de interface do comigo, seguindo o DESIGN.md:
 * acromático, bordas hairline, raio de 2px, pílula de 60px só no botão principal, sem sombras.
 */

/** Alias mantido para os componentes existentes. Prefira `cn` de `@/lib/utils`. */
export const cx = cn;

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xs border border-ink bg-surface p-4 sm:p-6", className)} {...props} />;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";
const variants = {
  primary: "rounded-full bg-accent px-6 py-3 text-ink hover:bg-accent-strong",
  secondary: "rounded-xs border border-powder bg-transparent px-4 py-2.5 text-ink hover:border-ink",
  ghost: "px-0 py-1 text-ink underline decoration-powder underline-offset-4 hover:decoration-ink",
  danger: "rounded-xs border border-bad/40 bg-transparent px-4 py-2.5 text-bad hover:border-bad",
};
type Variant = keyof typeof variants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(buttonBase, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(buttonBase, variants[variant], className)} {...props} />;
}

export function Logo({ href = "/", className, size = "md" }: { href?: string; className?: string; size?: "md" | "lg" }) {
  return (
    <Link
      href={href}
      aria-label="comigo"
      className={cn(
        "inline-block font-light leading-none tracking-[-0.03em] text-ink",
        size === "lg" ? "text-[64px] sm:text-[120px]" : "text-[24px]",
        className,
      )}
    >
      comigo
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] uppercase tracking-[0.18em] text-muted", className)}>{children}</p>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-12 flex flex-col gap-6 border-b border-powder pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        {back && (
          <Link href={back.href} className="mb-8 inline-flex text-sm text-muted transition-colors hover:text-ink">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h1 className="text-[36px] sm:text-[54px]">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-base leading-[1.33] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Faixa azul-pó de ponta a ponta: separa “capítulos” editoriais sem sombra nem contraste. */
export function Band({ children, className, innerClassName }: { children: ReactNode; className?: string; innerClassName?: string }) {
  return (
    <section className={cn("relative left-1/2 w-screen -translate-x-1/2 bg-powder", className)}>
      <div className={cn("mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:py-16", innerClassName)}>{children}</div>
    </section>
  );
}

/** Campo com borda inferior apenas (DESIGN.md → Input Field). */
export const fieldClass =
  "w-full rounded-none border-0 border-b border-ink bg-transparent px-0 py-2.5 text-sm font-light text-ink outline-none transition-colors placeholder:text-muted focus:border-black";

export const VERDICT_STYLE: Record<Verdict, { dot: string; text: string; ring: string }> = {
  excellent: { dot: "bg-good", text: "text-good", ring: "#2f6b4a" },
  good: { dot: "bg-good", text: "text-good", ring: "#2f6b4a" },
  caution: { dot: "bg-caution", text: "text-caution", ring: "#8a5a12" },
  poor: { dot: "bg-bad", text: "text-bad", ring: "#9f2f2f" },
  conflict: { dot: "bg-bad", text: "text-bad", ring: "#9f2f2f" },
  insufficient: { dot: "bg-muted", text: "text-muted", ring: "#a3a8ad" },
};

const VERDICT_SHORT: Record<Verdict, string> = {
  excellent: "Excelente para você",
  good: "Combina com você",
  caution: "Com ressalvas",
  poor: "Pouco compatível",
  conflict: "Tem algo que você evita",
  insufficient: "Sem dados suficientes",
};

/** Título do resultado em linguagem de marca (a lógica do veredito continua no domínio). */
export function verdictTitle(verdict: Verdict, profileUsed: boolean): string {
  if (verdict === "insufficient") return "Ainda não dá para dizer";
  if (verdict === "conflict") return profileUsed ? "Tem algo que você prefere evitar" : "Contém um ponto de conflito";
  if (!profileUsed) {
    return { excellent: "Ótima compatibilidade geral", good: "Boa compatibilidade geral", caution: "Compatibilidade com ressalvas", poor: "Baixa compatibilidade geral" }[verdict];
  }
  return { excellent: "Excelente para você", good: "Combina com você", caution: "Pode combinar, com ressalvas", poor: "Não é o ideal para você" }[verdict];
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border border-powder px-2 py-1 text-[11px] text-ink">
      <span className={cn("h-1.5 w-1.5 rounded-full", VERDICT_STYLE[verdict].dot)} />
      {VERDICT_SHORT[verdict]}
    </span>
  );
}

export function ScoreRing({ score, verdict, size = 120 }: { score: number; verdict: Verdict; size?: number }) {
  const stroke = 1.5;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Nota ${score} de 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#d5e0ea" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={VERDICT_STYLE[verdict].ring}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-light leading-none tabular-nums text-ink" style={{ fontSize: size * 0.34 }}>
          {score}
        </span>
        {size >= 80 && <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">de 100</span>}
      </div>
    </div>
  );
}

export function ScorePill({ score, verdict }: { score: number; verdict: Verdict }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-powder text-sm font-medium tabular-nums",
        VERDICT_STYLE[verdict].text,
      )}
    >
      {score}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: "Confiança alta", medium: "Confiança média", low: "Confiança baixa" };

export function ConfidenceBadge({ confidence, partial }: { confidence: Confidence; partial: boolean }) {
  return (
    <span className="inline-flex items-center rounded-xs border border-powder px-2 py-1 text-[11px] text-muted">
      {partial ? "Análise parcial" : CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink pb-3">
      <h2 className="text-[28px]">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-y border-powder px-6 py-14 text-center">
      <p className="text-[24px] font-light leading-[1.11]">{title}</p>
      {children && <div className="mt-3 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
