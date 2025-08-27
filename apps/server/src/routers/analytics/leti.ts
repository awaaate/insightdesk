import { publicProcedure, router } from "@/lib/trpc";
import { SharedTypes } from "@/types/shared";
import { TRPCError } from "@trpc/server";
import {
  and,
  avg,
  lt,
  sum,
  count,
  gte,
  desc,
  lte,
  sql,
  eq,
  max,
  min,
} from "drizzle-orm";
import { DB } from "@/db";
import { subDays } from "date-fns";

export const letiRouter = router({
  topInsights: publicProcedure
    .input(SharedTypes.API.Analytics.LETI.Router.TopInsightsInputSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<SharedTypes.API.Analytics.LETI.InsightMetrics[]> => {
        if (input.metric === "growth") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Growth metric is not supported yet",
          });
        }
        const { db } = ctx;
        const now = new Date();
        const startDate = new Date(input.timeRange?.start || subDays(now, 30));
        const endDate = new Date(input.timeRange?.end || now);

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
          })
          .from(DB.schema.insights)
          .leftJoin(
            DB.schema.comment_insights,
            eq(DB.schema.insights.id, DB.schema.comment_insights.insight_id)
          )
          .where(
            and(
              gte(DB.schema.comment_insights.created_at, startDate),
              lte(DB.schema.comment_insights.created_at, endDate)
            )
          )
          .groupBy(DB.schema.insights.id)
          .having(gte(count(DB.schema.comment_insights.id), input.minComments))
          .orderBy(desc(count(DB.schema.comment_insights.id)))
          .limit(input.limit);

        return results.map((r) => ({
          id: r.insightId,
          name: r.insightName,
          description: r.description,
          aiGenerated: r.aiGenerated,
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
      }
    ),
  insightCorrelations: publicProcedure
    .input(SharedTypes.API.Analytics.LETI.Router.InsightCorrelationsInputSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<SharedTypes.API.Analytics.LETI.InsightCorrelation[]> => {
        const { db } = ctx;

        // First, get all comment-insight pairs within the time range
        const whereConditions = [];

        if (input.timeRange) {
          whereConditions.push(
            and(
              gte(
                DB.schema.comment_insights.created_at,
                new Date(input.timeRange.start)
              ),
              lte(
                DB.schema.comment_insights.created_at,
                new Date(input.timeRange.end)
              )
            )
          );
        }

        // Get all comment_insights with their insight details
        const commentInsights = await db
          .select({
            commentId: DB.schema.comment_insights.comment_id,
            insightId: DB.schema.comment_insights.insight_id,
            confidence: DB.schema.comment_insights.confidence,
            insightName: DB.schema.insights.name,
            insightDesc: DB.schema.insights.description,
          })
          .from(DB.schema.comment_insights)
          .innerJoin(
            DB.schema.insights,
            eq(DB.schema.comment_insights.insight_id, DB.schema.insights.id)
          )
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined
          );

        // Group by comment to find co-occurrences
        const commentGroups = new Map<
          string,
          Array<{
            insightId: number;
            insightName: string;
            insightDesc: string | null;
            confidence: number;
          }>
        >();

        for (const ci of commentInsights) {
          const key = ci.commentId?.toString() || "";
          if (!commentGroups.has(key)) {
            commentGroups.set(key, []);
          }
          commentGroups.get(key)!.push({
            insightId: ci.insightId || 0,
            insightName: ci.insightName,
            insightDesc: ci.insightDesc,
            confidence: ci.confidence || 0,
          });
        }

        // Calculate co-occurrences
        const correlationMap = new Map<
          string,
          {
            insightA: string;
            insightB: string;
            insightADesc: string;
            insightBDesc: string;
            coOccurrenceCount: number;
            confidenceSum: number;
            confidenceProducts: number[];
          }
        >();

        for (const insights of commentGroups.values()) {
          // Only process if there are multiple insights for this comment
          if (insights.length < 2) continue;

          // Generate all pairs
          for (let i = 0; i < insights.length; i++) {
            for (let j = i + 1; j < insights.length; j++) {
              const a = insights[i];
              const b = insights[j];

              // Filter by specific insight if requested
              if (
                input.insightId &&
                a.insightId !== input.insightId &&
                b.insightId !== input.insightId
              ) {
                continue;
              }

              // Create consistent key (smaller id first)
              const key =
                a.insightId < b.insightId
                  ? `${a.insightId}-${b.insightId}`
                  : `${b.insightId}-${a.insightId}`;

              const [first, second] =
                a.insightId < b.insightId ? [a, b] : [b, a];

              if (!correlationMap.has(key)) {
                correlationMap.set(key, {
                  insightA: first.insightName,
                  insightB: second.insightName,
                  insightADesc: first.insightDesc || "",
                  insightBDesc: second.insightDesc || "",
                  coOccurrenceCount: 0,
                  confidenceSum: 0,
                  confidenceProducts: [],
                });
              }

              const correlation = correlationMap.get(key)!;
              correlation.coOccurrenceCount++;
              const product = a.confidence * b.confidence;
              correlation.confidenceSum += product;
              correlation.confidenceProducts.push(product);
            }
          }
        }

        // Convert to array and filter by minimum co-occurrence
        const correlations = Array.from(correlationMap.values())
          .filter((c) => c.coOccurrenceCount >= input.minCoOccurrence)
          .map((c) => ({
            insightA: c.insightA,
            insightB: c.insightB,
            insightADesc: c.insightADesc,
            insightBDesc: c.insightBDesc,
            coOccurrenceCount: c.coOccurrenceCount,
            correlationScore: c.confidenceSum / c.coOccurrenceCount,
            confidenceCorrelation: 0, // Simplified - removed statistical correlation
          }))
          .sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount)
          .slice(0, input.limit);

        return correlations;
      }
    ),
});
