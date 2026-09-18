import { db } from "../db";
import type { ProductImageAnalysis } from "../ai/vision";

export interface ProductCandidate {
  productId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  matchScore: number;
  hasIngredients: boolean;
}

export interface ProductResolution {
  status: "resolved" | "candidates" | "not_found";
  bestMatch?: ProductCandidate;
  candidates: ProductCandidate[];
  confidence: number;
  evidence: string[];
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlap(a: string, b: string): number {
  const wa = new Set(normalizeForMatch(a).split(" ").filter((w) => w.length > 2));
  const wb = new Set(normalizeForMatch(b).split(" ").filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return 0;
  let matches = 0;
  for (const w of wa) if (wb.has(w)) matches++;
  return matches / Math.max(wa.size, wb.size);
}

export async function resolveFromVision(analysis: ProductImageAnalysis): Promise<ProductResolution> {
  const brandValue = analysis.brand?.value?.trim() || null;
  const nameValue = analysis.productName?.value?.trim() || null;
  const barcodeRaw = analysis.barcode?.value?.replace(/\s/g, "") || null;
  const barcodeConfidence = analysis.barcode?.confidence ?? 0;

  // 1. Barcode (mais confiável)
  if (barcodeRaw && /^\d{8,14}$/.test(barcodeRaw) && barcodeConfidence >= 0.7) {
    const product = await db.product.findUnique({
      where: { barcode: barcodeRaw },
      include: { brand: true },
    });
    if (product) {
      const candidate: ProductCandidate = {
        productId: product.id,
        name: product.name,
        brand: product.brand?.name ?? null,
        barcode: product.barcode,
        matchScore: 1,
        hasIngredients: Boolean(product.ingredientsRaw),
      };
      return {
        status: "resolved",
        bestMatch: candidate,
        candidates: [candidate],
        confidence: 1,
        evidence: ["Código de barras encontrado no catálogo"],
      };
    }
  }

  if (!nameValue) {
    return { status: "not_found", candidates: [], confidence: 0, evidence: [] };
  }

  // 2. Busca por marca + nome
  const products = await db.product.findMany({
    where: {
      reviewStatus: { not: "rejected" },
      ...(brandValue
        ? {
            OR: [
              { brand: { name: { contains: brandValue.slice(0, 30) } } },
              { name: { contains: nameValue.slice(0, 30) } },
            ],
          }
        : { name: { contains: nameValue.slice(0, 30) } }),
    },
    include: { brand: true },
    take: 60,
  });

  const evidence: string[] = [];
  const scored: ProductCandidate[] = products
    .map((p) => {
      const nameSim = wordOverlap(p.name, nameValue);
      const brandSim = brandValue && p.brand ? wordOverlap(p.brand.name, brandValue) : 0.5;
      const matchScore = nameSim * 0.65 + brandSim * 0.35;
      return {
        productId: p.id,
        name: p.name,
        brand: p.brand?.name ?? null,
        barcode: p.barcode,
        matchScore,
        hasIngredients: Boolean(p.ingredientsRaw),
      };
    })
    .filter((c) => c.matchScore > 0.25)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  if (!scored.length) {
    return { status: "not_found", candidates: [], confidence: 0, evidence: ["Nenhum candidato encontrado no catálogo"] };
  }

  const best = scored[0];

  if (best.matchScore >= 0.8) {
    if (brandValue) evidence.push("Marca correspondeu");
    evidence.push("Nome do produto correspondeu");
    return { status: "resolved", bestMatch: best, candidates: scored, confidence: best.matchScore, evidence };
  }

  if (best.matchScore >= 0.45) {
    evidence.push("Candidatos encontrados — confirmação necessária");
    return { status: "candidates", bestMatch: best, candidates: scored, confidence: best.matchScore, evidence };
  }

  return { status: "not_found", candidates: scored, confidence: best.matchScore, evidence: ["Correspondência insuficiente"] };
}
