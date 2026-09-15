"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconClipboard } from "./icons";
import { Button, ButtonLink, Card } from "./ui";

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
        if (!res.ok) throw new Error(data.error ?? "Erro ao buscar o produto.");
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
        setPhase({ kind: "error", message: e instanceof Error ? e.message : "Erro ao buscar o produto." });
      }
    },
    [router, stop],
  );

  async function start() {
    handledRef.current = false;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setPhase({ kind: "error", message: "A câmera só funciona em conexão segura (HTTPS). Digite o código ao lado." });
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
          ? "Permissão da câmera negada. Libere o acesso nas configurações do navegador ou digite o código."
          : "Não foi possível abrir a câmera. Digite o código ao lado.",
      });
    }
  }

  const cameraOn = phase.kind === "starting" || phase.kind === "scanning";

  return (
    <div className="space-y-6">
      {profileJustCreated && (
        <Card className="border-good/30 bg-good-soft px-5 py-3 text-sm font-medium text-good">
          ✓ Perfil criado. As próximas análises serão personalizadas para você.
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold">Câmera</h2>
              <p className="text-xs text-muted">Leitura de EAN-13, EAN-8 e UPC</p>
            </div>
            {cameraOn && (
              <Button
                variant="ghost"
                className="px-3 py-1.5"
                onClick={() => {
                  stop();
                  setPhase({ kind: "idle" });
                }}
              >
                Fechar câmera
              </Button>
            )}
          </div>
          <div className="relative aspect-[3/4] w-full bg-ink sm:aspect-[4/3]">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-28 w-[72%] max-w-md rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,.45)]">
                {phase.kind === "scanning" && <div className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-accent" />}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
              {phase.kind === "idle" && (
                <Button onClick={start} className="w-full sm:w-auto sm:px-8">
                  Abrir câmera
                </Button>
              )}
              {phase.kind === "starting" && <p className="text-sm font-medium">Abrindo câmera…</p>}
              {phase.kind === "scanning" && <p className="text-sm font-medium">Aponte para o código de barras</p>}
              {phase.kind === "found" && (
                <div className="mx-auto max-w-sm rounded-xl bg-white p-3 text-left text-ink shadow-lg">
                  <p className="text-xs text-muted">Código {phase.barcode}</p>
                  <p className="text-sm font-semibold">{phase.productName ? `Produto encontrado: ${phase.productName}` : "Buscando produto…"}</p>
                  <p className="mt-1 animate-pulse text-sm font-medium text-accent">Analisando para você…</p>
                </div>
              )}
              {phase.kind === "error" && (
                <div className="mx-auto max-w-sm rounded-xl bg-white p-3 text-left text-ink shadow-lg">
                  <p className="text-sm">{phase.message}</p>
                  <Button variant="secondary" onClick={start} className="mt-2 w-full py-2">
                    Tentar de novo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isBarcode(manual)) analyze(manual);
              }}
            >
              <label htmlFor="manual" className="font-semibold">
                Digitar código de barras
              </label>
              <p className="mt-0.5 text-sm text-ink-soft">Os números abaixo das barras (8 a 14 dígitos).</p>
              <div className="mt-3 flex gap-2">
                <input
                  id="manual"
                  inputMode="numeric"
                  autoComplete="off"
                  value={manual}
                  onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 14))}
                  placeholder="7891234567890"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm tracking-wide outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
                <Button type="submit" disabled={!isBarcode(manual) || phase.kind === "found"}>
                  Analisar
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <p className="font-semibold">Produto sem código ou fora do catálogo?</p>
            <p className="mt-0.5 text-sm text-ink-soft">Cole a lista de ingredientes da embalagem ou do site da marca.</p>
            <ButtonLink href="/colar" variant="secondary" className="mt-3">
              <IconClipboard className="h-4 w-4" />
              Colar lista de ingredientes
            </ButtonLink>
          </Card>

          <div className="rounded-xl border border-dashed border-line px-5 py-4 text-sm text-ink-soft">
            <p className="font-medium text-ink">Dicas</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Use boa iluminação e mantenha o código na moldura.</li>
              <li>A câmera exige conexão segura (HTTPS).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
