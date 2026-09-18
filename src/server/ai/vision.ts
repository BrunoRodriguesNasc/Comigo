import Anthropic from "@anthropic-ai/sdk";
import { logEvent } from "../log";

const MODEL = process.env.AI_MODEL || "claude-opus-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export const visionEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

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

const SYSTEM_PROMPT = `Você é um sistema de extração de dados de embalagens cosméticas.

REGRAS ABSOLUTAS:
1. Extraia APENAS o que está CLARAMENTE VISÍVEL na imagem. Nunca invente, complete nem suponha.
2. Se um campo não estiver legível, retorne "value": null, "confidence": 0.
3. Confidence reflete certeza real: 0.95+ = texto nítido e completo; 0.70–0.94 = visível mas parcial; <0.70 = incerto.
4. Para ingredientsText: copie o texto exatamente como aparece na embalagem, preservando ortografia e separadores (vírgula, ponto-e-vírgula).
5. Responda SOMENTE com JSON válido, sem explicação adicional.`;

const USER_PROMPT = `Analise esta embalagem cosmética e extraia as informações visíveis.

Responda SOMENTE com o seguinte JSON (sem texto antes ou depois):

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

export async function analyzeProductImage(base64Data: string, mimeType: SupportedMime): Promise<ProductImageAnalysis> {
  if (!visionEnabled()) return EMPTY_ANALYSIS;

  const start = performance.now();
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64Data },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    logEvent("vision.call", {
      model: response.model,
      stop: response.stop_reason,
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      ms: Math.round(performance.now() - start),
    });

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return EMPTY_ANALYSIS;

    const parsed = JSON.parse(jsonMatch[0]) as ProductImageAnalysis;
    return parsed;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) logEvent("vision.rate_limited", { ms: Math.round(performance.now() - start) });
    else if (err instanceof Anthropic.APIError) logEvent("vision.api_error", { status: err.status, error: err.message });
    else logEvent("vision.error", { error: String(err) });
    return EMPTY_ANALYSIS;
  }
}
