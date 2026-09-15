import type { Concern, Preference, Profile, SkinType, Strictness } from "@/domain/types";
import { hashOf } from "@/domain/utils";
import { db } from "../db";
import type { ProfileInput } from "../validation";

export interface ProfileView {
  exists: boolean;
  consentAt: string | null;
  version: number;
  profile: Profile;
}

const EMPTY: Profile = { skinType: "unknown", sensitive: null, concerns: [], preferences: [], avoidIngredients: [] };

export async function getProfileView(userId: string | null): Promise<ProfileView> {
  if (!userId) return { exists: false, consentAt: null, version: 0, profile: EMPTY };
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true, avoidList: { include: { ingredient: true } } },
  });
  if (!user?.profile) return { exists: false, consentAt: null, version: 0, profile: EMPTY };
  const p = user.profile;
  return {
    exists: true,
    consentAt: user.consentAt?.toISOString() ?? null,
    version: p.version,
    profile: {
      skinType: p.skinType as SkinType,
      sensitive: p.sensitive,
      concerns: (p.concerns as Concern[]) ?? [],
      preferences: (p.preferences as unknown as Preference[]) ?? [],
      avoidIngredients: user.avoidList.map((a) => ({
        ingredientId: a.ingredientId,
        inciName: a.ingredient.displayNamePt,
        strictness: a.strictness as Strictness,
      })),
    },
  };
}

export async function getProfile(userId: string | null): Promise<Profile | null> {
  const view = await getProfileView(userId);
  return view.exists ? view.profile : null;
}

/** Hash do conteúdo do perfil (não do id): perfis iguais compartilham chave de cache. */
export function profileHash(profile: Profile | null): string {
  if (!profile) return "none";
  return hashOf({
    ...profile,
    concerns: [...profile.concerns].sort(),
    preferences: [...profile.preferences].sort((a, b) => a.key.localeCompare(b.key)),
    avoidIngredients: profile.avoidIngredients
      .map((a) => ({ id: a.ingredientId, s: a.strictness }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  });
}

export async function saveProfile(userId: string, input: ProfileInput) {
  const validIds = new Set(
    (
      await db.ingredient.findMany({
        where: { id: { in: input.avoidIngredients.map((a) => a.ingredientId) } },
        select: { id: true },
      })
    ).map((r) => r.id),
  );

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { consentAt: new Date() } }),
    db.userProfile.upsert({
      where: { userId },
      update: {
        skinType: input.skinType,
        sensitive: input.sensitive,
        concerns: input.concerns,
        preferences: input.preferences,
        version: { increment: 1 },
      },
      create: {
        userId,
        skinType: input.skinType,
        sensitive: input.sensitive,
        concerns: input.concerns,
        preferences: input.preferences,
      },
    }),
    db.userAvoidIngredient.deleteMany({ where: { userId } }),
    db.userAvoidIngredient.createMany({
      data: input.avoidIngredients
        .filter((a) => validIds.has(a.ingredientId))
        .map((a) => ({ userId, ingredientId: a.ingredientId, strictness: a.strictness })),
    }),
  ]);
  return getProfileView(userId);
}

/** LGPD: remove perfil, lista, histórico, favoritos e o próprio usuário anônimo. */
export async function deleteUserData(userId: string) {
  await db.user.deleteMany({ where: { id: userId } });
}
