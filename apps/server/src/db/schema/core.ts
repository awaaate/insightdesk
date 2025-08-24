import { boolean, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey(),
  content: text("content").notNull(),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  description: text("description").notNull(),
  ai_generated: boolean("ai_generated").notNull().default(false),
  business_unit: text("business_unit"),
  operational_area: text("operational_area"),
  external_id: text("external_id"),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const comment_insights = pgTable("comment_insights", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  comment_id: uuid("comment_id").references(() => comments.id),
  insight_id: serial("insight_id").references(() => insights.id),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;

export type CommentInsight = typeof comment_insights.$inferSelect;
export type NewCommentInsight = typeof comment_insights.$inferInsert;
