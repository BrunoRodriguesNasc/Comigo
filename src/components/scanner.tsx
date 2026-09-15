"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sprig } from "./illustrations";
import { Button } from "./ui";

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
        <p className="mb-8 inline-flex rounded-full bg-sage px-5 py-2.5 text-sm text-good">
          Perfil criado. A partir de agora, cada análise é feita para você.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[36px] bg-ink sm:aspect-[4/3]">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-28 w-[70%] max-w-md rounded-[20px] border border-ground/80 shadow-[0_0_0_9999px_rgba(58,42,34,.42)]">
                {phase.kind === "scanning" && <div className="absolute inset-x-4 top-1/2 h-px animate-pulse bg-blush" />}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 text-center text-ground">
              {phase.kind === "idle" && (
                <button onClick={start} className="rounded-full bg-ground px-7 py-3 text-sm font-medium text-ink transition hover:bg-surface">
                  Abrir a câmera
                </button>
              )}
              {phase.kind === "starting" && <p className="text-sm">Abrindo a câmera…</p>}
              {phase.kind === "scanning" && <p className="text-sm">Centralize o código de barras na moldura</p>}
              {phase.kind === "found" && (
                <div className="mx-auto max-w-sm rounded-[22px] bg-ground p-4 text-left text-ink">
                  <p className="text-xs text-muted">Código {phase.barcode}</p>
                  <p className="mt-0.5 text-sm">{phase.productName ? `Encontramos: ${phase.productName}` : "Procurando o produto…"}</p>
                  <p className="mt-1 animate-pulse font-display text-lg italic text-rose">Preparando a sua análise…</p>
                </div>
              )}
              {phase.kind === "error" && (
                <div className="mx-auto max-w-sm rounded-[22px] bg-ground p-4 text-left text-ink">
                  <p className="text-sm">{phase.message}</p>
                  <Button variant="secondary" onClick={start} className="mt-3 w-full py-2.5">
                    Tentar de novo
                  </Button>
                </div>
              )}
            </div>
          </div>
          {cameraOn && (
            <button
              onClick={() => {
                stop();
                setPhase({ kind: "idle" });
              }}
              className="mt-3 text-sm text-ink-soft underline-offset-4 hover:underline"
            >
              Fechar a câmera
            </button>
          )}
        </div>

        <div className="divide-y divide-line">
          <form
            className="pb-10"
            onSubmit={(e) => {
              e.preventDefault();
              if (isBarcode(manual)) analyze(manual);
            }}
          >
            <h2 className="text-3xl leading-tight">Prefere digitar?</h2>
            <label htmlFor="manual" className="mt-2 block text-ink-soft">
              Os números logo abaixo das barras.
            </label>
            <div className="mt-5 flex gap-2">
              <input
                id="manual"
                inputMode="numeric"
                autoComplete="off"
                value={manual}
                onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 14))}
                placeholder="7891234567890"
                className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-3 text-sm tracking-wide outline-none transition focus:border-ink/40"
              />
              <Button type="submit" disabled={!isBarcode(manual) || phase.kind === "found"}>
                Analisar
              </Button>
            </div>
          </form>

          <div className="py-10">
            <h2 className="text-3xl leading-tight">Sem código de barras?</h2>
            <p className="mt-2 text-ink-soft">Cole a lista de ingredientes da embalagem ou do site da marca.</p>
            <Link href="/colar" className="mt-4 inline-flex text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              Colar ingredientes →
            </Link>
          </div>

          <div className="flex items-end gap-4 pt-10">
            <Sprig className="h-24 w-16 shrink-0 text-ink" />
            <p className="text-sm leading-relaxed text-muted">
              Dica: boa luz ajuda muito. A câmera funciona em conexão segura (HTTPS); se não abrir, é só digitar o código.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
