"use client";

import { useState } from "react";
import { Button } from "../ui";

export function FavoriteButton({ productId, initial }: { productId: string; initial: boolean }) {
  const [favorite, setFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !favorite;
    setFavorite(next);
    setBusy(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, favorite: next }),
    }).catch(() => null);
    if (!res?.ok) setFavorite(!next);
    setBusy(false);
  }

  return (
    <Button variant="secondary" onClick={toggle} disabled={busy} aria-pressed={favorite} className="flex-1">
      <span className={favorite ? "text-accent" : ""}>{favorite ? "♥" : "♡"}</span>
      {favorite ? "Salvo" : "Salvar"}
    </Button>
  );
}
