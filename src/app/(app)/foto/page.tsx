import type { Metadata } from "next";
import { ImageCapture } from "@/components/image-capture";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Fotografar produto" };

export default function FotoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Identificar por foto"
        title="Mostre o produto"
        description="Fotografe a frente, o verso ou a lista de ingredientes. A gente tenta identificar o produto e analisar para você."
      />
      <ImageCapture />
    </>
  );
}
