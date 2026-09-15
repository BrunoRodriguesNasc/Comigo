import Link from "next/link";
import type { Metadata } from "next";
import type { Verdict } from "@/domain/types";
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
      <PageHeader eyebrow="Favoritos" title="Os produtos que você guardou" description="Para lembrar na hora da compra." />
      {favorites.length === 0 ? (
        <EmptyState title="Nenhum favorito ainda">Use “Salvar” no resultado de um produto que combinou com você.</EmptyState>
      ) : (
        <ul className="grid gap-x-12 border-t border-ink sm:grid-cols-2">
          {favorites.map(({ product }) => {
            const last = product.analyses[0];
            const href = last ? `/analise/${last.id}` : product.barcode ? `/p/${product.barcode}` : "#";
            return (
              <li key={product.id} className="border-b border-powder">
                <Link href={href} className="group flex items-center gap-4 py-5">
                  {last ? (
                    <ScorePill score={last.score} verdict={last.verdict as Verdict} />
                  ) : (
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-powder text-xs text-muted">—</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[20px] font-light leading-[1.11] group-hover:underline group-hover:underline-offset-4 sm:text-[24px]">
                      {product.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">{[product.brand?.name, product.category?.namePt].filter(Boolean).join(" · ")}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
