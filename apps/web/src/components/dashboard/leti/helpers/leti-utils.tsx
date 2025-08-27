import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  BaseInsight,
  InsightCorrelation,
  InsightHighlighter,
  InsightFilterFn,
  InsightSorterFn,
} from "./leti-types";

/**
 * Utility functions for Leti Insights
 */

/**
 * Create a highlighter instance for rendering insights
 */
export function createHighlighter(
  highlightClass: string = "font-semibold text-primary"
): InsightHighlighter {
  return {
    highlight: (text: string): ReactNode => (
      <span className={cn(highlightClass)}>{text}</span>
    ),
    highlightNumber: (value: number, format = "integer"): ReactNode => {
      let formatted: string;
      switch (format) {
        case "percentage":
          formatted = `${value.toFixed(0)}%`;
          break;
        case "decimal":
          formatted = value.toFixed(1);
          break;
        case "integer":
        default:
          formatted = Math.round(value).toString();
      }
      return <span className={cn(highlightClass)}>{formatted}</span>;
    },
    highlightInsight: (name: string): ReactNode => (
      <span className={cn(highlightClass, "italic")}>{name}</span>
    ),
  };
}

/**
 * Common filter functions
 */
export const InsightFilters = {
  aiGenerated: (): InsightFilterFn => (insight) => insight.aiGenerated,

  humanDefined: (): InsightFilterFn => (insight) => !insight.aiGenerated,

  highConfidence:
    (threshold = 8): InsightFilterFn =>
    (insight) =>
      insight.avgConfidence >= threshold,

  minComments:
    (min: number): InsightFilterFn =>
    (insight) =>
      insight.totalComments >= min,

  recent:
    (days = 30): InsightFilterFn =>
    (insight) => {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(insight.emergenceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysSince <= days;
    },

  combine:
    (...filters: InsightFilterFn[]): InsightFilterFn =>
    (insight) =>
      filters.every((filter) => filter(insight)),
};

/**
 * Common sorter functions
 */
export const InsightSorters = {
  byComments: (): InsightSorterFn => (a, b) =>
    b.totalComments - a.totalComments,

  byConfidence: (): InsightSorterFn => (a, b) =>
    b.avgConfidence - a.avgConfidence,

  byEmergence: (): InsightSorterFn => (a, b) =>
    new Date(b.emergenceDate).getTime() - new Date(a.emergenceDate).getTime(),

  byName: (): InsightSorterFn => (a, b) => a.name.localeCompare(b.name),

  chain:
    (...sorters: InsightSorterFn[]): InsightSorterFn =>
    (a, b) => {
      for (const sorter of sorters) {
        const result = sorter(a, b);
        if (result !== 0) return result;
      }
      return 0;
    },
};

/**
 * Calculate statistics for insights
 */
export function calculateInsightStatistics(insights: BaseInsight[]) {
  if (!insights.length) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 },
    };
  }

  const values = insights.map((i) => i.totalComments).sort((a, b) => a - b);
  const n = values.length;

  // Mean
  const mean = values.reduce((sum, val) => sum + val, 0) / n;

  // Median
  const median =
    n % 2 === 0
      ? (values[n / 2 - 1] + values[n / 2]) / 2
      : values[Math.floor(n / 2)];

  // Standard deviation and variance
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Min, Max, Range
  const min = values[0];
  const max = values[n - 1];
  const range = max - min;

  // Quartiles
  const q1 = values[Math.floor(n * 0.25)];
  const q2 = median;
  const q3 = values[Math.floor(n * 0.75)];

  return {
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    range,
    quartiles: { q1, q2, q3 },
  };
}

/**
 * Find correlation patterns
 */
export function findCorrelationPatterns(
  correlations: InsightCorrelation[],
  minScore = 7
): Map<string, string[]> {
  const patterns = new Map<string, string[]>();

  correlations
    .filter((c) => c.correlationScore >= minScore)
    .forEach((correlation) => {
      // Add to patterns for insightA
      if (!patterns.has(correlation.insightA)) {
        patterns.set(correlation.insightA, []);
      }
      patterns.get(correlation.insightA)!.push(correlation.insightB);

      // Add to patterns for insightB
      if (!patterns.has(correlation.insightB)) {
        patterns.set(correlation.insightB, []);
      }
      patterns.get(correlation.insightB)!.push(correlation.insightA);
    });

  return patterns;
}

