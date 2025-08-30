import { router, publicProcedure } from "@/lib/trpc";
import { DB } from "@/db";
import { SharedTypes } from "@/types/shared";
import {
  desc,
  eq,
  and,
  gte,
  lte,
  inArray,
  sql,
  isNotNull,
  ilike,
} from "drizzle-orm";
import { z } from "zod";

export const ExtendedFilterSchema = z.object({
  // Basic filters
  searchText: z.string().optional(), // Text search in comment content
  // Date range filters
  startDate: z.date().or(z.string().datetime()).optional(),
  endDate: z.date().or(z.string().datetime()).optional(),
  // Insight filters
  insightId: z.number().optional(),
  insightIds: z.array(z.number()).optional(),
  hasInsights: z.boolean().optional(),
  // Intention filters
  intentionId: z.number().optional(),
  intentionType: z.string().optional(),
  hasIntention: z.boolean().optional(),
  // Sentiment filters
  sentimentLevelId: z.number().optional(),
  sentimentLevels: z.array(z.string()).optional(),
  sentimentSeverity: z.string().optional(),
  minConfidence: z.number().min(0).max(10).optional(),

  business_unit: z.array(z.string()).optional().default([]),
  operational_area: z.array(z.string()).optional().default([]),
  source: z.array(z.string()).optional().default([]),
});

const ExtendedListInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  filter: SharedTypes.Domain.Comment.ExtendedFilterSchema.optional(),
  includeRelations: z.boolean().default(false),
  sortBy: z
    .enum(["created_at", "updated_at", "sentiment_intensity", "confidence"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const v2CommentsRouter = router({
  listWithRelations: publicProcedure
    .input(ExtendedListInputSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const filter = input?.filter;
      const sortBy = input?.sortBy ?? "created_at";
      const sortOrder = input?.sortOrder ?? "desc";

      try {
        // Build main query with INNER JOINs to force all relationships
        const baseQuery = ctx.db
          .select({
            // Comment fields
            comment_id: DB.schema.comments.id,
            comment_content: DB.schema.comments.content,
            comment_source: DB.schema.comments.source,
            comment_created_at: DB.schema.comments.created_at,
            comment_updated_at: DB.schema.comments.updated_at,
            // Insight fields
            insight_id: DB.schema.insights.id,
            insight_name: DB.schema.insights.name,
            insight_description: DB.schema.insights.description,
            insight_business_unit: DB.schema.insights.business_unit,
            insight_ai_generated: DB.schema.insights.ai_generated,
            // Comment-Insight relation fields
            ci_confidence: DB.schema.comment_insights.confidence,
            ci_sentiment_level_id:
              DB.schema.comment_insights.sentiment_level_id,
            ci_sentiment_confidence:
              DB.schema.comment_insights.sentiment_confidence,
            ci_emotional_drivers: DB.schema.comment_insights.emotional_drivers,
            ci_sentiment_reasoning:
              DB.schema.comment_insights.sentiment_reasoning,
            ci_reasoning: DB.schema.comment_insights.reasoning,
            // Sentiment fields
            sentiment_level: DB.schema.sentiment_levels.level,
            sentiment_name: DB.schema.sentiment_levels.name,
            sentiment_severity: DB.schema.sentiment_levels.severity,
            sentiment_intensity: DB.schema.sentiment_levels.intensity_value,
            // Intention fields
            intention_id: DB.schema.intentions.id,
            intention_type: DB.schema.intentions.type,
            intention_name: DB.schema.intentions.name,
            intention_description: DB.schema.intentions.description,
            ci2_primary_intention:
              DB.schema.comment_intentions.primary_intention,
            ci2_secondary_intentions:
              DB.schema.comment_intentions.secondary_intentions,
            ci2_confidence: DB.schema.comment_intentions.confidence,
            ci2_reasoning: DB.schema.comment_intentions.reasoning,
            ci2_context_factors: DB.schema.comment_intentions.context_factors,
          })
          .from(DB.schema.comments)
          // INNER JOIN to force comment-insight relationship
          .innerJoin(
            DB.schema.comment_insights,
            eq(DB.schema.comments.id, DB.schema.comment_insights.comment_id)
          )
          // INNER JOIN to force insights exist
          .innerJoin(
            DB.schema.insights,
            eq(DB.schema.comment_insights.insight_id, DB.schema.insights.id)
          )
          // INNER JOIN to force sentiment exists
          .innerJoin(
            DB.schema.sentiment_levels,
            eq(
              DB.schema.comment_insights.sentiment_level_id,
              DB.schema.sentiment_levels.id
            )
          )
          // INNER JOIN to force intention exists
          .innerJoin(
            DB.schema.comment_intentions,
            eq(DB.schema.comments.id, DB.schema.comment_intentions.comment_id)
          )
          .innerJoin(
            DB.schema.intentions,
            eq(
              DB.schema.comment_intentions.intention_id,
              DB.schema.intentions.id
            )
          );

        // Apply filters
        const conditions = [];

        if (filter) {
          // Text search filter
          if (filter.searchText && filter.searchText.trim() !== "") {
            conditions.push(
              ilike(DB.schema.comments.content, `%${filter.searchText.trim()}%`)
            );
          }

          // Date filters
          if (filter.startDate) {
            conditions.push(
              gte(DB.schema.comments.created_at, new Date(filter.startDate))
            );
          }
          if (filter.endDate) {
            conditions.push(
              lte(DB.schema.comments.created_at, new Date(filter.endDate))
            );
          }

          // Source filter (from comments table)
          if (filter.source) {
            conditions.push(eq(DB.schema.comments.source, filter.source));
          }

          // Business Unit filter (from insights table)
          if (filter.businessUnit) {
            conditions.push(
              eq(DB.schema.insights.business_unit, filter.businessUnit)
            );
          }

          // Insight filter
          if (filter.insightId) {
            conditions.push(eq(DB.schema.insights.id, filter.insightId));
          }

          // Intention type filter
          if (filter.intentionType) {
            conditions.push(
              eq(DB.schema.intentions.type, filter.intentionType as any)
            );
          }

          // Sentiment level filter
          if (filter.sentimentLevels && filter.sentimentLevels.length > 0) {
            conditions.push(
              inArray(
                DB.schema.sentiment_levels.level,
                filter.sentimentLevels as any
              )
            );
          }

          // Confidence filter
          if (filter.minConfidence) {
            conditions.push(
              gte(
                DB.schema.comment_insights.confidence,
                filter.minConfidence / 10
              )
            );
          }
        }

        // Apply where clause if conditions exist
        if (conditions.length > 0) {
          baseQuery.where(and(...conditions));
        }

        // Execute query to get all data
        const rawResults = await baseQuery;

        // Count total for pagination (needs separate query)
        const countQuery = ctx.db
          .select({
            count: sql<number>`count(distinct ${DB.schema.comments.id})`,
          })
          .from(DB.schema.comments)
          .innerJoin(
            DB.schema.comment_insights,
            eq(DB.schema.comments.id, DB.schema.comment_insights.comment_id)
          )
          .innerJoin(
            DB.schema.insights,
            eq(DB.schema.comment_insights.insight_id, DB.schema.insights.id)
          )
          .innerJoin(
            DB.schema.sentiment_levels,
            eq(
              DB.schema.comment_insights.sentiment_level_id,
              DB.schema.sentiment_levels.id
            )
          )
          .innerJoin(
            DB.schema.comment_intentions,
            eq(DB.schema.comments.id, DB.schema.comment_intentions.comment_id)
          )
          .innerJoin(
            DB.schema.intentions,
            eq(
              DB.schema.comment_intentions.intention_id,
              DB.schema.intentions.id
            )
          );

        if (conditions.length > 0) {
          countQuery.where(and(...conditions));
        }

        const [totalResult] = await countQuery;
        const total = Number(totalResult?.count ?? 0);

        // Group results by comment
        const commentsMap = new Map<string, any>();

        rawResults.forEach((row) => {
          const commentId = row.comment_id;

          if (!commentsMap.has(commentId)) {
            commentsMap.set(commentId, {
              id: commentId,
              content: row.comment_content,
              source: row.comment_source,
              created_at: row.comment_created_at,
              updated_at: row.comment_updated_at,
              insights: [],
              intention: {
                id: row.intention_id,
                type: row.intention_type,
                name: row.intention_name,
                description: row.intention_description,
                primary_intention: row.ci2_primary_intention,
                secondary_intentions: row.ci2_secondary_intentions,
                confidence: row.ci2_confidence,
                reasoning: row.ci2_reasoning,
                context_factors: row.ci2_context_factors,
              },
            });
          }

          const comment = commentsMap.get(commentId);

          // Add insight if not already added (handle multiple rows per comment)
          const existingInsight = comment.insights.find(
            (i: any) => i.id === row.insight_id
          );
          if (!existingInsight) {
            comment.insights.push({
              id: row.insight_id,
              name: row.insight_name,
              description: row.insight_description,
              business_unit: row.insight_business_unit,
              ai_generated: row.insight_ai_generated,
              confidence: row.ci_confidence,
              reasoning: row.ci_reasoning,
              sentiment_level_id: row.ci_sentiment_level_id,
              sentiment_confidence: row.ci_sentiment_confidence,
              emotional_drivers: row.ci_emotional_drivers,
              sentiment_reasoning: row.ci_sentiment_reasoning,
              sentiment_level: row.sentiment_level,
              sentiment_name: row.sentiment_name,
              sentiment_severity: row.sentiment_severity,
              sentiment_intensity: row.sentiment_intensity,
            });
          }
        });

        // Convert to array and apply pagination
        let allComments = Array.from(commentsMap.values());

        // Sort
        const sortColumn =
          sortBy === "created_at" || sortBy === "updated_at"
            ? sortBy
            : "created_at";
        allComments.sort((a, b) => {
          const aVal = new Date(a[sortColumn]).getTime();
          const bVal = new Date(b[sortColumn]).getTime();
          return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        });

        // Paginate
        const paginatedComments = allComments.slice(offset, offset + limit);

        return {
          comments: paginatedComments,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to list comments"
        );
      }
    }),
});
