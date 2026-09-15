import { db } from "../db";
import { logEvent } from "../log";
import { openBeautyFactsSource } from "../sources/open-beauty-facts";
import type { ProductSource } from "../sources/types";
import { upsertProductWithIngredients } from "./catalog";

export const productInclude = { brand: true, category: true, source: true } as const;

function externalSources(): ProductSource[] {
  const sources: ProductSource[] = [];
  if (process.env.ENABLE_OPEN_BEAUTY_FACTS !== "false") sources.push(openBeautyFactsSource);
  return sources;
}

/** Catálogo local primeiro; depois fontes externas, cujo resultado é persistido (cache + fila de revisão). */
export async function findProductByBarcode(barcode: string) {
  const local = await db.product.findUnique({ where: { barcode }, include: productInclude });
  if (local && local.reviewStatus !== "rejected") {
    logEvent("scan.lookup", { barcode, hit: true, source: "local" });
    return local;
  }

  for (const source of externalSources()) {
    try {
      const ext = await source.lookupByBarcode(barcode);
      if (!ext) continue;
      const saved = await upsertProductWithIngredients({
        barcode: ext.barcode,
        brandName: ext.brandName,
        name: ext.name,
        ingredientsRaw: ext.ingredientsRaw,
        imageUrl: ext.imageUrl,
        country: ext.country,
        sourceKey: source.key,
        sourceUrl: ext.sourceUrl,
        externalId: ext.externalId,
        reviewStatus: "pending",
      });
      logEvent("scan.lookup", { barcode, hit: true, source: source.key, hasIngredients: !!ext.ingredientsRaw });
      return db.product.findUniqueOrThrow({ where: { id: saved.id }, include: productInclude });
    } catch (err) {
      logEvent("scan.lookup.source_error", { barcode, source: source.key, error: String(err) });
    }
  }

  logEvent("scan.lookup", { barcode, hit: false });
  return null;
}
