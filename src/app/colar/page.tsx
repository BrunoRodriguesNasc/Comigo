import { AppShell } from "@/components/app-shell";
import { PasteForm } from "@/components/paste-form";

export default async function PastePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; motivo?: string; nome?: string }>;
}) {
  const { codigo, motivo, nome } = await searchParams;
  return (
    <AppShell>
      <PasteForm
        barcode={codigo && /^\d{8,14}$/.test(codigo) ? codigo : null}
        reason={motivo === "nao-encontrado" || motivo === "sem-ingredientes" ? motivo : null}
        productName={nome ?? ""}
      />
    </AppShell>
  );
}
