"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "./ui";

export function PasteForm({
  barcode,
  reason,
  productName,
}: {
  barcode: string | null;
  reason: "nao-encontrado" | "sem-ingredientes" | null;
  productName: string;
}) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState("");
  const [name, setName] = useState(productName);
  const [brand, setBrand] = useState("");
  const [share, setShare] = useState(Boolean(barcode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (share && name.trim().length >= 2) {
        // Envio para revisão é "melhor esforço": não bloqueia a análise.
        fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: barcode ?? "", brandName: brand, productName: name, ingredientsRaw: ingredients }),
        }).catch(() => {});
      }
      const res = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, name: [brand, name].filter(Boolean).join(" · ") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/analise/${data.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível analisar.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Colar ingredientes</h1>

      {reason === "nao-encontrado" && (
        <Card className="mt-3 border-caution/30 bg-caution-soft/70 text-sm">
          <p className="font-semibold">Ainda não conhecemos o código {barcode}.</p>
          <p className="mt-1 text-ink-soft">Copie a lista de ingredientes da embalagem ou do site da marca e cole abaixo.</p>
        </Card>
      )}
      {reason === "sem-ingredientes" && (
        <Card className="mt-3 border-caution/30 bg-caution-soft/70 text-sm">
          <p className="font-semibold">Encontramos “{productName}”, mas sem lista de ingredientes.</p>
          <p className="mt-1 text-ink-soft">Cole a composição da embalagem para analisarmos.</p>
        </Card>
      )}
      {!reason && (
        <p className="mt-1 text-[15px] text-ink-soft">Útil para produtos sem código ou que ainda não estão no catálogo.</p>
      )}

      <Card className="mt-4 space-y-3">
        <div>
          <label htmlFor="ingredients" className="font-semibold">
            Lista de ingredientes (INCI)
          </label>
          <textarea
            id="ingredients"
            required
            minLength={3}
            maxLength={8000}
            rows={7}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Aqua, Glycerin, Niacinamide, Dimethicone, Phenoxyethanol, Parfum…"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-muted">Separados por vírgula, na ordem da embalagem.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Marca (opcional)"
            maxLength={120}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-accent"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do produto"
            maxLength={160}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-accent"
          />
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-ground p-3 text-sm">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]" />
          <span>
            Enviar para revisão, para que o produto entre no catálogo
            <span className="block text-xs text-muted">Precisa do nome do produto. Não enviamos nada do seu perfil.</span>
          </span>
        </label>
      </Card>

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <Button type="submit" className="mt-4 w-full" disabled={busy || ingredients.trim().length < 3}>
        {busy ? "Analisando para você…" : "Analisar"}
      </Button>
    </form>
  );
}
