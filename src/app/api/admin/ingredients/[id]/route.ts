import { db } from "@/server/db";
import { route } from "@/server/http";

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await db.ingredient.delete({ where: { id } });
  return { ok: true };
});
