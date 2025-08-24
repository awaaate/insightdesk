import type { DB } from "@/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

export namespace Schemas {
  /**
   * Legacy create function for backward compatibility
   */
  export interface CreateCommentAnalysisParams {
    insights: Omit<DB.Insight.Insert, "_id" | "createdAt" | "updatedAt">[];
  }

  /**
   * Helper function to find the closest matching insight name
   * Uses simple string similarity to handle minor variations
   */
  export function findClosestInsightMatch(
    input: string, 
    validInsights: string[],
    logger?: { warn: (msg: string, data?: any) => void }
  ): string | null {
    if (input === "No insight") return input;
    
    // Direct match first
    if (validInsights.includes(input)) return input;
    
    // Normalize for comparison (lowercase, trim)
    const normalizedInput = input.toLowerCase().trim();
    
    // Look for exact case-insensitive match
    const exactMatch = validInsights.find(
      insight => insight.toLowerCase().trim() === normalizedInput
    );
    if (exactMatch) {
      if (logger && input !== exactMatch) {
        logger.warn("Fixed case mismatch in insight name", { input, matched: exactMatch });
      }
      return exactMatch;
    }
    
    // Look for substring matches
    const substringMatch = validInsights.find(
      insight => 
        insight.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(insight.toLowerCase())
    );
    if (substringMatch) {
      if (logger) {
        logger.warn("Used fuzzy matching for insight name", { input, matched: substringMatch });
      }
      return substringMatch;
    }
    
    // If no match found, log and return null (will be filtered out)
    if (logger) {
      logger.warn("No matching insight found", { 
        input, 
        availableInsights: validInsights.slice(0, 5) + (validInsights.length > 5 ? '...' : '')
      });
    }
    return null;
  }

  export const NewInsightSchema = z.object({
    name: z.string().describe("Name of the new insight"),
    description: z.string().describe("Description of the new insight"),
  });

  export type NewInsight = z.infer<typeof NewInsightSchema>;

  /**
   * Create schema for the complete analysis response
   */
  export const createCommentAnalysisSchema = (
    params: CreateCommentAnalysisParams
  ) => {
    // Create enum with "No insight" option and existing insights
    const insightOptions = ["No insight", ...params.insights.map((i) => i.name)] as [string, ...string[]];
    const validInsightNames = params.insights.map((i) => i.name);
    
    return z.object({
      results: z.array(
        z.object({
          commentIndex: z.number().describe("0-based index of the comment"),
          existingInsights: z
            .array(z.string())
            .describe("Array of matching existing insight names or 'No insight' if none match")
            .transform((values) => {
              // Filter and validate insight names, attempting to match close variants
              return values
                .map(val => findClosestInsightMatch(val, insightOptions, logger))
                .filter((v): v is string => v !== null)
                .filter((v) => v !== "No insight"); // Remove "No insight" from final result
            }),
          newInsights: z
            .array(NewInsightSchema)
            .describe("Array of new insight categories needed"),
          confidence: z
            .number()
            .min(0)
            .max(10)
            .describe("Confidence in categorization (0-10)"),
          explanation: z
            .string()
            .describe("Brief explanation of categorization (20-100 chars)"),
        })
      ),
    });
  };

  export type CommentAnalysis = z.infer<
    ReturnType<typeof createCommentAnalysisSchema>
  >["results"];
}
