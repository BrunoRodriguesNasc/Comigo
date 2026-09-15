import { answerQuestion } from "@/server/ai/assistant";
import { route } from "@/server/http";
import { getAnalysisForUser } from "@/server/services/analysis";
import { HttpError, requireUserId } from "@/server/session";
import { askSchema } from "@/server/validation";

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const { analysisId, question } = askSchema.parse(await req.json());
  const analysis = await getAnalysisForUser(analysisId, userId);
  if (!analysis) throw new HttpError(404, "Análise não encontrada.");
  return answerQuestion(analysis.result, question);
});
