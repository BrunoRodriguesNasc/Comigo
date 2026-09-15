import { z } from "zod";
import { PREFERENCE_KEYS } from "../types";

const dimension = z.enum(["preferences", "profile_fit", "benefits", "general"]);
const evidence = z.enum(["low", "moderate", "high"]);

export const ruleSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]+$/),
  dimension: z.enum(["profile_fit", "benefits", "general"]),
  description: z.string().optional(),
  active: z.boolean().default(true),
  when: z.object({
    profile: z
      .object({
        skinTypesAny: z.array(z.string()).optional(),
        concernsAny: z.array(z.string()).optional(),
        /** Se `skinTypesAny` e `concernsAny` forem dados, basta um deles casar. */
        match: z.enum(["any", "all"]).default("any"),
        sensitive: z.boolean().optional(),
      })
      .optional(),
    ingredient: z
      .object({
        flagsAny: z.array(z.string()).optional(),
        benefitTagsAny: z.array(z.string()).optional(),
        concernTagsAny: z.array(z.string()).optional(),
        functionsAny: z.array(z.string()).optional(),
        maxPosition: z.number().int().positive().optional(),
      })
      .optional(),
    product: z
      .object({
        attributeEquals: z.record(z.union([z.string(), z.boolean()])).optional(),
      })
      .optional(),
  }),
  effect: z.object({
    kind: z.enum(["positive", "attention", "info"]),
    /** Pontos na escala da dimensão (0–100), antes do peso. */
    points: z.number(),
    aggregate: z.enum(["max", "sum"]).default("max"),
    maxPoints: z.number().optional(),
    positionScaling: z.boolean().default(false),
    title: z.string(),
    message: z.string(),
  }),
  evidence: evidence,
});

export type Rule = z.infer<typeof ruleSchema>;

const preferenceDef = z.object({
  label: z.string(),
  /** Título do ponto positivo quando a preferência é atendida (ex.: "Sem fragrância"). */
  okTitle: z.string().optional(),
  /** Ingredientes com qualquer uma dessas flags violam a preferência. */
  flagsAny: z.array(z.string()).optional(),
  /** Atributo declarado do produto que precisa ser `true`. */
  requiresAttribute: z.string().optional(),
  /** Número máximo de ingredientes (fórmula simples). */
  maxIngredients: z.number().int().positive().optional(),
  softPoints: z.number(),
  conflictTitle: z.string(),
  conflictMessage: z.string(),
  okMessage: z.string(),
  unknownMessage: z.string().optional(),
});

/** Todas as dimensões são obrigatórias: um JSON sem uma delas não pode passar na validação. */
const perDimension = <T extends z.ZodTypeAny>(v: T) =>
  z.object({ preferences: v, profile_fit: v, benefits: v, general: v });

export const scoringConfigSchema = z.object({
  weights: perDimension(z.number().min(0)),
  bases: perDimension(z.number().min(0).max(100)),
  verdictThresholds: z.object({
    excellent: z.number(),
    good: z.number(),
    caution: z.number(),
  }),
  conflictCap: z.number().min(0).max(100),
  /** Pontos (escala da dimensão preferences) por ingrediente da lista pessoal "prefiro evitar". */
  softAvoidPoints: z.number(),
  positionFactors: z.array(z.object({ upTo: z.number().int(), factor: z.number() })),
  evidenceFactors: z.object({ low: z.number(), moderate: z.number(), high: z.number() }),
  confidence: z.object({
    highAt: z.number(),
    mediumAt: z.number(),
    partialBelow: z.number(),
  }),
  preferences: z.record(z.enum(PREFERENCE_KEYS), preferenceDef),
  rules: z.array(ruleSchema),
});

export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
export type PreferenceDef = z.infer<typeof preferenceDef>;
