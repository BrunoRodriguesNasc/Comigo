import { db } from "@/server/db";
import { route } from "@/server/http";

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const alias = await db.ingredientAlias.delete({ where: { id } });
  await db.ingredient.update({ where: { id: alias.ingredientId }, data: { updatedAt: new Date() } });
  return { ok: true };
});
