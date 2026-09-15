import type { AnalysisResult, Dimension } from "@/domain/types";
import { cx } from "../ui";

const DIMENSION_LABEL: Record<Dimension | "overall", string> = {
  preferences: "Suas preferências",
  profile_fit: "Seu tipo de pele",
  benefits: "Seus objetivos",
  general: "Pontos gerais",
  overall: "Geral",
};

const fmt = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`;

export function ScoreBreakdown({ result }: { result: AnalysisResult }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex items-center justify-between gap-2 p-4 font-semibold">
        <span>Como chegamos nessa avaliação</span>
        <span className="text-muted transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-line p-4 text-sm">
        <p className="text-ink-soft">
          A nota é a soma das parcelas abaixo. Cada parcela vem de uma regra com evidência registrada — nenhuma é
          decidida por IA.
        </p>

        <table className="mt-3 w-full">
          <tbody>
            {result.contributions.map((c, idx) => (
              <tr key={`${c.code}-${idx}`} className="border-b border-line/70 last:border-0">
                <td className="py-2 pr-2">
                  <p className="leading-snug">{c.label}</p>
                  {c.dimension !== "overall" && <p className="text-xs text-muted">{DIMENSION_LABEL[c.dimension]}</p>}
                </td>
                <td
                  className={cx(
                    "whitespace-nowrap py-2 text-right font-semibold tabular-nums",
                    c.code === "base" ? "text-ink" : c.points > 0 ? "text-good" : c.points < 0 ? "text-bad" : "text-muted",
                  )}
                >
                  {c.code === "base" ? c.points.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : fmt(c.points)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 font-bold">Nota final</td>
              <td className="pt-3 text-right text-base font-bold tabular-nums">{result.score}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-5 font-semibold">Por dimensão</h3>
        <ul className="mt-2 space-y-2">
          {result.dimensions.map((d) => (
            <li key={d.dimension}>
              <div className="flex justify-between text-xs">
                <span>
                  {DIMENSION_LABEL[d.dimension]} <span className="text-muted">· peso {Math.round(d.weight * 100)}%</span>
                </span>
                <span className="tabular-nums">{Math.round(d.subscore)}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ground">
                <div className="h-full rounded-full bg-ink/70" style={{ width: `${d.subscore}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-soft">
          <dt>Ingredientes reconhecidos</dt>
          <dd className="text-right tabular-nums">{Math.round(result.coverage * 100)}%</dd>
          <dt>Origem dos dados</dt>
          <dd className="text-right">{result.product.sourceLabel}</dd>
          <dt>Versão do motor</dt>
          <dd className="text-right tabular-nums">{result.engineVersion}</dd>
        </dl>
      </div>
    </details>
  );
}
