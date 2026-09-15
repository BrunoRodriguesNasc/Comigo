import Link from "next/link";
import type { Metadata } from "next";
import { IconClipboard, IconClock, IconHeart, IconScan, IconUser } from "@/components/icons";
import { SKIN_LABEL } from "@/components/labels";
import { QuickAnalyze } from "@/components/quick-analyze";
import { ButtonLink, Card, EmptyState, PageHeader, ScorePill, StatCard, VerdictBadge, formatDateTime, table } from "@/components/ui";
import { db } from "@/server/db";
import { listHistory } from "@/server/services/analysis";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const userId = await getUserId();
  const [profile, history, favorites, demo] = await Promise.all([
    getProfileView(userId),
    listHistory(userId, 100),
    userId ? db.favorite.count({ where: { userId } }) : 0,
    db.product.findMany({ where: { source: { key: "demo" } }, include: { category: true }, orderBy: { name: "asc" } }),
  ]);
  const conflicts = history.filter((h) => h.verdict === "conflict").length;
  const recent = history.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Olá! ✨"
        description="Seu cantinho para descobrir o que combina com a sua pele."
        actions={
          <ButtonLink href="/escanear">
            <IconScan className="h-4 w-4" />
            Analisar produto
          </ButtonLink>
        }
      />

      {!profile.exists && (
        <Card className="mb-6 flex flex-col gap-4 border-accent/20 bg-accent-soft/60 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Complete seu perfil para análises personalizadas</p>
            <p className="mt-1 text-sm text-ink-soft">Sem perfil, mostramos só uma análise geral. Leva cerca de 1 minuto.</p>
          </div>
          <ButtonLink href="/perfil">Criar perfil</ButtonLink>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Analisados" value={history.length} hint="produtos únicos" icon={<IconClock className="h-4 w-4" />} tone="butter" />
        <StatCard label="Conflitos" value={conflicts} hint="com o que você evita" icon={<span aria-hidden>🚫</span>} tone="blush" />
        <StatCard label="Favoritos" value={favorites} hint="produtos salvos" icon={<IconHeart className="h-4 w-4" />} tone="peach" />
        <StatCard
          label="Perfil"
          value={<span className="text-base">{profile.exists ? SKIN_LABEL[profile.profile.skinType] : "Não criado"}</span>}
          hint={
            <Link href="/perfil" className="font-medium text-accent hover:underline">
              {profile.exists ? "Editar" : "Criar agora"}
            </Link>
          }
          icon={<IconUser className="h-4 w-4" />}
          tone="sage"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <Card className="p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Últimas análises</h2>
            {history.length > 0 && (
              <Link href="/historico" className="text-sm font-medium text-accent hover:underline">
                Ver histórico
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <EmptyState title="Nenhum produto analisado ainda">
              Analise pelo código de barras ou cole a lista de ingredientes.
            </EmptyState>
          ) : (
            <div className={table.wrap}>
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Produto</th>
                    <th className={`${table.th} hidden sm:table-cell`}>Resultado</th>
                    <th className={`${table.th} text-right`}>Nota</th>
                    <th className={`${table.th} hidden text-right md:table-cell`}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((h) => (
                    <tr key={h.id} className={table.row}>
                      <td className={table.td}>
                        <Link href={`/analise/${h.id}`} className="font-medium text-ink hover:text-accent">
                          {h.productName}
                        </Link>
                        {h.brand && <p className="text-xs text-muted">{h.brand}</p>}
                        <div className="mt-1.5 sm:hidden">
                          <VerdictBadge verdict={h.verdict} />
                        </div>
                      </td>
                      <td className={`${table.td} hidden sm:table-cell`}>
                        <VerdictBadge verdict={h.verdict} />
                      </td>
                      <td className={`${table.td} text-right`}>
                        <ScorePill score={h.score} verdict={h.verdict} />
                      </td>
                      <td className={`${table.td} hidden whitespace-nowrap text-right text-muted md:table-cell`}>{formatDateTime(h.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold">Análise rápida</h2>
            <p className="mt-1 text-sm text-ink-soft">Digite o código ou use a câmera.</p>
            <div className="mt-4">
              <QuickAnalyze />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ButtonLink href="/escanear" variant="secondary" className="py-2">
                <IconScan className="h-4 w-4" />
                Câmera
              </ButtonLink>
              <ButtonLink href="/colar" variant="secondary" className="py-2">
                <IconClipboard className="h-4 w-4" />
                Colar INCI
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      {demo.length > 0 && (
        <Card className="mt-6 p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Catálogo de demonstração</h2>
            <p className="mt-0.5 text-sm text-ink-soft">Produtos e marcas fictícios para testar o COMIGO sem um produto em mãos.</p>
          </div>
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Produto</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Categoria</th>
                  <th className={`${table.th} hidden md:table-cell`}>Código</th>
                  <th className={`${table.th} text-right`} />
                </tr>
              </thead>
              <tbody>
                {demo.map((p) => (
                  <tr key={p.id} className={table.row}>
                    <td className={`${table.td} font-medium`}>{p.name}</td>
                    <td className={`${table.td} hidden text-ink-soft sm:table-cell`}>{p.category?.namePt}</td>
                    <td className={`${table.td} hidden tabular-nums text-muted md:table-cell`}>{p.barcode}</td>
                    <td className={`${table.td} text-right`}>
                      <a href={`/p/${p.barcode}`} className="font-medium text-accent hover:underline">
                        Analisar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
