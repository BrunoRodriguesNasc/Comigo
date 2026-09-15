import Link from "next/link";
import { compareAnalyses } from "@/domain/compare";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ButtonLink, Card, EmptyState, ScorePill, ScoreRing, VERDICT_STYLE, cx } from "@/components/ui";
import { analyzeProductForUser, getAnalysisForUser, listHistory, type StoredAnalysis } from "@/server/services/analysis";
import { getUserId, requireUserId } from "@/server/session";

export const dynamic = "force-dynamic";

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
        <AppShell>
          <PageHeader title="Comparação" back="/comparar" />
          <Card className={cx("text-[15px] font-semibold leading-snug", cmp.winner === "tie" ? "bg-info-soft/60" : "bg-good-soft/70")}>
            {cmp.reason}
          </Card>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([
              [A, cmp.onlyA, cmp.winner === "a"],
              [B, cmp.onlyB, cmp.winner === "b"],
            ] as const).map(([an, only, winner]) => (
              <Card key={an.id} className={cx("flex flex-col p-3", winner && "ring-2 ring-good")}>
                {winner && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-good">Recomendado</p>}
                <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-tight">{an.result.product.name}</p>
                <div className="mt-3 flex justify-center">
                  <ScoreRing score={an.result.score} verdict={an.result.verdict} size={92} />
                </div>
                <p className={cx("mt-2 text-center text-[11px] font-bold leading-tight", VERDICT_STYLE[an.result.verdict].text)}>
                  {an.result.verdictLabel}
                </p>
                <ul className="mt-3 space-y-1.5 text-[13px] leading-snug">
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
                <Link href={`/analise/${an.id}`} className="mt-auto pt-3 text-center text-xs font-semibold text-accent">
                  Ver análise
                </Link>
              </Card>
            ))}
          </div>
          <p className="mt-4 px-1 text-xs text-muted">
            A lista mostra só o que é exclusivo de cada produto. Pontos em comum aparecem na análise completa.
          </p>
        </AppShell>
      );
    }
  }

  const history = await listHistory(userId, 50);
  const unique = history.filter((h, i) => (h.productId ? history.findIndex((x) => x.productId === h.productId) === i : true));

  return (
    <AppShell>
      <PageHeader
        title="Comparar produtos"
        subtitle={a ? "Agora escolha o segundo produto." : "Escolha o primeiro produto do seu histórico."}
        back="/historico"
      />
      {unique.length < 2 ? (
        <EmptyState title="Analise pelo menos dois produtos para comparar">
          <ButtonLink href="/escanear" className="mt-3">
            Escanear produto
          </ButtonLink>
        </EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {unique.map((h) => {
              const selected = h.id === a;
              return (
                <li key={h.id}>
                  <Link
                    href={selected ? "/comparar" : a ? `/comparar?a=${a}&b=${h.id}` : `/comparar?a=${h.id}`}
                    className={cx("flex items-center gap-3 p-4", selected ? "bg-accent-soft" : "hover:bg-ground")}
                  >
                    <ScorePill score={h.score} verdict={h.verdict} />
                    <span className="min-w-0 flex-1 truncate font-medium">{h.productName}</span>
                    <span className="text-sm font-semibold text-accent">{selected ? "Produto A ✓" : a ? "Comparar" : "Escolher"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
