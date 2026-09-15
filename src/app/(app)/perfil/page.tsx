import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const view = await getProfileView(await getUserId());
  return <ProfileForm initial={view} />;
}
