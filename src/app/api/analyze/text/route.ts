import { route } from "@/server/http";
import { analyzeTextForUser } from "@/server/services/analysis";
import { requireUserId } from "@/server/session";
import { analyzeTextSchema } from "@/server/validation";

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const { ingredients, name } = analyzeTextSchema.parse(await req.json());
  const analysis = await analyzeTextForUser(ingredients, name, userId);
  return { status: "ok", analysisId: analysis.id };
});
