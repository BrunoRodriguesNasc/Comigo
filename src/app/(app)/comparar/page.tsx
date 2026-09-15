import Link from "next/link";
import type { Metadata } from "next";
import { compareAnalyses } from "@/domain/compare";
import { ButtonLink, EmptyState, Eyebrow, PageHeader, ScorePill, ScoreRing, VERDICT_STYLE, VerdictBadge, cx, verdictTitle } from "@/components/ui";
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
          <PageHeader back={{ href: "/comparar", label: "Escolher outros" }} eyebrow="Comparar" title="Lado a lado, pensando em você" />
          <p className="max-w-3xl border-l-2 border-rose pl-6 font-display text-2xl italic leading-snug sm:text-3xl">{cmp.reason}</p>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {([
              [A, cmp.onlyA, cmp.winner === "a"],
              [B, cmp.onlyB, cmp.winner === "b"],
            ] as const).map(([an, only, winner]) => (
              <article
                key={an.id}
                className={cx("flex flex-col rounded-[32px] px-7 py-8", winner ? VERDICT_STYLE[an.result.verdict].soft : "bg-surface ring-1 ring-line")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Eyebrow>{winner ? "Nossa escolha para você" : an.result.product.brand ?? "Produto"}</Eyebrow>
                    <h2 className="mt-3 text-3xl leading-tight">{an.result.product.name}</h2>
                  </div>
                  <ScoreRing score={an.result.score} verdict={an.result.verdict} size={80} />
                </div>
                <p className={cx("mt-4 font-display text-xl italic", VERDICT_STYLE[an.result.verdict].text)}>
                  {verdictTitle(an.result.verdict, an.result.profileUsed)}
                </p>
                <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-muted">Só neste produto</p>
                <ul className="mt-3 space-y-2 text-sm leading-snug">
                  {only.positives.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-good" />
                      {t}
                    </li>
                  ))}
                  {only.attentions.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caution" />
                      {t}
                    </li>
                  ))}
                  {only.positives.length + only.attentions.length === 0 && <li className="text-muted">Sem diferenças exclusivas.</li>}
                </ul>
                <Link href={`/analise/${an.id}`} className="mt-auto pt-8 text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                  Ver a análise completa →
                </Link>
              </article>
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
        back={{ href: "/historico", label: "Meus produtos" }}
        eyebrow="Comparar"
        title={a ? "Agora, o segundo produto" : "Escolha o primeiro produto"}
        description="Comparamos os dois com o seu perfil atual."
      />
      {history.length < 2 ? (
        <EmptyState title="Analise pelo menos dois produtos">
          <ButtonLink href="/escanear" className="mt-4">
            Analisar produto
          </ButtonLink>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {history.map((h) => {
            const selected = h.id === a;
            return (
              <li key={h.id}>
                <Link
                  href={selected ? "/comparar" : a ? `/comparar?a=${a}&b=${h.id}` : `/comparar?a=${h.id}`}
                  className={cx("group flex items-center gap-5 px-2 py-4", selected && "rounded-2xl bg-blush/60")}
                >
                  <ScorePill score={h.score} verdict={h.verdict} />
                  <span className="min-w-0 flex-1 truncate font-display text-2xl leading-tight">{h.productName}</span>
                  <span className="hidden sm:inline">
                    <VerdictBadge verdict={h.verdict} />
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft group-hover:text-ink">{selected ? "Escolhido ✓" : a ? "Comparar →" : "Escolher →"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
