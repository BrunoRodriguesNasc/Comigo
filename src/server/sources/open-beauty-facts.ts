import type { ExternalProduct, ProductSource } from "./types";

const OBF_FIELDS = [
  "code",
  "product_name",
  "product_name_pt",
  "brands",
  "ingredients_text",
  "ingredients_text_pt",
  "ingredients_text_en",
  "image_front_url",
  "countries_tags",
].join(",");

function parseProduct(p: Record<string, unknown>, fallbackCode?: string): ExternalProduct | null {
  const str = (k: string) => (typeof p[k] === "string" && (p[k] as string).trim() ? (p[k] as string).trim() : null);
  const name = str("product_name_pt") ?? str("product_name");
  if (!name) return null;
  const code = String(p.code ?? fallbackCode ?? "");
  return {
    externalId: code,
    barcode: code,
    name,
    brandName: str("brands")?.split(",")[0]?.trim() ?? null,
    ingredientsRaw: str("ingredients_text_pt") ?? str("ingredients_text") ?? str("ingredients_text_en"),
    imageUrl: str("image_front_url"),
    country: Array.isArray(p.countries_tags) && p.countries_tags.includes("en:brazil") ? "BR" : null,
    sourceUrl: code ? `https://world.openbeautyfacts.org/product/${code}` : null,
  };
}

/**
 * Open Beauty Facts — base colaborativa aberta (licença ODbL: exige atribuição).
 * https://world.openbeautyfacts.org
 */
export const openBeautyFactsSource: ProductSource = {
  key: "openbeautyfacts",
  async lookupByBarcode(barcode) {
    const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OBF_FIELDS}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "COMIGO/0.1 (MVP; open-source research)" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { status?: number; product?: Record<string, unknown> };
    if (json.status !== 1 || !json.product) return null;
    return parseProduct(json.product, barcode);
  },
};

const tokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

/**
 * Só aceita o resultado se for o mesmo produto: marca confere e todas as palavras do nome aparecem.
 * Produto parecido (mesma linha, outro país) tem fórmula diferente — anexar seria atribuir
 * composição errada a um produto real.
 */
function isSameProduct(p: ExternalProduct, brand: string, productName: string) {
  const brandTokens = tokens(brand);
  const pBrand = tokens(p.brandName ?? "");
  if (!brandTokens.every((t) => pBrand.includes(t))) return false;
  const nameTokens = tokens(productName).filter((t) => !brandTokens.includes(t));
  if (nameTokens.length === 0) return false;
  const pName = tokens(p.name);
  return nameTokens.every((t) => pName.includes(t));
}

/** Busca no OBF por marca + nome. Retorna só correspondência exata com ingredientes, ou null. */
export async function searchObfByName(brand: string, productName: string): Promise<ExternalProduct | null> {
  const params = new URLSearchParams({
    search_terms: `${brand} ${productName}`,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
    fields: OBF_FIELDS,
  });
  const url = `https://world.openbeautyfacts.org/cgi/search.pl?${params}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "COMIGO/0.1 (MVP; open-source research)" },
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { products?: Record<string, unknown>[] };
    for (const p of json.products ?? []) {
      const parsed = parseProduct(p);
      if (parsed?.ingredientsRaw && isSameProduct(parsed, brand, productName)) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
