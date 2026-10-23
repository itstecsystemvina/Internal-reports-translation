import { boolean, date, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { ReportContent, Role, TranslationStatus } from "@/lib/types";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<Role>().notNull().default("employee"),
  passwordHash: text("password_hash").notNull(),
  department: text("department"),
  position: text("position"),
  // Order of employees in the tracker and in exported documents.
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  // Whether this person appears in the weekly submission tracker.
  tracked: boolean("tracked").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Monday of the reported week, YYYY-MM-DD.
    weekStart: date("week_start", { mode: "string" }).notNull(),
    content: jsonb("content").$type<ReportContent>().notNull(),
    translation: jsonb("translation").$type<ReportContent>(),
    translationStatus: text("translation_status").$type<TranslationStatus>().notNull().default("pending"),
    translationError: text("translation_error"),
    translatedAt: timestamp("translated_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("reports_user_week").on(t.userId, t.weekStart)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export type User = typeof users.$inferSelect;
export type Report = typeof reports.$inferSelect;
