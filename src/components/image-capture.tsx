"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "./ui";

type SupportedMime = "image/jpeg" | "image/png" | "image/webp";

const MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_INTERVAL_MS = 5000;

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

async function postImage(imageData: string, mimeType: string): Promise<ApiResult> {
  const res = await fetch("/api/analyze/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData, mimeType }),
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
  | { kind: "not_found"; extractedName: string | null }
  | { kind: "insufficient_image"; issues: string[] }
  | { kind: "error"; message: string };

function ResultView({ result, onReset }: { result: ResultState; onReset: () => void }) {
  const router = useRouter();

  if (result.kind === "needs_confirmation") {
    return (
      <div className="mt-8">
        <p className="text-sm text-muted">Encontramos estes produtos. Qual é o seu?</p>
        <ul className="mt-4 divide-y divide-powder border-t border-ink">
          {result.candidates.map((c) => (
            <li key={c.productId}>
              <button
                onClick={() => { if (c.hasIngredients) router.push(`/analise?produto=${c.productId}`); else onReset(); }}
                className="group w-full py-4 text-left"
              >
                <p className="text-base group-hover:underline group-hover:underline-offset-4">
                  {c.brand ? `${c.brand} · ` : ""}{c.name}
                </p>
                {!c.hasIngredients && <p className="mt-0.5 text-xs text-muted">Sem ingredientes cadastrados</p>}
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

  if (result.kind === "no_ingredients") {
    return (
      <div className="mt-8">
        <p className="text-base">Encontramos <strong>{result.productName}</strong>, mas ele ainda não tem ingredientes cadastrados.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <ButtonLink href={`/colar?nome=${encodeURIComponent(result.productName)}`}>Colar ingredientes</ButtonLink>
          <Button variant="secondary" onClick={onReset}>Tentar de novo</Button>
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
        <p className="text-base">
          {result.extractedName ? `Não encontramos "${result.extractedName}" no catálogo.` : "Não conseguimos identificar o produto."}
        </p>
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

function parseApiResult(data: ApiResult): ResultState | null {
  if (data.status === "needs_confirmation" && data.resolution) {
    return { kind: "needs_confirmation", candidates: data.resolution.candidates, summary: extractName(data.visionData) ?? "produto" };
  }
  if (data.status === "no_ingredients" && data.resolution?.bestMatch) {
    const { name, productId } = data.resolution.bestMatch;
    return { kind: "no_ingredients", productName: name, productId };
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

const STEPS = ["Olhando o seu produto...", "Lendo as informações da embalagem...", "Procurando no catálogo...", "Quase lá..."];

type PhotoPhase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; url: string }
  | { kind: "analyzing"; step: string }
  | { kind: "result"; result: ResultState };

function PhotoMode() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<PhotoPhase>({ kind: "idle" });

  const reset = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
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
    const { file } = phase;

    let stepIdx = 0;
    setPhase({ kind: "analyzing", step: STEPS[0] });
    const timer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1);
      setPhase((p) => p.kind === "analyzing" ? { kind: "analyzing", step: STEPS[stepIdx] } : p);
    }, 2200);

    try {
      const imageData = await toBase64(file);
      const data = await postImage(imageData, file.type as SupportedMime);
      clearInterval(timer);

      if (data.status === "analyzed" && data.analysisId) {
        router.push(`/analise/${data.analysisId}`);
        return;
      }
      const result = parseApiResult(data) ?? { kind: "error" as const, message: "Resposta inesperada do servidor." };
      setPhase({ kind: "result", result });
    } catch {
      clearInterval(timer);
      setPhase({ kind: "result", result: { kind: "error", message: "Não foi possível enviar a foto. Verifique sua conexão." } });
    }
  }, [phase, router]);

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
            <span className="text-[48px] leading-none" aria-hidden>📷</span>
            <div>
              <p className="text-[20px]">Fotografe o produto</p>
              <p className="mt-1 text-sm text-muted">Frente, verso ou lista de ingredientes</p>
            </div>
            <span className="inline-block rounded-full bg-accent px-8 py-3 text-sm text-ink">Escolher foto</span>
          </div>
        </label>
        <div className="mt-5 flex justify-center">
          <ButtonLink href="/colar" variant="ghost">Colar ingredientes manualmente</ButtonLink>
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
    return (
      <div className="mt-6 flex flex-col items-center gap-5 py-16 text-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-powder border-t-ink" />
        <p className="text-sm text-muted">{phase.step}</p>
      </div>
    );
  }

  return <ResultView result={phase.result} onReset={reset} />;
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

  const [phase, setPhase] = useState<VideoPhase>({ kind: "idle" });

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.82).split(",")[1] ?? null;
  }, []);

  const runAnalysis = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase((p) => p.kind === "live" ? { ...p, analyzing: true } : p);

    try {
      const frame = captureFrame();
      if (!frame) { busyRef.current = false; return; }

      const data = await postImage(frame, "image/jpeg");

      if (data.status === "analyzed" && data.analysisId) {
        stopCamera();
        router.push(`/analise/${data.analysisId}`);
        return;
      }

      const result = parseApiResult(data);

      // Para needs_confirmation e no_ingredients mostramos tela de confirmação
      if (result && (result.kind === "needs_confirmation" || result.kind === "no_ingredients")) {
        stopCamera();
        setPhase({ kind: "result", result });
        return;
      }

      // Para erros menores (not_found, insufficient_image) continuamos tentando e mostramos na barra
      const label = result?.kind === "not_found" ? (result.extractedName ? `"${result.extractedName}" não encontrado` : "sem correspondência")
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
    setPhase({ kind: "idle" });
  }, [stopCamera]);

  const isLive = phase.kind === "live";

  return (
    <div className="mt-6">
      {/* Vídeo sempre no DOM quando câmera ativa para manter o stream */}
      <div className={isLive ? "block" : "hidden"}>
        <div className="relative border border-ink bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: "60vh", objectFit: "cover" }} />
          {isLive && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-ink/70 px-5 py-3 text-white">
              <p className="text-xs">
                {(phase as { analyzing: boolean; lastResult: string | null }).analyzing
                  ? "Analisando..."
                  : (phase as { analyzing: boolean; lastResult: string | null }).lastResult
                  ? `Última leitura: ${(phase as { analyzing: boolean; lastResult: string | null }).lastResult}`
                  : "Aponte para o produto..."}
              </p>
              <div className={`h-2 w-2 shrink-0 rounded-full ${(phase as { analyzing: boolean }).analyzing ? "animate-pulse bg-powder" : "bg-green-400"}`} />
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          <Button
            onClick={runAnalysis}
            disabled={(phase as { analyzing?: boolean }).analyzing ?? false}
          >
            {(phase as { analyzing?: boolean }).analyzing ? "Analisando..." : "Analisar agora"}
          </Button>
          <Button variant="secondary" onClick={reset}>Parar câmera</Button>
        </div>
        <p className="mt-3 text-xs text-muted">Analisa automaticamente a cada {VIDEO_INTERVAL_MS / 1000} segundos.</p>
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

      {phase.kind === "result" && <ResultView result={phase.result} onReset={reset} />}
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
