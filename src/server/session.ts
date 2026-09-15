import { cookies } from "next/headers";
import { db } from "./db";

export const USER_COOKIE = "uid";
export const USER_ID_PATTERN = /^[a-zA-Z0-9-]{16,64}$/;

/** Id anônimo do dispositivo (cookie criado no middleware). */
export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  const id = store.get(USER_COOKIE)?.value;
  return id && USER_ID_PATTERN.test(id) ? id : null;
}

/** Garante que o usuário anônimo existe no banco e devolve o id. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new HttpError(401, "Sessão ausente. Recarregue a página.");
  await db.user.upsert({ where: { id }, update: {}, create: { id } });
  return id;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
