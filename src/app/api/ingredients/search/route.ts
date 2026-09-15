import { normalizeName } from "@/domain/normalization/normalize";
import { db } from "@/server/db";
import { route } from "@/server/http";

export const GET = route(async (req: Request) => {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return { results: [] };
  const n = normalizeName(q);

  const [byName, byAlias] = await Promise.all([
    db.ingredient.findMany({
      where: { OR: [{ inciName: { contains: q } }, { displayNamePt: { contains: q } }, { slug: { contains: n.replace(/\s+/g, "-") } }] },
      take: 10,
    }),
    db.ingredientAlias.findMany({ where: { normalized: { contains: n } }, include: { ingredient: true }, take: 10 }),
  ]);

  const seen = new Map<string, { id: string; inciName: string; displayNamePt: string; matchedAlias: string | null }>();
  for (const i of byName) seen.set(i.id, { id: i.id, inciName: i.inciName, displayNamePt: i.displayNamePt, matchedAlias: null });
  for (const a of byAlias) {
    if (!seen.has(a.ingredientId)) {
      seen.set(a.ingredientId, {
        id: a.ingredient.id,
        inciName: a.ingredient.inciName,
        displayNamePt: a.ingredient.displayNamePt,
        matchedAlias: a.alias,
      });
    }
  }
  return { results: [...seen.values()].slice(0, 12) };
});
