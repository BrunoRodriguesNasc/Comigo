import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantBox } from "@/components/analysis/assistant-box";
import { FavoriteButton } from "@/components/analysis/favorite-button";
import { FindingsList } from "@/components/analysis/findings";
import { IngredientList } from "@/components/analysis/ingredient-list";
import { ScoreBreakdown } from "@/components/analysis/score-breakdown";
import { ButtonLink, ConfidenceBadge, Eyebrow, ScorePill, ScoreRing, VERDICT_STYLE, cx, verdictTitle } from "@/components/ui";
import { db } from "@/server/db";
import { alternativesFor, getAnalysisForUser } from "@/server/services/analysis";
import { getProfile, profileHash } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Seu resultado" };

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  const analysis = await getAnalysisForUser(id, userId);
  if (!analysis || !userId) notFound();

  const r = analysis.result;
  const style = VERDICT_STYLE[r.verdict];
  const [favorite, alternatives, currentProfile] = await Promise.all([
    analysis.productId ? db.favorite.findUnique({ where: { userId_productId: { userId, productId: analysis.productId } } }) : null,
    analysis.productId && r.verdict !== "excellent" ? alternativesFor(analysis.productId, userId, r.score) : [],
    getProfile(userId),
  ]);
  const profileChanged = profileHash(currentProfile) !== analysis.profileHash;
  const reasons = r.findings.filter((f) => f.kind !== "info");
  const infos = r.findings.filter((f) => f.kind === "info");

  const counts = [
    { n: r.counts.positive, label: r.counts.positive === 1 ? "ponto positivo" : "pontos positivos", dot: "bg-good" },
    { n: r.counts.attention, label: r.counts.attention === 1 ? "ponto de atenção" : "pontos de atenção", dot: "bg-caution" },
    { n: r.counts.conflict, label: r.counts.conflict === 1 ? "conflito" : "conflitos", dot: "bg-bad" },
  ];

  return (
    <>
      <Link href="/historico" className="mb-8 inline-flex text-sm text-muted transition hover:text-ink">
        ← Meus produtos
      </Link>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {r.product.brand && <Eyebrow>{r.product.brand}</Eyebrow>}
          <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{r.product.name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {analysis.productId && <FavoriteButton productId={analysis.productId} initial={Boolean(favorite)} />}
          <ButtonLink href={`/comparar?a=${analysis.id}`} variant="secondary">
            Comparar
          </ButtonLink>
        </div>
      </header>

      {profileChanged && analysis.barcode && (
        <p className="mt-6 text-sm text-ink-soft">
          Seu perfil mudou desde esta análise.{" "}
          <a href={`/p/${analysis.barcode}`} className="text-ink underline underline-offset-4">
            Ver com o perfil atual
          </a>
        </p>
      )}

      <section className={cx("mt-10 rounded-[36px] px-6 py-10 sm:px-12 sm:py-12", style.soft)}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <ScoreRing score={r.score} verdict={r.verdict} size={140} />
          <div className="min-w-0">
            <Eyebrow>{r.profileUsed ? "Para você" : "Análise geral"}</Eyebrow>
            <h2 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{verdictTitle(r.verdict, r.profileUsed)}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{r.headline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
              {counts.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-2">
                  <span className={cx("h-2 w-2 rounded-full", c.n > 0 ? c.dot : "bg-line")} />
                  {c.n} {c.label}
                </span>
              ))}
              <ConfidenceBadge confidence={r.confidence} partial={r.partial} />
            </div>
          </div>
        </div>
      </section>

      {!r.profileUsed && (
        <p className="mt-6 text-ink-soft">
          Esta é uma leitura geral.{" "}
          <Link href="/perfil" className="text-ink underline underline-offset-4">
            Crie seu perfil
          </Link>{" "}
          para saber se o produto combina com você.
        </p>
      )}

      <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-16">
          <blockquote className="border-l-2 border-rose pl-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Nossa recomendação</p>
            <p className="mt-3 font-display text-2xl italic leading-snug text-ink sm:text-3xl">{r.recommendation}</p>
          </blockquote>

          <section>
            <h2 className="border-b border-line pb-4 text-3xl">Por que chegamos aqui</h2>
            <div className="mt-6">
              <FindingsList findings={reasons} />
            </div>
            {infos.length > 0 && (
              <div className="mt-8 rounded-[24px] bg-surface p-6 ring-1 ring-line">
                <FindingsList findings={infos} />
              </div>
            )}
          </section>

          <section>
            <h2 className="border-b border-line pb-4 text-3xl">O que tem dentro</h2>
            <div className="mt-4">
              <IngredientList ingredients={r.ingredients} />
            </div>
          </section>

          <ScoreBreakdown result={r} />
        </div>

        <aside className="space-y-12 lg:sticky lg:top-28 lg:self-start">
          {alternatives.length > 0 && (
            <section>
              <h3 className="text-2xl leading-tight">Que também combinam com você</h3>
              <p className="mt-1 text-sm text-muted">Mesma categoria, com mais afinidade com o seu perfil.</p>
              <ul className="mt-4 divide-y divide-line">
                {alternatives.map((a) => (
                  <li key={a.productId}>
                    <a href={a.barcode ? `/p/${a.barcode}` : "#"} className="group flex items-center gap-4 py-3.5">
                      <ScorePill score={a.score} verdict={a.verdict} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] group-hover:underline group-hover:underline-offset-4">{a.name}</p>
                        <p className="truncate text-xs text-muted">{a.highlights.join(" · ") || a.brand}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <AssistantBox analysisId={analysis.id} initialSummary={analysis.aiSummary} />

          <div className="space-y-2 text-xs leading-relaxed text-muted">
            <p>Origem dos dados: {r.product.sourceLabel}.</p>
            {r.disclaimers.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
