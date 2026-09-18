import type { Metadata } from "next";
import Link from "next/link";
import { Scanner } from "@/components/scanner";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Analisar" };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  const visionEnabled = process.env.ANTHROPIC_API_KEY && process.env.ENABLE_VISION !== "false";

  return (
    <>
      <PageHeader
        eyebrow="Analisar"
        title="Qual produto você está olhando?"
        description="Aponte a câmera para o código de barras, tire uma foto do produto ou cole a lista de ingredientes."
      />

      {visionEnabled && (
        <div className="mb-8">
          <Link
            href="/foto"
            className="group flex items-center gap-4 border border-ink bg-surface px-6 py-5 transition-colors hover:bg-powder"
          >
            <span className="text-2xl" aria-hidden>📷</span>
            <div className="min-w-0">
              <p className="text-base group-hover:underline group-hover:underline-offset-4">
                Fotografar o produto
              </p>
              <p className="text-sm text-muted">Frente, verso ou lista de ingredientes</p>
            </div>
          </Link>
        </div>
      )}

      <Scanner profileJustCreated={perfil === "criado"} />
    </>
  );
}
