import type { AnalysisResult } from "./types";

export interface Comparison {
  winner: "a" | "b" | "tie";
  reason: string;
  onlyA: { positives: string[]; attentions: string[] };
  onlyB: { positives: string[]; attentions: string[] };
}

const titles = (r: AnalysisResult, kinds: string[]) =>
  new Set(r.findings.filter((f) => kinds.includes(f.kind)).map((f) => f.title));

/** Comparação determinística entre duas análises do MESMO perfil. */
export function compareAnalyses(a: AnalysisResult, b: AnalysisResult, tieMargin = 5): Comparison {
  const posA = titles(a, ["positive"]);
  const posB = titles(b, ["positive"]);
  const attA = titles(a, ["attention", "conflict"]);
  const attB = titles(b, ["attention", "conflict"]);
  const diff = (x: Set<string>, y: Set<string>) => [...x].filter((t) => !y.has(t));

  const onlyA = { positives: diff(posA, posB), attentions: diff(attA, attB) };
  const onlyB = { positives: diff(posB, posA), attentions: diff(attB, attA) };

  const aConflict = a.verdict === "conflict";
  const bConflict = b.verdict === "conflict";
  let winner: Comparison["winner"];
  let reason: string;

  if (aConflict !== bConflict) {
    winner = aConflict ? "b" : "a";
    const w = winner === "a" ? a : b;
    reason = `Recomendamos ${w.product.name} para você: o outro contém algo que você marcou para evitar.`;
  } else if (aConflict && bConflict) {
    winner = "tie";
    reason = "Os dois produtos contêm algo que você marcou para evitar. Considere uma alternativa.";
  } else if (Math.abs(a.score - b.score) < tieMargin) {
    winner = "tie";
    reason = "A compatibilidade dos dois é parecida para o seu perfil. Vale decidir por textura, preço ou preferência pessoal.";
  } else {
    winner = a.score > b.score ? "a" : "b";
    const w = winner === "a" ? a : b;
    reason = `Recomendamos ${w.product.name} para você: tem melhor compatibilidade com seu perfil.`;
  }

  if (a.partial || b.partial) {
    reason += " Atenção: reconhecemos só parte dos ingredientes de pelo menos um dos produtos.";
  }
  return { winner, reason, onlyA, onlyB };
}
