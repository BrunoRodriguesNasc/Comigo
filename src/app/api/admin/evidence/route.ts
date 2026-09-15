import { z } from "zod";
import { db } from "@/server/db";
import { route } from "@/server/http";

const schema = z.object({
  ingredientId: z.string().min(1),
  claim: z.string().trim().min(2),
  stance: z.enum(["supports", "mixed", "against"]),
  level: z.enum(["low", "moderate", "high"]),
  sourceTitle: z.string().trim().min(5),
  sourceUrl: z.string().url().nullable().optional(),
});

export const POST = route(async (req: Request) => {
  const data = schema.parse(await req.json());
  await db.ingredientEvidence.create({ data });
  return { ok: true, message: "Evidência adicionada." };
});
