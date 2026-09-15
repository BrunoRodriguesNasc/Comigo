import type { Metadata } from "next";
import { Scanner } from "@/components/scanner";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Analisar" };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Analisar"
        title="Qual produto você está olhando?"
        description="Aponte a câmera para o código de barras, digite os números ou cole a lista de ingredientes. A gente cuida do resto."
      />
      <Scanner profileJustCreated={perfil === "criado"} />
    </>
  );
}
