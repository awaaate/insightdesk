import type { DB } from "@/db";
import { SharedTypes } from "@/types/shared";
import { z } from "zod";
import { logger } from "@/lib/logger";

export namespace Schemas {
  // Use SharedTypes for consistency
  export const NewInsightSchema = SharedTypes.Domain.Insight.NewInsightSchema;
  export type NewInsight = SharedTypes.Domain.Insight.NewInsight;

  /**
   * LETI - Insight Detection Agent Schema
   * Detects both predefined and emergent insights in comments
   */
  export interface CreateInsightDetectionParams {
    insights: Omit<DB.Insight.Insert, "_id" | "createdAt" | "updatedAt">[];
  }

  export const createInsightDetectionSchema = (
    params: CreateInsightDetectionParams
  ) => {
    const validInsightNames = params.insights.map((i) => i.name);

    return z.object({
      results: z
        .array(
          z.object({
            commentIndex: z.number().describe("0-based index of the comment"),
            detectedInsights: z
              .array(
                z.object({
                  insightName: z.string().describe("Name of detected insight"),
                  confidence: z
                    .number()
                    .min(0)
                    .max(10)
                    .describe("Detection confidence (0-10)"),
                  isEmergent: z
                    .boolean()
                    .describe("True if this is a new/emergent insight"),
                  reasoning: z
                    .string()
                    .describe("Why this insight was detected"),
                })
              )
              .default([])
              .describe("All insights detected in this comment"),
            suggestedNewInsights: z
              .array(NewInsightSchema)
              .default([])
              .describe("New insights that should be created"),
          })
        )
        .default([]),
    });
  };

  /**
   * GRO - Intention Detection Agent Schema
   * Identifies the underlying motivation/objective behind comments
   */
  export const IntentionTypeSchema = z.enum([
    "resolve",
    "complain",
    "compare",
    "cancel",
    "inquire",
    "praise",
    "suggest",
    "other",
  ]);

  export const createIntentionDetectionSchema = () => {
    return z.object({
      results: z
        .array(
          z.object({
            commentIndex: z.number().describe("0-based index of the comment"),
            primaryIntention: IntentionTypeSchema.describe(
              "Main intention detected"
            ),
            secondaryIntentions: z
              .array(IntentionTypeSchema)
              .default([])
              .describe("Additional intentions present"),
            confidence: z
              .number()
              .min(0)
              .max(10)
              .describe("Confidence in detection (0-10)"),
            reasoning: z.string().describe("Why this intention was identified"),
            contextFactors: z
              .string()
              .describe("What factors drove this intention"),
          })
        )
        .default([]),
    });
  };

  /**
   * PIX - Sentiment Analysis Agent Schema with PIXE Scale
   * Analyzes emotional intensity per detected insight using dynamic sentiment levels
   */
  export interface CreateSentimentAnalysisParams {
    commentInsightPairs: Array<{
      commentIndex: number;
      insightName: string;
    }>;
    sentimentLevels: Array<{
      level: string;
      name: string;
      severity: string;
    }>;
  }

  export const createSentimentAnalysisSchema = (
    params: CreateSentimentAnalysisParams
  ) => {
    // Create enum from available sentiment levels
    const validLevels = params.sentimentLevels.map((s) => s.level);

    return z.object({
      results: z
        .array(
          z.object({
            commentIndex: z.number().describe("0-based index of the comment"),
            insightName: z
              .string()
              .describe("Name of the insight being analyzed"),
            sentimentLevel: z
              .enum([validLevels[0], ...validLevels.slice(1)])
              .describe("Detected sentiment level from PIXE scale"),
            confidence: z
              .number()
              .min(0)
              .max(10)
              .describe("Confidence in sentiment detection (0-10)"),
            emotionalDrivers: z
              .array(z.string())
              .default([])
              .describe("Key emotional factors detected"),
            reasoning: z
              .string()
              .describe("Explanation of why this sentiment level was detected"),
          })
        )
        .default([]),
    });
  };

  // Type exports for the new schemas
  export type InsightDetection = z.infer<
    ReturnType<typeof createInsightDetectionSchema>
  >["results"];

  export type IntentionDetection = z.infer<
    ReturnType<typeof createIntentionDetectionSchema>
  >["results"];

  export type SentimentAnalysis = z.infer<
    ReturnType<typeof createSentimentAnalysisSchema>
  >["results"];
}
