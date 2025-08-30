import { publicProcedure, router } from "@/lib/trpc";
import { SharedTypes } from "@/types/shared";
import { z } from "zod";
import {
  and,
  avg,
  lt,
  sum,
  count,
  gte,
  desc,
  asc,
  lte,
  sql,
  eq,
  max,
  min,
  isNotNull,
  inArray,
  or,
} from "drizzle-orm";
import { DB } from "@/db";
import { subDays } from "date-fns";
export const TimeRangeSchema = z.object({
  start: z.date().or(z.string().datetime()),
  end: z.date().or(z.string().datetime()),
  granularity: z.enum(["hour", "day", "week", "month"]),
});
export const TopInsightsInputSchema = z.object({
  timeRange: TimeRangeSchema.optional(),
  limit: z.number().min(1).max(50).default(20),
  minComments: z.number().min(1).default(5),
  business_unit: z.array(z.string()).optional().default([]),
  operational_area: z.array(z.string()).optional().default([]),
  source: z.array(z.string()).optional().default([]),
});

// Helper function to build dynamic filters
function buildFilters(input: any, startDate?: Date, endDate?: Date) {
  const conditions = [];

  // Time range filter
  if (startDate && endDate) {
    conditions.push(
      gte(DB.schema.comment_insights.created_at, startDate),
      lte(DB.schema.comment_insights.created_at, endDate)
    );
  }

  // Business unit filter - only if provided and not empty
  if (input.business_unit && input.business_unit.length > 0) {
    conditions.push(
      inArray(DB.schema.insights.business_unit, input.business_unit)
    );
  }

  // Operational area filter - only if provided and not empty  
  if (input.operational_area && input.operational_area.length > 0) {
    conditions.push(
      inArray(DB.schema.insights.operational_area, input.operational_area)
    );
  }

  // Source filter - only if provided and not empty
  if (input.source && input.source.length > 0) {
    conditions.push(
      inArray(DB.schema.comments.source, input.source)
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const analyticsRouters = router({
  // Get unique filter values from database
  getFilterOptions: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    
    // Get unique business units
    const businessUnitsResult = await db
      .selectDistinct({
        value: DB.schema.insights.business_unit,
      })
      .from(DB.schema.insights)
      .where(isNotNull(DB.schema.insights.business_unit));
    
    // Get unique operational areas
    const operationalAreasResult = await db
      .selectDistinct({
        value: DB.schema.insights.operational_area,
      })
      .from(DB.schema.insights)
      .where(isNotNull(DB.schema.insights.operational_area));
    
    // Get unique sources
    const sourcesResult = await db
      .selectDistinct({
        value: DB.schema.comments.source,
      })
      .from(DB.schema.comments)
      .where(isNotNull(DB.schema.comments.source));
    
    return {
      businessUnits: businessUnitsResult
        .map((r) => r.value)
        .filter((v): v is string => v !== null)
        .sort(),
      operationalAreas: operationalAreasResult
        .map((r) => r.value)
        .filter((v): v is string => v !== null)
        .sort(),
      sources: sourcesResult
        .map((r) => r.value)
        .filter((v): v is string => v !== null)
        .sort(),
    };
  }),

  topInsights: publicProcedure
    .input(TopInsightsInputSchema)
    .query(async ({ input, ctx }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = new Date(input.timeRange?.start || subDays(now, 30));
      const endDate = new Date(input.timeRange?.end || now);

      // Build dynamic filters
      const whereConditions = buildFilters(input, startDate, endDate);
      
      // Top by total comment volume
      const results = await db
        .select({
          insightId: DB.schema.insights.id,
          insightName: DB.schema.insights.name,
          description: DB.schema.insights.description,
          aiGenerated: DB.schema.insights.ai_generated,
          totalComments: count(DB.schema.comment_insights.id),
          avgConfidence: avg(DB.schema.comment_insights.confidence),
          highConfidence: sum(
            sql<number>`CASE WHEN ${DB.schema.comment_insights.confidence} >= 8 THEN 1 ELSE 0 END`
          ),
          mediumConfidence: sum(
            sql<number>`CASE WHEN ${DB.schema.comment_insights.confidence} >= 5 AND ${DB.schema.comment_insights.confidence} < 8 THEN 1 ELSE 0 END`
          ),
          lowConfidence: sum(
            sql<number>`CASE WHEN ${DB.schema.comment_insights.confidence} < 5 THEN 1 ELSE 0 END`
          ),
          lastSeenDate: max(DB.schema.comment_insights.created_at),
          emergenceDate: min(DB.schema.comment_insights.created_at),
          operational_area: DB.schema.insights.operational_area,
          business_unit: DB.schema.insights.business_unit,
        })
        .from(DB.schema.insights)
        .leftJoin(
          DB.schema.comment_insights,
          eq(DB.schema.insights.id, DB.schema.comment_insights.insight_id)
        )
        .leftJoin(
          DB.schema.comments,

          eq(DB.schema.comments.id, DB.schema.comment_insights.comment_id)
        )
        .where(whereConditions)
        .groupBy(DB.schema.insights.id)
        .having(gte(count(DB.schema.comment_insights.id), input.minComments))
        .orderBy(desc(count(DB.schema.comment_insights.id)))
        .limit(input.limit);

      return results.map((r) => ({
        id: r.insightId,
        name: r.insightName,
        description: r.description,
        operational_area: r.operational_area,
        business_unit: r.business_unit,
        emergent: r.aiGenerated,
        totalComments: r.totalComments,
        avgConfidence: Number(r.avgConfidence) || 0,
        lastSeenDate: r.lastSeenDate || new Date(),
        emergenceDate: r.emergenceDate || new Date(),
        growthRate: 0,
        confidenceDistribution: {
          high: Number(r.highConfidence) || 0,
          medium: Number(r.mediumConfidence) || 0,
          low: Number(r.lowConfidence) || 0,
        },
      }));
    }),

  intentDistribution: publicProcedure
    .input(TopInsightsInputSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = new Date(input.timeRange?.start || subDays(now, 30));
      const endDate = new Date(input.timeRange?.end || now);

      // Build dynamic filters for intentions
      const conditions = [];
      
      // Time range filter on comment_intentions
      if (startDate && endDate) {
        conditions.push(
          gte(DB.schema.comment_intentions.created_at, startDate),
          lte(DB.schema.comment_intentions.created_at, endDate)
        );
      }
      
      // Source filter
      if (input.source && input.source.length > 0) {
        conditions.push(
          inArray(DB.schema.comments.source, input.source)
        );
      }

      // For business unit and operational area, we need to join with comment_insights and insights
      const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

      // Get intention distribution - count of comments per intention type
      const intentionDistribution = await db
        .select({
          intentionId: DB.schema.intentions.id,
          type: DB.schema.intentions.type,
          name: DB.schema.intentions.name,
          description: DB.schema.intentions.description,
          count: count(DB.schema.comment_intentions.id),
        })
        .from(DB.schema.intentions)
        .leftJoin(
          DB.schema.comment_intentions,
          eq(DB.schema.intentions.id, DB.schema.comment_intentions.intention_id)
        )
        .leftJoin(
          DB.schema.comments,
          eq(DB.schema.comment_intentions.comment_id, DB.schema.comments.id)
        )
        .where(whereConditions)
        .groupBy(
          DB.schema.intentions.id,
          DB.schema.intentions.type,
          DB.schema.intentions.name,
          DB.schema.intentions.description
        )
        .orderBy(desc(count(DB.schema.comment_intentions.id)));

      // Format the response
      return intentionDistribution.map((item) => ({
        id: item.intentionId,
        type: item.type,
        name: item.name,
        description: item.description,
        count: Number(item.count) || 0,
      }));
    }),

  sentimentDistribution: publicProcedure
    .input(TopInsightsInputSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = new Date(input.timeRange?.start || subDays(now, 30));
      const endDate = new Date(input.timeRange?.end || now);

      // Build dynamic filters for sentiment
      const conditions = [];
      
      // Time range filter
      if (startDate && endDate) {
        conditions.push(
          gte(DB.schema.comment_insights.created_at, startDate),
          lte(DB.schema.comment_insights.created_at, endDate)
        );
      }
      
      // Business unit filter
      if (input.business_unit && input.business_unit.length > 0) {
        conditions.push(
          inArray(DB.schema.insights.business_unit, input.business_unit)
        );
      }
      
      // Operational area filter  
      if (input.operational_area && input.operational_area.length > 0) {
        conditions.push(
          inArray(DB.schema.insights.operational_area, input.operational_area)
        );
      }

      const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

      // Get sentiment distribution - count of comments per sentiment level
      const sentimentDistribution = await db
        .select({
          sentimentId: DB.schema.sentiment_levels.id,
          level: DB.schema.sentiment_levels.level,
          name: DB.schema.sentiment_levels.name,
          severity: DB.schema.sentiment_levels.severity,
          intensityValue: DB.schema.sentiment_levels.intensity_value,
          count: count(DB.schema.comment_insights.id),
        })
        .from(DB.schema.sentiment_levels)
        .leftJoin(
          DB.schema.comment_insights,
          eq(
            DB.schema.sentiment_levels.id,
            DB.schema.comment_insights.sentiment_level_id
          )
        )
        .leftJoin(
          DB.schema.insights,
          eq(
            DB.schema.insights.id,
            DB.schema.comment_insights.insight_id
          )
        )
        .leftJoin(
          DB.schema.comments,
          eq(
            DB.schema.comments.id,
            DB.schema.comment_insights.comment_id
          )
        )
        .where(whereConditions)
        .groupBy(
          DB.schema.sentiment_levels.id,
          DB.schema.sentiment_levels.level,
          DB.schema.sentiment_levels.name,
          DB.schema.sentiment_levels.severity,
          DB.schema.sentiment_levels.intensity_value
        )
        .orderBy(asc(DB.schema.sentiment_levels.intensity_value));

      // Format the response
      return sentimentDistribution.map((item) => ({
        id: item.sentimentId,
        level: item.level,
        name: item.name,
        severity: item.severity,
        intensityValue: item.intensityValue,
        count: Number(item.count) || 0,
      }));
    }),
});
