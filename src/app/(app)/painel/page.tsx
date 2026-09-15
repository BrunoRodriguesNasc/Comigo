import Link from "next/link";
import type { Metadata } from "next";
import { SKIN_LABEL, profileSentence } from "@/components/labels";
import { QuickAnalyze } from "@/components/quick-analyze";
import { Band, ButtonLink, EmptyState, Eyebrow, ScorePill, SectionTitle, VerdictBadge, formatDateTime } from "@/components/ui";
import { ParallaxImage } from "@/components/ui/parallax";
import { PHOTOS } from "@/lib/photos";
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
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Eyebrow>Início</Eyebrow>
          <h1 className="mt-5 text-[42px] sm:text-[54px]">Olá. Vamos encontrar o que combina com você.</h1>
          <p className="mt-6 max-w-lg text-base leading-[1.33] text-muted">
            {profile.exists
              ? `Cada análise é feita pensando em você: ${profileSentence(profile)}.`
              : "Conte um pouco sobre a sua pele e cada produto passa a ser avaliado para você, não para todo mundo."}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/escanear">Analisar um produto</ButtonLink>
            <ButtonLink href="/perfil" variant="secondary">
              {profile.exists ? "Ajustar meu perfil" : "Criar meu perfil"}
            </ButtonLink>
          </div>
        </div>

        <div className="relative pb-16 lg:pb-0">
          <ParallaxImage src={PHOTOS.home.src} alt={PHOTOS.home.alt} priority strength={0.1} className="aspect-[4/5] w-full" />
          <div className="absolute bottom-0 left-4 right-4 border border-ink bg-surface p-4 sm:left-auto sm:right-6 sm:w-72 lg:-left-10 lg:bottom-10 lg:right-auto">
            <Eyebrow>Seu perfil</Eyebrow>
            <p className="mt-2 text-[24px] leading-[1.11]">{profile.exists ? SKIN_LABEL[profile.profile.skinType] : "Ainda não criado"}</p>
            <Link href="/perfil" className="mt-3 inline-block text-sm underline decoration-powder underline-offset-4 hover:decoration-ink">
              {profile.exists ? "Editar perfil" : "Criar perfil"}
            </Link>
          </div>
        </div>
      </section>

      <Band className="mt-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <Eyebrow>Análise rápida</Eyebrow>
            <h2 className="mt-4 text-[36px]">Tem um produto em mãos?</h2>
            <p className="mt-3 max-w-md text-muted">Digite os números do código de barras. Se preferir, use a câmera ou cole a lista de ingredientes.</p>
          </div>
          <div>
            <QuickAnalyze />
            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <Link href="/escanear" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Usar a câmera
              </Link>
              <Link href="/colar" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Colar ingredientes
              </Link>
            </div>
          </div>
        </div>
      </Band>

      <section className="mt-24">
        <SectionTitle
          aside={
            history.length > 0 && (
              <Link href="/historico" className="text-sm text-muted hover:text-ink">
                Ver todos
              </Link>
            )
          }
        >
          Seus últimos produtos
        </SectionTitle>
        {history.length === 0 ? (
          <EmptyState title="Nenhum produto analisado ainda">Os produtos que você analisar aparecem aqui.</EmptyState>
        ) : (
          <ul className="divide-y divide-powder">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/analise/${h.id}`} className="group flex items-center gap-4 py-4">
                  <ScorePill score={h.score} verdict={h.verdict} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base group-hover:underline group-hover:underline-offset-4">{h.productName}</p>
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
      </section>

      {demo.length > 0 && (
        <section className="mt-24">
          <SectionTitle>Vitrine de demonstração</SectionTitle>
          <p className="-mt-2 mb-6 max-w-xl text-sm text-muted">Produtos e marcas fictícios para experimentar sem um produto por perto.</p>
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {demo.map((p) => (
              <li key={p.id} className="border-b border-powder">
                <a href={`/p/${p.barcode}`} className="group flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm group-hover:underline group-hover:underline-offset-4">{p.name}</span>
                    <span className="block text-xs text-muted">{p.category?.namePt}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted group-hover:text-ink">Analisar</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
