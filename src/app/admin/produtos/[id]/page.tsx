import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, EntityForm, Field, inputClass } from "@/components/admin/forms";
import { Card } from "@/components/ui";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "novo";
  const [product, categories] = await Promise.all([
    isNew
      ? null
      : db.product.findUnique({
          where: { id },
          include: { brand: true, category: true, source: true, ingredients: { include: { ingredient: true }, orderBy: { position: "asc" } } },
        }),
    db.category.findMany({ orderBy: { namePt: "asc" } }),
  ]);
  if (!isNew && !product) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Link href="/admin/produtos" className="text-sm text-muted">
          ← Produtos
        </Link>
        <h1 className="mt-1 text-lg font-bold">{isNew ? "Novo produto" : product!.name}</h1>
        {product && (
          <p className="text-xs text-muted">
            Fonte: {product.source.name}
            {product.sourceUrl && (
              <>
                {" · "}
                <a href={product.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                  origem
                </a>
              </>
            )}
          </p>
        )}
        <EntityForm action="/api/admin/products" extra={{ id: product?.id ?? null }} redirectTo="/admin/produtos/:id" className="mt-4">
          <Field label="Nome">
            <input name="name" required defaultValue={product?.name} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca">
              <input name="brandName:nullable" defaultValue={product?.brand?.name ?? ""} className={inputClass} />
            </Field>
            <Field label="Código de barras">
              <input name="barcode:nullable" defaultValue={product?.barcode ?? ""} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select name="categorySlug:nullable" defaultValue={product?.category?.slug ?? ""} className={inputClass}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.namePt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select name="reviewStatus" defaultValue={product?.reviewStatus ?? "verified"} className={inputClass}>
                <option value="pending">pending</option>
                <option value="verified">verified</option>
                <option value="rejected">rejected</option>
              </select>
            </Field>
          </div>
          <Field label="Descrição">
            <input name="description:nullable" defaultValue={product?.description ?? ""} className={inputClass} />
          </Field>
          <Field label="Ingredientes (texto do rótulo)" hint="re-normalizado ao salvar">
            <textarea name="ingredientsRaw:nullable" rows={6} defaultValue={product?.ingredientsRaw ?? ""} className={inputClass} />
          </Field>
          <Field label="Atributos declarados (JSON)" hint='ex.: {"vegan": true, "crueltyFree": null, "finish": "matte"}'>
            <textarea
              name="attributes:json"
              rows={3}
              defaultValue={JSON.stringify(product?.attributes ?? {}, null, 0)}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>
        </EntityForm>
        {product && (
          <div className="mt-6 border-t border-line pt-4">
            <ActionButton
              url={`/api/admin/products/${product.id}`}
              method="DELETE"
              label="Excluir produto"
              tone="bad"
              confirmText="Excluir o produto e as análises ligadas a ele?"
              redirectTo="/admin/produtos"
            />
          </div>
        )}
      </Card>

      {product && (
        <Card>
          <h2 className="font-bold">Normalização</h2>
          <p className="text-sm text-ink-soft">Como cada item do rótulo foi reconhecido.</p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1">#</th>
                <th>No rótulo</th>
                <th>Ingrediente canônico</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>
              {product.ingredients.map((pi) => (
                <tr key={pi.id} className="border-t border-line">
                  <td className="py-1.5 text-muted tabular-nums">{pi.position}</td>
                  <td>{pi.rawName}</td>
                  <td>
                    {pi.ingredient ? (
                      <Link href={`/admin/ingredientes/${pi.ingredient.id}`} className="hover:text-accent">
                        {pi.ingredient.inciName}
                      </Link>
                    ) : (
                      <Link href={`/admin/ingredientes/novo?inci=${encodeURIComponent(pi.rawName)}`} className="font-semibold text-bad">
                        não reconhecido
                      </Link>
                    )}
                  </td>
                  <td className={pi.matchType === "fuzzy" ? "text-caution" : pi.matchType === "unmatched" ? "text-bad" : "text-muted"}>
                    {pi.matchType}
                    {pi.matchType === "fuzzy" && ` (${Math.round(pi.matchConfidence * 100)}%)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
