import type {
  GeneratedInsight,
  InsightGenerationContext,
  InsightStrategy,
  BaseInsight,
  InsightMetrics,
  InsightAnalytics,
} from "./leti-types";
import { InsightStrategyFactory } from "./leti-strategies";

/**
 * Configuration for insight generation
 */
export interface InsightGeneratorConfig {
  maxInsights?: number;
  minConfidence?: number;
  priorityThreshold?: number;
  strategies?: InsightStrategy[];
  sortBy?: "confidence" | "priority" | "type";
}

/**
 * Main insight generator with composition pattern
 */
export class InsightGenerator {
  private strategyFactory: InsightStrategyFactory;
  private config: Required<InsightGeneratorConfig>;

  constructor(config: InsightGeneratorConfig = {}) {
    this.strategyFactory = new InsightStrategyFactory();
    this.config = {
      maxInsights: config.maxInsights ?? 5,
      minConfidence: config.minConfidence ?? 0,
      priorityThreshold: config.priorityThreshold ?? 0,
      strategies: config.strategies ?? [],
      sortBy: config.sortBy ?? "confidence",
    };

    // Register custom strategies if provided
    this.config.strategies.forEach((strategy) => {
      this.strategyFactory.register(strategy);
    });
  }

  /**
   * Generate insights based on context
   */
  generateInsights(context: InsightGenerationContext): GeneratedInsight[] {
    const applicableStrategies = this.strategyFactory.getApplicableStrategies(context);
    const generatedInsights: GeneratedInsight[] = [];

    for (const strategy of applicableStrategies) {
      try {
        const insight = strategy.generate(context);
        if (insight && this.isValidInsight(insight)) {
          generatedInsights.push(insight);
        }
      } catch (error) {
        console.error(`Error generating insight with strategy ${strategy.id}:`, error);
      }
    }

    return this.processInsights(generatedInsights);
  }

  /**
   * Process and filter insights
   */
  private processInsights(insights: GeneratedInsight[]): GeneratedInsight[] {
    return insights
      .filter((insight) => insight.confidence >= this.config.minConfidence)
      .sort((a, b) => this.getSortComparator()(a, b))
      .slice(0, this.config.maxInsights);
  }

  /**
   * Get sort comparator based on config
   */
  private getSortComparator(): (a: GeneratedInsight, b: GeneratedInsight) => number {
    switch (this.config.sortBy) {
      case "confidence":
        return (a, b) => b.confidence - a.confidence;
      case "priority":
        return (a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority ?? "low"];
          const bPriority = priorityOrder[b.priority ?? "low"];
          return bPriority - aPriority;
        };
      case "type":
        return (a, b) => a.type.localeCompare(b.type);
      default:
        return (a, b) => b.confidence - a.confidence;
    }
  }

  /**
   * Validate insight
   */
  private isValidInsight(insight: GeneratedInsight): boolean {
    return (
      insight.id !== "" &&
      insight.text !== "" &&
      insight.confidence >= 0 &&
      insight.confidence <= 10
    );
  }

  /**
   * Calculate metrics from insights
   */
  static calculateMetrics(
    insights: BaseInsight[],
    correlations: any[]
  ): InsightMetrics {
    const totalInsights = insights.length;
    const totalComments = insights.reduce((sum, i) => sum + i.totalComments, 0);
    const aiGeneratedCount = insights.filter((i) => i.aiGenerated).length;
    const averageConfidence =
      insights.reduce((sum, i) => sum + i.avgConfidence, 0) / (totalInsights || 1);
    const topInsight = insights[0] || null;
    
    const strongCorrelations = correlations.filter((c) => c.correlationScore > 7);
    const correlationStrength = strongCorrelations.length > 0
      ? strongCorrelations.reduce((sum, c) => sum + c.correlationScore, 0) / strongCorrelations.length
      : 0;

    return {
      totalInsights,
      totalComments,
      aiGeneratedCount,
      averageConfidence,
      topInsight,
      correlationStrength,
      analytics: this.calculateAnalytics(insights, correlations),
    };
  }

  /**
   * Calculate advanced analytics
   */
  private static calculateAnalytics(
    insights: BaseInsight[],
    correlations: any[]
  ): InsightAnalytics {
    // Calculate distribution using Gini coefficient
    const giniCoefficient = this.calculateGiniCoefficient(
      insights.map((i) => i.totalComments)
    );

    // Confidence distribution
    const highConfidence = insights.filter((i) => i.avgConfidence >= 8).length;
    const mediumConfidence = insights.filter(
      (i) => i.avgConfidence >= 5 && i.avgConfidence < 8
    ).length;
    const lowConfidence = insights.filter((i) => i.avgConfidence < 5).length;

    // Emergence analysis
    const aiGenerated = insights.filter((i) => i.aiGenerated);
    const recentEmergent = aiGenerated.filter((i) => {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(i.emergenceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysSince <= 30;
    });

    // Calculate trend
    const oldEmergent = aiGenerated.filter((i) => {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(i.emergenceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysSince > 30 && daysSince <= 60;
    });

    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (recentEmergent.length > oldEmergent.length * 1.3) trend = "increasing";
    else if (recentEmergent.length < oldEmergent.length * 0.7) trend = "decreasing";

    return {
      distribution: {
        type: giniCoefficient > 0.6 ? "concentrated" : giniCoefficient < 0.3 ? "sparse" : "balanced",
        giniCoefficient,
      },
      confidence: {
        average: insights.reduce((sum, i) => sum + i.avgConfidence, 0) / (insights.length || 1),
        distribution: {
          high: highConfidence / (insights.length || 1),
          medium: mediumConfidence / (insights.length || 1),
          low: lowConfidence / (insights.length || 1),
        },
      },
      emergence: {
        rate: aiGenerated.length / (insights.length || 1),
        recentCount: recentEmergent.length,
        trend,
      },
    };
  }

  /**
   * Calculate Gini coefficient for distribution analysis
   */
  private static calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const cumulativeSum = sortedValues.reduce((acc, val, i) => {
      acc.push((acc[i - 1] || 0) + val);
      return acc;
    }, [] as number[]);
    
    const totalSum = cumulativeSum[n - 1] || 1;
    const lorenzSum = cumulativeSum.reduce((sum, val) => sum + val, 0);
    
    return (n + 1 - 2 * lorenzSum / totalSum) / n;
  }
}

/**
 * Singleton instance for convenience
 */
let defaultGenerator: InsightGenerator | null = null;

export function getDefaultInsightGenerator(
  config?: InsightGeneratorConfig
): InsightGenerator {
  if (!defaultGenerator || config) {
    defaultGenerator = new InsightGenerator(config);
  }
  return defaultGenerator;
}

/**
 * Helper function for quick insight generation
 */
export function generateInsights(
  insights: BaseInsight[],
  correlations: any[],
  config?: InsightGeneratorConfig
): GeneratedInsight[] {
  const generator = getDefaultInsightGenerator(config);
  const totalComments = insights.reduce((sum, i) => sum + i.totalComments, 0);
  
  const context: InsightGenerationContext = {
    insights,
    correlations,
    totalComments,
  };
  
  return generator.generateInsights(context);
}