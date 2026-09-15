/** Log estruturado (JSON por linha). Pronto para ser coletado por qualquer agregador. */
export function logEvent(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export async function timed<T>(event: string, fn: () => Promise<T>, data: Record<string, unknown> = {}): Promise<T> {
  const start = performance.now();
  try {
    const out = await fn();
    logEvent(event, { ...data, ms: Math.round(performance.now() - start) });
    return out;
  } catch (err) {
    logEvent(`${event}.error`, { ...data, ms: Math.round(performance.now() - start), error: String(err) });
    throw err;
  }
}
