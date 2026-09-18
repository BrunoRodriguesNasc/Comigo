import { z } from "zod";
import { CONCERNS, PREFERENCE_KEYS, SKIN_TYPES } from "@/domain/types";

const strictness = z.enum(["strict", "soft"]);

export const profileInputSchema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: "É preciso consentir para salvar o perfil." }) }),
  skinType: z.enum(SKIN_TYPES),
  sensitive: z.boolean().nullable(),
  concerns: z.array(z.enum(CONCERNS)).max(CONCERNS.length),
  preferences: z.array(z.object({ key: z.enum(PREFERENCE_KEYS), strictness })).max(PREFERENCE_KEYS.length),
  avoidIngredients: z.array(z.object({ ingredientId: z.string().min(1), strictness })).max(100),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

export const barcodeSchema = z.object({
  barcode: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, "Código de barras deve ter de 8 a 14 dígitos."),
});

export const analyzeTextSchema = z.object({
  ingredients: z.string().trim().min(3, "Cole a lista de ingredientes.").max(8000),
  name: z.string().trim().max(160).optional(),
});

export const submissionSchema = z.object({
  barcode: z.string().trim().regex(/^\d{8,14}$/).optional().or(z.literal("")),
  brandName: z.string().trim().max(120).optional(),
  productName: z.string().trim().min(2).max(160),
  ingredientsRaw: z.string().trim().min(3).max(8000),
});

export const compareSchema = z.object({
  analysisIds: z.array(z.string().min(1)).length(2),
});

export const askSchema = z.object({
  analysisId: z.string().min(1),
  question: z.string().trim().min(3).max(500),
});

export const analyzeImageSchema = z.object({
  imageData: z.string().min(1, "Imagem obrigatória."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"] as const),
});
