import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ledgerState } from "../../../db/schema";
import { createDefaultState, normalizeState } from "../../ledger/domain.js";

const LEDGER_ID = "main";

export async function GET() {
  try {
    const [stored] = await getDb()
      .select()
      .from(ledgerState)
      .where(eq(ledgerState.id, LEDGER_ID))
      .limit(1);

    if (!stored) {
      return Response.json({ state: createDefaultState(), etag: "0" });
    }

    return Response.json({ state: JSON.parse(stored.state), etag: stored.etag });
  } catch {
    return Response.json({ error: "تعذر قراءة بيانات الدفتر." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { state?: unknown; etag?: string | null };
    if (!payload.state) {
      return Response.json({ error: "بيانات الدفتر مطلوبة." }, { status: 400 });
    }

    const db = getDb();
    const [current] = await db
      .select({ etag: ledgerState.etag })
      .from(ledgerState)
      .where(eq(ledgerState.id, LEDGER_ID))
      .limit(1);

    if (current && payload.etag !== current.etag) {
      return Response.json(
        { error: "تم تعديل البيانات من جلسة أخرى. أعد تحميل الصفحة ثم حاول مجددًا." },
        { status: 409 },
      );
    }

    const normalized = normalizeState(payload.state);
    const etag = crypto.randomUUID();
    const values = {
      id: LEDGER_ID,
      state: JSON.stringify(normalized),
      etag,
      updatedAt: new Date(),
    };

    await db
      .insert(ledgerState)
      .values(values)
      .onConflictDoUpdate({
        target: ledgerState.id,
        set: { state: values.state, etag, updatedAt: values.updatedAt },
      });

    return Response.json({ state: normalized, etag });
  } catch {
    return Response.json({ error: "تعذر حفظ بيانات الدفتر." }, { status: 500 });
  }
}
