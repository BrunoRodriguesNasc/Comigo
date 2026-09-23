"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "./ui";

type SupportedMime = "image/jpeg" | "image/png" | "image/webp";

const MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_INTERVAL_MS = 15000;

interface Candidate {
  productId: string;
  name: string;
  brand: string | null;
  hasIngredients: boolean;
}

interface ApiResult {
  status: string;
  analysisId?: string;
  resolution?: { candidates: Candidate[]; bestMatch?: Candidate };
  visionData?: { productName?: { value?: string | null }; brand?: { value?: string | null } };
  issues?: string[];
  error?: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function postImage(imageData: string, mimeType: string, targetProductId?: string): Promise<ApiResult> {
  const res = await fetch("/api/analyze/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData, mimeType, targetProductId }),
  });
  return res.json() as Promise<ApiResult>;
}

function extractName(visionData?: ApiResult["visionData"]): string | null {
  if (!visionData) return null;
  const parts = [visionData.brand?.value, visionData.productName?.value].filter(Boolean);
  return parts.join(" ").trim() || null;
}

// ─── mode tab ──────────────────────────────────────────────────────────────

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm transition-colors ${
        active ? "border-b-2 border-ink font-medium text-ink" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

// ─── shared result display ─────────────────────────────────────────────────

type ResultState =
  | { kind: "needs_confirmation"; candidates: Candidate[]; summary: string }
  | { kind: "no_ingredients"; productName: string; productId: string }
  | { kind: "ingredients_not_visible"; productName: string; productId: string }
  | { kind: "not_found"; extractedName: string | null }
  | { kind: "insufficient_image"; issues: string[] }
  | { kind: "error"; message: string };

interface Target {
  productId: string;
  productName: string;
}

function ResultView({
  result,
  onReset,
  onScanBack,
}: {
  result: ResultState;
  onReset: () => void;
  onScanBack: (target: Target) => void;
}) {
  const router = useRouter();
  const [fetching, setFetching] = useState<string | null>(null);

  /** Sem ingredientes no catálogo: procura na web; só pede o verso se não achar. */
  const pickCandidate = useCallback(
    async (c: Candidate) => {
      const target = { productId: c.productId, productName: c.brand ? `${c.brand} ${c.name}` : c.name };
      if (c.hasIngredients) {
        router.push(`/analise?produto=${c.productId}`);
        return;
      }
      setFetching(c.productId);
      try {
        const res = await fetch("/api/analyze/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: c.productId }),
        });
        const data = (await res.json()) as ApiResult;
        if (data.status === "analyzed" && data.analysisId) {
          router.push(`/analise/${data.analysisId}`);
          return;
        }
        onScanBack(target);
      } catch {
        onScanBack(target);
      } finally {
        setFetching(null);
      }
    },
    [onScanBack, router],
  );

  if (result.kind === "needs_confirmation") {
    return (
      <div className="mt-8">
        <p className="text-sm text-muted">Encontramos estes produtos. Qual é o seu?</p>
        <ul className="mt-4 divide-y divide-powder border-t border-ink">
          {result.candidates.map((c) => (
            <li key={c.productId}>
              <button
                onClick={() => void pickCandidate(c)}
                disabled={fetching !== null}
                className="group w-full py-4 text-left disabled:opacity-50"
              >
                <p className="text-base group-hover:underline group-hover:underline-offset-4">
                  {c.brand ? `${c.brand} · ` : ""}{c.name}
                </p>
                {!c.hasIngredients && (
                  <p className="mt-0.5 text-xs text-muted">
                    {fetching === c.productId ? "Procurando a lista de ingredientes…" : "Sem ingredientes ainda"}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button variant="secondary" onClick={onReset}>Nenhum desses — tentar de novo</Button>
          <ButtonLink href="/colar" variant="ghost">Colar ingredientes</ButtonLink>
        </div>
      </div>
    );
  }

  if (result.kind === "no_ingredients" || result.kind === "ingredients_not_visible") {
    const retry = result.kind === "ingredients_not_visible";
    const { productId, productName } = result;
    return (
      <div className="mt-8">
        {retry ? (
          <>
            <p className="text-base">Ainda não consegui ler a lista de <strong>{productName}</strong>.</p>
            <p className="mt-2 text-sm text-muted">
              Aproxime a câmera do texto dos ingredientes e mantenha a embalagem firme e bem iluminada.
            </p>
          </>
        ) : (
          <>
            <p className="text-base">Identificamos <strong>{productName}</strong>.</p>
            <p className="mt-2 text-sm text-muted">
              Agora <strong>vire a embalagem</strong> e mostre a lista de ingredientes — ela costuma ficar no verso ou
              embaixo, começando por <em>Aqua</em> ou <em>Água</em>.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={() => onScanBack({ productId, productName })}>
            {retry ? "Tentar ler de novo" : "Escanear ingredientes"}
          </Button>
          <ButtonLink href={`/colar?nome=${encodeURIComponent(productName)}`} variant="secondary">
            Colar ingredientes
          </ButtonLink>
          <Button variant="ghost" onClick={onReset}>Começar de novo</Button>
        </div>
      </div>
    );
  }

  if (result.kind === "insufficient_image") {
    return (
      <div className="mt-8">
        <p className="text-base">Não conseguimos ler a imagem com clareza.</p>
        {result.issues.length > 0 && <ul className="mt-2 text-sm text-muted">{result.issues.map((i) => <li key={i}>— {i}</li>)}</ul>}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={onReset}>Tentar de novo</Button>
          <ButtonLink href="/colar" variant="secondary">Colar ingredientes</ButtonLink>
        </div>
      </div>
    );
  }

  if (result.kind === "not_found") {
    return (
      <div className="mt-8">
        {result.extractedName ? (
          <>
            <p className="text-base">Identificamos <strong>{result.extractedName}</strong>, mas ele ainda não está no nosso catálogo.</p>
            <p className="mt-2 text-sm text-muted">Aponte para o <strong>código de barras</strong> ou a <strong>lista de ingredientes</strong> na embalagem para continuarmos a análise.</p>
          </>
        ) : (
          <p className="text-base">Não conseguimos identificar o produto. Tente um ângulo diferente ou mais iluminado.</p>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={onReset}>Tentar de novo</Button>
          <ButtonLink href="/colar" variant="secondary">Colar ingredientes</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-sm text-muted">{result.message}</p>
      <div className="mt-6"><Button onClick={onReset}>Tentar novamente</Button></div>
    </div>
  );
}

// ─── API result → state ────────────────────────────────────────────────────

function parseApiResult(data: ApiResult, target?: Target | null): ResultState | null {
  if (data.status === "ingredients_not_visible" && target) {
    return { kind: "ingredients_not_visible", productName: target.productName, productId: target.productId };
  }
  if (data.status === "needs_confirmation" && data.resolution) {
    return { kind: "needs_confirmation", candidates: data.resolution.candidates, summary: extractName(data.visionData) ?? "produto" };
  }
  if (data.status === "no_ingredients" && data.resolution?.bestMatch) {
    const { name, brand, productId } = data.resolution.bestMatch;
    return { kind: "no_ingredients", productName: brand ? `${brand} ${name}` : name, productId };
  }
  if (data.status === "insufficient_image") {
    return { kind: "insufficient_image", issues: data.issues ?? [] };
  }
  if (data.status === "error" || data.status === "unavailable") {
    return { kind: "error", message: data.error ?? "Erro inesperado." };
  }
  if (data.status === "not_found") {
    return { kind: "not_found", extractedName: extractName(data.visionData) };
  }
  return null;
}

// ─── photo mode ────────────────────────────────────────────────────────────

const STEPS = [
  "Lendo a embalagem com IA...",
  "Identificando marca e produto...",
  "Procurando no catálogo...",
  "Buscando a lista de ingredientes...",
  "Calculando compatibilidade...",
];

type PhotoPhase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; url: string }
  | { kind: "analyzing"; stepIdx: number; previewUrl: string }
  | { kind: "result"; result: ResultState };

function PhotoMode() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<PhotoPhase>({ kind: "idle" });
  const [target, setTarget] = useState<Target | null>(null);

  const reset = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    setTarget(null);
    setPhase({ kind: "idle" });
  }, []);

  const scanBack = useCallback((t: Target) => {
    if (inputRef.current) inputRef.current.value = "";
    setTarget(t);
    setPhase({ kind: "idle" });
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhase({ kind: "result", result: { kind: "error", message: "Formato não aceito. Use JPG, PNG ou WebP." } });
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase({ kind: "result", result: { kind: "error", message: "Foto muito grande. Máximo 5 MB." } });
      return;
    }
    setPhase({ kind: "preview", file, url: URL.createObjectURL(file) });
  }, []);

  const analyze = useCallback(async () => {
    if (phase.kind !== "preview") return;
    const { file, url: previewUrl } = phase;

    let stepIdx = 0;
    setPhase({ kind: "analyzing", stepIdx: 0, previewUrl });
    const timer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1);
      setPhase((p) => p.kind === "analyzing" ? { ...p, stepIdx } : p);
    }, 3000);

    try {
      const imageData = await toBase64(file);
      const data = await postImage(imageData, file.type as SupportedMime, target?.productId);
      clearInterval(timer);

      if (data.status === "analyzed" && data.analysisId) {
        router.push(`/analise/${data.analysisId}`);
        return;
      }
      const result = parseApiResult(data, target) ?? { kind: "error" as const, message: "Resposta inesperada do servidor." };
      setPhase({ kind: "result", result });
    } catch {
      clearInterval(timer);
      setPhase({ kind: "result", result: { kind: "error", message: "Não foi possível enviar a foto. Verifique sua conexão." } });
    }
  }, [phase, router, target]);

  if (phase.kind === "idle") {
    return (
      <div className="mt-6">
        <label className="group block cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div className="flex flex-col items-center gap-5 border border-ink bg-surface px-8 py-14 text-center transition-colors group-hover:bg-powder">
            <span className="text-[48px] leading-none" aria-hidden>{target ? "🔄" : "📷"}</span>
            <div>
              <p className="text-[20px]">{target ? "Fotografe o verso" : "Fotografe o produto"}</p>
              <p className="mt-1 text-sm text-muted">
                {target ? `Lista de ingredientes de ${target.productName}` : "Frente, verso ou lista de ingredientes"}
              </p>
            </div>
            <span className="inline-block rounded-full bg-accent px-8 py-3 text-sm text-ink">Escolher foto</span>
          </div>
        </label>
        <div className="mt-5 flex justify-center gap-4">
          <ButtonLink href="/colar" variant="ghost">Colar ingredientes manualmente</ButtonLink>
          {target && <Button variant="ghost" onClick={reset}>Cancelar</Button>}
        </div>
      </div>
    );
  }

  if (phase.kind === "preview") {
    return (
      <div className="mt-6">
        <div className="border border-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase.url} alt="Foto selecionada" className="max-h-[420px] w-full bg-powder object-contain" />
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          <Button onClick={analyze} className="px-8">Analisar esta foto</Button>
          <Button variant="secondary" onClick={reset}>Trocar foto</Button>
        </div>
      </div>
    );
  }

  if (phase.kind === "analyzing") {
    const progress = Math.round(((phase.stepIdx + 1) / STEPS.length) * 100);
    return (
      <div className="mt-6">
        {/* Miniatura da foto */}
        <div className="border border-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase.previewUrl} alt="Foto enviada" className="max-h-[220px] w-full bg-powder object-contain opacity-60" />
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 h-px w-full bg-powder">
          <div
            className="h-px bg-ink transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Passos */}
        <ul className="mt-5 space-y-3">
          {STEPS.map((label, i) => {
            const done = i < phase.stepIdx;
            const active = i === phase.stepIdx;
            return (
              <li key={i} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${active ? "opacity-100" : done ? "opacity-40" : "opacity-20"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-ink text-[10px]">
                  {done ? "✓" : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> : ""}
                </span>
                <span className={active ? "font-medium" : ""}>{label}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs text-muted">Isso pode levar alguns segundos…</p>
      </div>
    );
  }

  return <ResultView result={phase.result} onReset={reset} onScanBack={scanBack} />;
}

// ─── video mode ────────────────────────────────────────────────────────────

type VideoPhase =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "denied" }
  | { kind: "live"; analyzing: boolean; lastResult: string | null }
  | { kind: "result"; result: ResultState };

function VideoMode() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const targetRef = useRef<Target | null>(null);

  const [phase, setPhase] = useState<VideoPhase>({ kind: "idle" });
  const [target, setTarget] = useState<Target | null>(null);

  const stopCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    // Reduz para 640px de largura máxima — suficiente para OCR e 4× menor em bytes
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75).split(",")[1] ?? null;
  }, []);

  const runAnalysis = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase((p) => p.kind === "live" ? { ...p, analyzing: true } : p);

    try {
      const frame = captureFrame();
      if (!frame) { busyRef.current = false; return; }

      const current = targetRef.current;
      const data = await postImage(frame, "image/jpeg", current?.productId);

      if (data.status === "analyzed" && data.analysisId) {
        stopCamera();
        router.push(`/analise/${data.analysisId}`);
        return;
      }

      const result = parseApiResult(data, current);

      // Lendo o verso: seguimos tentando até a lista aparecer no enquadramento
      if (result?.kind === "ingredients_not_visible") {
        setPhase((p) => p.kind === "live" ? { ...p, analyzing: false, lastResult: "ainda não vejo a lista — aproxime do texto" } : p);
        return;
      }

      // Para needs_confirmation e no_ingredients mostramos tela de confirmação
      if (result && (result.kind === "needs_confirmation" || result.kind === "no_ingredients")) {
        stopCamera();
        setPhase({ kind: "result", result });
        return;
      }

      // Produto identificado mas não no catálogo → para câmera e orienta o próximo passo
      if (result?.kind === "not_found" && result.extractedName) {
        stopCamera();
        setPhase({ kind: "result", result });
        return;
      }

      // Para erros menores continuamos tentando e mostramos na barra
      const label = result?.kind === "not_found" ? "sem correspondência — tente de outro ângulo"
        : result?.kind === "insufficient_image" ? "foto pouco nítida"
        : result?.kind === "error" ? result.message
        : null;

      setPhase((p) => p.kind === "live" ? { ...p, analyzing: false, lastResult: label } : p);
    } catch {
      setPhase((p) => p.kind === "live" ? { ...p, analyzing: false, lastResult: "erro na leitura" } : p);
    } finally {
      busyRef.current = false;
    }
  }, [captureFrame, router, stopCamera]);

  const startCamera = useCallback(async () => {
    setPhase({ kind: "requesting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase({ kind: "live", analyzing: false, lastResult: null });
      setTimeout(runAnalysis, 1200);
      timerRef.current = setInterval(runAnalysis, VIDEO_INTERVAL_MS);
    } catch {
      setPhase({ kind: "denied" });
    }
  }, [runAnalysis]);

  const reset = useCallback(() => {
    stopCamera();
    busyRef.current = false;
    targetRef.current = null;
    setTarget(null);
    setPhase({ kind: "idle" });
  }, [stopCamera]);

  const scanBack = useCallback((t: Target) => {
    targetRef.current = t;
    setTarget(t);
    void startCamera();
  }, [startCamera]);

  const isLive = phase.kind === "live";
  const livePhase = isLive ? (phase as { kind: "live"; analyzing: boolean; lastResult: string | null }) : null;

  return (
    <div className="mt-6">
      <style>{`
        @keyframes scanLine {
          0%   { top: 0%; opacity: 1; }
          90%  { top: 100%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Vídeo sempre no DOM quando câmera ativa para manter o stream */}
      <div className={isLive ? "block" : "hidden"}>
        <div className="relative border border-ink bg-black overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: "60vh", objectFit: "cover" }} />

          {/* ── Overlay: analisando ── */}
          {livePhase?.analyzing && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Linha de scan */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-accent"
                style={{ animation: "scanLine 2s ease-in-out infinite" }}
              />
              {/* Banner superior */}
              <div className="absolute top-0 left-0 right-0 bg-ink px-4 py-3">
                <p className="text-sm text-white font-medium">
                  {target ? "Procurando a lista de ingredientes…" : "Analisando frame…"}
                </p>
                <p className="mt-0.5 text-xs text-white/60">A IA está lendo a embalagem</p>
              </div>
            </div>
          )}

          {/* ── Overlay: viewfinder (câmera ativa, não analisando) ── */}
          {livePhase && !livePhase.analyzing && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Cantos do viewfinder */}
              <span className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-white/70" />
              <span className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-white/70" />
              <span className="absolute bottom-12 left-4 h-8 w-8 border-b-2 border-l-2 border-white/70" />
              <span className="absolute bottom-12 right-4 h-8 w-8 border-b-2 border-r-2 border-white/70" />
            </div>
          )}

          {/* ── Status bar inferior ── */}
          {livePhase && (
            <div className="absolute bottom-0 left-0 right-0 bg-ink/80 px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs text-white leading-snug">
                {livePhase.analyzing
                  ? "Lendo com IA — aguarde…"
                  : livePhase.lastResult
                  ? `↩ ${livePhase.lastResult}`
                  : target
                  ? "Vire a embalagem e mostre a lista de ingredientes"
                  : "Aponte para a embalagem do produto"}
              </p>
              <span className={`h-2 w-2 shrink-0 rounded-full ${livePhase.analyzing ? "animate-ping bg-accent" : "bg-green-400"}`} />
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={runAnalysis} disabled={livePhase?.analyzing ?? false}>
            {livePhase?.analyzing ? "Analisando…" : "Analisar agora"}
          </Button>
          <Button variant="secondary" onClick={reset}>Parar câmera</Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Analisa automaticamente a cada {VIDEO_INTERVAL_MS / 1000}s.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {phase.kind === "idle" && (
        <>
          <div className="flex flex-col items-center gap-5 border border-ink bg-surface px-8 py-14 text-center">
            <span className="text-[48px] leading-none" aria-hidden>🎥</span>
            <div>
              <p className="text-[20px]">Câmera ao vivo</p>
              <p className="mt-1 text-sm text-muted">Aponte para a embalagem — a IA lê em tempo real</p>
            </div>
            <Button onClick={startCamera} className="px-8">Ligar câmera</Button>
          </div>
          <div className="mt-5 flex justify-center">
            <ButtonLink href="/colar" variant="ghost">Colar ingredientes manualmente</ButtonLink>
          </div>
        </>
      )}

      {phase.kind === "requesting" && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-powder border-t-ink" />
          <p className="text-sm text-muted">Aguardando permissão da câmera...</p>
        </div>
      )}

      {phase.kind === "denied" && (
        <div className="mt-4">
          <p className="text-base">Permissão de câmera negada.</p>
          <p className="mt-1 text-sm text-muted">Permita o acesso à câmera nas configurações do navegador e tente de novo.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Button onClick={startCamera}>Tentar de novo</Button>
            <ButtonLink href="/colar" variant="secondary">Colar ingredientes</ButtonLink>
          </div>
        </div>
      )}

      {phase.kind === "result" && <ResultView result={phase.result} onReset={reset} onScanBack={scanBack} />}
    </div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────

export function ImageCapture() {
  const [mode, setMode] = useState<"photo" | "video">("photo");

  return (
    <div>
      <div className="mt-8 flex border-b border-powder">
        <ModeTab active={mode === "photo"} onClick={() => setMode("photo")}>📷 Foto</ModeTab>
        <ModeTab active={mode === "video"} onClick={() => setMode("video")}>🎥 Ao vivo</ModeTab>
      </div>
      {mode === "photo" ? <PhotoMode /> : <VideoMode />}
    </div>
  );
}
