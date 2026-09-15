import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Confidence, Verdict } from "@/domain/types";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(29,34,48,.04)]", className)} {...props} />;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none";
const variants = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "bg-surface text-ink border border-line hover:bg-ground",
  ghost: "text-accent hover:bg-accent-soft",
  danger: "bg-bad-soft text-bad hover:bg-bad hover:text-white",
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

export const VERDICT_STYLE: Record<Verdict, { dot: string; text: string; soft: string; ring: string; emoji: string }> = {
  excellent: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#1f7a47", emoji: "🟢" },
  good: { dot: "bg-good", text: "text-good", soft: "bg-good-soft", ring: "#1f7a47", emoji: "🟢" },
  caution: { dot: "bg-caution", text: "text-caution", soft: "bg-caution-soft", ring: "#9a6412", emoji: "🟡" },
  poor: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#b42c2c", emoji: "🔴" },
  conflict: { dot: "bg-bad", text: "text-bad", soft: "bg-bad-soft", ring: "#b42c2c", emoji: "🔴" },
  insufficient: { dot: "bg-info", text: "text-info", soft: "bg-info-soft", ring: "#7b8193", emoji: "⚪" },
};

export function ScoreRing({ score, verdict, size = 132 }: { score: number; verdict: Verdict; size?: number }) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = VERDICT_STYLE[verdict].ring;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Nota ${score} de 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#efe9e4" strokeWidth={stroke} fill="none" />
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
        <span className="text-[2.6em] font-bold leading-none tabular-nums" style={{ color, fontSize: size * 0.3 }}>
          {score}
        </span>
        <span className="text-xs text-muted">de 100</span>
      </div>
    </div>
  );
}

export function ScorePill({ score, verdict }: { score: number; verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span className={cx("inline-flex min-w-12 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums", s.soft, s.text)}>
      <span className={cx("h-2 w-2 rounded-full", s.dot)} />
      {score}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: "Confiança alta", medium: "Confiança média", low: "Confiança baixa" };

export function ConfidenceBadge({ confidence, partial }: { confidence: Confidence; partial: boolean }) {
  const style = confidence === "high" ? "bg-good-soft text-good" : confidence === "medium" ? "bg-info-soft text-info" : "bg-caution-soft text-caution";
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", style)}>
      {partial ? "Análise parcial" : CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 mt-7 flex items-end justify-between gap-2 px-1">
      <h2 className="text-[17px] font-bold tracking-tight">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-soft">{children}</div>}
    </Card>
  );
}
