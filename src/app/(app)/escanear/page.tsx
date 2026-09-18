import type { Metadata } from "next";
import { ImageCapture } from "@/components/image-capture";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Analisar" };

export default function ScanPage() {
  return (
    <>
      <PageHeader
        eyebrow="Analisar"
        title="Mostre o produto"
        description="Fotografe a embalagem ou use a câmera ao vivo — a gente identifica o produto e analisa para a sua pele."
      />
      <ImageCapture />
    </>
  );
}
