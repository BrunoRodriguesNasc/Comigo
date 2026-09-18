"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button, ButtonLink } from "./ui";

type SupportedMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const ACCEPTED_TYPES: SupportedMime[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; previewUrl: string }
  | { kind: "analyzing"; step: string }
  | { kind: "needs_confirmation"; candidates: Candidate[]; visionSummary: string }
  | { kind: "no_ingredients"; productName: string; productId: string }
  | { kind: "not_found"; extractedName: string | null }
  | { kind: "insufficient_image"; issues: string[] }
  | { kind: "error"; message: string };

interface Candidate {
  productId: string;
  name: string;
  brand: string | null;
  hasIngredients: boolean;
}

const STEPS = [
  "Olhando o seu produto...",
  "Lendo as informações da embalagem...",
  "Procurando no catálogo...",
  "Quase lá...",
];

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:image/xxx;base64,"
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageCapture() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type as SupportedMime)) {
      setPhase({ kind: "error", message: "Formato não aceito. Use JPG, PNG ou WebP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase({ kind: "error", message: "Foto muito grande. Use uma imagem com menos de 5 MB." });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPhase({ kind: "preview", file, previewUrl });
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const analyze = useCallback(async () => {
    if (phase.kind !== "preview") return;
    const { file } = phase;

    let stepIdx = 0;
    setPhase({ kind: "analyzing", step: STEPS[0] });

    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1);
      setPhase((p) => (p.kind === "analyzing" ? { kind: "analyzing", step: STEPS[stepIdx] } : p));
    }, 2200);

    try {
      const [imageData] = await Promise.all([toBase64(file)]);

      const res = await fetch("/api/analyze/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, mimeType: file.type }),
      });

      clearInterval(stepTimer);
      const data = (await res.json()) as {
        status: string;
        analysisId?: string;
        resolution?: { candidates: Candidate[]; bestMatch?: Candidate };
        visionData?: { productName?: { value?: string }; brand?: { value?: string } };
        issues?: string[];
        error?: string;
      };

      if (!res.ok || data.status === "error") {
        setPhase({ kind: "error", message: data.error ?? "Erro inesperado. Tente novamente." });
        return;
      }

      if (data.status === "analyzed" && data.analysisId) {
        router.push(`/analise/${data.analysisId}`);
        return;
      }

      if (data.status === "needs_confirmation" && data.resolution) {
        const name = [data.visionData?.brand?.value, data.visionData?.productName?.value]
          .filter(Boolean)
          .join(" ")
          .trim();
        setPhase({
          kind: "needs_confirmation",
          candidates: data.resolution.candidates,
          visionSummary: name || "produto identificado",
        });
        return;
      }

      if (data.status === "no_ingredients" && data.resolution?.bestMatch) {
        const best = data.resolution.bestMatch;
        setPhase({ kind: "no_ingredients", productName: best.name, productId: best.productId });
        return;
      }

      if (data.status === "insufficient_image") {
        setPhase({ kind: "insufficient_image", issues: data.issues ?? [] });
        return;
      }

      if (data.status === "unavailable") {
        setPhase({ kind: "error", message: data.error ?? "Recurso indisponível." });
        return;
      }

      // not_found
      const name = [data.visionData?.brand?.value, data.visionData?.productName?.value]
        .filter(Boolean)
        .join(" ")
        .trim();
      setPhase({ kind: "not_found", extractedName: name || null });
    } catch {
      clearInterval(stepTimer);
      setPhase({ kind: "error", message: "Não foi possível enviar a foto. Verifique sua conexão." });
    }
  }, [phase, router]);

  const reset = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    setPhase({ kind: "idle" });
  }, []);

  // --- Telas ---

  if (phase.kind === "idle") {
    return (
      <div className="mt-8">
        <label className="group block cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={onInputChange}
          />
          <div className="flex flex-col items-center gap-6 border border-ink bg-surface px-8 py-16 text-center transition-colors group-hover:bg-powder">
            <span className="text-[48px] leading-none" aria-hidden>
              📷
            </span>
            <div>
              <p className="text-[22px]">Fotografe o produto</p>
              <p className="mt-2 text-sm text-muted">Frente, verso ou lista de ingredientes</p>
            </div>
            <span className="mt-2 inline-block rounded-full bg-accent px-8 py-3 text-sm text-ink">
              Escolher foto
            </span>
          </div>
        </label>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted">
          <ButtonLink href="/colar" variant="ghost">
            Colar ingredientes
          </ButtonLink>
          <ButtonLink href="/escanear" variant="ghost">
            Código de barras
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (phase.kind === "preview") {
    return (
      <div className="mt-8">
        <div className="relative border border-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={phase.previewUrl}
            alt="Foto selecionada"
            className="max-h-[420px] w-full object-contain bg-powder"
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={analyze} className="px-8">
            Analisar esta foto
          </Button>
          <Button variant="secondary" onClick={reset}>
            Trocar foto
          </Button>
        </div>
      </div>
    );
  }

  if (phase.kind === "analyzing") {
    return (
      <div className="mt-8 flex flex-col items-center gap-6 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-powder border-t-ink" />
        <p className="text-base text-muted">{phase.step}</p>
      </div>
    );
  }

  if (phase.kind === "needs_confirmation") {
    return (
      <div className="mt-8">
        <p className="text-sm text-muted">Encontramos estes produtos. Qual é o seu?</p>
        <ul className="mt-4 divide-y divide-powder border-t border-ink">
          {phase.candidates.map((c) => (
            <li key={c.productId}>
              <button
                onClick={() => {
                  if (c.hasIngredients) {
                    router.push(`/analise?produto=${c.productId}`);
                  } else {
                    setPhase({ kind: "no_ingredients", productName: c.name, productId: c.productId });
                  }
                }}
                className="group w-full py-4 text-left"
              >
                <p className="text-base group-hover:underline group-hover:underline-offset-4">
                  {c.brand ? `${c.brand} · ` : ""}{c.name}
                </p>
                {!c.hasIngredients && (
                  <p className="mt-0.5 text-xs text-muted">Sem ingredientes cadastrados</p>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button variant="secondary" onClick={reset}>
            Nenhum desses — tirar outra foto
          </Button>
          <ButtonLink href="/colar" variant="ghost">
            Colar ingredientes
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (phase.kind === "no_ingredients") {
    return (
      <div className="mt-8">
        <p className="text-base">
          Encontramos <strong>{phase.productName}</strong>, mas ele ainda não tem lista de ingredientes
          no catálogo.
        </p>
        <p className="mt-2 text-sm text-muted">
          Cole a lista do rótulo para analisar mesmo assim — e ela ficará disponível para outras pessoas.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <ButtonLink href={`/colar?nome=${encodeURIComponent(phase.productName)}`}>
            Colar ingredientes
          </ButtonLink>
          <Button variant="secondary" onClick={reset}>
            Tentar outra foto
          </Button>
        </div>
      </div>
    );
  }

  if (phase.kind === "insufficient_image") {
    return (
      <div className="mt-8">
        <p className="text-base">Não conseguimos ler a foto com clareza suficiente.</p>
        {phase.issues.length > 0 && (
          <ul className="mt-2 text-sm text-muted">
            {phase.issues.map((i) => (
              <li key={i}>— {i}</li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={reset}>Tirar outra foto</Button>
          <ButtonLink href="/colar" variant="secondary">
            Fotografar os ingredientes
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (phase.kind === "not_found") {
    return (
      <div className="mt-8">
        <p className="text-base">
          {phase.extractedName
            ? `Não encontramos "${phase.extractedName}" no catálogo.`
            : "Não conseguimos identificar o produto com segurança."}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={reset}>Tirar outra foto</Button>
          <ButtonLink href="/colar" variant="secondary">
            Colar ingredientes
          </ButtonLink>
          <ButtonLink href="/escanear" variant="ghost">
            Código de barras
          </ButtonLink>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="mt-8">
      <p className="text-sm text-muted">{(phase as { message: string }).message}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
