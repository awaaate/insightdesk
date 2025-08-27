import { ReactNode } from "react";

/**
 * Core types for Leti Insights system
 */

export type InsightType =
  | "discovery"
  | "correlation"
  | "trend"
  | "intelligence"
  | "dominance";

export type InsightPriority = "critical" | "high" | "medium" | "low";

export interface BaseInsight {
  id: string;
  name: string;
  totalComments: number;
  avgConfidence: number;
  aiGenerated: boolean;
  emergenceDate: string;
}

export interface GeneratedInsight<> {
  id: string;
  text: string;
  icon: ReactNode;
  type: InsightType;
  confidence: number;
  priority?: InsightPriority;
  metadata?: any;
  renderInsight?: (params: {
    highlight: (text: string) => ReactNode;
  }) => ReactNode;
  renderMetadata?: (params: { metadata: any }) => ReactNode;
}

export interface InsightCorrelation {
  insightA: string;
  insightB: string;
  correlationScore: number;
  coOccurrences: number;
}

export interface InsightGenerationContext {
  insights: BaseInsight[];
  correlations: InsightCorrelation[];
  totalComments: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface InsightStrategy {
  id: string;
  name: string;
  type: InsightType;
  minDataRequirements: {
    minInsights?: number;
    minComments?: number;
    minCorrelations?: number;
  };
  canGenerate(context: InsightGenerationContext): boolean;
  generate(context: InsightGenerationContext): GeneratedInsight | null;
}

export interface InsightAnalytics {
  distribution: {
    type: "concentrated" | "balanced" | "sparse";
    giniCoefficient: number;
  };
  confidence: {
    average: number;
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  emergence: {
    rate: number;
    recentCount: number;
    trend: "increasing" | "stable" | "decreasing";
  };
}

export interface InsightMetrics {
  totalInsights: number;
  totalComments: number;
  aiGeneratedCount: number;
  averageConfidence: number;
  topInsight: BaseInsight | null;
  correlationStrength: number;
  analytics: InsightAnalytics;
}

export interface InsightHighlighter {
  highlight: (text: string) => ReactNode;
  highlightNumber: (
    value: number,
    format?: "percentage" | "decimal" | "integer"
  ) => ReactNode;
  highlightInsight: (name: string) => ReactNode;
}

export interface InsightRenderer {
  render(insight: GeneratedInsight, highlighter: InsightHighlighter): ReactNode;
}

export type InsightFilterFn = (insight: BaseInsight) => boolean;
export type InsightSorterFn = (a: BaseInsight, b: BaseInsight) => number;
export type InsightTransformerFn<T = unknown> = (insight: BaseInsight) => T;
