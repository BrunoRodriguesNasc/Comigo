import { searchIngredientsOnWeb } from "../ai/ingredient-search";
import { db } from "../db";
import { analyzeProductForUser } from "./analysis";
import { attachIngredientsToProduct } from "./catalog";

const WEB_SOURCE = {
  key: "web_ai",
  name: "Ingredientes encontrados na web por IA (não verificados)",
  trustLevel: 0.5,
};

/**
 * Produto identificado sem ingredientes: procura a lista na web (só com fonte citada).
 * Achou → anexa como dado não verificado e analisa. Não achou → null (a tela pede o verso).
 */
export async function fillIngredientsFromWeb(productId: string, userId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, include: { brand: true } });
  if (!product || product.ingredientsRaw) return null;

  const brand = product.brand?.name;
  if (!brand) return null;

  const attrs = (product.attributes ?? {}) as { line?: string | null; variant?: string | null; volume?: string | null };
  const web = await searchIngredientsOnWeb(brand, product.name, {
    line: attrs.line,
    variant: attrs.variant,
    volume: attrs.volume,
  });
  if (!web) return null;

  await db.source.upsert({ where: { key: WEB_SOURCE.key }, update: {}, create: WEB_SOURCE });
  await attachIngredientsToProduct(productId, web.ingredientsRaw, {
    sourceKey: WEB_SOURCE.key,
    sourceUrl: web.sourceUrl,
  });
  return analyzeProductForUser(productId, userId);
}
