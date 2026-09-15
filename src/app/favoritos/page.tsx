import Link from "next/link";
import type { Verdict } from "@/domain/types";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, EmptyState, ScorePill } from "@/components/ui";
import { db } from "@/server/db";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

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
              analyses: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, score: true, verdict: true } },
            },
          },
        },
      })
    : [];

  return (
    <AppShell>
      <PageHeader title="Meus produtos" subtitle="Produtos que você salvou." />
      {favorites.length === 0 ? (
        <EmptyState title="Nenhum produto salvo">Toque em “♡ Salvar” no resultado de uma análise.</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {favorites.map(({ product }) => {
              const last = product.analyses[0];
              return (
                <li key={product.id} className="flex items-center gap-3 p-4">
                  <span className="text-lg text-accent">♥</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted">{product.brand?.name}</p>
                  </div>
                  {last ? (
                    <Link href={`/analise/${last.id}`} className="flex items-center gap-2">
                      <ScorePill score={last.score} verdict={last.verdict as Verdict} />
                      <span className="text-muted">›</span>
                    </Link>
                  ) : (
                    product.barcode && (
                      <a href={`/p/${product.barcode}`} className="text-sm font-semibold text-accent">
                        Analisar
                      </a>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
