"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Concern, PreferenceKey, Profile, SkinType, Strictness } from "@/domain/types";
import type { ProfileView } from "@/server/services/profile";
import { Button, Card, cx } from "./ui";

const SKIN_TYPES: { value: SkinType; label: string; hint: string }[] = [
  { value: "oily", label: "Oleosa", hint: "Brilha ao longo do dia" },
  { value: "dry", label: "Seca", hint: "Repuxa ou descama" },
  { value: "combination", label: "Mista", hint: "Oleosa na zona T" },
  { value: "normal", label: "Normal", hint: "Equilibrada" },
  { value: "unknown", label: "Não sei", hint: "Tudo bem!" },
];

const CONCERNS: { value: Concern; label: string }[] = [
  { value: "acne", label: "Acne" },
  { value: "blackheads", label: "Cravos" },
  { value: "oiliness", label: "Oleosidade" },
  { value: "dryness", label: "Ressecamento" },
  { value: "redness", label: "Vermelhidão" },
  { value: "irritation", label: "Irritação" },
  { value: "dark_spots", label: "Manchas" },
  { value: "aging", label: "Sinais de envelhecimento" },
  { value: "dullness", label: "Falta de viço" },
];

const PREFERENCES: { key: PreferenceKey; label: string; hint?: string }[] = [
  { key: "avoid_fragrance", label: "Sem fragrância" },
  { key: "avoid_essential_oils", label: "Sem óleos essenciais" },
  { key: "avoid_drying_alcohol", label: "Sem álcool", hint: "Álcool etílico/desnaturado. Álcoois graxos (emolientes) não contam." },
  { key: "simple_formula", label: "Fórmulas mais simples", hint: "Até 20 ingredientes" },
  { key: "vegan", label: "Vegano", hint: "Conforme declarado pela marca" },
  { key: "cruelty_free", label: "Cruelty-free", hint: "Conforme declarado pela marca" },
];

interface SearchResult {
  id: string;
  inciName: string;
  displayNamePt: string;
  matchedAlias: string | null;
}

const STEPS = ["Sua pele", "Preocupações", "O que evitar", "Confirmar"];

export function ProfileForm({ initial }: { initial: ProfileView }) {
  const router = useRouter();
  const editing = initial.exists;
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [consent, setConsent] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<Profile>) => {
    setSaved(false);
    setProfile((p) => ({ ...p, ...patch }));
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent,
          skinType: profile.skinType,
          sensitive: profile.sensitive,
          concerns: profile.concerns,
          preferences: profile.preferences,
          avoidIngredients: profile.avoidIngredients.map(({ ingredientId, strictness }) => ({ ingredientId, strictness })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      if (!editing) router.push("/escanear?perfil=criado");
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAll() {
    if (!confirm("Apagar perfil, histórico e favoritos deste dispositivo? Essa ação não pode ser desfeita.")) return;
    await fetch("/api/profile", { method: "DELETE" });
    window.location.href = "/";
  }

  const sections = [
    <SkinSection key="skin" profile={profile} update={update} />,
    <ConcernSection key="concerns" profile={profile} update={update} />,
    <AvoidSection key="avoid" profile={profile} update={update} />,
    <ConsentSection key="consent" consent={consent} setConsent={setConsent} />,
  ];

  if (editing) {
    return (
      <div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Meu perfil</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Ajuste quando quiser — as próximas análises usam o perfil atualizado.</p>
        <div className="mt-4 space-y-3">{sections.slice(0, 3)}</div>
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
        <div className="sticky bottom-24 z-10 mt-4">
          <Button className="w-full shadow-lg" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : saved ? "✓ Perfil salvo" : "Salvar alterações"}
          </Button>
        </div>
        <Card className="mt-8">
          <p className="font-semibold">Seus dados</p>
          <p className="mt-1 text-sm text-ink-soft">
            Guardamos seu perfil só neste dispositivo (sem e-mail ou nome). Você pode apagar tudo a qualquer momento.
          </p>
          <Button variant="danger" className="mt-3 w-full" onClick={deleteAll}>
            Apagar todos os meus dados
          </Button>
        </Card>
      </div>
    );
  }

  const last = step === STEPS.length - 1;
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="text-sm font-medium text-ink-soft">
            ← Voltar
          </button>
        ) : (
          <Link href="/" className="text-sm font-medium text-ink-soft">
            ← Início
          </Link>
        )}
        <span className="text-xs font-medium text-muted">
          {step + 1} de {STEPS.length}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-line")} />
        ))}
      </div>

      <div className="mt-5 flex-1">{sections[step]}</div>

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <div className="mt-6 space-y-2">
        {last ? (
          <Button className="w-full" onClick={save} disabled={!consent || saving}>
            {saving ? "Salvando…" : "Salvar e escanear"}
          </Button>
        ) : (
          <Button className="w-full" onClick={() => setStep(step + 1)}>
            Continuar
          </Button>
        )}
        {step < 2 && (
          <button onClick={() => setStep(step + 1)} className="w-full py-2 text-sm font-medium text-muted">
            Pular esta etapa
          </button>
        )}
      </div>
    </div>
  );
}

type SectionProps = { profile: Profile; update: (p: Partial<Profile>) => void };

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        selected ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-accent/60",
      )}
    >
      {children}
    </button>
  );
}

