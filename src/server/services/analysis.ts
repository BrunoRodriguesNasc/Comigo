import type { Brand, Category, Prisma, Product, Source } from "@prisma/client";
import { analyze, ENGINE_VERSION } from "@/domain/analyze";
import { normalizeIngredientList } from "@/domain/normalization/normalize";
import type { AnalysisResult, Profile, ProductAttributes, ProductInput } from "@/domain/types";
import { hashOf } from "@/domain/utils";
import { db } from "../db";
import { loadIngredientIndex } from "../ingredient-index";
import { logEvent } from "../log";
import { getActiveConfig } from "../scoring-config";
import { HttpError } from "../session";
import { recordUnmatched } from "./catalog";
import { getProfile, profileHash } from "./profile";

type ProductRow = Product & { brand: Brand | null; category: Category | null; source: Source };

const REVIEW_FACTOR: Record<string, number> = { verified: 1, pending: 0.9, rejected: 0.5 };

export function productInput(p: ProductRow): ProductInput {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand?.name ?? null,
    category: p.category?.slug ?? null,
    attributes: (p.attributes as ProductAttributes) ?? {},
    dataReliability: p.source.trustLevel * (REVIEW_FACTOR[p.reviewStatus] ?? 0.9),
    sourceLabel: p.source.name + (p.reviewStatus === "verified" ? "" : " · aguardando revisão"),
  };
}

async function engineContext() {
  const [{ index, stamp }, active] = await Promise.all([loadIngredientIndex(), getActiveConfig()]);
  return { index, config: active.config, rulesetHash: hashOf([active.hash, stamp, ENGINE_VERSION]) };
}

export interface StoredAnalysis {
  id: string;
  createdAt: string;
  productId: string | null;
  barcode: string | null;
  result: AnalysisResult;
  aiSummary: string | null;
  profileHash: string;
}

function toStored(row: {
  id: string;
  createdAt: Date;
  productId: string | null;
  result: Prisma.JsonValue;
  aiSummary: string | null;
  profileHash: string;
  product?: { barcode: string | null } | null;
}): StoredAnalysis {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    productId: row.productId,
    barcode: row.product?.barcode ?? null,
    result: row.result as unknown as AnalysisResult,
    aiSummary: row.aiSummary,
    profileHash: row.profileHash,
  };
}

/** Roda o motor para um produto em memória (sem persistir). Usado por alternativas. */
export async function computeForProduct(product: ProductRow, profile: Profile | null, ctx?: Awaited<ReturnType<typeof engineContext>>) {
  const { index, config } = ctx ?? (await engineContext());
  return analyze({
    product: productInput(product),
    ingredients: normalizeIngredientList(product.ingredientsRaw ?? "", index),
    index,
    profile,
    config,
  });
}

/**
 * Análise de produto do catálogo para o usuário, com cache:
 * mesmo produto (mesma versão) + mesmo perfil + mesmas regras/base = reutiliza o resultado.
 */
