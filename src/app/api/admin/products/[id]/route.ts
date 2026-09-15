import { z } from "zod";
import { db } from "@/server/db";
import { route } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { reviewStatus } = z.object({ reviewStatus: z.enum(["pending", "verified", "rejected"]) }).parse(await req.json());
  await db.product.update({
    where: { id },
    data: { reviewStatus, verifiedAt: reviewStatus === "verified" ? new Date() : null },
  });
  return { ok: true };
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  await db.product.delete({ where: { id } });
  return { ok: true };
});
