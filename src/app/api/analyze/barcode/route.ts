import { route } from "@/server/http";
import { analyzeProductForUser } from "@/server/services/analysis";
import { findProductByBarcode } from "@/server/services/lookup";
import { requireUserId } from "@/server/session";
import { barcodeSchema } from "@/server/validation";

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const { barcode } = barcodeSchema.parse(await req.json());
  const product = await findProductByBarcode(barcode);
  if (!product) return { status: "not_found", barcode };

  const summary = { name: product.name, brand: product.brand?.name ?? null, source: product.source.name };
  if (!product.ingredientsRaw) return { status: "no_ingredients", barcode, product: summary };

  const analysis = await analyzeProductForUser(product.id, userId);
  return { status: "ok", analysisId: analysis.id, product: summary };
});
