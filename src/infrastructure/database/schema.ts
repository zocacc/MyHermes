import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const captureStatus = pgEnum("capture_status", [
  "queued",
  "processing",
  "completed",
  "needs_review",
  "failed"
]);

export const itemType = pgEnum("item_type", ["note", "task", "reminder"]);
export const itemStatus = pgEnum("item_status", ["active"]);

export const captures = pgTable(
  "captures",
  {
    id: text("id").primaryKey(),
    externalUpdateId: text("external_update_id").notNull(),
    userId: text("user_id").notNull(),
    chatId: text("chat_id").notNull(),
    kind: text("kind").notNull(),
    rawText: text("raw_text").notNull(),
    locale: text("locale").notNull(),
    timeZone: text("time_zone").notNull(),
    status: captureStatus("status").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "string" }).notNull()
  },
  (table) => [
    uniqueIndex("captures_external_update_id_unique").on(table.externalUpdateId),
    index("captures_status_idx").on(table.status)
  ]
);

export const items = pgTable(
  "items",
  {
    id: text("id").primaryKey(),
    captureId: text("capture_id")
      .notNull()
      .references(() => captures.id, { onDelete: "cascade" }),
    type: itemType("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }),
    status: itemStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull()
  },
  (table) => [uniqueIndex("items_capture_id_unique").on(table.captureId)]
);
