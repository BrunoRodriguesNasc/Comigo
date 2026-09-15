import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const view = await getProfileView(await getUserId());
  return (
    <AppShell hideNav={!view.exists}>
      <ProfileForm initial={view} />
    </AppShell>
  );
}
