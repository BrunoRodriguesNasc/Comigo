import type { Prisma } from "@prisma/client";
import { normalizeIngredientList } from "@/domain/normalization/normalize";
import type { NormalizedIngredient } from "@/domain/types";
import { slugify } from "@/domain/utils";
import { db } from "../db";
import { getIngredientIndex } from "../ingredient-index";

export interface ProductUpsert {
  /** Quando informado, atualiza este produto (inclusive o código de barras). */
  id?: string | null;
  barcode?: string | null;
  brandName?: string | null;
  name: string;
  categorySlug?: string | null;
  subcategory?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ingredientsRaw?: string | null;
  country?: string | null;
  sourceKey: string;
  sourceUrl?: string | null;
  externalId?: string | null;
  reviewStatus?: "pending" | "verified" | "rejected";
  attributes?: Record<string, unknown>;
}

export async function ensureBrand(name: string | null | undefined) {
  if (!name?.trim()) return null;
  const clean = name.trim();
  return db.brand.upsert({ where: { name: clean }, update: {}, create: { name: clean, slug: slugify(clean) } });
}

/** Registra ingredientes não reconhecidos: é o backlog editorial. */
export async function recordUnmatched(items: NormalizedIngredient[]) {
  const unmatched = items.filter((i) => i.matchType === "unmatched" && i.normalized.length > 1);
  for (const u of unmatched) {
    await db.unmatchedIngredient.upsert({
      where: { normalized: u.normalized },
      update: { count: { increment: 1 }, lastSeenAt: new Date() },
      create: { normalized: u.normalized, sample: u.rawName },
    });
  }
}

/**
 * Pipeline único de entrada de produtos (seed, admin, importação, fontes externas).
 * Sempre re-normaliza o INCI a partir do texto bruto.
 */
export async function upsertProductWithIngredients(input: ProductUpsert) {
  const source = await db.source.findUnique({ where: { key: input.sourceKey } });
  if (!source) throw new Error(`Fonte desconhecida: ${input.sourceKey}`);

  const brand = await ensureBrand(input.brandName);
  const category = input.categorySlug ? await db.category.findUnique({ where: { slug: input.categorySlug } }) : null;
  const index = await getIngredientIndex();
  const normalized = input.ingredientsRaw ? normalizeIngredientList(input.ingredientsRaw, index) : [];

  const data = {
    name: input.name,
    brandId: brand?.id ?? null,
    categoryId: category?.id ?? null,
    subcategory: input.subcategory ?? null,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    ingredientsRaw: input.ingredientsRaw ?? null,
    country: input.country ?? null,
    sourceId: source.id,
    sourceUrl: input.sourceUrl ?? null,
    externalId: input.externalId ?? null,
    reviewStatus: input.reviewStatus ?? "pending",
    verifiedAt: input.reviewStatus === "verified" ? new Date() : null,
    attributes: (input.attributes ?? {}) as Prisma.InputJsonValue,
  };

  const product = await db.$transaction(async (tx) => {
    const existing = input.id
      ? await tx.product.findUnique({ where: { id: input.id } })
      : input.barcode
        ? await tx.product.findUnique({ where: { barcode: input.barcode } })
        : null;
    const p = existing
      ? await tx.product.update({ where: { id: existing.id }, data: { ...data, barcode: input.barcode ?? existing.barcode } })
      : await tx.product.create({ data: { ...data, barcode: input.barcode ?? null } });

    await tx.productIngredient.deleteMany({ where: { productId: p.id } });
    if (normalized.length) {
      await tx.productIngredient.createMany({
        data: normalized.map((n) => ({
          productId: p.id,
          position: n.position,
          rawName: n.rawName,
          normalized: n.normalized,
          ingredientId: n.ingredientId,
          matchType: n.matchType,
          matchConfidence: n.matchConfidence,
        })),
      });
    }
    return p;
  });

  await recordUnmatched(normalized);
  return product;
}

/** Re-normaliza todos os produtos (após melhorar a base de ingredientes/aliases). */
export async function renormalizeAllProducts() {
  const products = await db.product.findMany({ where: { ingredientsRaw: { not: null } } });
  const index = await getIngredientIndex();
  let count = 0;
  for (const p of products) {
    const normalized = normalizeIngredientList(p.ingredientsRaw!, index);
    await db.$transaction([
      db.productIngredient.deleteMany({ where: { productId: p.id } }),
      db.productIngredient.createMany({
        data: normalized.map((n) => ({
          productId: p.id,
          position: n.position,
          rawName: n.rawName,
          normalized: n.normalized,
          ingredientId: n.ingredientId,
          matchType: n.matchType,
          matchConfidence: n.matchConfidence,
        })),
      }),
      db.product.update({ where: { id: p.id }, data: { updatedAt: new Date() } }),
    ]);
    count++;
  }
  return count;
}
