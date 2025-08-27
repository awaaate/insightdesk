import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  generateInsights,
  InsightGenerator,
  type InsightGeneratorConfig,
} from "../helpers/leti-insight-generator";
import type {
  GeneratedInsight,
  BaseInsight,
  InsightMetrics,
} from "../helpers/leti-types";

/**
 * Configuration for the useLetiInsights hook
 */
export interface UseLetiInsightsConfig {
  minComments?: number;
  insightLimit?: number;
  correlationLimit?: number;
  generatorConfig?: InsightGeneratorConfig;
  enabled?: boolean;
}

/**
 * Return type for the useLetiInsights hook
 */
export interface LetiInsightsData {
  insights: BaseInsight[] | undefined;
  correlations: any[] | undefined;
  generatedInsights: GeneratedInsight[];
  metrics: InsightMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for managing Leti insights with advanced patterns
 */
export function useLetiInsights(
  config: UseLetiInsightsConfig = {}
): LetiInsightsData {
  const {
    minComments = 1,
    insightLimit = 50,
    correlationLimit = 20,
    generatorConfig,
    enabled = true,
  } = config;

  // Fetch insights data
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery(
    trpc.analytics.leti.topInsights.queryOptions(
      {
        minComments,
        limit: insightLimit,
      },
      {
        enabled,
      }
    )
  );

  // Fetch correlations data
  const {
    data: correlations,
    isLoading: correlationsLoading,
    error: correlationsError,
    refetch: refetchCorrelations,
  } = useQuery(
    trpc.analytics.leti.insightCorrelations.queryOptions(
      {
        minCoOccurrence: 2,
        limit: correlationLimit,
      },
      {
        enabled,
      }
    )
  );

  // Generate insights using the advanced pattern system
  const generatedInsights = useMemo(() => {
    if (!insights || !correlations) return [];

    try {
      return generateInsights(insights, correlations, generatorConfig);
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }, [insights, correlations, generatorConfig]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!insights || !correlations) return null;

    try {
      return InsightGenerator.calculateMetrics(insights, correlations);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return null;
    }
  }, [insights, correlations]);

  // Combined loading state
  const isLoading = insightsLoading || correlationsLoading;

  // Combined error
  const error = insightsError || correlationsError;

  // Combined refetch
  const refetch = () => {
    refetchInsights();
    refetchCorrelations();
  };

  return {
    insights,
    correlations,
    generatedInsights,
    metrics,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for filtering and sorting insights
 */
export function useFilteredInsights(
  insights: BaseInsight[] | undefined,
  filters: {
    showAiOnly?: boolean;
    showHumanOnly?: boolean;
    minConfidence?: number;
    minComments?: number;
    sortBy?: "volume" | "confidence" | "recency" | "emergence";
  } = {}
) {
  return useMemo(() => {
    if (!insights) return [];

    let filtered = [...insights];

    // Apply filters
    if (filters.showAiOnly) {
      filtered = filtered.filter((i) => i.aiGenerated);
    }
    if (filters.showHumanOnly) {
      filtered = filtered.filter((i) => !i.aiGenerated);
    }
    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter(
        (i) => i.avgConfidence >= filters.minConfidence!
      );
    }
    if (filters.minComments !== undefined) {
      filtered = filtered.filter(
        (i) => i.totalComments >= filters.minComments!
      );
    }

    // Sort
    const sortBy = filters.sortBy || "volume";
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "confidence":
          return b.avgConfidence - a.avgConfidence;
        case "recency":
          return (
            new Date(b.emergenceDate).getTime() -
            new Date(a.emergenceDate).getTime()
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

    return filtered;
  }, [insights, filters]);
}

/**
 * Hook for insight analytics
 */
export function useInsightAnalytics(metrics: InsightMetrics | null) {
  return useMemo(() => {
    if (!metrics) {
      return {
        hasData: false,
        isHealthy: false,
        dominanceLevel: null,
        confidenceLevel: null,
        emergenceRate: null,
        recommendations: [] as string[],
      };
    }

    const hasData = metrics.totalInsights > 0;
    const analytics = metrics.analytics;

    // Health check
    const isHealthy =
      analytics.confidence.average >= 6 &&
      analytics.distribution.type !== "concentrated" &&
      analytics.emergence.trend !== "decreasing";

    // Dominance level
    const dominanceLevel = analytics.distribution.type;

    // Confidence level
    const confidenceLevel =
      analytics.confidence.average >= 8
        ? "high"
        : analytics.confidence.average >= 5
          ? "medium"
          : "low";

    // Emergence rate
    const emergenceRate = analytics.emergence.rate;

    // Generate recommendations
    const recommendations: string[] = [];

    if (analytics.distribution.type === "concentrated") {
      recommendations.push("Consider diversifying pattern detection");
    }
    if (analytics.confidence.average < 6) {
      recommendations.push("Review and refine pattern definitions");
    }
    if (analytics.emergence.trend === "decreasing") {
      recommendations.push("Monitor for new emerging patterns");
    }
    if (emergenceRate > 0.5) {
      recommendations.push("Many AI-discovered patterns - review for accuracy");
    }

    return {
      hasData,
      isHealthy,
      dominanceLevel,
      confidenceLevel,
      emergenceRate,
      recommendations,
    };
  }, [metrics]);
}
