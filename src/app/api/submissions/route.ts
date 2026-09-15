import { db } from "@/server/db";
import { route } from "@/server/http";
import { requireUserId } from "@/server/session";
import { submissionSchema } from "@/server/validation";

export const POST = route(async (req: Request) => {
  const userId = await requireUserId();
  const input = submissionSchema.parse(await req.json());
  const sub = await db.productSubmission.create({
    data: {
      userId,
      barcode: input.barcode || null,
      brandName: input.brandName || null,
      productName: input.productName,
      ingredientsRaw: input.ingredientsRaw,
    },
  });
  return { ok: true, id: sub.id };
});
