import { router, publicProcedure } from "@/lib/trpc";
import { DB } from "@/db";
import { SharedTypes } from "@/types/shared";
import { desc, eq, inArray, sql } from "drizzle-orm";

export const insightsRouter = router({
  list: publicProcedure
    .input(SharedTypes.Domain.Insight.ListInputSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<SharedTypes.API.Insights.ListResponse> => {
        const { db } = ctx;
        const limit = input?.limit ?? 20;
        const offset = input?.offset ?? 0;

        try {
          let query = db
            .select({
              insight: DB.schema.insights,
              commentCount: sql<number>`count(${DB.schema.comment_insights.id})`,
            })
            .from(DB.schema.insights)
            .leftJoin(
              DB.schema.comment_insights,
              sql`${DB.schema.insights.id} = ${DB.schema.comment_insights.insight_id}`
            )
            .groupBy(DB.schema.insights.id)
            .orderBy(desc(DB.schema.insights.created_at))
            .limit(limit)
            .offset(offset);

          if (input?.onlyAiGenerated !== undefined) {
            query = query.where(
              eq(DB.schema.insights.ai_generated, input.onlyAiGenerated)
            );
          }

          const insights = await query;

          const [totalResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.insights);

          const total = Number(totalResult?.count ?? 0);

          return {
            insights: insights.map((item) => ({
              ...item.insight,
              commentCount: Number(item.commentCount),
            })),
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total,
            },
          };
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : "Failed to list insights"
          );
        }
      }
    ),

  getByIds: publicProcedure
    .input(SharedTypes.Domain.Insight.GetByIdsInputSchema)
    .query(
      async ({ ctx, input }): Promise<SharedTypes.Domain.Insight.Entity[]> => {
        return DB.client
          .select()
          .from(DB.schema.insights)
          .where(inArray(DB.schema.insights.id, input.ids));
      }
    ),

  getWithComments: publicProcedure
    .input(SharedTypes.API.Insights.GetWithCommentsInputSchema)
    .query(
      async ({
        ctx,
        input,
      }): Promise<SharedTypes.Domain.Insight.WithComments> => {
        const { db } = ctx;
        try {
          const result = await db
            .select({
              insight: DB.schema.insights,
              comment: DB.schema.comments,
            })
            .from(DB.schema.insights)
            .leftJoin(
              DB.schema.comment_insights,
              sql`${DB.schema.insights.id} = ${DB.schema.comment_insights.insight_id}`
            )
            .leftJoin(
              DB.schema.comments,
              sql`${DB.schema.comment_insights.comment_id} = ${DB.schema.comments.id}`
            )
            .where(sql`${DB.schema.insights.id} = ${input.insightId}`);

          if (result.length === 0) {
            throw new Error("Insight not found");
          }

          const insight = result[0].insight;
          const comments = result
            .filter((r) => r.comment !== null)
            .map((r) => r.comment!);

          return {
            insight,
            comments,
          };
        } catch (error) {
          throw new Error(
            error instanceof Error
              ? error.message
              : "Failed to get insight with comments"
          );
        }
      }
    ),

  stats: publicProcedure.query(
    async ({ ctx }): Promise<SharedTypes.Domain.Insight.Stats> => {
      const { db } = ctx;
      try {
        const [
          totalInsights,
          aiGeneratedInsights,
          avgCommentsPerInsight,
          recentInsights,
        ] = await Promise.all([
          // Total insights
          db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.insights)
            .then((r) => Number(r[0]?.count ?? 0)),

          // AI generated insights
          db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.insights)
            .where(sql`${DB.schema.insights.ai_generated} = true`)
            .then((r) => Number(r[0]?.count ?? 0)),

          // Average comments per insight
          db
            .select({
              avg: sql<number>`avg(comment_count)`,
            })
            .from(
              sql`(
              SELECT ${DB.schema.insights.id}, count(${DB.schema.comment_insights.id}) as comment_count
              FROM ${DB.schema.insights}
              LEFT JOIN ${DB.schema.comment_insights} ON ${DB.schema.insights.id} = ${DB.schema.comment_insights.insight_id}
              GROUP BY ${DB.schema.insights.id}
            ) as counts`
            )
            .then((r) => Number(r[0]?.avg ?? 0)),

          // Recent insights (last 24h)
          db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.insights)
            .where(
              sql`${DB.schema.insights.created_at} > now() - interval '24 hours'`
            )
            .then((r) => Number(r[0]?.count ?? 0)),
        ]);

        return {
          totalInsights,
          aiGeneratedInsights,
          manualInsights: totalInsights - aiGeneratedInsights,
          avgCommentsPerInsight: Math.round(avgCommentsPerInsight),
          recentInsights,
          aiGenerationRate:
            totalInsights > 0
              ? Math.round((aiGeneratedInsights / totalInsights) * 100)
              : 0,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to get insight stats"
        );
      }
    }
  ),
});
