"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, fieldClass } from "./ui";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "found"; barcode: string; productName?: string }
  | { kind: "error"; message: string };

interface DetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts: { formats: string[] }): DetectorLike;
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
const isBarcode = (v: string) => /^\d{8,14}$/.test(v);

export function Scanner({ profileJustCreated }: { profileJustCreated: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const handledRef = useRef(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [manual, setManual] = useState("");

  const stop = useCallback(() => {
    stopRef.current();
    stopRef.current = () => {};
  }, []);

  useEffect(() => stop, [stop]);

  const analyze = useCallback(
    async (barcode: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      stop();
      if ("vibrate" in navigator) navigator.vibrate?.(60);
      setPhase({ kind: "found", barcode });
      try {
        const res = await fetch("/api/analyze/barcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Não conseguimos buscar o produto.");
        if (data.status === "ok") {
          setPhase({ kind: "found", barcode, productName: data.product.name });
          router.push(`/analise/${data.analysisId}`);
        } else if (data.status === "no_ingredients") {
          router.push(`/colar?codigo=${barcode}&motivo=sem-ingredientes&nome=${encodeURIComponent(data.product.name)}`);
        } else {
          router.push(`/colar?codigo=${barcode}&motivo=nao-encontrado`);
        }
      } catch (e) {
        handledRef.current = false;
        setPhase({ kind: "error", message: e instanceof Error ? e.message : "Não conseguimos buscar o produto." });
      }
    },
    [router, stop],
  );

  async function start() {
    handledRef.current = false;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setPhase({ kind: "error", message: "A câmera só abre em conexão segura (HTTPS). Você pode digitar o código ao lado." });
      return;
    }
    setPhase({ kind: "starting" });
    try {
      const video = videoRef.current!;
      const native = window.BarcodeDetector && (await window.BarcodeDetector.getSupportedFormats()).some((f) => FORMATS.includes(f));

      if (native) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector!({ formats: FORMATS });
        let active = true;
        stopRef.current = () => {
          active = false;
          stream.getTracks().forEach((t) => t.stop());
          video.srcObject = null;
        };
        setPhase({ kind: "scanning" });
        const loop = async () => {
          if (!active) return;
          try {
            const codes = await detector.detect(video);
            const hit = codes.find((c) => isBarcode(c.rawValue));
            if (hit) return analyze(hit.rawValue);
          } catch {
            /* frame ainda não disponível */
          }
          setTimeout(loop, 180);
        };
        loop();
      } else {
        // Fallback (iOS Safari, Firefox): ZXing em JavaScript.
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({ video: { facingMode: "environment" }, audio: false }, video, (result) => {
          const text = result?.getText();
          if (text && isBarcode(text)) analyze(text);
        });
        stopRef.current = () => controls.stop();
        setPhase({ kind: "scanning" });
      }
    } catch (e) {
      stop();
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setPhase({
        kind: "error",
        message: denied
          ? "A permissão da câmera foi negada. Você pode liberar nas configurações do navegador ou digitar o código."
          : "Não conseguimos abrir a câmera. Tente digitar o código.",
      });
    }
  }

  const cameraOn = phase.kind === "starting" || phase.kind === "scanning";

  return (
    <div>
      {profileJustCreated && (
        <p className="mb-10 border-l border-ink pl-4 text-sm text-ink">Perfil criado. A partir de agora, cada análise é feita para você.</p>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-ink sm:aspect-[4/3]">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-28 w-[70%] max-w-md rounded-xs border border-white/80">
                {phase.kind === "scanning" && <div className="absolute inset-x-3 top-1/2 h-px animate-pulse bg-accent" />}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 text-center text-white">
              {phase.kind === "idle" && (
                <Button onClick={start} className="px-8">
                  Abrir a câmera
                </Button>
              )}
              {phase.kind === "starting" && <p className="text-sm">Abrindo a câmera…</p>}
              {phase.kind === "scanning" && <p className="text-sm">Centralize o código de barras na moldura</p>}
              {phase.kind === "found" && (
                <div className="mx-auto max-w-sm rounded-xs border border-ink bg-surface p-4 text-left text-ink">
                  <p className="text-xs text-muted">Código {phase.barcode}</p>
                  <p className="mt-1 text-sm">{phase.productName ? `Encontramos: ${phase.productName}` : "Procurando o produto…"}</p>
                  <p className="mt-2 animate-pulse text-[24px] leading-[1.11]">Preparando a sua análise…</p>
                </div>
              )}
              {phase.kind === "error" && (
                <div className="mx-auto max-w-sm rounded-xs border border-ink bg-surface p-4 text-left text-ink">
                  <p className="text-sm">{phase.message}</p>
                  <Button variant="secondary" onClick={start} className="mt-3 w-full">
                    Tentar de novo
                  </Button>
                </div>
              )}
            </div>
          </div>
          {cameraOn && (
            <Button
              variant="ghost"
              onClick={() => {
                stop();
                setPhase({ kind: "idle" });
              }}
              className="mt-3"
            >
              Fechar a câmera
            </Button>
          )}
        </div>

        <div className="border-t border-ink">
          <form
            className="border-b border-powder py-10"
            onSubmit={(e) => {
              e.preventDefault();
              if (isBarcode(manual)) analyze(manual);
            }}
          >
            <h2 className="text-[28px]">Prefere digitar?</h2>
            <label htmlFor="manual" className="mt-3 block text-sm text-muted">
              Os números logo abaixo das barras.
            </label>
            <div className="mt-6 flex items-end gap-4">
              <input
                id="manual"
                inputMode="numeric"
                autoComplete="off"
                value={manual}
                onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 14))}
                placeholder="7891234567890"
                className={`${fieldClass} tracking-wide`}
              />
              <Button type="submit" disabled={!isBarcode(manual) || phase.kind === "found"}>
                Analisar
              </Button>
            </div>
          </form>

          <div className="border-b border-powder py-10">
            <h2 className="text-[28px]">Sem código de barras?</h2>
            <p className="mt-3 text-sm text-muted">Cole a lista de ingredientes da embalagem ou do site da marca.</p>
            <Link href="/colar" className="mt-5 inline-flex text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              Colar ingredientes
            </Link>
          </div>

          <p className="pt-8 text-xs leading-[1.33] text-muted">
            Boa luz ajuda muito. A câmera funciona em conexão segura (HTTPS); se não abrir, é só digitar o código.
          </p>
        </div>
      </div>
    </div>
  );
}
