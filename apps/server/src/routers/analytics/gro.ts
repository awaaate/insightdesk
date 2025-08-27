import { DB } from "@/db";
import { publicProcedure, router } from "@/lib/trpc";
import { eq, sql, count, desc, asc, isNotNull } from "drizzle-orm";

export const groRouter = router({
  overview: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

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
        eq(
          DB.schema.intentions.id,
          DB.schema.comment_intentions.intention_id
        )
      )
      .groupBy(
        DB.schema.intentions.id,
        DB.schema.intentions.type,
        DB.schema.intentions.name,
        DB.schema.intentions.description
      )
      .orderBy(desc(count(DB.schema.comment_intentions.id)));

    // Get intention type summary - aggregate by type
    const typeSummary = await db
      .select({
        type: DB.schema.intentions.type,
        count: count(DB.schema.comment_intentions.id),
        percentage: sql<number>`
          ROUND(
            COUNT(${DB.schema.comment_intentions.id})::numeric * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM ${DB.schema.comment_intentions} WHERE ${DB.schema.comment_intentions.intention_id} IS NOT NULL), 0),
            2
          )
        `,
      })
      .from(DB.schema.intentions)
      .innerJoin(
        DB.schema.comment_intentions,
        eq(
          DB.schema.intentions.id,
          DB.schema.comment_intentions.intention_id
        )
      )
      .groupBy(DB.schema.intentions.type)
      .orderBy(desc(count(DB.schema.comment_intentions.id)));

    // Get intentions with confidence levels
    const intentionConfidence = await db
      .select({
        intentionId: DB.schema.intentions.id,
        intentionName: DB.schema.intentions.name,
        type: DB.schema.intentions.type,
        avgConfidence: sql<number>`
          ROUND(AVG(${DB.schema.comment_intentions.confidence})::numeric, 2)
        `,
        count: count(DB.schema.comment_intentions.id),
      })
      .from(DB.schema.comment_intentions)
      .innerJoin(
        DB.schema.intentions,
        eq(
          DB.schema.intentions.id,
          DB.schema.comment_intentions.intention_id
        )
      )
      .where(isNotNull(DB.schema.comment_intentions.intention_id))
      .groupBy(
        DB.schema.intentions.id,
        DB.schema.intentions.name,
        DB.schema.intentions.type
      )
      .orderBy(desc(sql<number>`AVG(${DB.schema.comment_intentions.confidence})`))
      .limit(20);

    // Get secondary intentions analysis
    const secondaryIntentions = await db
      .select({
        primaryIntention: DB.schema.comment_intentions.primary_intention,
        count: count(DB.schema.comment_intentions.id),
        hasSecondary: sql<boolean>`
          CASE 
            WHEN array_length(${DB.schema.comment_intentions.secondary_intentions}, 1) > 0 
            THEN true 
            ELSE false 
          END
        `,
      })
      .from(DB.schema.comment_intentions)
      .groupBy(
        DB.schema.comment_intentions.primary_intention,
        DB.schema.comment_intentions.secondary_intentions
      )
      .orderBy(desc(count(DB.schema.comment_intentions.id)))
      .limit(10);

    // Get overall statistics
    const totalCommentsWithIntention = await db
      .select({
        total: count(DB.schema.comment_intentions.id),
      })
      .from(DB.schema.comment_intentions)
      .where(isNotNull(DB.schema.comment_intentions.intention_id));

    const avgIntentionConfidence = await db
      .select({
        avgConfidence: sql<number>`
          ROUND(AVG(${DB.schema.comment_intentions.confidence})::numeric, 2)
        `,
      })
      .from(DB.schema.comment_intentions);

    // Count comments with multiple intentions
    const multipleIntentions = await db
      .select({
        count: count(DB.schema.comment_intentions.id),
      })
      .from(DB.schema.comment_intentions)
      .where(
        sql`array_length(${DB.schema.comment_intentions.secondary_intentions}, 1) > 0`
      );

    // Format for chart visualizations
    const chartData = {
      // Bar chart data - intention distribution
      barChart: {
        labels: intentionDistribution.map((i) => i.name),
        datasets: [
          {
            label: "Number of Comments",
            data: intentionDistribution.map((i) => i.count),
            backgroundColor: intentionDistribution.map((i) => {
              // Color based on intention type
              const colorMap: Record<string, string> = {
                resolve: "#10b981", // emerald
                complain: "#ef4444", // red
                compare: "#3b82f6", // blue
                cancel: "#f97316", // orange
                inquire: "#8b5cf6", // purple
                praise: "#22c55e", // green
                suggest: "#06b6d4", // cyan
                other: "#6b7280", // gray
              };
              return colorMap[i.type] || "#6b7280";
            }),
          },
        ],
      },

      // Pie chart data - type distribution
      pieChart: {
        labels: typeSummary.map((t) => t.type),
        datasets: [
          {
            label: "Distribution by Type",
            data: typeSummary.map((t) => Number(t.count)),
            percentages: typeSummary.map((t) => Number(t.percentage)),
          },
        ],
      },

      // Confidence analysis
      confidence: {
        byIntention: intentionConfidence.map((i) => ({
          id: i.intentionId,
          name: i.intentionName,
          type: i.type,
          avgConfidence: Number(i.avgConfidence),
          count: i.count,
        })),
        overall: Number(avgIntentionConfidence[0]?.avgConfidence) || 0,
      },

      // Raw data for custom visualizations
      raw: {
        intentionDistribution: intentionDistribution.map((i) => ({
          ...i,
          count: Number(i.count),
        })),
        typeSummary: typeSummary.map((t) => ({
          ...t,
          count: Number(t.count),
          percentage: Number(t.percentage),
        })),
        intentionConfidence,
        secondaryIntentions,
      },

      // Summary statistics
      statistics: {
        totalAnalyzed: totalCommentsWithIntention[0]?.total || 0,
        averageConfidence: Number(avgIntentionConfidence[0]?.avgConfidence) || 0,
        dominantType: typeSummary[0]?.type || "other",
        dominantIntention: intentionDistribution[0]?.name || "Unknown",
        intentionTypesCount: typeSummary.length,
        totalIntentions: intentionDistribution.length,
        multipleIntentionsCount: multipleIntentions[0]?.count || 0,
      },
    };

    return chartData;
  }),
});