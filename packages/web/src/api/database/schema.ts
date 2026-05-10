import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentType: text("agent_type").notNull(), // blog | seo | price | image
  title: text("title").notNull(),
  input: text("input").notNull(), // JSON string with task-specific params
  status: text("status").notNull().default("pending"), // pending | running | done | error
  result: text("result"), // JSON string with output
  logs: text("logs").default("[]"), // JSON array of log lines
  scheduledAt: text("scheduled_at"), // ISO string, null = run now
  cronExpression: text("cron_expression"), // e.g. "0 9 * * *" for daily 9am
  nextRunAt: integer("next_run_at", { mode: "timestamp" }), // next scheduled run
  telegramChatId: text("telegram_chat_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
