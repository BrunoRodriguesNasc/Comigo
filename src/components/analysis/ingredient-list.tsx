"use client";

import { useState } from "react";
import type { IngredientExplanation } from "@/domain/types";
import { StatusIcon } from "./findings";

const PRIORITY = { conflict: 0, attention: 1, positive: 2, neutral: 3, unknown: 4 } as const;

export function IngredientList({ ingredients }: { ingredients: IngredientExplanation[] }) {
  const [showAll, setShowAll] = useState(false);
  const [order, setOrder] = useState<"relevance" | "label">("relevance");

  const sorted =
    order === "label"
      ? ingredients
      : [...ingredients].sort((a, b) => PRIORITY[a.status] - PRIORITY[b.status] || a.position - b.position);
  const visible = showAll ? sorted : sorted.slice(0, 8);
  const unknown = ingredients.filter((i) => i.status === "unknown").length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-ink-soft">
          {ingredients.length} ingredientes{unknown > 0 && ` · ${unknown} sem dados`}
        </span>
        <div className="flex rounded-lg border border-line p-0.5 text-xs font-medium">
          {(["relevance", "label"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              className={`rounded-md px-2 py-1 ${order === o ? "bg-ink text-white" : "text-ink-soft"}`}
            >
              {o === "relevance" ? "Relevância" : "Ordem do rótulo"}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line">
        {visible.map((i) => (
          <li key={i.position} className="flex gap-3 py-3">
            <StatusIcon status={i.status} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">
                {i.displayName}
                <span className="ml-1.5 text-xs font-normal text-muted">#{i.position}</span>
              </p>
              {i.inciName && i.rawName.toLowerCase() !== i.displayName.toLowerCase() && (
                <p className="text-xs text-muted">
                  no rótulo: {i.rawName}
                  {i.matchType === "fuzzy" && " · correspondência aproximada"}
                </p>
              )}
              <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{i.summary}</p>
              {i.personalNotes.length > 0 && (
                <p className="mt-1 text-[13px] font-medium text-ink">Para você: {i.personalNotes.join(" · ")}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > 8 && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-accent hover:bg-accent-soft">
          {showAll ? "Mostrar menos" : `Ver todos os ${sorted.length} ingredientes`}
        </button>
      )}
    </div>
  );
}
