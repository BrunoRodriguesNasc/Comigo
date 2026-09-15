import Link from "next/link";
import { Card } from "@/components/ui";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, pendingProducts, ingredients, aliases, analyses, lowConfidence, submissions, unmatched, bySource] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { reviewStatus: "pending" } }),
    db.ingredient.count(),
    db.ingredientAlias.count(),
    db.analysis.count(),
    db.analysis.count({ where: { confidence: "low" } }),
    db.productSubmission.count({ where: { status: "pending" } }),
    db.unmatchedIngredient.findMany({ orderBy: [{ count: "desc" }, { lastSeenAt: "desc" }], take: 25 }),
    db.product.groupBy({ by: ["sourceId"], _count: true }),
  ]);
  const sources = await db.source.findMany();
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;

  const stats = [
    { label: "Produtos", value: products, href: "/admin/produtos" },
    { label: "Aguardando revisão", value: pendingProducts + submissions, href: "/admin/revisao" },
    { label: "Ingredientes", value: ingredients, href: "/admin/ingredientes" },
    { label: "Aliases", value: aliases, href: "/admin/ingredientes" },
    { label: "Análises", value: analyses },
    { label: "Análises com confiança baixa", value: analyses ? `${Math.round((lowConfidence / analyses) * 100)}%` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const inner = (
            <Card className="h-full">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-sm text-ink-soft">{s.label}</p>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-bold">Ingredientes não reconhecidos (backlog editorial)</h2>
          <p className="text-sm text-ink-soft">Mais frequentes primeiro. Crie a ficha ou adicione como alias de um ingrediente existente.</p>
          {unmatched.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nenhum até agora.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-1">Como aparece</th>
                  <th>Vezes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {unmatched.map((u) => (
                  <tr key={u.normalized} className="border-t border-line">
                    <td className="py-2">{u.sample}</td>
                    <td className="tabular-nums">{u.count}</td>
                    <td className="text-right">
                      <Link href={`/admin/ingredientes/novo?inci=${encodeURIComponent(u.sample)}`} className="font-semibold text-accent">
                        Criar ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h2 className="font-bold">Produtos por fonte</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {bySource.map((s) => (
              <li key={s.sourceId} className="flex justify-between">
                <span>{sourceName(s.sourceId)}</span>
                <span className="tabular-nums">{s._count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Taxa de “não encontrado” no scan: veja os eventos <code>scan.lookup</code> nos logs.</p>
        </Card>
      </div>
    </div>
  );
}
