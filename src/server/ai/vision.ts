import OpenAI from "openai";
import { logEvent } from "../log";

const VISION_MODEL = "gpt-4o";

let client: OpenAI | null = null;
const getClient = () =>
  (client ??= new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY }));

export const visionEnabled = () => Boolean(process.env.OPEN_AI_API_KEY);

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

export async function analyzeProductImage(
  base64Data: string,
  mimeType: SupportedMime
): Promise<ProductImageAnalysis> {
  if (!visionEnabled()) return EMPTY_ANALYSIS;

  const start = performance.now();
  try {
    const response = await getClient().chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Data}`, detail: "high" },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    const usage = response.usage;
    logEvent("vision.call", {
      model: response.model,
      stop: response.choices[0]?.finish_reason,
      input: usage?.prompt_tokens ?? 0,
      output: usage?.completion_tokens ?? 0,
      ms: Math.round(performance.now() - start),
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return EMPTY_ANALYSIS;

    const parsed = JSON.parse(jsonMatch[0]) as ProductImageAnalysis;
    return parsed;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 429) logEvent("vision.rate_limited", { ms: Math.round(performance.now() - start) });
    else logEvent("vision.error", { error: String(err) });
    return EMPTY_ANALYSIS;
  }
}
