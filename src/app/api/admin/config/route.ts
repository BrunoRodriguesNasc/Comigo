import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { defaultScoringConfig } from "@/domain/config/default-config";
import { scoringConfigSchema } from "@/domain/config/schema";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { HttpError } from "@/server/session";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), config: z.unknown(), note: z.string().optional() }),
  z.object({ action: z.literal("activate"), version: z.number().int() }),
  z.object({ action: z.literal("restore") }),
]);

async function createVersion(config: unknown, note?: string) {
  const parsed = scoringConfigSchema.safeParse(config);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, `Configuração inválida em ${issue.path.join(".") || "(raiz)"}: ${issue.message}`);
  }
  const last = await db.scoringConfig.findFirst({ orderBy: { version: "desc" } });
  const version = (last?.version ?? 0) + 1;
  await db.$transaction([
    db.scoringConfig.updateMany({ data: { active: false } }),
    db.scoringConfig.create({
      data: { version, active: true, config: parsed.data as unknown as Prisma.InputJsonValue, note: note || null },
    }),
  ]);
  return version;
}

export const POST = route(async (req: Request) => {
  const input = body.parse(await req.json());
  if (input.action === "save") {
    const version = await createVersion(input.config, input.note);
    return { ok: true, message: `Versão ${version} salva e ativada.` };
  }
  if (input.action === "restore") {
    const version = await createVersion(defaultScoringConfig, "Restaurada a configuração padrão");
    return { ok: true, message: `Versão ${version} (padrão) ativada.` };
  }
  const target = await db.scoringConfig.findUnique({ where: { version: input.version } });
  if (!target) throw new HttpError(404, "Versão não encontrada.");
  await db.$transaction([
    db.scoringConfig.updateMany({ data: { active: false } }),
    db.scoringConfig.update({ where: { version: input.version }, data: { active: true } }),
  ]);
  return { ok: true };
});
