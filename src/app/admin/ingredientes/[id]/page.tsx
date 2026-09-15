import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, EntityForm, Field, inputClass } from "@/components/admin/forms";
import { Card } from "@/components/ui";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const VOCAB = {
  flags: "fragrance, essential_oil, drying_alcohol, fatty_alcohol, eu_declarable_allergen, exfoliant_aha, exfoliant_bha, retinoid, uv_filter, known_sensitizer, formaldehyde_releaser, strong_surfactant, paraben, animal_derived, cooling_agent",
  benefits: "hydration, emollient, occlusive, barrier_support, oil_control, acne_support, exfoliation, soothing, brightening, antioxidant, anti_aging",
  concerns: "irritation, sensitization, comedogenic_potential, drying, photosensitivity",
};

export default async function AdminIngredientEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inci?: string }>;
}) {
  const { id } = await params;
  const { inci } = await searchParams;
  const isNew = id === "novo";
  const ing = isNew
    ? null
    : await db.ingredient.findUnique({ where: { id }, include: { aliases: { orderBy: { alias: "asc" } }, evidence: true } });
  if (!isNew && !ing) notFound();

  const list = (v: unknown) => (Array.isArray(v) ? v.join(", ") : "");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Link href="/admin/ingredientes" className="text-sm text-muted">
          ← Ingredientes
        </Link>
        <h1 className="mt-1 text-lg font-bold">{isNew ? "Novo ingrediente" : ing!.inciName}</h1>
        <EntityForm action="/api/admin/ingredients" extra={{ id: ing?.id ?? null }} redirectTo="/admin/ingredientes/:id" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome INCI canônico">
              <input name="inciName" required defaultValue={ing?.inciName ?? inci ?? ""} className={inputClass} />
            </Field>
            <Field label="Nome em português">
              <input name="displayNamePt" required defaultValue={ing?.displayNamePt} className={inputClass} />
            </Field>
          </div>
          <Field label="Explicação simples" hint="sem alegações médicas ou alarmismo">
            <textarea name="summaryPt" required rows={3} defaultValue={ing?.summaryPt} className={inputClass} />
          </Field>
          <Field label="Funções cosméticas" hint="separadas por vírgula">
            <input name="functions:list" defaultValue={list(ing?.functions)} className={inputClass} />
          </Field>
          <Field label="Benefícios (tags)">
            <input name="benefitTags:list" defaultValue={list(ing?.benefitTags)} className={inputClass} />
            <p className="mt-1 text-xs text-muted">{VOCAB.benefits}</p>
          </Field>
          <Field label="Flags">
            <input name="flags:list" defaultValue={list(ing?.flags)} className={inputClass} />
            <p className="mt-1 text-xs text-muted">{VOCAB.flags}</p>
          </Field>
          <Field label="Pontos de atenção (JSON)" hint='[{"tag":"irritation","level":"low","evidence":"moderate","note":"…"}]'>
            <textarea
              name="concerns:json"
              rows={3}
              defaultValue={JSON.stringify(ing?.concerns ?? [])}
              className={`${inputClass} font-mono text-xs`}
            />
            <p className="mt-1 text-xs text-muted">tags: {VOCAB.concerns} · level: low|medium|high · evidence: low|moderate|high</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Evidência geral">
              <select name="evidenceLevel" defaultValue={ing?.evidenceLevel ?? "moderate"} className={inputClass}>
                <option>low</option>
                <option>moderate</option>
                <option>high</option>
              </select>
            </Field>
            <Field label="Revisão">
              <select name="reviewStatus" defaultValue={ing?.reviewStatus ?? "draft"} className={inputClass}>
                <option>draft</option>
                <option>reviewed</option>
              </select>
            </Field>
          </div>
        </EntityForm>
      </Card>

      {ing && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-bold">Aliases</h2>
            <p className="text-sm text-ink-soft">Nomes alternativos que resolvem para este ingrediente.</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {ing.aliases.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span>
                    {a.alias} <span className="text-xs text-muted">({a.kind}{a.locale ? ` · ${a.locale}` : ""})</span>
                  </span>
                  <ActionButton url={`/api/admin/aliases/${a.id}`} method="DELETE" label="Remover" tone="bad" />
                </li>
              ))}
            </ul>
            <EntityForm action="/api/admin/aliases" extra={{ ingredientId: ing.id }} submitLabel="Adicionar alias" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                <input name="alias" required placeholder="Novo alias" className={`${inputClass} col-span-2`} />
                <select name="kind" className={inputClass} defaultValue="synonym">
                  <option>synonym</option>
                  <option>translation</option>
                  <option>inn</option>
                  <option>trade</option>
                  <option>typo</option>
                </select>
              </div>
            </EntityForm>
          </Card>

          <Card>
            <h2 className="font-bold">Evidências ({ing.evidence.length})</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {ing.evidence.map((e) => (
                <li key={e.id} className="rounded-lg bg-ground p-2">
                  <p>
                    <strong>{e.claim}</strong> · {e.stance} · {e.level}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {e.sourceUrl ? (
                      <a href={e.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                        {e.sourceTitle}
                      </a>
                    ) : (
                      e.sourceTitle
                    )}
                  </p>
                  {e.notes && <p className="text-xs text-muted">{e.notes}</p>}
                </li>
              ))}
            </ul>
            <EntityForm action="/api/admin/evidence" extra={{ ingredientId: ing.id }} submitLabel="Adicionar evidência" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                <input name="claim" required placeholder="tag (ex.: hydration)" className={inputClass} />
                <select name="stance" className={inputClass}>
                  <option>supports</option>
                  <option>mixed</option>
                  <option>against</option>
                </select>
                <select name="level" className={inputClass}>
                  <option>moderate</option>
                  <option>high</option>
                  <option>low</option>
                </select>
              </div>
              <input name="sourceTitle" required placeholder="Referência (autor, título, revista, ano)" className={inputClass} />
              <input name="sourceUrl:nullable" placeholder="URL (opcional)" className={inputClass} />
            </EntityForm>
          </Card>

          <ActionButton
            url={`/api/admin/ingredients/${ing.id}`}
            method="DELETE"
            label="Excluir ingrediente"
            tone="bad"
            confirmText="Excluir? Produtos que o usam passarão a mostrá-lo como não reconhecido."
            redirectTo="/admin/ingredientes"
          />
        </div>
      )}
    </div>
  );
}
