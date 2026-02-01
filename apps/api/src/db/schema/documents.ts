import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  checksum: text("checksum").notNull(),
  version: text("version"),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
});
