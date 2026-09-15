import Link from "next/link";
import type { Metadata } from "next";
import type { Verdict } from "@/domain/types";
import { Card, EmptyState, PageHeader, ScorePill, VerdictBadge, table } from "@/components/ui";
import { db } from "@/server/db";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const userId = await getUserId();
  const favorites = userId
    ? await db.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              analyses: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, score: true, verdict: true } },
            },
          },
        },
      })
    : [];

  return (
    <>
      <PageHeader title="Favoritos" description="Produtos que você salvou para lembrar depois." />
      <Card className="p-0">
        {favorites.length === 0 ? (
          <EmptyState title="Nenhum produto salvo">Use “Salvar” no resultado de uma análise.</EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Produto</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Categoria</th>
                  <th className={table.th}>Última análise</th>
                  <th className={`${table.th} text-right`} />
                </tr>
              </thead>
              <tbody>
                {favorites.map(({ product }) => {
                  const last = product.analyses[0];
                  return (
                    <tr key={product.id} className={table.row}>
                      <td className={table.td}>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted">{product.brand?.name}</p>
                      </td>
                      <td className={`${table.td} hidden text-ink-soft sm:table-cell`}>{product.category?.namePt ?? "—"}</td>
                      <td className={table.td}>
                        {last ? (
                          <span className="inline-flex items-center gap-2">
                            <ScorePill score={last.score} verdict={last.verdict as Verdict} />
                            <span className="hidden md:inline">
                              <VerdictBadge verdict={last.verdict as Verdict} />
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className={`${table.td} text-right`}>
                        {last ? (
                          <Link href={`/analise/${last.id}`} className="font-medium text-accent hover:underline">
                            Ver análise
                          </Link>
                        ) : (
                          product.barcode && (
                            <a href={`/p/${product.barcode}`} className="font-medium text-accent hover:underline">
                              Analisar
                            </a>
                          )
                        )}
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
