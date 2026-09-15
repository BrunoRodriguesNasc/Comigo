import { z } from "zod";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { requireUserId } from "@/server/session";

const schema = z.object({ productId: z.string().min(1), favorite: z.boolean() });

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const { productId, favorite } = schema.parse(await req.json());
  if (favorite) {
    await db.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  } else {
    await db.favorite.deleteMany({ where: { userId, productId } });
  }
  return { ok: true, favorite };
});
