import type { Prisma } from "@prisma/client";
import { seedEvidence, seedIngredients } from "@/data/ingredients";
import { seedCategories, seedProducts } from "@/data/products";
import { defaultScoringConfig } from "@/domain/config/default-config";
import { normalizeName } from "@/domain/normalization/normalize";
import { slugify } from "@/domain/utils";
import { db } from "@/server/db";
import { invalidateIngredientIndex } from "@/server/ingredient-index";
import { upsertProductWithIngredients } from "@/server/services/catalog";

async function main() {
  console.log("→ Fontes");
  const sources = [
    { key: "demo", name: "Dados de demonstração (produto fictício)", trustLevel: 1, license: null, url: null },
    { key: "manual", name: "Cadastro manual (admin)", trustLevel: 0.95, license: null, url: null },
    {
      key: "openbeautyfacts",
      name: "Open Beauty Facts",
      trustLevel: 0.75,
      license: "ODbL",
      url: "https://world.openbeautyfacts.org",
    },
    { key: "user_submission", name: "Enviado por usuário", trustLevel: 0.7, license: null, url: null },
    { key: "bulk_import", name: "Importação em lote", trustLevel: 0.85, license: null, url: null },
  ];
  for (const s of sources) await db.source.upsert({ where: { key: s.key }, update: s, create: s });

  console.log("→ Categorias");
  for (const c of seedCategories) {
    const parent = c.parent ? await db.category.findUnique({ where: { slug: c.parent } }) : null;
    await db.category.upsert({
      where: { slug: c.slug },
      update: { namePt: c.namePt, parentId: parent?.id ?? null },
      create: { slug: c.slug, namePt: c.namePt, parentId: parent?.id ?? null },
    });
  }

  console.log(`→ Ingredientes (${seedIngredients.length})`);
  for (const s of seedIngredients) {
    const data = {
      inciName: s.inciName,
      slug: slugify(s.inciName),
      displayNamePt: s.displayNamePt,
      summaryPt: s.summaryPt,
      functions: s.functions,
      benefitTags: s.benefitTags,
      concerns: s.concerns as Prisma.InputJsonValue,
      flags: s.flags,
      evidenceLevel: s.evidenceLevel,
      reviewStatus: "draft",
    };
    const ing = await db.ingredient.upsert({ where: { inciName: s.inciName }, update: data, create: data });
    for (const a of s.aliases) {
      const normalized = normalizeName(a.alias);
      await db.ingredientAlias.upsert({
        where: { normalized },
        update: { alias: a.alias, ingredientId: ing.id, kind: a.kind ?? "synonym", locale: a.locale ?? null },
        create: { alias: a.alias, normalized, ingredientId: ing.id, kind: a.kind ?? "synonym", locale: a.locale ?? null },
      });
    }
  }

  console.log("→ Evidências");
  await db.ingredientEvidence.deleteMany();
  for (const e of seedEvidence) {
    const ing = await db.ingredient.findUnique({ where: { inciName: e.inciName } });
    if (!ing) continue;
    const { inciName: _unused, ...rest } = e;
    await db.ingredientEvidence.create({ data: { ...rest, ingredientId: ing.id } });
  }

  console.log("→ Configuração de pontuação");
  const existing = await db.scoringConfig.findFirst({ where: { version: 1 } });
  if (!existing) {
    await db.scoringConfig.create({
      data: {
        version: 1,
        active: true,
        config: defaultScoringConfig as unknown as Prisma.InputJsonValue,
        note: "Configuração inicial",
      },
    });
  }

  console.log(`→ Produtos de demonstração (${seedProducts.length})`);
  invalidateIngredientIndex();
  for (const p of seedProducts) {
    await upsertProductWithIngredients({
      barcode: p.barcode,
      brandName: p.brand,
      name: p.name,
      categorySlug: p.category,
      description: p.description,
      ingredientsRaw: p.ingredientsRaw,
      country: "BR",
      sourceKey: "demo",
      reviewStatus: "verified",
      attributes: p.attributes,
    });
  }

  console.log("✓ Seed concluído. Códigos de demonstração:");
  for (const p of seedProducts) console.log(`  ${p.barcode}  ${p.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
