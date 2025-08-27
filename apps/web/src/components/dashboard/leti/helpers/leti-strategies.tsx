import { Sparkles, Target, Network, Lightbulb, TrendingUp } from "lucide-react";
import type {
  InsightStrategy,
  InsightGenerationContext,
  GeneratedInsight,
  BaseInsight,
} from "./leti-types";

/**
 * Strategy for discovering emergent patterns
 */
export class DiscoveryStrategy implements InsightStrategy {
  id = "discovery";
  name = "Pattern Discovery";
  type = "discovery" as const;

  minDataRequirements = {
    minInsights: 1,
    minComments: 1,
  };

  canGenerate(context: InsightGenerationContext): boolean {
    const aiGenerated = context.insights.filter((i) => i.aiGenerated);
    return aiGenerated.length > 0;
  }

  generate(context: InsightGenerationContext): GeneratedInsight | null {
    const aiGenerated = context.insights.filter((i) => i.aiGenerated);
    if (aiGenerated.length === 0) return null;

    const emergentPercentage = (
      (aiGenerated.length / context.insights.length) *
      100
    ).toFixed(0);

    const topEmergent = aiGenerated.sort(
      (a, b) => b.totalComments - a.totalComments
    )[0];

    return {
      id: "discovery",
      text: `He identificado ${aiGenerated.length} patrones emergentes no catalogados inicialmente, siendo '${topEmergent.name}' el patrón más sorprendente que representa el ${emergentPercentage}% de todos los insights detectados.`,
      icon: <Sparkles className="h-5 w-5" />,
      type: "correlation",
      confidence: this.calculateConfidence(aiGenerated, context),
      priority: aiGenerated.length > 5 ? "high" : "medium",
      metadata: {
        emergentCount: aiGenerated.length,
        topPattern: topEmergent.name,
        percentage: parseFloat(emergentPercentage),
      },
      renderInsight: ({ highlight }) => (
        <p>
          {highlight(aiGenerated.length.toString())} patrones emergentes no
          catalogados inicialmente, siendo '{highlight(topEmergent.name)}' el
          patrón más sorprendente que representa el{" "}
          {highlight(emergentPercentage)}% de todos los insights detectados.
        </p>
      ),
      renderMetadata: ({ metadata }) => (
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          {Object.entries(metadata).map(([key, value]) => (
            <span key={key}>
              {key}: {value}
            </span>
          ))}
        </div>
      ),
    };
  }

  private calculateConfidence(
    aiGenerated: BaseInsight[],
    context: InsightGenerationContext
  ): number {
    const avgConfidence =
      aiGenerated.reduce((sum, i) => sum + i.avgConfidence, 0) /
      aiGenerated.length;
    const coverageBonus = Math.min(aiGenerated.length / 10, 1) * 1.5;
    return Math.min(avgConfidence + coverageBonus, 10);
  }
}

/**
 * Strategy for analyzing dominant patterns
 */
export class DominanceStrategy implements InsightStrategy {
  id = "dominance";
  name = "Dominance Analysis";
  type = "dominance" as const;

  minDataRequirements = {
    minInsights: 1,
    minComments: 10,
  };

  canGenerate(context: InsightGenerationContext): boolean {
    return context.insights.length > 0 && context.totalComments > 0;
  }

  generate(context: InsightGenerationContext): GeneratedInsight | null {
    const topInsight = context.insights[0];
    if (!topInsight) return null;

    const dominancePercentage = (
      (topInsight.totalComments / context.totalComments) *
      100
    ).toFixed(0);

    const pattern = topInsight.aiGenerated ? "emergente" : "establecido";
    const priority = parseFloat(dominancePercentage) > 40 ? "critical" : "high";

    return {
      id: "dominance",
      text: `El patrón dominante '${topInsight.name}' concentra el ${dominancePercentage}% de todas las detecciones, indicando que es un tema ${pattern} de alta relevancia que requiere atención inmediata.`,
      icon: <Target className="h-5 w-5" />,
      type: "dominance",
      confidence: this.calculateDominanceConfidence(
        parseFloat(dominancePercentage),
        topInsight.avgConfidence
      ),
      renderInsight: ({ highlight }) => (
        <p>
          El patrón dominante '{highlight(topInsight.name)}' concentra el{" "}
          {highlight(dominancePercentage)}% de todas las detecciones, indicando
          que es un tema {highlight(pattern)} de alta relevancia que requiere
          atención inmediata.
        </p>
      ),
      priority,
      metadata: {
        dominantInsight: topInsight.name,
        percentage: parseFloat(dominancePercentage),
        pattern,
      },
    };
  }

