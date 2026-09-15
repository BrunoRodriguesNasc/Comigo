import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AssistantBox } from "@/components/analysis/assistant-box";
import { FavoriteButton } from "@/components/analysis/favorite-button";
import { FindingsList } from "@/components/analysis/findings";
import { IngredientList } from "@/components/analysis/ingredient-list";
import { ScoreBreakdown } from "@/components/analysis/score-breakdown";
import { ButtonLink, Card, ConfidenceBadge, ScorePill, ScoreRing, SectionTitle, VERDICT_STYLE, cx } from "@/components/ui";
import { db } from "@/server/db";
import { alternativesFor, getAnalysisForUser } from "@/server/services/analysis";
import { getProfile, profileHash } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

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
    <AppShell>
      <Link href="/historico" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft">
        ← Histórico
      </Link>

      <header className="mt-3 px-1">
        {r.product.brand && <p className="text-sm font-medium text-muted">{r.product.brand}</p>}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">{r.product.name}</h1>
      </header>

      {profileChanged && analysis.barcode && (
        <Card className="mt-3 flex items-center justify-between gap-3 border-info/30 bg-info-soft/60 py-3 text-sm">
          <span>Seu perfil mudou desde esta análise.</span>
          <a href={`/p/${analysis.barcode}`} className="shrink-0 font-semibold text-info">
            Reanalisar
          </a>
        </Card>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        <div className={cx("flex items-center gap-4 p-4", style.soft)}>
          <ScoreRing score={r.score} verdict={r.verdict} size={116} />
          <div className="min-w-0">
            <p className={cx("text-[15px] font-extrabold leading-tight tracking-tight", style.text)}>
              {style.emoji} {r.verdictLabel}
            </p>
            <p className="mt-1.5 text-[15px] leading-snug">{r.headline}</p>
            <div className="mt-2">
              <ConfidenceBadge confidence={r.confidence} partial={r.partial} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line border-t border-line text-center text-sm">
          <Count n={r.counts.positive} label={r.counts.positive === 1 ? "ponto positivo" : "pontos positivos"} className="text-good" symbol="✓" />
          <Count n={r.counts.attention} label={r.counts.attention === 1 ? "ponto de atenção" : "pontos de atenção"} className="text-caution" symbol="!" />
          <Count n={r.counts.conflict} label={r.counts.conflict === 1 ? "conflito" : "conflitos"} className="text-bad" symbol="✕" />
        </div>
      </Card>

      {!r.profileUsed && (
        <Card className="mt-3 border-accent/30 bg-accent-soft/50">
          <p className="font-semibold">Esta é uma análise geral.</p>
          <p className="mt-1 text-sm text-ink-soft">Conte sobre sua pele e preferências para saber se o produto combina com você.</p>
          <ButtonLink href="/perfil" className="mt-3 w-full">
            Criar meu perfil
          </ButtonLink>
        </Card>
      )}

      <Card className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nossa recomendação</p>
        <p className="mt-1 text-[15px] leading-relaxed">{r.recommendation}</p>
      </Card>

      <SectionTitle>Por quê?</SectionTitle>
      <Card>
        <FindingsList findings={reasons} />
        {infos.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <FindingsList findings={infos} />
          </div>
        )}
      </Card>

      <div className="mt-3 flex gap-2">
        {analysis.productId && <FavoriteButton productId={analysis.productId} initial={Boolean(favorite)} />}
        <ButtonLink href={`/comparar?a=${analysis.id}`} variant="secondary" className="flex-1">
          ⇄ Comparar
        </ButtonLink>
      </div>

      {alternatives.length > 0 && (
        <>
          <SectionTitle>Alternativas melhores para você</SectionTitle>
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {alternatives.map((a) => (
                <li key={a.productId}>
                  <a href={a.barcode ? `/p/${a.barcode}` : "#"} className="flex items-center gap-3 p-4 hover:bg-ground">
                    <ScorePill score={a.score} verdict={a.verdict} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted">{a.highlights.join(" · ") || a.brand}</p>
                    </div>
                    <span className="text-muted">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <SectionTitle>O que encontramos</SectionTitle>
      <Card>
        <IngredientList ingredients={r.ingredients} />
      </Card>

      <div className="mt-3">
        <AssistantBox analysisId={analysis.id} initialSummary={analysis.aiSummary} />
      </div>

      <div className="mt-3">
        <ScoreBreakdown result={r} />
      </div>

      <div className="mt-5 space-y-2 px-1 text-xs leading-relaxed text-muted">
        <p>Dados: {r.product.sourceLabel}.</p>
        {r.disclaimers.map((d) => (
          <p key={d}>{d}</p>
        ))}
      </div>

      <ButtonLink href="/escanear" className="mt-6 w-full">
        Escanear outro produto
      </ButtonLink>
    </AppShell>
  );
}

function Count({ n, label, className, symbol }: { n: number; label: string; className: string; symbol: string }) {
  return (
    <div className="px-2 py-3">
      <p className={cx("text-lg font-bold tabular-nums", n > 0 ? className : "text-muted")}>
        {symbol} {n}
      </p>
      <p className="text-[11px] leading-tight text-ink-soft">{label}</p>
    </div>
  );
}
