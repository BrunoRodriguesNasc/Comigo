import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Confidence, Verdict } from "@/domain/types";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Card com padding padrão, a menos que o className traga o próprio padding (p-*, px-*, py-*). */
export function Card({ className, ...props }: ComponentProps<"div">) {
  const customPadding = /(^|\s)(p|px|py)-/.test(className ?? "");
  return (
    <div
      className={cx(
        "rounded-3xl border border-line/80 bg-surface shadow-[0_12px_32px_-18px_rgba(124,90,147,0.28)]",
        !customPadding && "p-6",
        className,
      )}
      {...props}
    />
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50";
const variants = {
  primary: "bg-accent text-white shadow-[0_8px_18px_-8px_rgba(124,90,147,0.7)] hover:bg-accent-strong",
  secondary: "border border-line bg-surface text-ink hover:border-accent/30 hover:bg-accent-soft/60",
  ghost: "text-ink-soft hover:bg-accent-soft/70 hover:text-accent-strong",
  danger: "border border-bad/25 bg-surface text-bad hover:bg-bad-soft",
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

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-2 text-ink", className)} aria-label="COMIGO">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac via-blush to-peach text-accent shadow-sm ring-1 ring-white">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
        </svg>
      </span>
      <span className="font-display text-[22px] font-semibold leading-none tracking-tight [font-variation-settings:'SOFT'_100]">
        comigo<span className="text-accent">.</span>
      </span>
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-accent">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  lilac: "bg-lilac text-accent-strong",
  peach: "bg-peach text-[#9a5a3c]",
  sage: "bg-sage text-good",
  butter: "bg-butter text-caution",
  blush: "bg-blush text-bad",
};
export type Tone = keyof typeof TONES;

export function IconBubble({ tone = "lilac", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", TONES[tone], className)}>{children}</span>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "lilac",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-ink-soft">{label}</span>
        {icon && <IconBubble tone={tone} className="h-9 w-9 rounded-xl">{icon}</IconBubble>}
      </div>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export const VERDICT_STYLE: Record<Verdict, { dot: string; text: string; soft: string; ring: string; emoji: string }> = {
  excellent: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#5f9c77", emoji: "🌿" },
  good: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#5f9c77", emoji: "🌿" },
  caution: { dot: "bg-caution", text: "text-caution", soft: "bg-caution-soft", ring: "#d69a4c", emoji: "🌼" },
  poor: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#d0697b", emoji: "🥀" },
  conflict: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#d0697b", emoji: "🚫" },
  insufficient: { dot: "bg-muted", text: "text-info", soft: "bg-info-soft", ring: "#b9b0c4", emoji: "🔍" },
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  excellent: "Excelente para você",
  good: "Bom para você",
  caution: "Atenção",
  poor: "Pouco compatível",
  conflict: "Conflito",
  insufficient: "Dados insuficientes",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", s.soft, s.text)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {VERDICT_SHORT[verdict]}
    </span>
  );
}

export function ScoreRing({ score, verdict, size = 132 }: { score: number; verdict: Verdict; size?: number }) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = VERDICT_STYLE[verdict].ring;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Nota ${score} de 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#f3eaf0" strokeWidth={stroke} fill="none" />
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
        <span className="font-display font-semibold leading-none tabular-nums text-ink" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
        <span className="text-[11px] font-semibold text-muted">de 100</span>
      </div>
    </div>
  );
}

export function ScorePill({ score, verdict }: { score: number; verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={cx("inline-flex min-w-11 items-center justify-center rounded-full px-2.5 py-1 text-sm font-extrabold tabular-nums", s.soft, s.text)}>
      {score}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: "Confiança alta", medium: "Confiança média", low: "Confiança baixa" };

export function ConfidenceBadge({ confidence, partial }: { confidence: Confidence; partial: boolean }) {
  const style = confidence === "high" ? "bg-good-soft text-good" : confidence === "medium" ? "bg-info-soft text-info" : "bg-caution-soft text-caution";
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", style)}>
      {partial ? "Análise parcial" : CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-2">
      <h2 className="text-xl font-semibold">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-lilac to-peach text-2xl" aria-hidden>
        ✨
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

/** Estilos de tabela compartilhados. */
export const table = {
  wrap: "overflow-x-auto",
  table: "w-full text-sm",
  head: "border-b border-line bg-ground/80 text-left text-xs font-bold text-muted",
  th: "px-4 py-3 font-bold sm:px-6",
  row: "border-b border-line/70 last:border-0 transition hover:bg-accent-soft/40",
  td: "px-4 py-3.5 sm:px-6",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
