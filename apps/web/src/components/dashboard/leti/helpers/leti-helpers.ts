import type { SharedTypes } from "types/shared";
import {
  CONFIDENCE_THRESHOLDS,
  LETI_METRICS,
  INSIGHT_ICONS,
} from "./leti-constants";

/**
 * Analytics helper functions for Leti insights
 */

/**
 * Analyze insight concentration to understand distribution patterns
 */
export const analyzeInsightConcentration = (
  insights: SharedTypes.API.Analytics.LETI.InsightMetrics[]
) => {
  if (!insights || insights.length === 0) return null;

  const totalComments = insights.reduce(
    (sum, insight) => sum + insight.totalComments,
    0
  );
  const topInsight = insights[0];
  const topInsightPercentage = (topInsight.totalComments / totalComments) * 100;

  const top3Total = insights
    .slice(0, 3)
    .reduce((sum, insight) => sum + insight.totalComments, 0);
  const top3Percentage = (top3Total / totalComments) * 100;

  // Categorize concentration level
  const concentrationLevel =
    topInsightPercentage > 50
      ? "very_high"
      : topInsightPercentage > 30
        ? "high"
        : top3Percentage > 70
          ? "moderate"
          : "low";

  const aiGeneratedCount = insights.filter((i) => i.aiGenerated).length;
  const humanDefinedCount = insights.filter((i) => !i.aiGenerated).length;

  return {
    totalComments,
    totalInsights: insights.length,
    topInsight,
    topInsightPercentage,
    top3Percentage,
    concentrationLevel,
    averageCommentsPerInsight: totalComments / insights.length,
    aiGeneratedCount,
    humanDefinedCount,
    aiPercentage: (aiGeneratedCount / insights.length) * 100,
  };
};

/**
 * Calculate confidence statistics
 */
export const calculateConfidenceStats = (
  insights: SharedTypes.API.Analytics.LETI.InsightMetrics[]
) => {
  if (!insights || insights.length === 0) {
    return {
      high: 0,
      medium: 0,
      low: 0,
      average: 0,
      highPercentage: 0,
      mediumPercentage: 0,
      lowPercentage: 0,
    };
  }

  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;
  let totalConfidence = 0;
  let totalCount = 0;

  insights.forEach((insight) => {
    totalHigh += insight.confidenceDistribution.high;
    totalMedium += insight.confidenceDistribution.medium;
    totalLow += insight.confidenceDistribution.low;
    totalConfidence += insight.avgConfidence * insight.totalComments;
    totalCount += insight.totalComments;
  });

  const total = totalHigh + totalMedium + totalLow;

  return {
    high: totalHigh,
    medium: totalMedium,
    low: totalLow,
    average: totalCount > 0 ? totalConfidence / totalCount : 0,
    highPercentage: total > 0 ? (totalHigh / total) * 100 : 0,
    mediumPercentage: total > 0 ? (totalMedium / total) * 100 : 0,
    lowPercentage: total > 0 ? (totalLow / total) * 100 : 0,
  };
};

/**
 * Get confidence badge configuration
 */
export const getConfidenceBadge = (confidence: number) => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return { label: "High Confidence", color: "default" as const };
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return { label: "Medium Confidence", color: "secondary" as const };
  }
  return { label: "Low Confidence", color: "outline" as const };
};

/**
 * Get performance badge based on ranking
 */
export const getPerformanceBadge = (position: number) => {
  if (position === 1) return LETI_METRICS.TOP_INSIGHTS.BADGES.TOP;
  if (position <= 3) return LETI_METRICS.TOP_INSIGHTS.BADGES.HIGH;
  if (position <= 5) return LETI_METRICS.TOP_INSIGHTS.BADGES.NOTABLE;
  return null;
};

/**
 * Format insight name for display
 */
export const formatInsightName = (name: string, maxLength: number = 40) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + "...";
};

/**
 * Get emergence indicator for AI insights
 */
export const getEmergenceIndicator = (
  insight: SharedTypes.API.Analytics.LETI.InsightMetrics
) => {
  if (!insight.aiGenerated) return null;

  const daysSinceEmergence = Math.floor(
    (new Date().getTime() - new Date(insight.emergenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceEmergence <= 7) return LETI_METRICS.EMERGENT.INDICATORS.NEW;
  if (daysSinceEmergence <= 30) return LETI_METRICS.EMERGENT.INDICATORS.GROWING;
  return LETI_METRICS.EMERGENT.INDICATORS.ESTABLISHED;
};

/**
 * Get icon for insight
 */
export const getInsightIcon = (insightName: string) => {
  return INSIGHT_ICONS.getIcon(insightName);
};

/**
 * Calculate growth trend (simplified without time series)
 */
export const calculateGrowthTrend = (
  insight: SharedTypes.API.Analytics.LETI.InsightMetrics
) => {
  const daysSinceEmergence = Math.floor(
    (new Date().getTime() - new Date(insight.emergenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const daysSinceLastSeen = Math.floor(
    (new Date().getTime() - new Date(insight.lastSeenDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Simple trend based on recency
  if (daysSinceLastSeen <= 1) return "active";
  if (daysSinceLastSeen <= 7) return "recent";
  if (daysSinceLastSeen <= 30) return "declining";
  return "inactive";
};

/**
 * Get summary statistics for insights
 */
export const getInsightsSummary = (
  insights: SharedTypes.API.Analytics.LETI.InsightMetrics[]
) => {
  if (!insights || insights.length === 0) {
    return {
      total: 0,
      aiGenerated: 0,
      humanDefined: 0,
      avgConfidence: 0,
      topInsight: null,
      recentlyActive: 0,
    };
  }

  const aiGenerated = insights.filter((i) => i.aiGenerated);
  const humanDefined = insights.filter((i) => !i.aiGenerated);

  const recentlyActive = insights.filter((i) => {
    const daysSinceLastSeen = Math.floor(
      (new Date().getTime() - new Date(i.lastSeenDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSinceLastSeen <= 7;
  });

  const totalConfidence = insights.reduce(
    (sum, insight) => sum + insight.avgConfidence * insight.totalComments,
    0
  );
  const totalComments = insights.reduce(
    (sum, insight) => sum + insight.totalComments,
    0
  );

  return {
    total: insights.length,
    aiGenerated: aiGenerated.length,
    humanDefined: humanDefined.length,
    avgConfidence: totalComments > 0 ? totalConfidence / totalComments : 0,
    topInsight: insights[0] || null,
    recentlyActive: recentlyActive.length,
  };
};

/**
 * Sort insights by different metrics
 */
export const sortInsights = (
  insights: SharedTypes.API.Analytics.LETI.InsightMetrics[],
  sortBy: "volume" | "confidence" | "recency" | "emergence" = "volume"
) => {
  return [...insights].sort((a, b) => {
    switch (sortBy) {
      case "confidence":
        return b.avgConfidence - a.avgConfidence;
      case "recency":
        return (
          new Date(b.lastSeenDate).getTime() -
          new Date(a.lastSeenDate).getTime()
        );
      case "emergence":
        return (
          new Date(b.emergenceDate).getTime() -
          new Date(a.emergenceDate).getTime()
        );
      case "volume":
      default:
        return b.totalComments - a.totalComments;
    }
  });
};
