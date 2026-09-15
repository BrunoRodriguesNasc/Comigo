import { AppFrame } from "@/components/app-frame";
import { summarizeProfile } from "@/components/labels";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const view = await getProfileView(await getUserId());
  return <AppFrame profile={summarizeProfile(view)}>{children}</AppFrame>;
}
