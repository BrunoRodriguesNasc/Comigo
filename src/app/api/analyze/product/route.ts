import { route } from "@/server/http";
import { db } from "@/server/db";
import { analyzeProductForUser } from "@/server/services/analysis";
import { fillIngredientsFromWeb } from "@/server/services/ingredients-from-web";
import { requireUserId } from "@/server/session";
import { analyzeProductSchema } from "@/server/validation";

/** Analisa um produto escolhido na lista; sem ingredientes, tenta achá-los na web antes. */
export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const { productId } = analyzeProductSchema.parse(await req.json());

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, ingredientsRaw: true } });
  if (!product) return { status: "error", error: "Produto não encontrado. Comece a leitura de novo." };

  if (product.ingredientsRaw) {
    const analysis = await analyzeProductForUser(product.id, userId);
    return { status: "analyzed", analysisId: analysis.id, source: "catalog" };
  }

  const fromWeb = await fillIngredientsFromWeb(product.id, userId);
  if (fromWeb) return { status: "analyzed", analysisId: fromWeb.id, source: "web_ai" };

  return { status: "ingredients_not_found" };
});
