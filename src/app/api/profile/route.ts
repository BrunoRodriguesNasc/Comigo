import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { deleteUserData, getProfileView, saveProfile } from "@/server/services/profile";
import { getUserId, requireUserId, USER_COOKIE } from "@/server/session";
import { profileInputSchema } from "@/server/validation";

export const GET = route(async () => getProfileView(await getUserId()));

export const PUT = route(async (req: Request) => {
  const userId = await requireUserId();
  const input = profileInputSchema.parse(await req.json());
  return saveProfile(userId, input);
});

export const DELETE = route(async () => {
  const userId = await getUserId();
  if (userId) await deleteUserData(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE);
  return res;
});
