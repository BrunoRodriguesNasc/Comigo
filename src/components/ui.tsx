import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Confidence, Verdict } from "@/domain/types";
import { HeartMark, Jar } from "./illustrations";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Superfície suave. Usar com moderação: o layout respira com seções e linhas, não com caixas. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  const customPadding = /(^|\s)(p|px|py)-/.test(className ?? "");
  return <div className={cx("rounded-[28px] bg-surface ring-1 ring-line", !customPadding && "p-6 sm:p-7", className)} {...props} />;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium tracking-wide transition disabled:pointer-events-none disabled:opacity-40";
const variants = {
  primary: "bg-accent text-ground hover:bg-accent-strong",
  secondary: "bg-transparent text-ink ring-1 ring-ink/20 hover:bg-surface hover:ring-ink/35",
  ghost: "text-ink-soft underline-offset-4 hover:text-ink hover:underline",
  danger: "text-bad ring-1 ring-bad/30 hover:bg-bad-soft",
};
type Variant = keyof typeof variants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(buttonBase, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, variants[variant], className)} {...props} />;
}

export function Logo({ href = "/", className, size = "md" }: { href?: string; className?: string; size?: "md" | "lg" }) {
  return (
    <Link href={href} className={cx("inline-flex items-start text-ink", className)} aria-label="comigo">
      <span className={cx("font-display leading-none tracking-tight", size === "lg" ? "text-6xl" : "text-[32px]")}>comigo</span>
      <HeartMark className={cx("text-rose", size === "lg" ? "ml-1 mt-1 h-4 w-4" : "ml-0.5 mt-0.5 h-2.5 w-2.5")} />
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-xs font-medium uppercase tracking-[0.2em] text-rose", className)}>{children}</p>;
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
    <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        {back && (
          <Link href={back.href} className="mb-6 inline-flex text-sm text-muted transition hover:text-ink">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="text-4xl leading-[1.05] text-ink sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const VERDICT_STYLE: Record<Verdict, { dot: string; text: string; soft: string; ring: string }> = {
  excellent: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#7d9a72" },
  good: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#7d9a72" },
  caution: { dot: "bg-caution", text: "text-caution", soft: "bg-caution-soft", ring: "#c9965b" },
  poor: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#c27a7a" },
  conflict: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#c27a7a" },
  insufficient: { dot: "bg-muted", text: "text-info", soft: "bg-info-soft", ring: "#b8a89a" },
};

const VERDICT_SHORT: Record<Verdict, string> = {
  excellent: "Excelente para você",
  good: "Combina com você",
  caution: "Com ressalvas",
  poor: "Pouco compatível",
  conflict: "Tem algo que você evita",
  insufficient: "Sem dados suficientes",
};

/** Título do resultado, em linguagem de marca (a lógica do veredito continua no domínio). */
export function verdictTitle(verdict: Verdict, profileUsed: boolean): string {
  if (verdict === "insufficient") return "Ainda não dá para dizer";
  if (verdict === "conflict") return profileUsed ? "Tem algo que você prefere evitar" : "Contém um ponto de conflito";
  if (!profileUsed) {
    return { excellent: "Ótima compatibilidade geral", good: "Boa compatibilidade geral", caution: "Compatibilidade com ressalvas", poor: "Baixa compatibilidade geral" }[verdict];
  }
  return { excellent: "Excelente para você", good: "Combina com você", caution: "Pode combinar, com ressalvas", poor: "Não é o ideal para você" }[verdict];
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium", s.soft, s.text)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {VERDICT_SHORT[verdict]}
    </span>
  );
}

export function ScoreRing({ score, verdict, size = 132 }: { score: number; verdict: Verdict; size?: number }) {
  const stroke = Math.max(3, size * 0.045);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = VERDICT_STYLE[verdict].ring;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Nota ${score} de 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eadfd3" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display leading-none tabular-nums text-ink" style={{ fontSize: size * 0.36 }}>
          {score}
        </span>
        {size >= 80 && <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">de 100</span>}
      </div>
    </div>
  );
}

export function ScorePill({ score, verdict }: { score: number; verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={cx("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg tabular-nums", s.soft, s.text)}>
      {score}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: "Confiança alta", medium: "Confiança média", low: "Confiança baixa" };

export function ConfidenceBadge({ confidence, partial }: { confidence: Confidence; partial: boolean }) {
  const style = confidence === "high" ? "bg-good-soft text-good" : confidence === "medium" ? "bg-info-soft text-info" : "bg-caution-soft text-caution";
  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", style)}>
      {partial ? "Análise parcial" : CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-4">
      <h2 className="text-3xl leading-tight">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Jar className="h-20 w-20 text-ink" />
      <p className="mt-4 font-display text-2xl">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm text-ink-soft">{children}</div>}
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
