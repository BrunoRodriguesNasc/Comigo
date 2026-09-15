import { route } from "@/server/http";
import { renormalizeAllProducts } from "@/server/services/catalog";

export const POST = route(async () => {
  const count = await renormalizeAllProducts();
  return { ok: true, message: `${count} produto(s) re-normalizado(s).` };
});
