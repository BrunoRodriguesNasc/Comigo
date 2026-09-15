import Link from "next/link";
import { ActionButton } from "@/components/admin/forms";
import { Card } from "@/components/ui";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [submissions, products] = await Promise.all([
    db.productSubmission.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: 50 }),
    db.product.findMany({
      where: { reviewStatus: "pending" },
      include: { brand: true, source: true, ingredients: { select: { matchType: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-bold">Envios de usuários ({submissions.length})</h2>
        <p className="text-sm text-ink-soft">Ao aprovar, o produto entra no catálogo como verificado. Se o código já existir, os dados são substituídos.</p>
        <div className="mt-3 space-y-3">
          {submissions.length === 0 && <p className="text-sm text-muted">Nada pendente.</p>}
          {submissions.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {s.brandName && <span className="text-muted">{s.brandName} · </span>}
                  {s.productName}
                </p>
                <span className="text-xs text-muted">
                  {s.barcode ?? "sem código"} · {s.createdAt.toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="mt-2 max-h-24 overflow-auto rounded-lg bg-ground p-2 text-xs leading-relaxed">{s.ingredientsRaw}</p>
              <div className="mt-2 flex gap-2">
                <ActionButton url={`/api/admin/submissions/${s.id}`} body={{ action: "approve" }} label="Aprovar" tone="good" />
                <ActionButton url={`/api/admin/submissions/${s.id}`} body={{ action: "reject" }} label="Rejeitar" tone="bad" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold">Produtos importados aguardando verificação ({products.length})</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1">Produto</th>
              <th>Fonte</th>
              <th>Reconhecidos</th>
              <th />
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
                    <span className="block text-xs text-muted">
                      {p.brand?.name} · {p.barcode}
                    </span>
                  </td>
                  <td>{p.source.name}</td>
                  <td className="tabular-nums">{total ? `${matched}/${total}` : "sem INCI"}</td>
                  <td className="space-x-2 text-right">
                    <ActionButton url={`/api/admin/products/${p.id}`} method="PATCH" body={{ reviewStatus: "verified" }} label="Verificar" tone="good" />
                    <ActionButton url={`/api/admin/products/${p.id}`} method="PATCH" body={{ reviewStatus: "rejected" }} label="Rejeitar" tone="bad" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-sm text-muted">Nada pendente.</p>}
      </Card>
    </div>
  );
}
