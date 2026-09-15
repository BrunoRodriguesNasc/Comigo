import type { ExternalProduct, ProductSource } from "./types";

/**
 * Open Beauty Facts — base colaborativa aberta (licença ODbL: exige atribuição).
 * https://world.openbeautyfacts.org
 */
export const openBeautyFactsSource: ProductSource = {
  key: "openbeautyfacts",
  async lookupByBarcode(barcode) {
    const fields = [
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
    const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "COMIGO/0.1 (MVP; open-source research)" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { status?: number; product?: Record<string, unknown> };
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const str = (k: string) => (typeof p[k] === "string" && (p[k] as string).trim() ? (p[k] as string).trim() : null);

    const name = str("product_name_pt") ?? str("product_name");
    if (!name) return null;
    return {
      externalId: String(p.code ?? barcode),
      barcode,
      name,
      brandName: str("brands")?.split(",")[0]?.trim() ?? null,
      ingredientsRaw: str("ingredients_text_pt") ?? str("ingredients_text") ?? str("ingredients_text_en"),
      imageUrl: str("image_front_url"),
      country: Array.isArray(p.countries_tags) && p.countries_tags.includes("en:brazil") ? "BR" : null,
      sourceUrl: `https://world.openbeautyfacts.org/product/${barcode}`,
    } satisfies ExternalProduct;
  },
};
