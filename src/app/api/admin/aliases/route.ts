import { z } from "zod";
import { normalizeName } from "@/domain/normalization/normalize";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { HttpError } from "@/server/session";

const schema = z.object({
  ingredientId: z.string().min(1),
  alias: z.string().trim().min(2),
  kind: z.enum(["synonym", "translation", "inn", "trade", "typo"]),
});

export const POST = route(async (req: Request) => {
  const { ingredientId, alias, kind } = schema.parse(await req.json());
  const normalized = normalizeName(alias);
  const [existingAlias, existingInci] = await Promise.all([
    db.ingredientAlias.findUnique({ where: { normalized }, include: { ingredient: true } }),
    db.ingredient.findMany({ select: { id: true, inciName: true } }),
  ]);
  if (existingAlias) throw new HttpError(409, `Este alias já aponta para ${existingAlias.ingredient.inciName}.`);
  const inci = existingInci.find((i) => normalizeName(i.inciName) === normalized);
  if (inci) throw new HttpError(409, `“${alias}” já é o INCI canônico de ${inci.inciName}.`);

  await db.$transaction([
    db.ingredientAlias.create({ data: { ingredientId, alias, normalized, kind } }),
    // Toca o ingrediente para invalidar o índice em memória e o cache de análises.
    db.ingredient.update({ where: { id: ingredientId }, data: { updatedAt: new Date() } }),
    db.unmatchedIngredient.deleteMany({ where: { normalized } }),
  ]);
  return { ok: true, message: "Alias adicionado." };
});
