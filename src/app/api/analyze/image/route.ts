import { analyzeProductImage, visionEnabled } from "@/server/ai/vision";
import { fillIngredientsFromWeb } from "@/server/services/ingredients-from-web";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { analyzeProductForUser, analyzeTextForUser } from "@/server/services/analysis";
import { attachIngredientsToProduct, upsertProductWithIngredients } from "@/server/services/catalog";
import { findProductByBarcode } from "@/server/services/lookup";
import { resolveFromVision } from "@/server/services/product-resolver";
import { requireUserId } from "@/server/session";
import { searchObfByName } from "@/server/sources/open-beauty-facts";
import { analyzeImageSchema } from "@/server/validation";

/** Garante que a fonte da câmera existe (bancos criados antes do seed atual podem não ter). */
async function ensureVisionSource() {
  await db.source.upsert({
    where: { key: "vision_ai" },
    update: {},
    create: { key: "vision_ai", name: "Identificação por IA (câmera)", trustLevel: 0.6 },
  });
}

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();

  if (!visionEnabled()) {
    return { status: "unavailable", error: "Identificação por foto não está disponível no momento." };
  }

  const body = analyzeImageSchema.parse(await req.json());

  if (body.imageData.length > 7_000_000) {
    return { status: "error", error: "Imagem muito grande. Use uma foto com menos de 5 MB." };
  }

  const vision = await analyzeProductImage(body.imageData, body.mimeType);

  // Imagem ilegível
  if (!vision.imageQuality.readable && vision.overallConfidence < 0.15) {
    return { status: "insufficient_image", issues: vision.imageQuality.issues, visionData: vision };
  }

  const ingredientsField = vision.ingredientsText;

  // 0. Leitura do verso de um produto já identificado: só procura a lista de ingredientes
  if (body.targetProductId) {
    const target = await db.product.findUnique({ where: { id: body.targetProductId }, select: { id: true } });
    if (!target) {
      return { status: "error", error: "Produto não encontrado. Comece a leitura de novo." };
    }
    if (!ingredientsField?.value || ingredientsField.confidence < 0.35) {
      return { status: "ingredients_not_visible", visionData: vision };
    }
    await ensureVisionSource();
    await attachIngredientsToProduct(target.id, ingredientsField.value, { sourceKey: "vision_ai" });
    const analysis = await analyzeProductForUser(target.id, userId);
    return { status: "analyzed", analysisId: analysis.id, source: "ingredients_back", visionData: vision };
  }

  // 1. Ingredientes visíveis na foto → análise direta
  if (ingredientsField?.value && ingredientsField.confidence >= 0.35) {
    const productName =
      [vision.brand?.value, vision.productName?.value].filter(Boolean).join(" ").trim() || undefined;
    const analysis = await analyzeTextForUser(ingredientsField.value, productName, userId);
    return { status: "analyzed", analysisId: analysis.id, source: "ingredients_ocr", visionData: vision };
  }

  // 2. Código de barras → catálogo local → Open Beauty Facts → web
  const barcodeRaw = vision.barcode?.value?.replace(/\s/g, "") ?? null;
  const barcodeConf = vision.barcode?.confidence ?? 0;
  if (barcodeRaw && /^\d{8,14}$/.test(barcodeRaw) && barcodeConf >= 0.6) {
    const found = await findProductByBarcode(barcodeRaw);
    if (found) {
      if (found.ingredientsRaw) {
        const analysis = await analyzeProductForUser(found.id, userId);
        return { status: "analyzed", analysisId: analysis.id, source: "barcode_obf", visionData: vision };
      }
      const fromWeb = await fillIngredientsFromWeb(found.id, userId);
      if (fromWeb) return { status: "analyzed", analysisId: fromWeb.id, source: "web_ai", visionData: vision };
      return {
        status: "no_ingredients",
        resolution: {
          status: "resolved",
          bestMatch: { productId: found.id, name: found.name, brand: found.brand?.name ?? null, hasIngredients: false },
          candidates: [],
          confidence: barcodeConf,
          evidence: ["Código de barras via Open Beauty Facts"],
        },
        visionData: vision,
      };
    }
  }

  // 3. Catálogo local
  const resolution = await resolveFromVision(vision);

  if (resolution.status === "resolved" && resolution.bestMatch?.hasIngredients) {
    const analysis = await analyzeProductForUser(resolution.bestMatch.productId, userId);
    return { status: "analyzed", analysisId: analysis.id, source: "catalog", visionData: vision, resolution };
  }

  if (resolution.status === "resolved" && resolution.bestMatch && !resolution.bestMatch.hasIngredients) {
    const fromWeb = await fillIngredientsFromWeb(resolution.bestMatch.productId, userId);
    if (fromWeb) return { status: "analyzed", analysisId: fromWeb.id, source: "web_ai", visionData: vision };
    return { status: "no_ingredients", resolution, visionData: vision };
  }

  if (resolution.status === "candidates") {
    return { status: "needs_confirmation", resolution, visionData: vision };
  }

  // 4. Produto novo → cadastra com os dados da IA; ingredientes do OBF (exato) ou da web (com fonte)
  // Só cadastra com o nome do produto legível — marca sozinha não identifica nada
  const aiBrand = vision.brand?.value?.trim() || null;
  const aiProductName = vision.productName?.value?.trim() || null;
  if (aiProductName) {
    const obfResult = aiBrand ? await searchObfByName(aiBrand, aiProductName) : null;

    await ensureVisionSource();
    const saved = await upsertProductWithIngredients({
      barcode: obfResult?.barcode ?? barcodeRaw,
      brandName: aiBrand ?? obfResult?.brandName ?? null,
      name: aiProductName,
      ingredientsRaw: obfResult?.ingredientsRaw ?? null,
      imageUrl: obfResult?.imageUrl ?? null,
      sourceKey: obfResult ? "openbeautyfacts" : "vision_ai",
      sourceUrl: obfResult?.sourceUrl ?? null,
      reviewStatus: "pending",
      attributes: {
        line: vision.line?.value ?? null,
        variant: vision.variant?.value ?? null,
        shade: vision.shade?.value ?? null,
        volume: vision.volume?.value ?? null,
        category: vision.category?.value ?? null,
        overallConfidence: vision.overallConfidence,
        imageQuality: vision.imageQuality,
      },
    });

    if (saved.ingredientsRaw) {
      const analysis = await analyzeProductForUser(saved.id, userId);
      return { status: "analyzed", analysisId: analysis.id, source: "openbeautyfacts", visionData: vision };
    }

    const fromWeb = await fillIngredientsFromWeb(saved.id, userId);
    if (fromWeb) return { status: "analyzed", analysisId: fromWeb.id, source: "web_ai", visionData: vision };

    // Sem ingredientes em nenhuma fonte → a tela pede para escanear o verso
    return {
      status: "no_ingredients",
      resolution: {
        status: "resolved",
        bestMatch: { productId: saved.id, name: saved.name, brand: aiBrand, hasIngredients: false },
        candidates: [],
        confidence: vision.overallConfidence,
        evidence: ["Identificado pela IA e salvo no catálogo para revisão"],
      },
      visionData: vision,
    };
  }

  return { status: "not_found", resolution, visionData: vision };
});
