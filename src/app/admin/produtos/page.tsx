import Link from "next/link";
import { Card } from "@/components/ui";
import { inputClass } from "@/components/admin/forms";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const products = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { barcode: { contains: q } }, { brand: { name: { contains: q } } }] } : {},
    include: { brand: true, category: true, source: true, ingredients: { select: { matchType: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Produtos</h1>
        <div className="flex gap-2">
          <form>
            <input name="q" defaultValue={q} placeholder="Buscar nome, marca ou código" className={inputClass} />
          </form>
          <Link href="/admin/produtos/novo" className="whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white">
            + Novo
          </Link>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1">Produto</th>
              <th>Código</th>
              <th>Categoria</th>
              <th>Fonte</th>
              <th>Status</th>
              <th>Reconhecidos</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const total = p.ingredients.length;
              const matched = p.ingredients.filter((i) => i.matchType !== "unmatched").length;
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2">
                    <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:text-accent">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted">{p.brand?.name}</span>
                  </td>
                  <td className="tabular-nums">{p.barcode ?? "—"}</td>
                  <td>{p.category?.namePt ?? "—"}</td>
                  <td>{p.source.name}</td>
                  <td>{p.reviewStatus}</td>
                  <td className="tabular-nums">{total ? `${matched}/${total}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
