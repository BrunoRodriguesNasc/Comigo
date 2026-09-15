import { z } from "zod";
import { route } from "@/server/http";
import { upsertProductWithIngredients } from "@/server/services/catalog";

const item = z.object({
  barcode: z.string().trim().regex(/^\d{8,14}$/).optional(),
  brand: z.string().trim().optional(),
  name: z.string().trim().min(2),
  category: z.string().trim().optional(),
  description: z.string().optional(),
  ingredients: z.string().trim().min(3).max(8000),
  attributes: z.record(z.unknown()).optional(),
  sourceUrl: z.string().optional(),
});
const schema = z.object({ items: z.array(z.unknown()).max(500) });

export const POST = route(async (req: Request) => {
  const { items } = schema.parse(await req.json());
  let imported = 0;
  const errors: string[] = [];
  for (const [idx, raw] of items.entries()) {
    const parsed = item.safeParse(raw);
    if (!parsed.success) {
      errors.push(`#${idx + 1}: ${parsed.error.issues[0].path.join(".")} ${parsed.error.issues[0].message}`);
      continue;
    }
    const p = parsed.data;
    try {
      await upsertProductWithIngredients({
        barcode: p.barcode,
        brandName: p.brand,
        name: p.name,
        categorySlug: p.category,
        description: p.description,
        ingredientsRaw: p.ingredients,
        attributes: p.attributes,
        sourceUrl: p.sourceUrl,
        sourceKey: "bulk_import",
        reviewStatus: "pending",
      });
      imported++;
    } catch (err) {
      errors.push(`#${idx + 1}: ${String(err)}`);
    }
  }
  const message = `${imported} importado(s)` + (errors.length ? `, ${errors.length} com erro: ${errors.slice(0, 3).join(" | ")}` : ".");
  return { ok: true, imported, errors, message };
});
