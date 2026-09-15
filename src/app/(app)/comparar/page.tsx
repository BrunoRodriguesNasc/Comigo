import Link from "next/link";
import type { Metadata } from "next";
import { compareAnalyses } from "@/domain/compare";
import { IconScan } from "@/components/icons";
import { ButtonLink, Card, EmptyState, PageHeader, ScorePill, ScoreRing, VERDICT_STYLE, VerdictBadge, cx, table } from "@/components/ui";
import { analyzeProductForUser, getAnalysisForUser, listHistory, type StoredAnalysis } from "@/server/services/analysis";
import { getUserId, requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Comparar" };

/** Reanalisa produtos do catálogo com o perfil atual, para comparar em pé de igualdade. */
async function current(analysis: StoredAnalysis, userId: string) {
  return analysis.productId ? analyzeProductForUser(analysis.productId, userId) : analysis;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const { a, b } = await searchParams;
  const userId = await getUserId();

  if (a && b && userId) {
    await requireUserId();
    const [rawA, rawB] = await Promise.all([getAnalysisForUser(a, userId), getAnalysisForUser(b, userId)]);
    if (rawA && rawB) {
      const A = await current(rawA, userId);
      const B = await current(rawB, userId);
      const cmp = compareAnalyses(A.result, B.result);
      return (
        <>
          <PageHeader back={{ href: "/comparar", label: "Escolher outros" }} title="Comparação" description="Os dois produtos avaliados com o seu perfil atual." />
          <Card className={cx("mb-6 font-medium leading-snug", cmp.winner === "tie" ? "bg-info-soft" : "border-good/30 bg-good-soft")}>{cmp.reason}</Card>
          <div className="grid gap-6 md:grid-cols-2">
            {([
              [A, cmp.onlyA, cmp.winner === "a"],
              [B, cmp.onlyB, cmp.winner === "b"],
            ] as const).map(([an, only, winner]) => (
              <Card key={an.id} className={cx("flex flex-col", winner && "ring-2 ring-good")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {winner && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-good">Recomendado para você</p>}
                    <p className="font-semibold leading-snug">{an.result.product.name}</p>
                    {an.result.product.brand && <p className="text-sm text-muted">{an.result.product.brand}</p>}
                  </div>
                  <ScoreRing score={an.result.score} verdict={an.result.verdict} size={84} />
                </div>
                <p className={cx("mt-3 text-xs font-bold uppercase tracking-wide", VERDICT_STYLE[an.result.verdict].text)}>{an.result.verdictLabel}</p>
                <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-muted">Só neste produto</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-snug">
                  {only.positives.map((t) => (
                    <li key={t} className="text-good">
                      ✓ {t}
                    </li>
                  ))}
                  {only.attentions.map((t) => (
                    <li key={t} className="text-caution">
                      ⚠ {t}
                    </li>
                  ))}
                  {only.positives.length + only.attentions.length === 0 && <li className="text-muted">Sem diferenças exclusivas.</li>}
                </ul>
                <Link href={`/analise/${an.id}`} className="mt-auto pt-5 text-sm font-medium text-accent hover:underline">
                  Ver análise completa →
                </Link>
              </Card>
            ))}
          </div>
        </>
      );
    }
  }

  const history = await listHistory(userId, 50);

  return (
    <>
      <PageHeader
        back={{ href: "/historico", label: "Histórico" }}
        title="Comparar produtos"
        description={a ? "Agora escolha o segundo produto." : "Escolha o primeiro produto do seu histórico."}
      />
      <Card className="p-0">
        {history.length < 2 ? (
          <EmptyState title="Analise pelo menos dois produtos para comparar">
            <ButtonLink href="/escanear" className="mt-3">
              <IconScan className="h-4 w-4" />
              Analisar produto
            </ButtonLink>
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Produto</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Resultado</th>
                  <th className={`${table.th} text-right`}>Nota</th>
                  <th className={`${table.th} text-right`} />
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const selected = h.id === a;
                  return (
                    <tr key={h.id} className={cx(table.row, selected && "bg-accent-soft/60")}>
                      <td className={`${table.td} font-medium`}>{h.productName}</td>
                      <td className={`${table.td} hidden sm:table-cell`}>
                        <VerdictBadge verdict={h.verdict} />
                      </td>
                      <td className={`${table.td} text-right`}>
                        <ScorePill score={h.score} verdict={h.verdict} />
                      </td>
                      <td className={`${table.td} text-right`}>
                        <Link
                          href={selected ? "/comparar" : a ? `/comparar?a=${a}&b=${h.id}` : `/comparar?a=${h.id}`}
                          className="whitespace-nowrap font-medium text-accent hover:underline"
                        >
                          {selected ? "Produto A ✓" : a ? "Comparar" : "Escolher"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
