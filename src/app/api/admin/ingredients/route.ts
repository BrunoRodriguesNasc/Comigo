import { z } from "zod";
import { slugify } from "@/domain/utils";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { HttpError } from "@/server/session";

const level = z.enum(["low", "moderate", "high"]);
const schema = z.object({
  id: z.string().nullable().optional(),
  inciName: z.string().trim().min(2),
  displayNamePt: z.string().trim().min(2),
  summaryPt: z.string().trim().min(5),
  functions: z.array(z.string()),
  benefitTags: z.array(z.string()),
  flags: z.array(z.string()),
  concerns: z
    .array(z.object({ tag: z.string(), level: z.enum(["low", "medium", "high"]), evidence: level, note: z.string().optional() }))
    .nullable()
    .transform((v) => v ?? []),
  evidenceLevel: level,
  reviewStatus: z.enum(["draft", "reviewed"]),
});

const ALARMIST = /t[óo]xic|veneno|cancer[íi]gen|perigos/i;

export const POST = route(async (req: Request) => {
  const { id, ...data } = schema.parse(await req.json());
  if (ALARMIST.test(data.summaryPt)) {
    throw new HttpError(400, "Evite termos alarmistas (tóxico, veneno, cancerígeno). Descreva o ponto de atenção com contexto e evidência.");
  }
  const clash = await db.ingredient.findUnique({ where: { inciName: data.inciName } });
  if (clash && clash.id !== id) throw new HttpError(409, "Já existe um ingrediente com este INCI.");

  const payload = { ...data, slug: slugify(data.inciName) };
  const ing = id
    ? await db.ingredient.update({ where: { id }, data: payload })
    : await db.ingredient.create({ data: payload });
  return { id: ing.id, message: "Ingrediente salvo. As próximas análises já usam a ficha nova." };
});
