import Link from "next/link";
import { inputClass } from "@/components/admin/forms";
import { Card } from "@/components/ui";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AdminIngredients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const ingredients = await db.ingredient.findMany({
    where: q
      ? { OR: [{ inciName: { contains: q } }, { displayNamePt: { contains: q } }, { aliases: { some: { alias: { contains: q } } } }] }
      : {},
    include: { _count: { select: { aliases: true, products: true, evidence: true } } },
    orderBy: { inciName: "asc" },
    take: 300,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Ingredientes ({ingredients.length})</h1>
        <div className="flex gap-2">
          <form>
            <input name="q" defaultValue={q} placeholder="Buscar INCI, nome ou alias" className={inputClass} />
          </form>
          <Link href="/admin/ingredientes/novo" className="whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white">
            + Novo
          </Link>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1">INCI</th>
              <th>Flags</th>
              <th>Benefícios</th>
              <th>Evidência</th>
              <th>Revisão</th>
              <th className="text-right">Aliases · Produtos · Fontes</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id} className="border-t border-line align-top">
                <td className="py-2">
                  <Link href={`/admin/ingredientes/${i.id}`} className="font-medium hover:text-accent">
                    {i.inciName}
                  </Link>
                  <span className="block text-xs text-muted">{i.displayNamePt}</span>
                </td>
                <td className="text-xs">{(i.flags as string[]).join(", ")}</td>
                <td className="text-xs">{(i.benefitTags as string[]).join(", ")}</td>
                <td className="text-xs">{i.evidenceLevel}</td>
                <td className="text-xs">{i.reviewStatus}</td>
                <td className="text-right text-xs tabular-nums">
                  {i._count.aliases} · {i._count.products} · {i._count.evidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
