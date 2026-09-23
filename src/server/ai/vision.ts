import { GoogleGenerativeAI } from "@google/generative-ai";
import { logEvent } from "../log";

const VISION_MODEL = "gemini-3.6-flash";

let client: GoogleGenerativeAI | null = null;
const getClient = () =>
  (client ??= new GoogleGenerativeAI(process.env.GEMINI_API_KEY!));

export const visionEnabled = () => Boolean(process.env.GEMINI_API_KEY);

export interface ExtractedField {
  value: string | null;
  confidence: number;
  evidence: string;
}

export interface ProductImageAnalysis {
  brand?: ExtractedField;
  productName?: ExtractedField;
  line?: ExtractedField;
  variant?: ExtractedField;
  shade?: ExtractedField;
  category?: ExtractedField;
  volume?: ExtractedField;
  barcode?: ExtractedField;
  ingredientsText?: ExtractedField;
  overallConfidence: number;
  imageQuality: {
    readable: boolean;
    issues: string[];
  };
}

export type SupportedMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const PROMPT = `Você é um sistema de extração de dados de embalagens cosméticas.

REGRAS ABSOLUTAS:
1. Extraia APENAS o que está CLARAMENTE VISÍVEL na imagem. Nunca invente, complete nem suponha.
2. Se um campo não estiver legível, retorne "value": null, "confidence": 0.
3. Confidence reflete certeza real: 0.95+ = texto nítido e completo; 0.70–0.94 = visível mas parcial; <0.70 = incerto.
4. Para ingredientsText: copie o texto exatamente como aparece na embalagem, preservando ortografia e separadores.
5. Responda SOMENTE com JSON válido, sem texto antes ou depois.

Analise esta embalagem cosmética e retorne SOMENTE este JSON:

{
  "brand": { "value": null, "confidence": 0, "evidence": "" },
  "productName": { "value": null, "confidence": 0, "evidence": "" },
  "line": { "value": null, "confidence": 0, "evidence": "" },
  "variant": { "value": null, "confidence": 0, "evidence": "" },
  "shade": { "value": null, "confidence": 0, "evidence": "" },
  "category": { "value": null, "confidence": 0, "evidence": "" },
  "volume": { "value": null, "confidence": 0, "evidence": "" },
  "barcode": { "value": null, "confidence": 0, "evidence": "" },
  "ingredientsText": { "value": null, "confidence": 0, "evidence": "" },
  "overallConfidence": 0,
  "imageQuality": { "readable": false, "issues": [] }
}`;

const EMPTY_ANALYSIS: ProductImageAnalysis = {
  overallConfidence: 0,
  imageQuality: { readable: false, issues: ["IA de visão indisponível"] },
};

export async function analyzeProductImage(
  base64Data: string,
  mimeType: SupportedMime
): Promise<ProductImageAnalysis> {
  if (!visionEnabled()) return EMPTY_ANALYSIS;

  const start = performance.now();
  try {
    const model = getClient().getGenerativeModel({ model: VISION_MODEL });
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      PROMPT,
    ]);

    const text = result.response.text().trim();
    const usage = result.response.usageMetadata;

    logEvent("vision.call", {
      model: VISION_MODEL,
      input: usage?.promptTokenCount ?? 0,
      output: usage?.candidatesTokenCount ?? 0,
      ms: Math.round(performance.now() - start),
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return EMPTY_ANALYSIS;

    return JSON.parse(jsonMatch[0]) as ProductImageAnalysis;
  } catch (err) {
    const msg = String(err);
    const isQuota = msg.includes("429") || msg.includes("quota");
    const isOverloaded = msg.includes("503") || msg.includes("high demand");
    logEvent("vision.error", { error: msg, quota: isQuota, overloaded: isOverloaded });
    // A foto pode estar ótima: o problema é do serviço. Não culpe a imagem do usuário.
    if (isQuota || isOverloaded) {
      const issue = isQuota
        ? "Limite diário da IA atingido. Tente novamente amanhã ou cole os ingredientes manualmente."
        : "A IA está sobrecarregada no momento. Tente de novo em instantes.";
      return { overallConfidence: 0, imageQuality: { readable: false, issues: [issue] } };
    }
    return EMPTY_ANALYSIS;
  }
}