export async function analyzeProductForUser(productId: string, userId: string): Promise<StoredAnalysis> {
  const start = performance.now();
  const product = await db.product.findUnique({ where: { id: productId }, include: { brand: true, category: true, source: true } });
  if (!product) throw new HttpError(404, "Produto não encontrado.");
  if (!product.ingredientsRaw) throw new HttpError(422, "Este produto ainda não tem lista de ingredientes.");

  const profile = await getProfile(userId);
  const ctx = await engineContext();
  const pHash = profileHash(profile);
  const productStamp = product.updatedAt.toISOString();

  const cached = await db.analysis.findFirst({
    where: { userId, productId, profileHash: pHash, rulesetHash: ctx.rulesetHash, productStamp, engineVersion: ENGINE_VERSION },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    // Reaparece no topo do histórico.
    const touched = await db.analysis.update({ where: { id: cached.id }, data: { createdAt: new Date() }, include: { product: true } });
    logEvent("analysis.cache_hit", { productId, ms: Math.round(performance.now() - start) });
    return toStored(touched);
  }

  const result = await computeForProduct(product, profile, ctx);
  const row = await db.analysis.create({
    data: {
      userId,
      productId,
      engineVersion: ENGINE_VERSION,
      rulesetHash: ctx.rulesetHash,
      profileHash: pHash,
      productStamp,
      score: result.score,
      verdict: result.verdict,
      confidence: result.confidence,
      result: result as unknown as Prisma.InputJsonValue,
    },
    include: { product: true },
  });
  logEvent("analysis.created", {
    productId,
    score: result.score,
    verdict: result.verdict,
    confidence: result.confidence,
    coverage: result.coverage,
    ms: Math.round(performance.now() - start),
  });
  return toStored(row);
}

/** Análise de uma lista colada pelo usuário (produto fora do catálogo). */
export async function analyzeTextForUser(raw: string, name: string | undefined, userId: string): Promise<StoredAnalysis> {
  const profile = await getProfile(userId);
  const ctx = await engineContext();
  const ingredients = normalizeIngredientList(raw, ctx.index);
  const result = analyze({
    product: {
      id: null,
      name: name?.trim() || "Produto sem cadastro",
      brand: null,
      category: null,
      attributes: {},
      dataReliability: 0.9,
      sourceLabel: "Lista de ingredientes informada por você",
    },
    ingredients,
    index: ctx.index,
    profile,
    config: ctx.config,
  });
  await recordUnmatched(ingredients);
  const row = await db.analysis.create({
    data: {
      userId,
      inputRaw: raw,
      engineVersion: ENGINE_VERSION,
      rulesetHash: ctx.rulesetHash,
      profileHash: profileHash(profile),
      productStamp: "text",
      score: result.score,
      verdict: result.verdict,
      confidence: result.confidence,
      result: result as unknown as Prisma.InputJsonValue,
    },
  });
  logEvent("analysis.created", { productId: null, score: result.score, verdict: result.verdict, coverage: result.coverage });
  return toStored(row);
}

export async function getAnalysisForUser(id: string, userId: string | null): Promise<StoredAnalysis | null> {
  if (!userId) return null;
  const row = await db.analysis.findFirst({ where: { id, userId }, include: { product: true } });
  return row ? toStored(row) : null;
}

export async function listHistory(userId: string | null, take = 100) {
  if (!userId) return [];
  const rows = await db.analysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: take * 3,
    select: { id: true, createdAt: true, score: true, verdict: true, confidence: true, productId: true, result: true },
  });
  // Análises antigas do mesmo produto (perfil ou regras anteriores) ficam guardadas para auditoria,
  // mas o histórico mostra só a mais recente de cada produto.
  const seen = new Set<string>();
  const latest = rows.filter((r) => {
    if (!r.productId) return true;
    if (seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  });
  return latest.slice(0, take).map((r) => {
    const res = r.result as unknown as AnalysisResult;
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      score: r.score,
      verdict: r.verdict as AnalysisResult["verdict"],
      partial: res.partial,
      productId: r.productId,
      productName: res.product.name,
      brand: res.product.brand,
    };
  });
}

export async function alternativesFor(productId: string, userId: string, currentScore: number, limit = 3) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product?.categoryId) return [];
  const [profile, ctx] = await Promise.all([getProfile(userId), engineContext()]);
  const candidates = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      ingredientsRaw: { not: null },
      reviewStatus: { not: "rejected" },
    },
    include: { brand: true, category: true, source: true },
    take: 60,
  });
  const scored = await Promise.all(
    candidates.map(async (c) => ({ product: c, result: await computeForProduct(c, profile, ctx) })),
  );
  return scored
    .filter((s) => s.result.verdict !== "conflict" && !s.result.partial && s.result.score > currentScore)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, limit)
    .map((s) => ({
      productId: s.product.id,
      barcode: s.product.barcode,
      name: s.product.name,
      brand: s.product.brand?.name ?? null,
      score: s.result.score,
      verdict: s.result.verdict,
      verdictLabel: s.result.verdictLabel,
      highlights: s.result.findings.filter((f) => f.kind === "positive").slice(0, 2).map((f) => f.title),
    }));
}
