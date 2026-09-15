// Tipos do domínio. Sem dependências de infraestrutura (Next, Prisma, IA).

export const SKIN_TYPES = ["oily", "dry", "combination", "normal", "unknown"] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

export const CONCERNS = [
  "acne",
  "blackheads",
  "oiliness",
  "dryness",
  "redness",
  "irritation",
  "dark_spots",
  "aging",
  "dullness",
] as const;
export type Concern = (typeof CONCERNS)[number];

export const PREFERENCE_KEYS = [
  "avoid_fragrance",
  "avoid_essential_oils",
  "avoid_drying_alcohol",
  "simple_formula",
  "vegan",
  "cruelty_free",
] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

/** strict = "não posso/não quero de jeito nenhum" (conflito). soft = "prefiro evitar" (penalidade). */
export type Strictness = "strict" | "soft";

export interface Preference {
  key: PreferenceKey;
  strictness: Strictness;
}

export interface AvoidIngredient {
  ingredientId: string;
  inciName: string;
  strictness: Strictness;
}

export interface Profile {
  skinType: SkinType;
  /** null = a pessoa não sabe */
  sensitive: boolean | null;
  concerns: Concern[];
  preferences: Preference[];
  avoidIngredients: AvoidIngredient[];
}

export type EvidenceLevel = "low" | "moderate" | "high";
export type ConcernSeverity = "low" | "medium" | "high";

export interface IngredientConcern {
  tag: string;
  level: ConcernSeverity;
  evidence: EvidenceLevel;
  note?: string;
}

/** Ficha canônica de um ingrediente, como o domínio precisa dela. */
export interface IngredientFacts {
  id: string;
  inciName: string;
  displayNamePt: string;
  summaryPt: string;
  functions: string[];
  benefitTags: string[];
  concerns: IngredientConcern[];
  flags: string[];
  evidenceLevel: EvidenceLevel;
}

export interface AliasEntry {
  normalized: string;
  ingredientId: string;
}

/** Índice de busca usado pela normalização. */
export interface IngredientIndex {
  byId: Map<string, IngredientFacts>;
  /** nome normalizado (INCI ou alias) → id */
  byName: Map<string, string>;
}

export type MatchType = "exact" | "alias" | "fuzzy" | "unmatched";

export interface NormalizedIngredient {
  position: number; // 1-based, ordem do rótulo
  rawName: string;
  normalized: string;
  ingredientId: string | null;
  matchType: MatchType;
  matchConfidence: number; // 0..1
}

export interface ProductAttributes {
  vegan?: boolean | null;
  crueltyFree?: boolean | null;
  finish?: string | null;
  [key: string]: unknown;
}

export interface ProductInput {
  id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  attributes: ProductAttributes;
  /** 0..1 — confiabilidade da origem do dado (fonte × verificação) */
  dataReliability: number;
  sourceLabel: string;
}

// ---------- Resultado ----------

export type Dimension = "preferences" | "profile_fit" | "benefits" | "general";

export type FindingKind = "positive" | "attention" | "conflict" | "info";

export interface Finding {
  kind: FindingKind;
  dimension: Dimension;
  code: string;
  title: string;
  message: string;
  ingredientIds: string[];
  ingredientNames: string[];
  evidence: EvidenceLevel | null;
  /** pontos no score final (já ponderados), para o modo detalhado */
  points: number;
}

export interface ScoreContribution {
  dimension: Dimension | "overall";
  label: string;
  points: number; // pontos no score final
  code: string;
}

export interface DimensionScore {
  dimension: Dimension;
  weight: number;
  base: number;
  rawDelta: number;
  subscore: number;
}

/** insufficient = poucos ingredientes reconhecidos: não exibimos um veredito positivo/negativo sem base. */
export type Verdict = "excellent" | "good" | "caution" | "poor" | "conflict" | "insufficient";
export type Confidence = "high" | "medium" | "low";

export type IngredientStatus = "positive" | "attention" | "conflict" | "neutral" | "unknown";

export interface IngredientExplanation {
  position: number;
  rawName: string;
  ingredientId: string | null;
  inciName: string | null;
  displayName: string;
  status: IngredientStatus;
  summary: string;
  personalNotes: string[];
  matchType: MatchType;
  matchConfidence: number;
}

export interface AnalysisResult {
  engineVersion: string;
  product: ProductInput;
  score: number;
  verdict: Verdict;
  verdictLabel: string;
  headline: string;
  recommendation: string;
  confidence: Confidence;
  partial: boolean;
  coverage: number;
  counts: { positive: number; attention: number; conflict: number };
  findings: Finding[];
  dimensions: DimensionScore[];
  contributions: ScoreContribution[];
  ingredients: IngredientExplanation[];
  disclaimers: string[];
  profileUsed: boolean;
}