  private calculateDominanceConfidence(
    dominancePercentage: number,
    avgConfidence: number
  ): number {
    const dominanceWeight = Math.min(dominancePercentage / 50, 1) * 2;
    return Math.min((avgConfidence + dominanceWeight) * 0.9, 10);
  }
}

/**
 * Strategy for finding correlations between insights
 */
export class CorrelationStrategy implements InsightStrategy {
  id = "correlation";
  name = "Correlation Intelligence";
  type = "correlation" as const;

  minDataRequirements = {
    minInsights: 2,
    minComments: 20,
    minCorrelations: 1,
  };

  canGenerate(context: InsightGenerationContext): boolean {
    const strongCorrelations = context.correlations.filter(
      (c) => c.correlationScore > 7
    );
    return strongCorrelations.length > 0;
  }

  generate(context: InsightGenerationContext) {
    const strongCorrelations = context.correlations.filter(
      (c) => c.correlationScore > 7
    );

    if (strongCorrelations.length === 0) return null;

    const totalCorrelations = context.correlations.length;
    const strongPercentage = (
      (strongCorrelations.length / totalCorrelations) *
      100
    ).toFixed(0);
    const topCorrelation = strongCorrelations[0];

    const metadata = {
      strongCount: strongCorrelations.length,
      percentage: parseFloat(strongPercentage),
      topPair: {
        a: topCorrelation.insightA,
        b: topCorrelation.insightB,
        score: topCorrelation.correlationScore,
      },
    };

    return {
      id: "correlation",
      text: `He detectado ${strongCorrelations.length} correlaciones fuertes (${strongPercentage}% del total), destacando la conexión entre '${topCorrelation.insightA}' y '${topCorrelation.insightB}' con una intensidad de ${topCorrelation.correlationScore.toFixed(1)}/10.`,
      icon: <Network className="h-5 w-5" />,
      type: "correlation",
      confidence: this.calculateCorrelationConfidence(strongCorrelations),
      priority: strongCorrelations.length > 3 ? "high" : "medium",
      renderInsight: ({ highlight }) => (
        <p>
          He detectado {highlight(strongCorrelations.length.toString())}
          correlaciones fuertes ({highlight(strongPercentage)}% del total),
          destacando la conexión entre '{highlight(topCorrelation.insightA)}' y
          '{highlight(topCorrelation.insightB)}' con una intensidad de{" "}
          {highlight(topCorrelation.correlationScore.toFixed(1))}/10.
        </p>
      ),
      metadata,
      renderMetadata: ({
        metadata: {
          strongCount,
          percentage,
          topPair: { a, b, score },
        },
      }: {
        metadata: typeof metadata;
      }) => (
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>
            {strongCount} correlaciones fuertes ({percentage}% del total),
            destacando la conexión entre '{a}' y '{b}' con una intensidad de{" "}
            {score.toFixed(1)}/10.
          </span>
        </div>
      ),
    };
  }

  private calculateCorrelationConfidence(
    correlations: typeof context.correlations
  ): number {
    const avgScore =
      correlations.reduce((sum, c) => sum + c.correlationScore, 0) /
      correlations.length;
    return Math.min(avgScore + 0.5, 10);
  }
}

/**
 * Strategy for business intelligence insights
 */
export class IntelligenceStrategy implements InsightStrategy {
  id = "intelligence";
  name = "Business Intelligence";
  type = "intelligence" as const;

  minDataRequirements = {
    minInsights: 5,
    minComments: 100,
  };

  canGenerate(context: InsightGenerationContext): boolean {
    return context.insights.length > 5 && context.totalComments > 100;
  }

  generate(context: InsightGenerationContext): GeneratedInsight | null {
    const avgCommentsPerInsight = Math.round(
      context.totalComments / context.insights.length
    );

    const highConfidenceInsights = context.insights.filter(
      (i) => i.avgConfidence >= 8
    ).length;

    const confidencePercentage = (
      (highConfidenceInsights / context.insights.length) *
      100
    ).toFixed(0);
    const confidence = this.calculateIntelligenceConfidence(
      parseFloat(confidencePercentage),
      avgCommentsPerInsight
    );
    return {
      id: "intelligence",
      text: `Los datos revelan un promedio de ${avgCommentsPerInsight} comentarios por patrón, con ${confidencePercentage}% de los insights mostrando alta confianza (≥8.0), lo que sugiere patrones bien definidos y accionables.`,
      icon: <Lightbulb className="h-5 w-5" />,
      type: "intelligence",
      confidence,
      renderInsight: ({ highlight }) => (
        <p>
          Los datos revelan un promedio de{" "}
          {highlight(avgCommentsPerInsight.toString())} comentarios por patrón,
          con {highlight(confidencePercentage)}% de los insights mostrando alta
          confianza {highlight(confidence.toString())}, lo que sugiere patrones
          bien definidos y accionables.
        </p>
      ),
      priority: parseFloat(confidencePercentage) > 70 ? "high" : "medium",
      metadata: {
        avgComments: avgCommentsPerInsight,
        highConfidencePercentage: parseFloat(confidencePercentage),
        totalInsights: context.insights.length,
      },
    };
  }

