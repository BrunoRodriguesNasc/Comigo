import { AppShell } from "@/components/app-shell";
import { Scanner } from "@/components/scanner";

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  return (
    <AppShell>
      <Scanner profileJustCreated={perfil === "criado"} />
    </AppShell>
  );
}
