import { redirect } from "next/navigation";
import { analyzeProductForUser } from "@/server/services/analysis";
import { findProductByBarcode } from "@/server/services/lookup";
import { requireUserId } from "@/server/session";

export const dynamic = "force-dynamic";

/** Link direto para um código de barras: busca, analisa para o usuário e redireciona para o resultado. */
export default async function BarcodePage({ params }: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await params;
  if (!/^\d{8,14}$/.test(barcode)) redirect("/escanear");

  const userId = await requireUserId();
  const product = await findProductByBarcode(barcode);
  if (!product) redirect(`/colar?codigo=${barcode}&motivo=nao-encontrado`);
  if (!product.ingredientsRaw) {
    redirect(`/colar?codigo=${barcode}&motivo=sem-ingredientes&nome=${encodeURIComponent(product.name)}`);
  }

  const analysis = await analyzeProductForUser(product.id, userId);
  redirect(`/analise/${analysis.id}`);
}
