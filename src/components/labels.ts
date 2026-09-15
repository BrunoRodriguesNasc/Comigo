import type { SkinType } from "@/domain/types";
import type { ProfileView } from "@/server/services/profile";
import type { ProfileSummary } from "./app-frame";

export const SKIN_LABEL: Record<SkinType, string> = {
  oily: "Pele oleosa",
  dry: "Pele seca",
  combination: "Pele mista",
  normal: "Pele normal",
  unknown: "Tipo de pele não informado",
};

export function summarizeProfile(view: ProfileView): ProfileSummary {
  if (!view.exists) return { exists: false, title: "Perfil não criado", detail: "Criar perfil →" };
  const p = view.profile;
  const parts = [p.sensitive === true && "sensível", p.concerns.length > 0 && `${p.concerns.length} objetivo(s)`].filter(Boolean);
  return { exists: true, title: SKIN_LABEL[p.skinType], detail: parts.join(" · ") || "Editar perfil" };
}
