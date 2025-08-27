import {
  boolean,
  pgTable,
  serial,
  text,
  uuid,
  integer,
  real,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source"),

  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
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

// Enum for intention types
export const intentionTypeEnum = pgEnum("intention_type", [
  "resolve",
  "complain",
  "compare",
  "cancel",
  "inquire",
  "praise",
  "suggest",
  "other",
]);

// Enum for sentiment levels (PIXE scale)
export const sentimentLevelEnum = pgEnum("sentiment_level", [
  // Negative sentiments (90% of comments)
  "doubt", // Level 1: Initial uncertainty
  "concern", // Level 2: Growing unease
  "annoyance", // Level 3: First clear irritation
  "frustration", // Level 4: Loss of patience
  "anger", // Level 5: Manifest anger
  "outrage", // Level 6: Sense of injustice
  "contempt", // Level 7: Total rejection
  "fury", // Level 8: Emotional explosion
  // Neutral sentiment (8% of comments)
  "neutral", // Level 0: No emotional charge
  // Positive sentiments (2% of comments)
  "satisfaction", // Level +1: Expectations met
  "gratitude", // Level +2: Explicit recognition
]);

// Enum for sentiment severity
export const sentimentSeverityEnum = pgEnum("sentiment_severity", [
  "positive",
  "none",
  "low",
  "medium",
  "high",
  "critical",
]);

// Catalog of possible intentions
export const intentions = pgTable("intentions", {
  id: serial("id").primaryKey(),
  type: intentionTypeEnum("type").notNull(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Catalog of sentiment levels (PIXE scale)
export const sentiment_levels = pgTable("sentiment_levels", {
  id: serial("id").primaryKey(),
  level: sentimentLevelEnum("level").notNull().unique(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  severity: sentimentSeverityEnum("severity").notNull(),
  intensity_value: integer("intensity_value").notNull(), // Numeric value for sorting/comparison
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Comment-Insight relationship with sentiment data (for PIX agent)
export const comment_insights = pgTable("comment_insights", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  comment_id: uuid("comment_id").references(() => comments.id),
  insight_id: integer("insight_id").references(() => insights.id),
  // LETI agent fields
  confidence: real("confidence"), // 0-10 confidence score
  detected_by: text("detected_by"), // 'leti', 'manual', etc.
  // PIX agent fields - sentiment per insight
  sentiment_level_id: integer("sentiment_level_id").references(
    () => sentiment_levels.id
  ),
  sentiment_confidence: real("sentiment_confidence"), // 0-10 confidence in sentiment detection
  emotional_drivers: text("emotional_drivers").array(), // Key emotional factors detected
  sentiment_reasoning: text("sentiment_reasoning"), // Explanation of sentiment analysis
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Comment intentions (for GRO agent)
export const comment_intentions = pgTable("comment_intentions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  comment_id: uuid("comment_id")
    .notNull()
    .unique()
    .references(() => comments.id),
  intention_id: integer("intention_id").references(() => intentions.id),
  primary_intention: text("primary_intention").notNull(), // Main intention detected
  secondary_intentions: text("secondary_intentions").array(), // Additional intentions
  confidence: real("confidence").notNull(), // 0-10 confidence score
  reasoning: text("reasoning"), // AI explanation of why this intention
  context_factors: text("context_factors"), // What drove this intention
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Agent processing logs
export const agent_processing_logs = pgTable(
  "agent_processing_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    job_id: text("job_id").notNull(), // Job ID from the queue system
    comment_id: uuid("comment_id")
      .references(() => comments.id)
      .notNull(),
    agent_name: text("agent_name").notNull(), // 'leti', 'gro', 'pix'
    processing_time_ms: integer("processing_time_ms"),
    success: boolean("success").notNull(),
    error_message: text("error_message"),
    metadata: text("metadata"), // JSON string with additional data
    created_at: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    // Ensure unique combination of job_id, comment_id, and agent_name
    unique_job_comment_agent: unique().on(
      table.job_id,
      table.comment_id,
      table.agent_name
    ),
  })
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;

export type Intention = typeof intentions.$inferSelect;
export type NewIntention = typeof intentions.$inferInsert;

export type SentimentLevel = typeof sentiment_levels.$inferSelect;
export type NewSentimentLevel = typeof sentiment_levels.$inferInsert;

export type CommentInsight = typeof comment_insights.$inferSelect;
export type NewCommentInsight = typeof comment_insights.$inferInsert;

export type CommentIntention = typeof comment_intentions.$inferSelect;
export type NewCommentIntention = typeof comment_intentions.$inferInsert;

export type AgentProcessingLog = typeof agent_processing_logs.$inferSelect;
export type NewAgentProcessingLog = typeof agent_processing_logs.$inferInsert;
