import type { Finding, IngredientStatus } from "@/domain/types";
import { cx } from "../ui";

export const STATUS_ICON: Record<IngredientStatus | Finding["kind"], { symbol: string; className: string; label: string }> = {
  positive: { symbol: "✓", className: "bg-good-soft text-good", label: "Ponto positivo" },
  attention: { symbol: "!", className: "bg-caution-soft text-caution", label: "Ponto de atenção" },
  conflict: { symbol: "✕", className: "bg-bad-soft text-bad", label: "Conflito" },
  info: { symbol: "i", className: "bg-info-soft text-info", label: "Informação" },
  neutral: { symbol: "•", className: "bg-ground text-muted", label: "Sem impacto para seu perfil" },
  unknown: { symbol: "?", className: "bg-ground text-muted", label: "Ingrediente sem dados" },
};

export function StatusIcon({ status, size = "md" }: { status: IngredientStatus | Finding["kind"]; size?: "sm" | "md" }) {
  const s = STATUS_ICON[status];
  return (
    <span
      aria-label={s.label}
      title={s.label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-xs border border-powder font-medium",
        size === "sm" ? "h-5 w-5 text-[11px]" : "h-7 w-7 text-sm",
        s.className,
      )}
    >
      {s.symbol}
    </span>
  );
}

const EVIDENCE_LABEL = { high: "evidência sólida", moderate: "evidência moderada", low: "evidência limitada" } as const;

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <p className="px-1 text-sm text-ink-soft">Nenhum ponto específico para o seu perfil.</p>;
  }
  return (
    <ul className="space-y-3">
      {findings.map((f) => (
        <li key={f.code} className="flex gap-3">
          <StatusIcon status={f.kind} />
          <div className="min-w-0">
            <p className="font-medium leading-[1.29]">{f.title}</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{f.message}</p>
            {f.evidence && f.kind !== "info" && <p className="mt-1 text-xs text-muted">{EVIDENCE_LABEL[f.evidence]}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
