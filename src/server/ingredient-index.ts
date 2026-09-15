import type { Ingredient } from "@prisma/client";
import { buildIndex } from "@/domain/normalization/normalize";
import type { EvidenceLevel, IngredientConcern, IngredientFacts, IngredientIndex } from "@/domain/types";
import { db } from "./db";

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function toFacts(row: Ingredient): IngredientFacts {
  return {
    id: row.id,
    inciName: row.inciName,
    displayNamePt: row.displayNamePt,
    summaryPt: row.summaryPt,
    functions: asArray<string>(row.functions),
    benefitTags: asArray<string>(row.benefitTags),
    concerns: asArray<IngredientConcern>(row.concerns),
    flags: asArray<string>(row.flags),
    evidenceLevel: row.evidenceLevel as EvidenceLevel,
  };
}

let cache: { stamp: string; index: IngredientIndex } | null = null;

/**
 * Índice em memória por processo. Invalida quando muda a contagem ou o updatedAt
 * mais recente de ingredientes/aliases (uma consulta barata por requisição).
 * O `stamp` entra na chave de cache das análises: base melhorou → análise é refeita.
 */
export async function loadIngredientIndex(): Promise<{ index: IngredientIndex; stamp: string }> {
  const [ingAgg, aliasCount] = await Promise.all([
    db.ingredient.aggregate({ _max: { updatedAt: true }, _count: true }),
    db.ingredientAlias.count(),
  ]);
  const stamp = `${ingAgg._count}:${ingAgg._max.updatedAt?.getTime() ?? 0}:${aliasCount}`;
  if (cache?.stamp === stamp) return cache;

  const [ingredients, aliases] = await Promise.all([
    db.ingredient.findMany(),
    db.ingredientAlias.findMany({ select: { normalized: true, ingredientId: true } }),
  ]);
  const facts = new Map(ingredients.map((r) => [r.id, toFacts(r)]));
  cache = { stamp, index: buildIndex(ingredients, aliases, facts) };
  return cache;
}

export async function getIngredientIndex(): Promise<IngredientIndex> {
  return (await loadIngredientIndex()).index;
}

export function invalidateIngredientIndex() {
  cache = null;
}
