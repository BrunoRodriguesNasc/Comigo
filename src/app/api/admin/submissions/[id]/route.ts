import { z } from "zod";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { upsertProductWithIngredients } from "@/server/services/catalog";
import { HttpError } from "@/server/session";

export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { action } = z.object({ action: z.enum(["approve", "reject"]) }).parse(await req.json());
  const sub = await db.productSubmission.findUnique({ where: { id } });
  if (!sub || sub.status !== "pending") throw new HttpError(404, "Envio não encontrado ou já revisado.");

  if (action === "reject") {
    await db.productSubmission.update({ where: { id }, data: { status: "rejected" } });
    return { ok: true };
  }

  const product = await upsertProductWithIngredients({
    barcode: sub.barcode,
    brandName: sub.brandName,
    name: sub.productName ?? "Produto sem nome",
    ingredientsRaw: sub.ingredientsRaw,
    sourceKey: "user_submission",
    reviewStatus: "verified",
  });
  await db.productSubmission.update({ where: { id }, data: { status: "approved", productId: product.id } });
  return { ok: true, id: product.id };
});
