import { z } from "zod";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { upsertProductWithIngredients } from "@/server/services/catalog";
import { HttpError } from "@/server/session";

const schema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().trim().min(2),
  brandName: z.string().trim().nullable().optional(),
  barcode: z.string().trim().regex(/^\d{8,14}$/, "Código deve ter 8–14 dígitos").nullable().optional(),
  categorySlug: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ingredientsRaw: z.string().max(8000).nullable().optional(),
  reviewStatus: z.enum(["pending", "verified", "rejected"]),
  attributes: z.record(z.unknown()).nullable().optional(),
});

export const POST = route(async (req: Request) => {
  const input = schema.parse(await req.json());
  let sourceKey = "manual";
  if (input.id) {
    const existing = await db.product.findUnique({ where: { id: input.id }, include: { source: true } });
    if (!existing) throw new HttpError(404, "Produto não encontrado.");
    sourceKey = existing.source.key;
  }
  if (input.barcode) {
    const clash = await db.product.findUnique({ where: { barcode: input.barcode } });
    if (clash && clash.id !== input.id) throw new HttpError(409, "Já existe outro produto com este código.");
  }
  const product = await upsertProductWithIngredients({ ...input, attributes: input.attributes ?? {}, sourceKey });
  return { id: product.id, message: "Produto salvo e ingredientes re-normalizados." };
});
