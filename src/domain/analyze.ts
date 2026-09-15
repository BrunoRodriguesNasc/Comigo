import type { PreferenceDef, Rule, ScoringConfig } from "./config/schema";
import type {
  AnalysisResult,
  Confidence,
  Dimension,
  DimensionScore,
  EvidenceLevel,
  Finding,
  IngredientExplanation,
  IngredientFacts,
  IngredientIndex,
  IngredientStatus,
  NormalizedIngredient,
  ProductInput,
  Profile,
  ScoreContribution,
  Verdict,
} from "./types";

export const ENGINE_VERSION = "1.2.0";

const DIMENSIONS: Dimension[] = ["preferences", "profile_fit", "benefits", "general"];

const DIMENSION_LABEL: Record<Dimension, string> = {
  preferences: "Suas preferências",
  profile_fit: "Seu tipo de pele",
  benefits: "Seus objetivos",
  general: "Pontos gerais",
};

const EVIDENCE_RANK: Record<EvidenceLevel, number> = { low: 0, moderate: 1, high: 2 };

interface PresentIngredient {
  item: NormalizedIngredient;
  facts: IngredientFacts;
}

/** Achado interno: guarda o delta na escala da dimensão, antes do peso. */
interface RawFinding extends Omit<Finding, "points"> {
  delta: number;
}

export interface AnalyzeInput {
  product: ProductInput;
  ingredients: NormalizedIngredient[];
  index: IngredientIndex;
  profile: Profile | null;
  config: ScoringConfig;
}

export function positionFactor(position: number, config: ScoringConfig): number {
  for (const pf of config.positionFactors) if (position <= pf.upTo) return pf.factor;
  return config.positionFactors.at(-1)?.factor ?? 1;
}

