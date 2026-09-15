import type { Metadata } from "next";
import { PasteForm } from "@/components/paste-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Colar ingredientes" };

export default async function PastePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; motivo?: string; nome?: string }>;
}) {
  const { codigo, motivo, nome } = await searchParams;
  return (
    <>
      <PageHeader
        back={{ href: "/escanear", label: "Analisar produto" }}
        title="Colar ingredientes"
        description="Para produtos sem código ou que ainda não estão no catálogo."
      />
      <PasteForm
        barcode={codigo && /^\d{8,14}$/.test(codigo) ? codigo : null}
        reason={motivo === "nao-encontrado" || motivo === "sem-ingredientes" ? motivo : null}
        productName={nome ?? ""}
      />
    </>
  );
}
