import { analyzeProductImage, visionEnabled } from "@/server/ai/vision";
import { route } from "@/server/http";
import { analyzeProductForUser, analyzeTextForUser } from "@/server/services/analysis";
import { findProductByBarcode } from "@/server/services/lookup";
import { resolveFromVision } from "@/server/services/product-resolver";
import { requireUserId } from "@/server/session";
import { analyzeImageSchema } from "@/server/validation";

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();

  if (!visionEnabled()) {
    return { status: "unavailable", error: "Identificação por foto não está disponível no momento." };
  }

  const body = analyzeImageSchema.parse(await req.json());

  // Limite de tamanho: ~5 MB em base64 ≈ 6.7 MB de string
  if (body.imageData.length > 7_000_000) {
    return { status: "error", error: "Imagem muito grande. Use uma foto com menos de 5 MB." };
  }

  const vision = await analyzeProductImage(body.imageData, body.mimeType);

  // Imagem ilegível
  if (!vision.imageQuality.readable && vision.overallConfidence < 0.15) {
    return { status: "insufficient_image", issues: vision.imageQuality.issues, visionData: vision };
  }

  // Ingredientes visíveis na foto → análise direta (mais confiável)
  const ingredientsField = vision.ingredientsText;
  if (ingredientsField?.value && ingredientsField.confidence >= 0.55) {
    const productName =
      [vision.brand?.value, vision.productName?.value].filter(Boolean).join(" ").trim() || undefined;
    const analysis = await analyzeTextForUser(ingredientsField.value, productName, userId);
    return {
      status: "analyzed",
      analysisId: analysis.id,
      source: "ingredients_ocr",
      visionData: vision,
    };
  }

  // Fallback via código de barras extraído → Open Beauty Facts (persiste no catálogo)
  const barcodeRaw = vision.barcode?.value?.replace(/\s/g, "") ?? null;
  const barcodeConf = vision.barcode?.confidence ?? 0;
  if (barcodeRaw && /^\d{8,14}$/.test(barcodeRaw) && barcodeConf >= 0.6) {
    const found = await findProductByBarcode(barcodeRaw);
    if (found) {
      if (found.ingredientsRaw) {
        const analysis = await analyzeProductForUser(found.id, userId);
        return { status: "analyzed", analysisId: analysis.id, source: "barcode_obf", visionData: vision };
      }
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

  // Tentar resolver produto no catálogo
  const resolution = await resolveFromVision(vision);

  if (resolution.status === "resolved" && resolution.bestMatch?.hasIngredients) {
    const analysis = await analyzeProductForUser(resolution.bestMatch.productId, userId);
    return {
      status: "analyzed",
      analysisId: analysis.id,
      source: "catalog",
      visionData: vision,
      resolution,
    };
  }

  // Produto sem ingredientes mas identificado → redirecionar para submissão
  if (resolution.status === "resolved" && resolution.bestMatch && !resolution.bestMatch.hasIngredients) {
    return {
      status: "no_ingredients",
      resolution,
      visionData: vision,
    };
  }

  // Candidatos → pedir confirmação do usuário
  if (resolution.status === "candidates") {
    return {
      status: "needs_confirmation",
      resolution,
      visionData: vision,
    };
  }

  // Produto não encontrado no catálogo
  return {
    status: "not_found",
    resolution,
    visionData: vision,
  };
});
