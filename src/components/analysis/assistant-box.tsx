"use client";

import { useState } from "react";
import { Button, Card } from "../ui";

interface Reply {
  text: string;
  source: "ai" | "rules";
}

const SUGGESTIONS = ["Por que essa nota?", "Qual ingrediente é o problema?", "É bom para pele oleosa?", "O que ajuda na hidratação?"];

export function AssistantBox({ analysisId, initialSummary }: { analysisId: string; initialSummary: string | null }) {
  const [summary, setSummary] = useState<Reply | null>(initialSummary ? { text: initialSummary, source: "ai" } : null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ q: string; a: Reply }[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar o resumo.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function ask(q: string) {
    if (q.trim().length < 3) return;
    setAsking(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThread((t) => [...t, { q, a: data }]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível responder agora.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl leading-tight">Ficou com alguma dúvida?</h2>
          <p className="mt-1 text-sm text-ink-soft">Pergunte sobre este produto e o seu perfil.</p>
        </div>
      </div>

      {summary ? (
        <div className="mt-4 border-l border-ink pl-4 text-sm leading-[1.33] whitespace-pre-line">
          {summary.text}
          <SourceTag source={summary.source} />
        </div>
      ) : (
        <Button variant="secondary" className="mt-3 w-full" onClick={loadSummary} disabled={loadingSummary}>
          {loadingSummary ? "Preparando…" : "Ver um resumo para você"}
        </Button>
      )}

      {thread.map((t, i) => (
        <div key={i} className="mt-3 space-y-2 text-[14px]">
          <p className="ml-auto w-fit max-w-[85%] rounded-xs bg-ink px-3 py-2 text-white">{t.q}</p>
          <div className="max-w-[92%] rounded-xs border border-powder px-3 py-2 leading-[1.33] whitespace-pre-line">
            {t.a.text}
            <SourceTag source={t.a.source} />
          </div>
        </div>
      ))}

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={asking}
            className="rounded-xs border border-powder px-2.5 py-1.5 text-xs text-ink hover:border-ink disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex.: o que o fenoxietanol faz?"
          maxLength={500}
          className="min-w-0 flex-1 border-0 border-b border-ink bg-transparent px-0 py-2.5 text-sm font-light outline-none placeholder:text-muted focus:border-black"
        />
        <Button type="submit" disabled={asking || question.trim().length < 3} className="px-4">
          {asking ? "…" : "Enviar"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </Card>
  );
}

function SourceTag({ source }: { source: Reply["source"] }) {
  return (
    <span className="mt-2 block text-[11px] text-muted" data-source={source}>
      Com base na análise deste produto.
    </span>
  );
}
