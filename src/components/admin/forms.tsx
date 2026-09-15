"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cx } from "../ui";

/**
 * Formulário genérico do admin: serializa campos para JSON.
 * Convenção de nome: "campo" (texto), "campo:list" (vírgulas → array), "campo:json", "campo:nullable".
 */
export function EntityForm({
  action,
  method = "POST",
  extra,
  redirectTo,
  submitLabel = "Salvar",
  children,
  className,
}: {
  action: string;
  method?: string;
  extra?: Record<string, unknown>;
  redirectTo?: string;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body: Record<string, unknown> = { ...extra };
    for (const [rawKey, value] of new FormData(e.currentTarget).entries()) {
      const [key, type] = rawKey.split(":");
      const v = String(value);
      if (type === "json") {
        try {
          body[key] = v.trim() ? JSON.parse(v) : null;
        } catch {
          setMsg({ ok: false, text: `JSON inválido em “${key}”.` });
          return;
        }
      } else if (type === "list") body[key] = v.split(",").map((s) => s.trim()).filter(Boolean);
      else if (type === "nullable") body[key] = v.trim() || null;
      else body[key] = v;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(action, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
      setMsg({ ok: true, text: data.message ?? "Salvo." });
      if (redirectTo) router.push(redirectTo.replace(":id", data.id ?? ""));
      else router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("space-y-3", className)}>
      {children}
      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Salvando…" : submitLabel}
        </button>
        {msg && <span className={cx("text-sm", msg.ok ? "text-good" : "text-bad")}>{msg.text}</span>}
      </div>
    </form>
  );
}

export function ActionButton({
  url,
  method = "POST",
  body,
  label,
  confirmText,
  tone = "neutral",
  redirectTo,
}: {
  url: string;
  method?: string;
  body?: unknown;
  label: string;
  confirmText?: string;
  tone?: "neutral" | "good" | "bad";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Falhou");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  const tones = {
    neutral: "border-line text-ink hover:bg-ground",
    good: "border-good/40 text-good hover:bg-good-soft",
    bad: "border-bad/40 text-bad hover:bg-bad-soft",
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={run} disabled={busy} className={cx("rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50", tones[tone])}>
        {busy ? "…" : label}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
