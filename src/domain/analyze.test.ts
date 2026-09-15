import { describe, expect, it } from "vitest";
import { profile, run } from "./testing/fixtures";
import { seedProducts } from "@/data/products";

const byName = (n: string) => seedProducts.find((p) => p.name === n)!;

const oilySensitiveNoFragrance = profile({
  skinType: "oily",
  sensitive: true,
  concerns: ["acne", "oiliness"],
  preferences: [{ key: "avoid_fragrance", strictness: "strict" }],
});

const dryNoRestrictions = profile({ skinType: "dry", sensitive: false, concerns: ["dryness"] });

const sumContributions = (r: ReturnType<typeof run>) => r.contributions.reduce((a, c) => a + c.points, 0);

describe("analyze — critérios de aceite do MVP", () => {
  const matteFoundation = byName("Base Matte Controle 24h");

  it("1. conflito estrito vence a média: fragrância para quem não quer fragrância", () => {
    const r = run(matteFoundation.ingredientsRaw, oilySensitiveNoFragrance, { attributes: matteFoundation.attributes });
    expect(r.verdict).toBe("conflict");
    expect(r.score).toBeLessThanOrEqual(40);
    expect(r.counts.conflict).toBe(1);
    expect(r.findings[0].kind).toBe("conflict");
    expect(r.headline).toContain("Fragrância");
  });

  it("2. o mesmo produto recebe notas diferentes para perfis diferentes", () => {
    const product = byName("Gel Hidratante Oil Control Niacinamida");
    const oily = run(product.ingredientsRaw, profile({ skinType: "oily", concerns: ["oiliness", "acne"] }), {
      attributes: product.attributes,
    });
    const dry = run(product.ingredientsRaw, profile({ skinType: "dry", concerns: ["dryness"] }), {
      attributes: product.attributes,
    });
    // As notas podem coincidir; os motivos não. Cada perfil precisa ver achados próprios.
    const codes = (r: typeof oily) => r.findings.map((f) => f.code).sort();
    expect(codes(oily)).not.toEqual(codes(dry));
    expect(codes(oily)).toContain("benefit_oil_control");
    expect(codes(dry)).toContain("benefit_hydration");

    const fragranced = run(matteFoundation.ingredientsRaw, oilySensitiveNoFragrance, { attributes: matteFoundation.attributes });
    const relaxed = run(matteFoundation.ingredientsRaw, dryNoRestrictions, { attributes: matteFoundation.attributes });
    expect(relaxed.score).toBeGreaterThan(fragranced.score);
  });

  it("4. álcool graxo não dispara a preferência 'sem álcool'", () => {
    const p = profile({ preferences: [{ key: "avoid_drying_alcohol", strictness: "strict" }] });
    const r = run("Aqua, Cetearyl Alcohol, Cetyl Alcohol, Glycerin", p);
    expect(r.verdict).not.toBe("conflict");
    const r2 = run("Aqua, Alcohol Denat., Glycerin", p);
    expect(r2.verdict).toBe("conflict");
  });

  it("5. muitos ingredientes desconhecidos ⇒ confiança baixa e sem veredito positivo/negativo", () => {
    const r = run("Aqua, Foo Bar Extract, Lorem Ipsum Oil, Dolor Sit Amet, Consectetur, Glycerin", dryNoRestrictions);
    expect(r.confidence).toBe("low");
    expect(r.partial).toBe(true);
    expect(r.verdict).toBe("insufficient");
    expect(r.headline).toContain("2 de 6");
  });

  it("5b. dados parciais não escondem um conflito estrito já identificado", () => {
    const r = run("Foo Bar Extract, Lorem Ipsum Oil, Dolor Sit Amet, Consectetur, Parfum", oilySensitiveNoFragrance);
    expect(r.partial).toBe(true);
    expect(r.verdict).toBe("conflict");
    expect(r.recommendation).toContain("cautela");
  });

  it("6. a soma das contribuições é igual à nota exibida", () => {
    for (const p of seedProducts) {
      for (const prof of [oilySensitiveNoFragrance, dryNoRestrictions, null]) {
        const r = run(p.ingredientsRaw, prof, { attributes: p.attributes });
        expect(sumContributions(r)).toBeCloseTo(r.score, 1);
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("analyze — comportamento do motor", () => {
  it("preferência 'prefiro evitar' penaliza sem bloquear", () => {
    const soft = profile({ preferences: [{ key: "avoid_fragrance", strictness: "soft" }] });
    const withFragrance = run("Aqua, Glycerin, Parfum", soft);
    const without = run("Aqua, Glycerin", soft);
    expect(withFragrance.verdict).not.toBe("conflict");
    expect(withFragrance.score).toBeLessThan(without.score);
  });

  it("lista pessoal resolve aliases: quem evita Parfum também evita 'Fragrance'", () => {
    const p = profile({ avoidIngredients: [{ ingredientId: "parfum", inciName: "Parfum", strictness: "strict" }] });
    expect(run("Aqua, Fragrance", p).verdict).toBe("conflict");
    expect(run("Aqua, Glycerin", p).findings.some((f) => f.code === "avoid_list_ok_ok")).toBe(true);
  });

  it("benefício no fim da lista vale menos e é explicado", () => {
    const p = profile({ concerns: ["oiliness"], skinType: "oily" });
    const top = run("Aqua, Niacinamide, Glycerin", p);
    const bottom = run(
      "Aqua, Glycerin, Squalane, Dimethicone, Carbomer, Xanthan Gum, Allantoin, Betaine, Sorbitol, Urea, Panthenol, Sodium PCA, Phenoxyethanol, Niacinamide",
      p,
    );
    expect(top.score).toBeGreaterThan(bottom.score);
    const f = bottom.findings.find((x) => x.code === "benefit_oil_control");
    expect(f?.message).toContain("baixa concentração");
  });

  it("vegano sem informação não penaliza, só informa", () => {
    const p = profile({ preferences: [{ key: "vegan", strictness: "soft" }] });
    const unknown = run("Aqua, Glycerin", p, { attributes: {} });
    const vegan = run("Aqua, Glycerin", p, { attributes: { vegan: true } });
    const notVegan = run("Aqua, Glycerin", p, { attributes: { vegan: false } });
    expect(unknown.score).toBe(vegan.score);
    expect(notVegan.score).toBeLessThan(vegan.score);
    expect(unknown.findings.find((f) => f.code === "pref_vegan")?.kind).toBe("info");
  });

  it("sem perfil: análise geral, sem linguagem 'para você'", () => {
    const r = run("Aqua, Glycerin, Niacinamide", null);
    expect(r.profileUsed).toBe(false);
    expect(r.verdictLabel).not.toContain("VOCÊ");
  });

  it("perfil sensível recebe aviso contextual e ponto de atenção sobre fragrância", () => {
    const r = run("Aqua, Glycerin, Parfum", profile({ sensitive: true }));
    expect(r.findings.some((f) => f.code === "sensitive_fragrance" && f.kind === "attention")).toBe(true);
    expect(r.disclaimers.length).toBeGreaterThan(1);
  });

  it("nunca usa linguagem alarmista", () => {
    for (const p of seedProducts) {
      const r = run(p.ingredientsRaw, oilySensitiveNoFragrance, { attributes: p.attributes });
      const text = JSON.stringify(r).toLowerCase();
      for (const word of ["tóxico", "toxico", "veneno", "cancerígeno", "cancerigeno", "perigoso"]) {
        expect(text).not.toContain(word);
      }
    }
  });

  it("é determinístico", () => {
    const p = byName("Creme Nutritivo Coco & Karité");
    const a = run(p.ingredientsRaw, oilySensitiveNoFragrance);
    const b = run(p.ingredientsRaw, oilySensitiveNoFragrance);
    expect(a).toEqual(b);
  });

  it("produto calmante sem fragrância é bem avaliado para pele sensível com vermelhidão", () => {
    const p = byName("Hidratante Calmante Centella");
    const r = run(p.ingredientsRaw, profile({ skinType: "combination", sensitive: true, concerns: ["redness"] }), {
      attributes: p.attributes,
    });
    expect(["excellent", "good"]).toContain(r.verdict);
  });
});