/**
 * Group insights by type
 */
export function groupInsightsByType(insights: BaseInsight[]) {
  return insights.reduce(
    (groups, insight) => {
      const key = insight.aiGenerated ? "aiGenerated" : "humanDefined";
      groups[key].push(insight);
      return groups;
    },
    {
      aiGenerated: [] as BaseInsight[],
      humanDefined: [] as BaseInsight[],
    }
  );
}

/**
 * Calculate time-based metrics
 */
export function calculateTimeMetrics(insights: BaseInsight[]) {
  const now = new Date();

  const timeRanges = {
    last24h: 0,
    last7d: 0,
    last30d: 0,
    older: 0,
  };

  insights.forEach((insight) => {
    const daysSince = Math.floor(
      (now.getTime() - new Date(insight.emergenceDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSince <= 1) timeRanges.last24h++;
    else if (daysSince <= 7) timeRanges.last7d++;
    else if (daysSince <= 30) timeRanges.last30d++;
    else timeRanges.older++;
  });

  return {
    timeRanges,
    averageAge:
      insights.reduce((sum, insight) => {
        const daysSince = Math.floor(
          (now.getTime() - new Date(insight.emergenceDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + daysSince;
      }, 0) / (insights.length || 1),
  };
}

/**
 * Format large numbers for display
 */
export function formatNumber(value: number, decimals = 0): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Calculate insight velocity (growth rate)
 */
export function calculateInsightVelocity(
  insight: BaseInsight,
  periodDays = 30
): number {
  const daysSinceEmergence = Math.floor(
    (new Date().getTime() - new Date(insight.emergenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceEmergence === 0) return insight.totalComments;

  const effectiveDays = Math.min(daysSinceEmergence, periodDays);
  return insight.totalComments / effectiveDays;
}

/**
 * Detect anomalies in insight patterns
 */
export function detectAnomalies(
  insights: BaseInsight[],
  threshold = 2
): BaseInsight[] {
  const stats = calculateInsightStatistics(insights);
  const upperBound = stats.mean + threshold * stats.stdDev;
  const lowerBound = Math.max(0, stats.mean - threshold * stats.stdDev);

  return insights.filter(
    (insight) =>
      insight.totalComments > upperBound || insight.totalComments < lowerBound
  );
}

/**
 * Calculate diversity index (Simpson's Diversity Index)
 */
export function calculateDiversityIndex(insights: BaseInsight[]): number {
  const totalComments = insights.reduce((sum, i) => sum + i.totalComments, 0);
  if (totalComments === 0) return 0;

  const proportions = insights.map((i) => i.totalComments / totalComments);
  const sumOfSquares = proportions.reduce((sum, p) => sum + p * p, 0);

  return 1 - sumOfSquares;
}

/**
 * Get insight health status
 */
export function getInsightHealth(insight: BaseInsight): {
  status: "healthy" | "warning" | "critical";
  reasons: string[];
} {
  const reasons: string[] = [];
  let status: "healthy" | "warning" | "critical" = "healthy";

  // Check confidence
  if (insight.avgConfidence < 5) {
    reasons.push("Low confidence score");
    status = "warning";
  }
  if (insight.avgConfidence < 3) {
    status = "critical";
  }

  // Check recency (if we had lastSeenDate)
  const daysSinceEmergence = Math.floor(
    (new Date().getTime() - new Date(insight.emergenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceEmergence > 60) {
    reasons.push("Old insight");
    status = status === "critical" ? "critical" : "warning";
  }

  // Check volume
  if (insight.totalComments < 5) {
    reasons.push("Low comment volume");
    status = status === "critical" ? "critical" : "warning";
  }

  return { status, reasons };
}
