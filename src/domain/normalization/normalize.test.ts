import { describe, expect, it } from "vitest";
import { matchIngredient, normalizeIngredientList, normalizeName, splitIngredientList } from "./normalize";
import { seedIndex } from "../testing/fixtures";

describe("splitIngredientList", () => {
  it("respeita parênteses e remove prefixos, porcentagens e marcadores", () => {
    const items = splitIngredientList(
      "Ingredientes: Aqua (Water, Eau), Glycerin, Niacinamide 5%, Parfum*, [+/- CI 77491, CI 77492]",
    );
    expect(items[0]).toBe("Aqua (Water, Eau)");
    expect(items).toContain("Niacinamide");
    expect(items).toContain("Parfum");
  });

  it("aceita quebras de linha e ponto e vírgula", () => {
    expect(splitIngredientList("Aqua\nGlycerin; Squalane")).toEqual(["Aqua", "Glycerin", "Squalane"]);
  });
});

describe("normalizeName", () => {
  it("remove acentos, caixa e corrige colorantes com OCR", () => {
    expect(normalizeName("  Álcool  Desnaturado ")).toBe("alcool desnaturado");
    expect(normalizeName("Cl 77891")).toBe("ci 77891");
    expect(normalizeName("C.I. 77491")).toBe("ci 77491");
  });
});

describe("matchIngredient", () => {
  const index = seedIndex();

  it("resolve sinônimos para o mesmo ingrediente canônico", () => {
    const a = matchIngredient("Nicotinamide", index);
    const b = matchIngredient("Niacinamide", index);
    const c = matchIngredient("Vitamin B3", index);
    expect(a.ingredientId).toBe("niacinamide");
    expect(b.ingredientId).toBe("niacinamide");
    expect(c.ingredientId).toBe("niacinamide");
    expect(b.matchType).toBe("exact");
    expect(a.matchType).toBe("alias");
  });

  it("resolve formas compostas", () => {
    expect(matchIngredient("Parfum/Fragrance", index).ingredientId).toBe("parfum");
    expect(matchIngredient("Aqua (Water)", index).ingredientId).toBe("aqua");
    expect(matchIngredient("Titanium Dioxide (CI 77891)", index).ingredientId).toBe("titanium-dioxide");
    expect(matchIngredient("Cl 77891", index).ingredientId).toBe("titanium-dioxide");
  });

  it("tolera erros de digitação com confiança reduzida", () => {
    const m = matchIngredient("Niacinamde", index);
    expect(m.ingredientId).toBe("niacinamide");
    expect(m.matchType).toBe("fuzzy");
    expect(m.matchConfidence).toBeLessThan(1);
  });

  it("nunca aproxima nomes com números diferentes", () => {
    expect(matchIngredient("CI 77490", index).ingredientId).toBeNull();
    expect(matchIngredient("PEG-40 Stearate", index).ingredientId).toBeNull();
  });

  it("não confunde álcool graxo com álcool secante", () => {
    expect(matchIngredient("Cetyl Alcohol", index).ingredientId).toBe("cetyl-alcohol");
    expect(matchIngredient("Behenyl Alcohol", index).ingredientId).toBeNull();
  });

  it("reconhece nomes em português de rótulos brasileiros", () => {
    const list = normalizeIngredientList(
      "ÁGUA•GLICEROL•DIMETICONA•NICOTINAMIDA•GOMA XANTANA•Álcool cetoestearílico•Etilexilglicerina•Ácido esteárico",
      index,
    );
    expect(list.map((i) => i.ingredientId)).toEqual([
      "aqua",
      "glycerin",
      "dimethicone",
      "niacinamide",
      "xanthan-gum",
      "cetearyl-alcohol",
      "ethylhexylglycerin",
      "stearic-acid",
    ]);
  });

  it("marca desconhecidos como unmatched", () => {
    const list = normalizeIngredientList("Aqua, Ingrediente Inventado XYZ", index);
    expect(list[1]).toMatchObject({ position: 2, ingredientId: null, matchType: "unmatched", matchConfidence: 0 });
  });
});
