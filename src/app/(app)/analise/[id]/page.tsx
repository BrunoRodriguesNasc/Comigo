import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantBox } from "@/components/analysis/assistant-box";
import { FavoriteButton } from "@/components/analysis/favorite-button";
import { FindingsList } from "@/components/analysis/findings";
import { IngredientList } from "@/components/analysis/ingredient-list";
import { ScoreBreakdown } from "@/components/analysis/score-breakdown";
import { Band, ButtonLink, ConfidenceBadge, Eyebrow, ScorePill, ScoreRing, SectionTitle, verdictTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
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
      <Link href="/historico" className="mb-8 inline-flex text-sm text-muted transition-colors hover:text-ink">
        ← Meus produtos
      </Link>

      <header className="flex flex-col gap-6 border-b border-powder pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {r.product.brand && <Eyebrow>{r.product.brand}</Eyebrow>}
          <h1 className="mt-4 text-[36px] sm:text-[54px]">{r.product.name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {analysis.productId && <FavoriteButton productId={analysis.productId} initial={Boolean(favorite)} />}
          <ButtonLink href={`/comparar?a=${analysis.id}`} variant="secondary">
            Comparar
          </ButtonLink>
        </div>
      </header>

      {profileChanged && analysis.barcode && (
        <p className="mt-6 text-sm text-muted">
          Seu perfil mudou desde esta análise.{" "}
          <a href={`/p/${analysis.barcode}`} className="text-ink underline underline-offset-4">
            Ver com o perfil atual
          </a>
        </p>
      )}

      <section className="mt-10 rounded-xs border border-ink p-6 sm:p-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <ScoreRing score={r.score} verdict={r.verdict} size={132} />
          <div className="min-w-0">
            <Eyebrow>{r.profileUsed ? "Para você" : "Análise geral"}</Eyebrow>
            <h2 className="mt-4 text-[36px] sm:text-[42px]">{verdictTitle(r.verdict, r.profileUsed)}</h2>
            <p className="mt-4 max-w-2xl text-base leading-[1.33] text-muted">{r.headline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {counts.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", c.n > 0 ? c.dot : "bg-powder")} />
                  {c.n} {c.label}
                </span>
              ))}
              <ConfidenceBadge confidence={r.confidence} partial={r.partial} />
            </div>
          </div>
        </div>
      </section>

      {!r.profileUsed && (
        <p className="mt-6 text-sm text-muted">
          Esta é uma leitura geral.{" "}
          <Link href="/perfil" className="text-ink underline underline-offset-4">
            Crie seu perfil
          </Link>{" "}
          para saber se o produto combina com você.
        </p>
      )}

      <Band className="mt-16">
        <div className="max-w-3xl">
          <Eyebrow>Nossa recomendação</Eyebrow>
          <p className="mt-5 text-[28px] font-light leading-[1.1] sm:text-[36px]">{r.recommendation}</p>
        </div>
      </Band>

      <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-16">
          <section>
            <SectionTitle>Por que chegamos aqui</SectionTitle>
            <FindingsList findings={reasons} />
            {infos.length > 0 && (
              <div className="mt-8 border-t border-powder pt-8">
                <FindingsList findings={infos} />
              </div>
            )}
          </section>

          <section>
            <SectionTitle>O que tem dentro</SectionTitle>
            <IngredientList ingredients={r.ingredients} />
          </section>

          <ScoreBreakdown result={r} />
        </div>

        <aside className="space-y-12 lg:sticky lg:top-24 lg:self-start">
          {alternatives.length > 0 && (
            <section>
              <h3 className="border-b border-ink pb-3 text-[24px]">Que combinam mais com você</h3>
              <ul className="divide-y divide-powder">
                {alternatives.map((a) => (
                  <li key={a.productId}>
                    <a href={a.barcode ? `/p/${a.barcode}` : "#"} className="group flex items-center gap-4 py-3.5">
                      <ScorePill score={a.score} verdict={a.verdict} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm group-hover:underline group-hover:underline-offset-4">{a.name}</p>
                        <p className="truncate text-xs text-muted">{a.highlights.join(" · ") || a.brand}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <AssistantBox analysisId={analysis.id} initialSummary={analysis.aiSummary} />

          <div className="space-y-2 text-xs leading-[1.33] text-muted">
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
