"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, fieldClass } from "./ui";

/** Análise rápida por código de barras (Painel). Mesmo fluxo do scanner. */
export function QuickAnalyze() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^\d{8,14}$/.test(code);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.status === "ok") router.push(`/analise/${data.analysisId}`);
      else if (data.status === "no_ingredients")
        router.push(`/colar?codigo=${code}&motivo=sem-ingredientes&nome=${encodeURIComponent(data.product.name)}`);
      else router.push(`/colar?codigo=${code}&motivo=nao-encontrado`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível analisar.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="quick-code" className="text-sm font-medium text-ink">
        Código de barras
      </label>
      <div className="mt-1.5 flex items-end gap-4">
        <input
          id="quick-code"
          inputMode="numeric"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
          placeholder="7891234567890"
          className={`${fieldClass} min-w-0 flex-1 tracking-wide`}
        />
        <Button type="submit" disabled={!valid || busy}>
          {busy ? "Analisando…" : "Analisar"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </form>
  );
}
