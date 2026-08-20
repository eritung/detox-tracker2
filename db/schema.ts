import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(), displayName: text("display_name").notNull(), toxinType: text("toxin_type").notNull(), startDate: text("start_date").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
export const checkins = sqliteTable("checkins", {
  userId: text("user_id").notNull(), day: integer("day").notNull(), completedJson: text("completed_json").notNull().default("[]"), sleepAt: text("sleep_at").notNull().default(""), wakeAt: text("wake_at").notNull().default(""), morningMood: text("morning_mood").notNull().default(""), morningNote: text("morning_note").notNull().default(""), eveningMood: text("evening_mood").notNull().default(""), eveningNote: text("evening_note").notNull().default(""), updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.day] }), index("idx_checkins_user_day").on(table.userId, table.day)]);
