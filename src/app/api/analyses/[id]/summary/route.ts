import { summarizeAnalysis } from "@/server/ai/assistant";
import { db } from "@/server/db";
import { route } from "@/server/http";
import { getAnalysisForUser } from "@/server/services/analysis";
import { HttpError, requireUserId } from "@/server/session";

export const POST = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const userId = await requireUserId();
  const analysis = await getAnalysisForUser(id, userId);
  if (!analysis) throw new HttpError(404, "Análise não encontrada.");
  if (analysis.aiSummary) return { text: analysis.aiSummary, source: "ai" };

  const reply = await summarizeAnalysis(analysis.result);
  if (reply.source === "ai") await db.analysis.update({ where: { id }, data: { aiSummary: reply.text } });
  return reply;
});
