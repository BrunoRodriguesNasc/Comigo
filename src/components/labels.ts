import type { Concern, SkinType } from "@/domain/types";
import type { ProfileView } from "@/server/services/profile";
import type { ProfileSummary } from "./app-frame";

export const SKIN_LABEL: Record<SkinType, string> = {
  oily: "Pele oleosa",
  dry: "Pele seca",
  combination: "Pele mista",
  normal: "Pele normal",
  unknown: "Tipo de pele não informado",
};

export const CONCERN_LABEL: Record<Concern, string> = {
  acne: "acne",
  blackheads: "cravos",
  oiliness: "oleosidade",
  dryness: "ressecamento",
  redness: "vermelhidão",
  irritation: "irritação",
  dark_spots: "manchas",
  aging: "sinais do tempo",
  dullness: "viço",
};

function joinPt(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

export function summarizeProfile(view: ProfileView): ProfileSummary {
  if (!view.exists) return { exists: false, title: "Perfil não criado", detail: "Criar perfil →" };
  const p = view.profile;
  const parts = [p.sensitive === true && "sensível", p.concerns.length > 0 && `${p.concerns.length} objetivo(s)`].filter(Boolean);
  return { exists: true, title: SKIN_LABEL[p.skinType], detail: parts.join(" · ") || "Editar perfil" };
}

/** Frase natural sobre o perfil, ex.: "pele oleosa e sensível, cuidando de acne e oleosidade". */
export function profileSentence(view: ProfileView): string {
  const p = view.profile;
  const skin = p.skinType === "unknown" ? "sua pele" : SKIN_LABEL[p.skinType].toLowerCase();
  const withSensitivity = p.sensitive === true ? `${skin} e sensível` : skin;
  const concerns = p.concerns.map((c) => CONCERN_LABEL[c]);
  return concerns.length > 0 ? `${withSensitivity}, cuidando de ${joinPt(concerns)}` : withSensitivity;
}