  private calculateIntelligenceConfidence(
    confidencePercentage: number,
    avgComments: number
  ): number {
    const confidenceWeight = (confidencePercentage / 100) * 3;
    const volumeWeight = Math.min(avgComments / 50, 1) * 2;
    return Math.min(5 + confidenceWeight + volumeWeight, 10);
  }
}

/**
 * Strategy for trend analysis
 */
export class TrendStrategy implements InsightStrategy {
  id = "trend";
  name = "Trend Analysis";
  type = "trend" as const;

  minDataRequirements = {
    minInsights: 1,
    minComments: 10,
  };

  canGenerate(context: InsightGenerationContext): boolean {
    const aiGenerated = context.insights.filter((i) => i.aiGenerated);
    if (aiGenerated.length === 0) return false;

    const recentEmergent = this.getRecentEmergent(aiGenerated);
    return recentEmergent.length > 0;
  }

  generate(context: InsightGenerationContext): GeneratedInsight | null {
    const aiGenerated = context.insights.filter((i) => i.aiGenerated);
    const recentEmergent = this.getRecentEmergent(aiGenerated);

    if (recentEmergent.length === 0) return null;

    const trendDirection = this.calculateTrendDirection(recentEmergent);
    const intensity =
      trendDirection === "accelerating" ? "intensa" : "moderada";

    return {
      id: "trends",
      text: `La actividad de detección ha sido ${intensity}: ${recentEmergent.length} nuevos patrones han emergido en los últimos 30 días, indicando una evolución ${trendDirection === "accelerating" ? "acelerada" : "gradual"} en los temas de conversación analizados.`,
      icon: <TrendingUp className="h-5 w-5" />,
      type: "trend",
      confidence: this.calculateTrendConfidence(recentEmergent, trendDirection),
      priority: recentEmergent.length > 10 ? "high" : "medium",
      renderInsight: ({ highlight }) => (
        <p>
          La actividad de detección ha sido {highlight(intensity)}:{" "}
          {highlight(recentEmergent.length.toString())} nuevos patrones han
          emergido en los últimos 30 días, indicando una evolución{" "}
          {highlight(
            trendDirection === "accelerating" ? "acelerada" : "gradual"
          )}
          en los temas de conversación analizados.
        </p>
      ),
      metadata: {
        recentCount: recentEmergent.length,
        trendDirection,
        daysAnalyzed: 30,
      },
    };
  }

  private getRecentEmergent(insights: BaseInsight[]): BaseInsight[] {
    return insights.filter((i) => {
      const daysSinceEmergence = Math.floor(
        (new Date().getTime() - new Date(i.emergenceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysSinceEmergence <= 30;
    });
  }

  private calculateTrendDirection(
    recentInsights: BaseInsight[]
  ): "accelerating" | "steady" | "decelerating" {
    const midPoint = new Date();
    midPoint.setDate(midPoint.getDate() - 15);

    const firstHalf = recentInsights.filter(
      (i) => new Date(i.emergenceDate) < midPoint
    ).length;

    const secondHalf = recentInsights.filter(
      (i) => new Date(i.emergenceDate) >= midPoint
    ).length;

    if (secondHalf > firstHalf * 1.5) return "accelerating";
    if (secondHalf < firstHalf * 0.5) return "decelerating";
    return "steady";
  }

  private calculateTrendConfidence(
    recentInsights: BaseInsight[],
    direction: string
  ): number {
    const baseConfidence = 7;
    const volumeBonus = Math.min(recentInsights.length / 20, 1) * 2;
    const directionBonus = direction === "accelerating" ? 0.5 : 0;
    return Math.min(baseConfidence + volumeBonus + directionBonus, 10);
  }
}

/**
 * Strategy registry and factory
 */
export class InsightStrategyFactory {
  private strategies: Map<string, InsightStrategy> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    this.register(new DiscoveryStrategy());
    this.register(new DominanceStrategy());
    this.register(new CorrelationStrategy());
    this.register(new IntelligenceStrategy());
    this.register(new TrendStrategy());
  }

  register(strategy: InsightStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  getStrategy(id: string): InsightStrategy | undefined {
    return this.strategies.get(id);
  }

  getAllStrategies(): InsightStrategy[] {
    return Array.from(this.strategies.values());
  }

  getApplicableStrategies(
    context: InsightGenerationContext
  ): InsightStrategy[] {
    return this.getAllStrategies().filter((strategy) =>
      strategy.canGenerate(context)
    );
  }
}
