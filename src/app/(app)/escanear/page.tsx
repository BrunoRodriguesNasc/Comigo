import type { Metadata } from "next";
import { Scanner } from "@/components/scanner";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Analisar produto" };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  return (
    <>
      <PageHeader title="Analisar produto" description="Aponte a câmera para o código de barras, digite o código ou cole a lista de ingredientes." />
      <Scanner profileJustCreated={perfil === "criado"} />
    </>
  );
}
