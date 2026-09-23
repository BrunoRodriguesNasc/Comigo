import OpenAI from "openai";
import { logEvent } from "../log";

/**
 * Busca a lista INCI de um produto real na web quando nenhuma base aberta a tem.
 * Só aceita resposta com fonte verificável (grounding/citação); sem fonte = null.
 * O resultado alimenta o catálogo como dado não verificado — nunca decide nota.
 */

export interface WebIngredients {
  ingredientsRaw: string;
  sourceUrl: string;
  sourceTitle: string | null;
  provider: "gemini" | "openai";
}

const GEMINI_MODEL = "gemini-3.6-flash";
const OPENAI_MODEL = process.env.OPENAI_SEARCH_MODEL || "gpt-4.1-mini";

const prompt = (brand: string, productName: string, details: string) => `Procure na web a lista oficial de ingredientes (INCI) deste cosmético vendido no Brasil:

Marca: ${brand}
Produto: ${productName}
${details}

COMO PROCURAR:
- Pesquise pelo nome do produto + "ingredientes" ou "composição".
- A lista costuma estar na descrição ou ficha técnica em lojas online (farmácias, supermercados, lojas de beleza) ou no site da marca.

REGRAS:
1. Só use uma página que mostre os ingredientes DESTE produto exato (mesmo nome e versão).
2. Nunca monte a lista a partir de produtos parecidos, de outra linha ou de outro país. Nunca complete nem invente ingredientes.
3. Copie a lista como aparece na página, separada por vírgulas (pode manter a tradução entre parênteses).
4. Se nenhuma página mostrar a lista deste produto, use found=false.

Responda SOMENTE com JSON neste formato:
{"found": <true ou false>, "ingredients": "<lista copiada da página, ou null>", "sourceUrl": "<endereço da página onde a lista aparece, ou null>"}`;

interface ParsedAnswer {
  ingredients: string;
  sourceUrl: string;
}

function parseAnswer(text: string): ParsedAnswer | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const json = JSON.parse(match[0]) as { found?: boolean; ingredients?: string | null; sourceUrl?: string | null };
    if (!json.found || !json.ingredients || !json.sourceUrl) return null;
    const items = json.ingredients.split(",").map((s) => s.trim()).filter(Boolean);
    // Lista INCI real tem vários itens; menos que isso é trecho ou chute.
    if (items.length < 5 || json.ingredients.length > 8000) return null;
    if (!/^https?:\/\//i.test(json.sourceUrl)) return null;
    const url = new URL(json.sourceUrl.trim());
    for (const k of [...url.searchParams.keys()]) if (k.startsWith("utm_")) url.searchParams.delete(k);
    return { ingredients: json.ingredients.trim(), sourceUrl: url.toString() };
  } catch {
    return null;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

/** A URL citada pelo modelo precisa ser de um domínio que a busca realmente retornou. */
function hostMatches(url: string, groundedHosts: string[]) {
  const host = hostOf(url);
  if (!host) return false;
  return groundedHosts.some((g) => host === g || host.endsWith(`.${g}`) || g.endsWith(`.${host}`));
}

async function searchWithGemini(brand: string, productName: string, details: string): Promise<WebIngredients | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const start = performance.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt(brand, productName, details) }] }],
      tools: [{ google_search: {} }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
    }[];
  };
  const cand = json.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  // No Gemini o título do chunk é o domínio; a uri é um redirecionamento temporário.
  const groundedHosts = (cand?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => c.web?.title?.replace(/^www\./, "").toLowerCase())
    .filter((h): h is string => Boolean(h));

  logEvent("ingredient_search.call", {
    provider: "gemini",
    grounded: groundedHosts.length,
    ms: Math.round(performance.now() - start),
  });

  const answer = parseAnswer(text);
  if (!answer || !hostMatches(answer.sourceUrl, groundedHosts)) {
    logEvent("ingredient_search.rejected", {
      provider: "gemini",
      reason: answer ? "source_not_grounded" : "no_valid_answer",
      text: text.slice(0, 400),
    });
    return null;
  }
  return { ingredientsRaw: answer.ingredients, sourceUrl: answer.sourceUrl, sourceTitle: hostOf(answer.sourceUrl), provider: "gemini" };
}

let openai: OpenAI | null = null;

// Aceita as duas grafias porque o .env do projeto usa OPEN_AI_API_KEY.
const openaiKey = () => process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;

async function searchWithOpenAI(brand: string, productName: string, details: string): Promise<WebIngredients | null> {
  const apiKey = openaiKey();
  if (!apiKey) return null;
  openai ??= new OpenAI({ apiKey, timeout: 60_000 });

  const start = performance.now();
  const res = await openai.responses.create({
    model: OPENAI_MODEL,
    tools: [{ type: "web_search" }],
    include: ["web_search_call.action.sources"],
    input: prompt(brand, productName, details),
  });

  // Resposta só em JSON costuma vir sem anotações; as fontes reais ficam nas ações da busca.
  const citations: { url: string; title: string | null }[] = [];
  for (const item of res.output) {
    if (item.type === "web_search_call") {
      const a = item.action;
      if (a.type === "search") for (const s of a.sources ?? []) citations.push({ url: s.url, title: null });
      if (a.type === "open_page" && a.url) citations.push({ url: a.url, title: null });
    }
    if (item.type === "message") {
      for (const c of item.content) {
        if (c.type !== "output_text") continue;
        for (const a of c.annotations) if (a.type === "url_citation") citations.push({ url: a.url, title: a.title });
      }
    }
  }
  const groundedHosts = citations.map((c) => hostOf(c.url)).filter((h): h is string => Boolean(h));

  logEvent("ingredient_search.call", {
    provider: "openai",
    model: OPENAI_MODEL,
    grounded: groundedHosts.length,
    ms: Math.round(performance.now() - start),
  });

  const answer = parseAnswer(res.output_text);
  if (!answer || !hostMatches(answer.sourceUrl, groundedHosts)) {
    logEvent("ingredient_search.rejected", {
      provider: "openai",
      reason: answer ? "source_not_grounded" : "no_valid_answer",
      text: res.output_text.slice(0, 400),
    });
    return null;
  }
  const title = citations.find((c) => hostOf(c.url) === hostOf(answer.sourceUrl))?.title ?? hostOf(answer.sourceUrl);
  return { ingredientsRaw: answer.ingredients, sourceUrl: answer.sourceUrl, sourceTitle: title, provider: "openai" };
}

export const ingredientSearchEnabled = () => Boolean(process.env.GEMINI_API_KEY || openaiKey());

/** Gemini com busca Google primeiro; se falhar (erro, cota ou sem fonte), OpenAI com busca web. */
export async function searchIngredientsOnWeb(
  brand: string,
  productName: string,
  details: { line?: string | null; variant?: string | null; volume?: string | null } = {},
): Promise<WebIngredients | null> {
  const extra = [
    details.line && `Linha: ${details.line}`,
    details.variant && `Variante: ${details.variant}`,
    details.volume && `Volume: ${details.volume}`,
  ]
    .filter(Boolean)
    .join("\n");

  for (const [provider, fn] of [
    ["gemini", searchWithGemini],
    ["openai", searchWithOpenAI],
  ] as const) {
    try {
      const found = await fn(brand, productName, extra);
      if (found) return found;
    } catch (err) {
      logEvent("ingredient_search.error", { provider, error: String(err).slice(0, 500) });
    }
  }
  return null;
}
