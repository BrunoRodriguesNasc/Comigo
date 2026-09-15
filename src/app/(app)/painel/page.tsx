import Link from "next/link";
import type { Metadata } from "next";
import { Bottle, Sprig } from "@/components/illustrations";
import { profileSentence } from "@/components/labels";
import { QuickAnalyze } from "@/components/quick-analyze";
import { ButtonLink, EmptyState, Eyebrow, ScorePill, SectionTitle, VerdictBadge, formatDateTime } from "@/components/ui";
import { db } from "@/server/db";
import { listHistory } from "@/server/services/analysis";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Início" };

export default async function HomePage() {
  const userId = await getUserId();
  const [profile, history, demo] = await Promise.all([
    getProfileView(userId),
    listHistory(userId, 5),
    db.product.findMany({ where: { source: { key: "demo" } }, include: { category: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <Eyebrow>Seu espaço</Eyebrow>
          <h1 className="mt-4 text-5xl leading-[1.02] sm:text-6xl">
            Vamos encontrar o que <em className="text-rose">combina com você</em>?
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            {profile.exists
              ? `Cada análise é feita pensando em você: ${profileSentence(profile)}.`
              : "Conte um pouco sobre a sua pele e cada produto passa a ser avaliado para você, não para todo mundo."}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/escanear">Analisar um produto</ButtonLink>
            <ButtonLink href="/perfil" variant="secondary">
              {profile.exists ? "Ajustar meu perfil" : "Criar meu perfil"}
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto h-[380px] w-full max-w-sm" aria-hidden>
          <div className="absolute inset-x-6 bottom-0 top-4 rounded-t-full bg-blush" />
          <div className="absolute -left-2 bottom-10 h-40 w-40 rounded-full bg-sage" />
          <Bottle className="absolute bottom-0 left-1/2 h-72 -translate-x-1/2 text-ink" />
          <Sprig className="absolute -left-1 bottom-6 h-44 text-ink" />
        </div>
      </section>

      <section className="mt-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <h2 className="text-3xl leading-tight">Tem um produto em mãos?</h2>
          <p className="mt-3 text-ink-soft">Digite os números do código de barras. Se preferir, use a câmera ou cole a lista de ingredientes.</p>
          <div className="mt-6">
            <QuickAnalyze />
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/escanear" className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              Usar a câmera
            </Link>
            <Link href="/colar" className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              Colar ingredientes
            </Link>
          </div>
        </div>

        <div>
          <SectionTitle
            aside={
              history.length > 0 && (
                <Link href="/historico" className="text-sm text-ink-soft hover:text-ink">
                  Ver todos →
                </Link>
              )
            }
          >
            Seus últimos produtos
          </SectionTitle>
          {history.length === 0 ? (
            <EmptyState title="Ainda está tudo por descobrir">Os produtos que você analisar aparecem aqui.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/analise/${h.id}`} className="group flex items-center gap-4 py-4">
                    <ScorePill score={h.score} verdict={h.verdict} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-ink group-hover:underline group-hover:underline-offset-4">{h.productName}</p>
                      <p className="truncate text-xs text-muted">{[h.brand, formatDateTime(h.createdAt)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="hidden sm:inline">
                      <VerdictBadge verdict={h.verdict} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {demo.length > 0 && (
        <section className="mt-24 rounded-[36px] bg-sand/70 px-6 py-12 sm:px-12">
          <Eyebrow>Para experimentar</Eyebrow>
          <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Sem um produto por perto?</h2>
          <p className="mt-3 max-w-xl text-ink-soft">Teste com a nossa vitrine de demonstração — produtos e marcas fictícios.</p>
          <ul className="mt-8 grid gap-x-12 sm:grid-cols-2">
            {demo.map((p) => (
              <li key={p.id} className="border-b border-ink/10">
                <a href={`/p/${p.barcode}`} className="group flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink group-hover:underline group-hover:underline-offset-4">{p.name}</span>
                    <span className="block text-xs text-muted">{p.category?.namePt}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
