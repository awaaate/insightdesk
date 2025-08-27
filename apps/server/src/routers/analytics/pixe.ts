import { DB } from "@/db";
import { publicProcedure, router } from "@/lib/trpc";
import { eq, sql, count, desc, asc, isNotNull } from "drizzle-orm";

export const pixeRouter = router({
  overview: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

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
      .groupBy(
        DB.schema.sentiment_levels.id,
        DB.schema.sentiment_levels.level,
        DB.schema.sentiment_levels.name,
        DB.schema.sentiment_levels.severity,
        DB.schema.sentiment_levels.intensity_value
      )
      .orderBy(asc(DB.schema.sentiment_levels.intensity_value));

    // Get sentiment severity summary - aggregate by severity category
    const severitySummary = await db
      .select({
        severity: DB.schema.sentiment_levels.severity,
        count: count(DB.schema.comment_insights.id),
        percentage: sql<number>`
          ROUND(
            COUNT(${DB.schema.comment_insights.id})::numeric * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM ${DB.schema.comment_insights} WHERE ${DB.schema.comment_insights.sentiment_level_id} IS NOT NULL), 0),
            2
          )
        `,
      })
      .from(DB.schema.sentiment_levels)
      .innerJoin(
        DB.schema.comment_insights,
        eq(
          DB.schema.sentiment_levels.id,
          DB.schema.comment_insights.sentiment_level_id
        )
      )
      .groupBy(DB.schema.sentiment_levels.severity)
      .orderBy(desc(count(DB.schema.comment_insights.id)));

    // Get sentiment trends by insight - top insights with their sentiment breakdown
    const sentimentByInsight = await db
      .select({
        insightId: DB.schema.insights.id,
        insightName: DB.schema.insights.name,
        sentimentLevel: DB.schema.sentiment_levels.level,
        sentimentName: DB.schema.sentiment_levels.name,
        severity: DB.schema.sentiment_levels.severity,
        count: count(DB.schema.comment_insights.id),
        avgConfidence: sql<number>`
          ROUND(AVG(${DB.schema.comment_insights.sentiment_confidence})::numeric, 2)
        `,
      })
      .from(DB.schema.comment_insights)
      .innerJoin(
        DB.schema.insights,
        eq(DB.schema.insights.id, DB.schema.comment_insights.insight_id)
      )
      .innerJoin(
        DB.schema.sentiment_levels,
        eq(
          DB.schema.sentiment_levels.id,
          DB.schema.comment_insights.sentiment_level_id
        )
      )
      .where(isNotNull(DB.schema.comment_insights.sentiment_level_id))
      .groupBy(
        DB.schema.insights.id,
        DB.schema.insights.name,
        DB.schema.sentiment_levels.level,
        DB.schema.sentiment_levels.name,
        DB.schema.sentiment_levels.severity
      )
      .orderBy(
        desc(count(DB.schema.comment_insights.id)),
        DB.schema.insights.name
      )
      .limit(20);

    // Get overall statistics
    const totalCommentsWithSentiment = await db
      .select({
        total: count(DB.schema.comment_insights.id),
      })
      .from(DB.schema.comment_insights)
      .where(isNotNull(DB.schema.comment_insights.sentiment_level_id));

    const avgSentimentIntensity = await db
      .select({
        avgIntensity: sql<number>`
          ROUND(AVG(${DB.schema.sentiment_levels.intensity_value})::numeric, 2)
        `,
      })
      .from(DB.schema.comment_insights)
      .innerJoin(
        DB.schema.sentiment_levels,
        eq(
          DB.schema.sentiment_levels.id,
          DB.schema.comment_insights.sentiment_level_id
        )
      );

    // Format for chart visualizations
    const chartData = {
      // Bar chart data - sentiment level distribution
      barChart: {
        labels: sentimentDistribution.map((s) => s.name),
        datasets: [
          {
            label: "Número de Comentarios",
            data: sentimentDistribution.map((s) => s.count),
            backgroundColor: sentimentDistribution.map((s) => {
              // Color based on severity
              const colorMap: Record<string, string> = {
                positive: "#10b981",
                none: "#6b7280",
                low: "#fbbf24",
                medium: "#fb923c",
                high: "#f87171",
                critical: "#dc2626",
              };
              return colorMap[s.severity] || "#6b7280";
            }),
          },
        ],
      },

      // Pie chart data - severity distribution
      pieChart: {
        labels: severitySummary.map((s) => s.severity),
        datasets: [
          {
            label: "Distribución por Severidad",
            data: severitySummary.map((s) => Number(s.count)),
            percentages: severitySummary.map((s) => Number(s.percentage)),
          },
        ],
      },

      // Heatmap data - insights vs sentiments
      heatmap: {
        insights: [...new Set(sentimentByInsight.map((s) => s.insightName))],
        sentiments: [
          ...new Set(sentimentByInsight.map((s) => s.sentimentName)),
        ],
        data: sentimentByInsight.map((s) => ({
          insight: s.insightName,
          sentiment: s.sentimentName,
          value: s.count,
          confidence: s.avgConfidence,
        })),
      },

      // Raw data for custom visualizations
      raw: {
        sentimentDistribution,
        severitySummary,
        sentimentByInsight,
      },

      // Summary statistics
      statistics: {
        totalAnalyzed: totalCommentsWithSentiment[0]?.total || 0,
        averageIntensity: Number(avgSentimentIntensity[0]?.avgIntensity) || 0,
        dominantSeverity: severitySummary[0]?.severity || "none",
        sentimentLevelsCount: sentimentDistribution.length,
      },
    };

    return chartData;
  }),
});