function SkinSection({ profile, update }: SectionProps) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Como é sua pele?</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SKIN_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => update({ skinType: t.value })}
            aria-pressed={profile.skinType === t.value}
            className={cx(
              "rounded-xl border p-3 text-left transition",
              t.value === "unknown" && "col-span-2",
              profile.skinType === t.value ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line hover:border-accent/50",
            )}
          >
            <span className="block font-semibold">{t.label}</span>
            <span className="block text-xs text-ink-soft">{t.hint}</span>
          </button>
        ))}
      </div>

      <h3 className="mt-5 font-semibold">Ela é sensível?</h3>
      <p className="text-sm text-ink-soft">Arde, coça ou fica vermelha com facilidade.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {([
          [true, "Sim"],
          [false, "Não"],
          [null, "Não sei"],
        ] as const).map(([value, label]) => (
          <Chip key={label} selected={profile.sensitive === value} onClick={() => update({ sensitive: value })}>
            {label}
          </Chip>
        ))}
      </div>
    </Card>
  );
}

function ConcernSection({ profile, update }: SectionProps) {
  const toggle = (c: Concern) =>
    update({ concerns: profile.concerns.includes(c) ? profile.concerns.filter((x) => x !== c) : [...profile.concerns, c] });
  return (
    <Card>
      <h2 className="text-lg font-bold">O que você quer cuidar?</h2>
      <p className="text-sm text-ink-soft">Escolha quantas quiser.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONCERNS.map((c) => (
          <Chip key={c.value} selected={profile.concerns.includes(c.value)} onClick={() => toggle(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>
    </Card>
  );
}

function StrictnessToggle({ value, onChange }: { value: Strictness; onChange: (s: Strictness) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg border border-line p-0.5 text-xs font-semibold">
      {([
        ["strict", "Não quero"],
        ["soft", "Prefiro evitar"],
      ] as const).map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cx("rounded-md px-2 py-1", value === v ? (v === "strict" ? "bg-bad text-white" : "bg-caution text-white") : "text-ink-soft")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AvoidSection({ profile, update }: SectionProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const pref = (key: PreferenceKey) => profile.preferences.find((p) => p.key === key);
  const setPref = (key: PreferenceKey, strictness: Strictness | null) => {
    const rest = profile.preferences.filter((p) => p.key !== key);
    update({ preferences: strictness ? [...rest, { key, strictness }] : rest });
  };

  return (
    <div className="space-y-3">
      <Card>
        <h2 className="text-lg font-bold">Preferências</h2>
        <p className="text-sm text-ink-soft">
          <strong>Não quero</strong> vira alerta de conflito. <strong>Prefiro evitar</strong> só diminui a nota.
        </p>
        <ul className="mt-3 divide-y divide-line">
          {PREFERENCES.map((p) => {
            const current = pref(p.key);
            return (
              <li key={p.key} className="flex items-center gap-3 py-3">
                <input
                  id={`pref-${p.key}`}
                  type="checkbox"
                  checked={Boolean(current)}
                  onChange={(e) => setPref(p.key, e.target.checked ? (p.key.startsWith("avoid") ? "strict" : "soft") : null)}
                  className="h-5 w-5 accent-[var(--color-accent)]"
                />
                <label htmlFor={`pref-${p.key}`} className="min-w-0 flex-1">
                  <span className="block font-medium">{p.label}</span>
                  {p.hint && <span className="block text-xs text-muted">{p.hint}</span>}
                </label>
                {current && <StrictnessToggle value={current.strictness} onChange={(s) => setPref(p.key, s)} />}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Ingredientes que você quer evitar</h2>
        <p className="text-sm text-ink-soft">Busque pelo nome do rótulo ou em português.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: lanolina, parabeno, linalool"
          className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-accent"
        />
        {results.length > 0 && (
          <ul className="mt-2 max-h-56 overflow-auto rounded-xl border border-line">
            {results.map((r) => {
              const added = profile.avoidIngredients.some((a) => a.ingredientId === r.id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => {
                      update({
                        avoidIngredients: [...profile.avoidIngredients, { ingredientId: r.id, inciName: r.displayNamePt, strictness: "strict" }],
                      });
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-ground disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{r.displayNamePt}</span>
                      <span className="block text-xs text-muted">
                        {r.inciName}
                        {r.matchedAlias && ` · também “${r.matchedAlias}”`}
                      </span>
                    </span>
                    <span className="font-semibold text-accent">{added ? "Adicionado" : "+ Adicionar"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {profile.avoidIngredients.length > 0 && (
          <ul className="mt-3 space-y-2">
            {profile.avoidIngredients.map((a) => (
              <li key={a.ingredientId} className="flex items-center gap-2 rounded-xl bg-ground px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.inciName}</span>
                <StrictnessToggle
                  value={a.strictness}
                  onChange={(s) =>
                    update({
                      avoidIngredients: profile.avoidIngredients.map((x) => (x.ingredientId === a.ingredientId ? { ...x, strictness: s } : x)),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label={`Remover ${a.inciName}`}
                  onClick={() => update({ avoidIngredients: profile.avoidIngredients.filter((x) => x.ingredientId !== a.ingredientId) })}
                  className="px-1 text-lg text-muted hover:text-bad"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ConsentSection({ consent, setConsent }: { consent: boolean; setConsent: (v: boolean) => void }) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Antes de salvar</h2>
      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
        <li>• Seu perfil fica associado só a este dispositivo — não pedimos nome nem e-mail.</li>
        <li>• Informações sobre a pele podem ser consideradas dados sensíveis. Usamos apenas para calcular a compatibilidade.</li>
        <li>• Você pode apagar tudo a qualquer momento em “Perfil”.</li>
        <li>• As análises são educativas e não substituem um dermatologista.</li>
      </ul>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-ground p-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]" />
        <span className="text-sm font-medium">Concordo em salvar essas informações para receber análises personalizadas.</span>
      </label>
    </Card>
  );
}
