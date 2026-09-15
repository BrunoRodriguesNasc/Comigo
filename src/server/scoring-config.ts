import { defaultScoringConfig } from "@/domain/config/default-config";
import { scoringConfigSchema, type ScoringConfig } from "@/domain/config/schema";
import { hashOf } from "@/domain/utils";
import { db } from "./db";
import { logEvent } from "./log";

export interface ActiveConfig {
  config: ScoringConfig;
  hash: string;
  version: number;
}

/** Configuração ativa do banco; se inválida ou ausente, usa a padrão (nunca derruba a análise). */
export async function getActiveConfig(): Promise<ActiveConfig> {
  const row = await db.scoringConfig.findFirst({ where: { active: true }, orderBy: { version: "desc" } });
  if (row) {
    const parsed = scoringConfigSchema.safeParse(row.config);
    if (parsed.success) return { config: parsed.data, hash: hashOf(parsed.data), version: row.version };
    logEvent("scoring_config.invalid", { version: row.version, issues: parsed.error.issues.length });
  }
  return { config: defaultScoringConfig, hash: hashOf(defaultScoringConfig), version: 0 };
}
