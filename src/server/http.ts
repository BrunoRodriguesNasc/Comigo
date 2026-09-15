import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./session";
import { logEvent } from "./log";

/** Envolve um handler de rota com tratamento uniforme de erros. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const data = await handler(...args);
      return data instanceof Response ? data : NextResponse.json(data ?? { ok: true });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: err.issues[0]?.message ?? "Dados inválidos.", issues: err.issues }, { status: 400 });
      }
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      logEvent("http.unhandled", { error: String(err), stack: err instanceof Error ? err.stack : undefined });
      return NextResponse.json({ error: "Algo deu errado. Tente novamente." }, { status: 500 });
    }
  };
}
