import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssistantBox } from "@/components/analysis/assistant-box";
import { FavoriteButton } from "@/components/analysis/favorite-button";
import { FindingsList } from "@/components/analysis/findings";
import { IngredientList } from "@/components/analysis/ingredient-list";
import { ScoreBreakdown } from "@/components/analysis/score-breakdown";
import { IconCompare } from "@/components/icons";
import { ButtonLink, Card, ConfidenceBadge, PageHeader, ScorePill, ScoreRing, VERDICT_STYLE, cx } from "@/components/ui";
import { db } from "@/server/db";
import { alternativesFor, getAnalysisForUser } from "@/server/services/analysis";
import { getProfile, profileHash } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Análise" };

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

  return (
    <>
      <PageHeader
        back={{ href: "/historico", label: "Histórico" }}
        title={r.product.name}
        description={[r.product.brand, r.product.sourceLabel].filter(Boolean).join(" · ")}
        actions={
          <>
            {analysis.productId && <FavoriteButton productId={analysis.productId} initial={Boolean(favorite)} />}
            <ButtonLink href={`/comparar?a=${analysis.id}`} variant="secondary">
              <IconCompare className="h-4 w-4" />
              Comparar
            </ButtonLink>
          </>
        }
      />

      {profileChanged && analysis.barcode && (
        <Card className="mb-6 flex items-center justify-between gap-3 bg-info-soft px-5 py-3 text-sm">
          <span>Seu perfil mudou desde esta análise.</span>
          <a href={`/p/${analysis.barcode}`} className="shrink-0 font-semibold text-accent hover:underline">
            Reanalisar
          </a>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <ScoreRing score={r.score} verdict={r.verdict} size={120} />
              <div className="min-w-0">
                <p className={cx("text-sm font-bold uppercase tracking-wide", style.text)}>
                  {style.emoji} {r.verdictLabel}
                </p>
                <p className="mt-1.5 text-lg font-medium leading-snug text-ink">{r.headline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ConfidenceBadge confidence={r.confidence} partial={r.partial} />
                  <span className="text-xs text-muted">{Math.round(r.coverage * 100)}% dos ingredientes reconhecidos</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line bg-ground/50 text-center">
              <Count n={r.counts.positive} label={r.counts.positive === 1 ? "ponto positivo" : "pontos positivos"} className="text-good" symbol="✓" />
              <Count n={r.counts.attention} label={r.counts.attention === 1 ? "ponto de atenção" : "pontos de atenção"} className="text-caution" symbol="!" />
              <Count n={r.counts.conflict} label={r.counts.conflict === 1 ? "conflito" : "conflitos"} className="text-bad" symbol="✕" />
            </div>
          </Card>

          {!r.profileUsed && (
            <Card className="flex flex-col gap-3 border-accent/20 bg-accent-soft/60 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Esta é uma análise geral</p>
                <p className="mt-0.5 text-sm text-ink-soft">Conte sobre sua pele e preferências para saber se o produto combina com você.</p>
              </div>
              <ButtonLink href="/perfil">Criar meu perfil</ButtonLink>
            </Card>
          )}

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nossa recomendação</p>
            <p className="mt-1.5 leading-relaxed">{r.recommendation}</p>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Por quê?</h2>
            <FindingsList findings={reasons} />
            {infos.length > 0 && (
              <div className="mt-5 border-t border-line pt-5">
                <FindingsList findings={infos} />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">O que encontramos</h2>
            <IngredientList ingredients={r.ingredients} />
          </Card>

          <ScoreBreakdown result={r} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-10">
          {alternatives.length > 0 && (
            <Card className="p-0">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-semibold">Alternativas melhores para você</h2>
                <p className="mt-0.5 text-xs text-muted">Mesma categoria, com maior compatibilidade.</p>
              </div>
              <ul className="divide-y divide-line">
                {alternatives.map((a) => (
                  <li key={a.productId}>
                    <a href={a.barcode ? `/p/${a.barcode}` : "#"} className="flex items-center gap-3 px-5 py-3 hover:bg-ground">
                      <ScorePill score={a.score} verdict={a.verdict} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className="truncate text-xs text-muted">{a.highlights.join(" · ") || a.brand}</p>
                      </div>
                      <span className="text-muted">›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <AssistantBox analysisId={analysis.id} initialSummary={analysis.aiSummary} />

          <div className="space-y-2 rounded-xl border border-dashed border-line px-5 py-4 text-xs leading-relaxed text-muted">
            <p>
              <span className="font-medium text-ink-soft">Origem dos dados:</span> {r.product.sourceLabel}.
            </p>
            {r.disclaimers.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function Count({ n, label, className, symbol }: { n: number; label: string; className: string; symbol: string }) {
  return (
    <div className="px-2 py-3">
      <p className={cx("text-lg font-semibold tabular-nums", n > 0 ? className : "text-muted")}>
        {symbol} {n}
      </p>
      <p className="text-xs leading-tight text-ink-soft">{label}</p>
    </div>
  );
}
