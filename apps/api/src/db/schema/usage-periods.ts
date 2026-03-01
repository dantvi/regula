import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const usagePeriods = pgTable("usage_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  tokenLimit: integer("token_limit").notNull().default(0),
  tokensUsed: integer("tokens_used").notNull().default(0),
  requestLimit: integer("request_limit").notNull(),
  requestsUsed: integer("requests_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
