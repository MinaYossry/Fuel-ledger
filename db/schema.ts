import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ledgerState = sqliteTable("ledger_state", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  etag: text("etag").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
