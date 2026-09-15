import Link from "next/link";
import type { Metadata } from "next";
import type { Verdict } from "@/domain/types";
import { HeartMark } from "@/components/illustrations";
import { EmptyState, PageHeader, ScorePill } from "@/components/ui";
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
      <PageHeader eyebrow="Favoritos" title="Os que você guardou com carinho" description="Produtos que você salvou para lembrar na hora da compra." />
      {favorites.length === 0 ? (
        <EmptyState title="Nenhum favorito ainda">Toque em “Salvar” no resultado de um produto que combinou com você.</EmptyState>
      ) : (
        <ul className="grid gap-x-12 border-t border-line sm:grid-cols-2">
          {favorites.map(({ product }) => {
            const last = product.analyses[0];
            const href = last ? `/analise/${last.id}` : product.barcode ? `/p/${product.barcode}` : "#";
            return (
              <li key={product.id} className="border-b border-line">
                <Link href={href} className="group flex items-center gap-4 py-5">
                  {last ? (
                    <ScorePill score={last.score} verdict={last.verdict as Verdict} />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush">
                      <HeartMark className="h-4 w-4 text-rose" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-2xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-muted">{[product.brand?.name, product.category?.namePt].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="text-ink-soft transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
