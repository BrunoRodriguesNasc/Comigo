import type { IngredientIndex, NormalizedIngredient } from "../types";

/** Forma canônica de comparação: minúsculas, sem acento, pontuação reduzida, espaços colapsados. */
export function normalizeName(input: string): string {
  let s = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[*†‡®™]/g, "")
    .replace(/[“”"']/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  // OCR/digitação: "Cl 77891" / "C.I. 77891" → "ci 77891"
  s = s.replace(/^(c\.?\s?i\.?|cl)\s?(\d{5})$/, "ci $2");
  s = s.replace(/[.;:]+$/, "").trim();
  return s;
}

const PREFIX_PATTERNS = [
  /^(ingredients?|ingredientes|composi[cç][aã]o|inci)\s*:\s*/i,
];

const MAY_CONTAIN = /\b(may contain|pode conter|peut contenir|\+\/-|\[\+\/-\])\s*:?/i;

/**
 * Divide uma lista INCI em itens, respeitando parênteses e colchetes
 * ("Aqua (Water, Eau)" é um único item).
 */
export function splitIngredientList(raw: string): string[] {
  let text = raw.replace(/\r?\n/g, ", ").trim();
  for (const p of PREFIX_PATTERNS) text = text.replace(p, "");
  // "[+/- CI 77491, CI 77492]" / "(may contain: ...)" → itens normais da lista
  text = text.replace(/[[(]\s*(\+\/-|may contain|pode conter|peut contenir)\s*:?\s*([^\])]*)[\])]/gi, ", $2");

  const items: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";" || ch === "•" || ch === "·") && depth === 0) {
      items.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  items.push(current);

  return items
    .map((i) => i.replace(MAY_CONTAIN, "").replace(/\s+/g, " ").trim())
    .map((i) => i.replace(/\s*\d+([.,]\d+)?\s*%$/, "").trim()) // "Niacinamide 5%"
    .map((i) => i.replace(/^[-–.\s]+|[.*†‡\s]+$/g, ""))
    .filter((i) => i.length > 0 && i.length < 120);
}

/** Distância de Levenshtein com parada antecipada. */
export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Candidatos alternativos de um item: "Parfum/Fragrance", "Aqua (Water)", "Water (Aqua)". */
function candidates(normalized: string): string[] {
  const out = new Set<string>([normalized]);
  const paren = normalized.match(/^(.*?)\s*[([](.*?)[)\]]\s*$/);
  if (paren) {
    const outer = paren[1].trim();
    if (outer) out.add(outer);
    for (const inner of paren[2].split(/[,/]/)) if (inner.trim()) out.add(inner.trim());
  }
  if (normalized.includes("/")) {
    for (const part of normalized.split("/")) if (part.trim()) out.add(part.trim());
  }
  return [...out];
}

export interface MatchResult {
  ingredientId: string | null;
  matchType: NormalizedIngredient["matchType"];
  matchConfidence: number;
}

export function matchIngredient(rawName: string, index: IngredientIndex): MatchResult {
  const normalized = normalizeName(rawName);
  const cands = candidates(normalized);

  for (const [i, cand] of cands.entries()) {
    const id = index.byName.get(cand);
    if (!id) continue;
    const facts = index.byId.get(id);
    const isCanonical = facts ? normalizeName(facts.inciName) === cand : false;
    // O item inteiro bateu com o INCI canônico → exato. Parte dele ou alias → alias.
    return {
      ingredientId: id,
      matchType: isCanonical && i === 0 ? "exact" : "alias",
      matchConfidence: i === 0 ? 1 : 0.95,
    };
  }

  // Fuzzy: só para nomes com tamanho suficiente, com limiar proporcional.
  // Números nunca podem divergir (PEG-40 ≠ PEG-60, CI 77491 ≠ CI 77492).
  let best: { id: string; dist: number; len: number } | null = null;
  for (const cand of cands) {
    if (cand.length < 5) continue;
    const maxDist = cand.length <= 8 ? 1 : cand.length <= 16 ? 2 : 3;
    const candDigits = cand.replace(/\D/g, "");
    for (const [name, id] of index.byName) {
      if (name.replace(/\D/g, "") !== candDigits) continue;
      const d = levenshtein(cand, name, maxDist);
      if (d <= maxDist && (!best || d < best.dist)) best = { id, dist: d, len: cand.length };
    }
  }
  if (best) {
    return {
      ingredientId: best.id,
      matchType: "fuzzy",
      matchConfidence: Math.max(0.5, Number((1 - best.dist / best.len).toFixed(2))),
    };
  }

  return { ingredientId: null, matchType: "unmatched", matchConfidence: 0 };
}

export function normalizeIngredientList(raw: string, index: IngredientIndex): NormalizedIngredient[] {
  return splitIngredientList(raw).map((rawName, i) => {
    const m = matchIngredient(rawName, index);
    return { position: i + 1, rawName, normalized: normalizeName(rawName), ...m };
  });
}

export function buildIndex(
  ingredients: { id: string; inciName: string }[],
  aliases: { normalized: string; ingredientId: string }[],
  facts: Map<string, import("../types").IngredientFacts>,
): IngredientIndex {
  const byName = new Map<string, string>();
  // Rótulos brasileiros costumam trazer o nome em português ("GOMA XANTANA", "Álcool cetoestearílico").
  // O nome de exibição (sem o complemento entre parênteses) entra como tradução, com a menor prioridade.
  for (const f of facts.values()) {
    const base = normalizeName(f.displayNamePt.replace(/\s*\(.*\)\s*$/, ""));
    if (base.length >= 4 && !byName.has(base)) byName.set(base, f.id);
  }
  for (const a of aliases) byName.set(normalizeName(a.normalized), a.ingredientId);
  // INCI canônico tem prioridade sobre alias em caso de colisão.
  for (const ing of ingredients) byName.set(normalizeName(ing.inciName), ing.id);
  return { byId: facts, byName };
}