export function joinNames(names: string[], limit = 3): string {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  const shown = unique.slice(0, limit);
  const rest = unique.length - shown.length;
  if (rest > 0) return `${shown.join(", ")} e mais ${rest}`;
  return `${shown.slice(0, -1).join(", ")} e ${shown.at(-1)}`;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function isProfileMeaningful(p: Profile | null): p is Profile {
  if (!p) return false;
  return (
    p.skinType !== "unknown" ||
    p.sensitive !== null ||
    p.concerns.length > 0 ||
    p.preferences.length > 0 ||
    p.avoidIngredients.length > 0
  );
}

function profileMatches(rule: Rule, profile: Profile | null): boolean {
  const cond = rule.when.profile;
  if (!cond) return true;
  if (!profile) return false;
  if (cond.sensitive !== undefined && profile.sensitive !== cond.sensitive) return false;

  const checks: boolean[] = [];
  if (cond.skinTypesAny) checks.push(cond.skinTypesAny.includes(profile.skinType));
  if (cond.concernsAny) checks.push(cond.concernsAny.some((c) => (profile.concerns as string[]).includes(c)));
  if (checks.length === 0) return true;
  return cond.match === "all" ? checks.every(Boolean) : checks.some(Boolean);
}

function productMatches(rule: Rule, product: ProductInput): boolean {
  const eq = rule.when.product?.attributeEquals;
  if (!eq) return true;
  return Object.entries(eq).every(([k, v]) => product.attributes[k] === v);
}

function ingredientMatches(rule: Rule, p: PresentIngredient): boolean {
  const c = rule.when.ingredient;
  if (!c) return false;
  if (c.maxPosition && p.item.position > c.maxPosition) return false;
  const f = p.facts;
  if (c.flagsAny && !c.flagsAny.some((x) => f.flags.includes(x))) return false;
  if (c.benefitTagsAny && !c.benefitTagsAny.some((x) => f.benefitTags.includes(x))) return false;
  if (c.concernTagsAny && !c.concernTagsAny.some((x) => f.concerns.some((cc) => cc.tag === x))) return false;
  if (c.functionsAny && !c.functionsAny.some((x) => f.functions.includes(x))) return false;
  return true;
}

function evaluateRule(
  rule: Rule,
  present: PresentIngredient[],
  input: AnalyzeInput,
): RawFinding | null {
  if (rule.active === false) return null;
  if (!profileMatches(rule, input.profile)) return null;
  if (!productMatches(rule, input.product)) return null;

  const { config } = input;
  const e = rule.effect;
  let delta = e.points * config.evidenceFactors[rule.evidence];
  let matched: PresentIngredient[] = [];
  let lowPosition = false;

  if (rule.when.ingredient) {
    matched = present.filter((p) => ingredientMatches(rule, p));
    if (matched.length === 0) return null;

    const valueOf = (p: PresentIngredient) => {
      // Benefícios: evidência efetiva é a menor entre a regra e o ingrediente.
      const ev =
        e.kind === "positive" && EVIDENCE_RANK[p.facts.evidenceLevel] < EVIDENCE_RANK[rule.evidence]
          ? p.facts.evidenceLevel
          : rule.evidence;
      const pos = e.positionScaling ? positionFactor(p.item.position, config) : 1;
      return e.points * config.evidenceFactors[ev] * pos * p.item.matchConfidence;
    };

    const scored = matched
      .map((p) => ({ p, v: valueOf(p) }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v) || a.p.item.position - b.p.item.position);
    matched = scored.map((s) => s.p);

    if (e.aggregate === "sum") {
      const total = scored.reduce((acc, s) => acc + s.v, 0);
      const cap = e.maxPoints ?? Infinity;
      delta = Math.sign(total) * Math.min(Math.abs(total), cap);
    } else {
      delta = scored[0].v;
    }
    lowPosition = e.positionScaling && e.kind === "positive" && matched[0].item.position > 10;
  }

  const names = matched.map((m) => m.facts.displayNamePt);
  let message = fill(e.message, { ingredients: joinNames(names), ingredient: names[0] ?? "" });
  if (lowPosition) {
    message += " Aparece mais para o fim da lista, então pode estar em baixa concentração.";
  }
  if (rule.evidence === "low") message += " (evidência limitada)";

  return {
    kind: e.kind,
    dimension: rule.dimension,
    code: rule.code,
    title: e.title,
    message,
    ingredientIds: matched.map((m) => m.facts.id),
    ingredientNames: names,
    evidence: rule.evidence,
    delta: e.kind === "info" ? 0 : delta,
  };
}

function evaluatePreferences(
  profile: Profile,
  present: PresentIngredient[],
  input: AnalyzeInput,
  partial: boolean,
): RawFinding[] {
  const out: RawFinding[] = [];
  const { config, product, ingredients } = input;
  const partialNote = partial ? " Atenção: reconhecemos só parte dos ingredientes." : "";

  for (const pref of profile.preferences) {
    const def: PreferenceDef | undefined = config.preferences[pref.key];
    if (!def) continue;
    const strict = pref.strictness === "strict";
    const code = `pref_${pref.key}`;

    if (def.flagsAny) {
      const offenders = present.filter((p) => def.flagsAny!.some((f) => p.facts.flags.includes(f)));
      if (offenders.length > 0) {
        const names = offenders.map((o) => o.facts.displayNamePt);
        out.push({
          kind: strict ? "conflict" : "attention",
          dimension: "preferences",
          code,
          title: def.conflictTitle,
          message: fill(def.conflictMessage, { ingredients: joinNames(names) }),
          ingredientIds: offenders.map((o) => o.facts.id),
          ingredientNames: names,
          evidence: null,
          delta: def.softPoints,
        });
      } else {
        out.push(okFinding(code, def.okTitle ?? def.label, def.okMessage + partialNote));
      }
      continue;
    }

    if (def.maxIngredients) {
      const count = ingredients.length;
      const vars = { count, max: def.maxIngredients };
      if (count > def.maxIngredients) {
        // "Fórmula simples" nunca é bloqueio: estrito só pesa mais.
        out.push({
          kind: "attention",
          dimension: "preferences",
          code,
          title: def.conflictTitle,
          message: fill(def.conflictMessage, vars),
          ingredientIds: [],
          ingredientNames: [],
          evidence: null,
          delta: def.softPoints * (strict ? 1.5 : 1),
        });
      } else if (count > 0) {
        out.push(okFinding(code, def.okTitle ?? def.label, fill(def.okMessage, vars)));
      }
      continue;
    }

    if (def.requiresAttribute) {
      const value = product.attributes[def.requiresAttribute];
      if (value === true) {
        out.push(okFinding(code, def.okTitle ?? def.label, def.okMessage));
      } else if (value === false) {
        out.push({
          kind: strict ? "conflict" : "attention",
          dimension: "preferences",
          code,
          title: def.conflictTitle,
          message: def.conflictMessage,
          ingredientIds: [],
          ingredientNames: [],
          evidence: null,
          delta: def.softPoints,
        });
      } else {
        // Sem informação não é penalidade: é incerteza declarada.
        out.push({
          kind: "info",
          dimension: "preferences",
          code,
          title: def.label,
          message: def.unknownMessage ?? "Informação não disponível.",
          ingredientIds: [],
          ingredientNames: [],
          evidence: null,
          delta: 0,
        });
      }
    }
  }

  // Lista pessoal de ingredientes
  if (profile.avoidIngredients.length > 0) {
    let anyHit = false;
    for (const avoid of profile.avoidIngredients) {
      const hits = present.filter((p) => p.facts.id === avoid.ingredientId);
      if (hits.length === 0) continue;
      anyHit = true;
      const strict = avoid.strictness === "strict";
      const fuzzy = hits.some((h) => h.item.matchType === "fuzzy");
      const name = hits[0].facts.displayNamePt;
      out.push({
        kind: strict ? "conflict" : "attention",
        dimension: "preferences",
        code: `avoid_${avoid.ingredientId}`,
        title: strict ? `Contém ${name}` : `Contém ${name} (prefere evitar)`,
        message:
          `${name} está na sua lista de ingredientes para ${strict ? "evitar" : "evitar quando possível"}` +
          ` (aparece como “${hits[0].item.rawName}”).` +
          (fuzzy ? " A correspondência foi aproximada; confira no rótulo." : ""),
        ingredientIds: [avoid.ingredientId],
        ingredientNames: [name],
        evidence: null,
        delta: config.softAvoidPoints,
      });
    }
    if (!anyHit) {
      out.push(
        okFinding(
          "avoid_list_ok",
          "Sua lista pessoal",
          `Não contém nenhum dos ${profile.avoidIngredients.length} ingrediente(s) da sua lista para evitar.${partialNote}`,
        ),
      );
    }
  }

  return out;
}

function okFinding(code: string, title: string, message: string): RawFinding {
  return {
    kind: "positive",
    dimension: "preferences",
    code: `${code}_ok`,
    title,
    message,
    ingredientIds: [],
    ingredientNames: [],
    evidence: null,
    delta: 0,
  };
}

function computeCoverage(ingredients: NormalizedIngredient[]): number {
  if (ingredients.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const i of ingredients) {
    const w = i.position <= 10 ? 1 : 0.5;
    num += w * i.matchConfidence;
    den += w;
  }
  return num / den;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  excellent: "EXCELENTE PARA VOCÊ",
  good: "BOM PARA VOCÊ",
  caution: "ATENÇÃO",
  poor: "NÃO É UMA BOA ESCOLHA PARA VOCÊ",
  conflict: "CONTÉM ALGO QUE VOCÊ QUER EVITAR",
  insufficient: "DADOS INSUFICIENTES PARA AVALIAR",
};

const GENERIC_VERDICT_LABEL: Record<Verdict, string> = {
  excellent: "ÓTIMA COMPATIBILIDADE GERAL",
  good: "BOA COMPATIBILIDADE GERAL",
  caution: "ATENÇÃO",
  poor: "BAIXA COMPATIBILIDADE GERAL",
  conflict: "CONFLITO",
  insufficient: "DADOS INSUFICIENTES PARA AVALIAR",
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function analyze(input: AnalyzeInput): AnalysisResult {
  const { config, index, ingredients, product } = input;
  const profileUsed = isProfileMeaningful(input.profile);
  const profile = profileUsed ? input.profile : null;

  const present: PresentIngredient[] = ingredients
    .filter((i) => i.ingredientId && index.byId.has(i.ingredientId))
    .map((item) => ({ item, facts: index.byId.get(item.ingredientId!)! }));

  const coverage = computeCoverage(ingredients);
  const partial = ingredients.length === 0 || coverage < config.confidence.partialBelow;

  // 1. Achados
  const raw: RawFinding[] = [];
  if (profile) raw.push(...evaluatePreferences(profile, present, input, partial));
  for (const rule of config.rules) {
    const f = evaluateRule(rule, present, { ...input, profile });
    if (f) raw.push(f);
  }

  // 2. Dimensões
  const totalWeight = DIMENSIONS.reduce((a, d) => a + (config.weights[d] ?? 0), 0) || 1;
  const w = (d: Dimension) => (config.weights[d] ?? 0) / totalWeight;

  const contributions: ScoreContribution[] = [];
  const baseTotal = DIMENSIONS.reduce((a, d) => a + w(d) * config.bases[d], 0);
  contributions.push({
    dimension: "overall",
    label: "Ponto de partida neutro (antes de olhar a fórmula)",
    points: baseTotal,
    code: "base",
  });

  const dimensions: DimensionScore[] = DIMENSIONS.map((d) => {
    const rawDelta = raw.filter((f) => f.dimension === d).reduce((a, f) => a + f.delta, 0);
    const unclamped = config.bases[d] + rawDelta;
    const subscore = clamp(unclamped);
    return { dimension: d, weight: w(d), base: config.bases[d], rawDelta, subscore };
  });

  const findings: Finding[] = raw.map(({ delta, ...f }) => ({ ...f, points: round1(w(f.dimension) * delta) }));

  for (const f of raw) {
    if (f.delta === 0) continue;
    contributions.push({ dimension: f.dimension, label: f.title, points: w(f.dimension) * f.delta, code: f.code });
  }
  for (const d of dimensions) {
    const diff = d.subscore - (d.base + d.rawDelta);
    if (Math.abs(diff) > 1e-9) {
      contributions.push({
        dimension: d.dimension,
        label: `Limite da dimensão “${DIMENSION_LABEL[d.dimension]}” (0–100)`,
        points: w(d.dimension) * diff,
        code: "clamp",
      });
    }
  }

  let scoreFloat = dimensions.reduce((a, d) => a + d.weight * d.subscore, 0);
  const conflicts = findings.filter((f) => f.kind === "conflict");
  if (conflicts.length > 0 && scoreFloat > config.conflictCap) {
    contributions.push({
      dimension: "overall",
      label: "Limite por conflito com o que você quer evitar",
      points: config.conflictCap - scoreFloat,
      code: "conflict_cap",
    });
    scoreFloat = config.conflictCap;
  }
  const score = Math.round(scoreFloat);
  if (Math.abs(score - scoreFloat) > 1e-9) {
    contributions.push({ dimension: "overall", label: "Arredondamento", points: score - scoreFloat, code: "rounding" });
  }

  // 3. Veredito e confiança
  const t = config.verdictThresholds;
  // Conflito estrito é informação real mesmo com dados parciais; veredito positivo/negativo sem base, não.
  const verdict: Verdict =
    conflicts.length > 0
      ? "conflict"
      : partial
        ? "insufficient"
        : score >= t.excellent
          ? "excellent"
          : score >= t.good
            ? "good"
            : score >= t.caution
              ? "caution"
              : "poor";
  const recognized = { known: present.length, total: ingredients.length };

  const confValue = coverage * product.dataReliability;
  const confidence: Confidence =
    confValue >= config.confidence.highAt ? "high" : confValue >= config.confidence.mediumAt ? "medium" : "low";

  const counts = {
    positive: findings.filter((f) => f.kind === "positive").length,
    attention: findings.filter((f) => f.kind === "attention").length,
    conflict: conflicts.length,
  };

  const order: Record<Finding["kind"], number> = { conflict: 0, attention: 1, positive: 2, info: 3 };
  findings.sort((a, b) => order[a.kind] - order[b.kind] || Math.abs(b.points) - Math.abs(a.points));

  return {
    engineVersion: ENGINE_VERSION,
    product,
    score,
    verdict,
    verdictLabel: profileUsed ? VERDICT_LABEL[verdict] : GENERIC_VERDICT_LABEL[verdict],
    headline: headline(verdict, counts, conflicts, profileUsed, recognized),
    recommendation: recommendation(verdict, counts.attention, partial),
    confidence,
    partial,
    coverage: Math.round(coverage * 1000) / 1000,
    counts,
    findings,
    dimensions,
    contributions: contributions.map((c) => ({ ...c, points: Math.round(c.points * 100) / 100 })),
    ingredients: explainIngredients(ingredients, index, findings),
    disclaimers: disclaimers(profile, findings),
    profileUsed,
  };
}

function headline(
  verdict: Verdict,
  counts: AnalysisResult["counts"],
  conflicts: Finding[],
  profileUsed: boolean,
  recognized: { known: number; total: number },
): string {
  if (verdict === "insufficient") {
    return recognized.total === 0
      ? "Não encontramos uma lista de ingredientes para avaliar."
      : `Reconhecemos só ${recognized.known} de ${recognized.total} ingredientes — não dá para avaliar com segurança.`;
  }
  if (!profileUsed) return "Análise geral. Crie seu perfil para saber se combina com você.";
  switch (verdict) {
    case "conflict": {
      const names = conflicts.flatMap((c) => c.ingredientNames);
      return names.length
        ? `Contém ${joinNames(names)}, que você marcou para evitar.`
        : `Não atende a uma preferência que você marcou como indispensável.`;
    }
    case "excellent":
      return "Ótima compatibilidade com seu perfil.";
    case "good":
      return counts.attention > 0
        ? `Boa compatibilidade com seu perfil, com ${counts.attention} ponto${counts.attention > 1 ? "s" : ""} de atenção.`
        : "Boa compatibilidade com seu perfil.";
    case "caution":
      return "Pode funcionar, mas alguns pontos não combinam tanto com você.";
    case "poor":
      return "Baixa compatibilidade com seu perfil.";
  }
}

function recommendation(verdict: Verdict, attention: number, partial: boolean): string {
  const base: Record<Verdict, string> = {
    conflict: "Não recomendamos para você, porque contém algo que você marcou como “evitar”. Veja as alternativas.",
    excellent: "Pode ser uma ótima opção para você.",
    good:
      attention > 0
        ? "Pode ser uma boa opção para você. Vale considerar os pontos de atenção abaixo."
        : "Pode ser uma boa opção para você.",
    caution: "Pode funcionar, mas existem alternativas possivelmente mais compatíveis com suas preferências.",
    poor: "Prefira uma alternativa mais compatível com seu perfil.",
    insufficient:
      "Ainda não temos dados suficientes para recomendar ou desaconselhar. A nota considera só os ingredientes reconhecidos e pode mudar bastante. Os pontos abaixo continuam válidos.",
  };
  const partialNote =
    partial && verdict !== "insufficient" ? " Reconhecemos só parte dos ingredientes, então trate esta avaliação com cautela." : "";
  return base[verdict] + partialNote;
}

function explainIngredients(
  ingredients: NormalizedIngredient[],
  index: IngredientIndex,
  findings: Finding[],
): IngredientExplanation[] {
  const rank: Record<IngredientStatus, number> = { conflict: 4, attention: 3, positive: 2, neutral: 1, unknown: 0 };
  return ingredients.map((item) => {
    const facts = item.ingredientId ? index.byId.get(item.ingredientId) : undefined;
    if (!facts) {
      return {
        position: item.position,
        rawName: item.rawName,
        ingredientId: null,
        inciName: null,
        displayName: item.rawName,
        status: "unknown",
        summary: "Ainda não temos informações sobre este ingrediente. Ele não foi considerado na nota.",
        personalNotes: [],
        matchType: item.matchType,
        matchConfidence: item.matchConfidence,
      };
    }
    let status: IngredientStatus = "neutral";
    const notes: string[] = [];
    for (const f of findings) {
      if (!f.ingredientIds.includes(facts.id)) continue;
      if (f.kind !== "info") notes.push(f.title);
      const s: IngredientStatus = f.kind === "info" ? "neutral" : f.kind;
      if (rank[s] > rank[status]) status = s;
    }
    return {
      position: item.position,
      rawName: item.rawName,
      ingredientId: facts.id,
      inciName: facts.inciName,
      displayName: facts.displayNamePt,
      status,
      summary: facts.summaryPt,
      personalNotes: [...new Set(notes)],
      matchType: item.matchType,
      matchConfidence: item.matchConfidence,
    };
  });
}

function disclaimers(profile: Profile | null, findings: Finding[]): string[] {
  const out = [
    "Avaliação educativa de compatibilidade, baseada na composição declarada. Não é diagnóstico e não substitui a orientação de um dermatologista.",
  ];
  const hasStrict = profile?.avoidIngredients.some((a) => a.strictness === "strict") || findings.some((f) => f.kind === "conflict");
  if (profile?.sensitive || hasStrict) {
    out.push(
      "Se você tem alergia diagnosticada ou já teve reação a cosméticos, confira sempre o rótulo físico (fórmulas mudam) e converse com um profissional de saúde.",
    );
  }
  if (profile?.sensitive) out.push("Ao testar um produto novo, aplique antes em uma pequena área da pele.");
  return out;
}
