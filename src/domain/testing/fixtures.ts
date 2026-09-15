import { seedIngredients } from "@/data/ingredients";
import { buildIndex, normalizeIngredientList } from "../normalization/normalize";
import type { IngredientFacts, IngredientIndex, Profile, ProductInput } from "../types";
import { slugify } from "../utils";
import { analyze } from "../analyze";
import { defaultScoringConfig } from "../config/default-config";

let cached: IngredientIndex | null = null;

export function seedIndex(): IngredientIndex {
  if (cached) return cached;
  const facts = new Map<string, IngredientFacts>();
  const aliases: { normalized: string; ingredientId: string }[] = [];
  for (const s of seedIngredients) {
    const id = slugify(s.inciName);
    facts.set(id, {
      id,
      inciName: s.inciName,
      displayNamePt: s.displayNamePt,
      summaryPt: s.summaryPt,
      functions: s.functions,
      benefitTags: s.benefitTags,
      concerns: s.concerns,
      flags: s.flags,
      evidenceLevel: s.evidenceLevel,
    });
    for (const a of s.aliases) aliases.push({ normalized: a.alias, ingredientId: id });
  }
  cached = buildIndex([...facts.values()], aliases, facts);
  return cached;
}

export function product(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    id: "p1",
    name: "Produto teste",
    brand: null,
    category: null,
    attributes: {},
    dataReliability: 1,
    sourceLabel: "teste",
    ...overrides,
  };
}

export function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    skinType: "unknown",
    sensitive: null,
    concerns: [],
    preferences: [],
    avoidIngredients: [],
    ...overrides,
  };
}

export function run(inci: string, p: Profile | null, prod: Partial<ProductInput> = {}) {
  const index = seedIndex();
  return analyze({
    product: product(prod),
    ingredients: normalizeIngredientList(inci, index),
    index,
    profile: p,
    config: defaultScoringConfig,
  });
}
