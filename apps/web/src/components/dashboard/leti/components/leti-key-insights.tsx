import React, { useState, useCallback } from "react";
import { DataCard } from "@/components/data/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, AlertCircle, RefreshCw, Info } from "lucide-react";
import {
  useLetiInsights,
  useInsightAnalytics,
} from "../hooks/use-leti-insights";
import { createHighlighter } from "../helpers/leti-utils";
import { InsightCard } from "./insight-card";
import type { InsightGeneratorConfig } from "../helpers/leti-insight-generator";

interface LetiKeyInsightsProps {
  className?: string;
  maxInsights?: number;
  minConfidence?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LetiKeyInsights: React.FC<LetiKeyInsightsProps> = ({
  className,
  maxInsights = 5,
  minConfidence = 7,
  autoRefresh = false,
  refreshInterval = 60000,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generator configuration
  const generatorConfig: InsightGeneratorConfig = {
    maxInsights,
    minConfidence,
    sortBy: "confidence",
  };

  // Use the custom hook with all the advanced patterns
  const { generatedInsights, metrics, isLoading, error, refetch } =
    useLetiInsights({
      minComments: 1,
      insightLimit: 50,
      correlationLimit: 20,
      generatorConfig,
    });

  // Analytics hook
  const analytics = useInsightAnalytics(metrics);

  // Create highlighter for rendering
  const highlighter = createHighlighter(
    "p-0.5 rounded-full  bg-brand/20 text-brand"
  );

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  // Auto-refresh effect
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(handleRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, handleRefresh]);

  // Loading state
  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title="Análisis de Leti"
          description="Insights clave generados por IA"
          icon={<Brain className="h-5 w-5" />}
          action={
            <Button variant="ghost" size="sm" disabled className="h-8">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </Button>
          }
        />
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    );
  }

  // Error state
  if (error) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title="Análisis de Leti"
          description="Insights clave generados por IA"
          icon={<Brain className="h-5 w-5" />}
        />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar los insights: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </DataCard>
    );
  }

  // Empty state
  if (generatedInsights.length === 0) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title="Análisis de Leti"
          description="Insights clave generados por IA"
          icon={<Brain className="h-5 w-5" />}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          }
        />
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay suficientes datos para generar insights clave. Los análisis
              aparecerán una vez que se detecten más patrones.
            </AlertDescription>
          </Alert>
        </div>
      </DataCard>
    );
  }

  // Main content
  return (
    <DataCard className={cn(className)}>
      <DataCard.Header
        title="Análisis de Leti"
        description="Insights clave generados por IA"
        icon={<Brain className="h-5 w-5" />}
        tooltip={
          <div className="flex items-center gap-2">
            {/* Health indicator */}
            {analytics.hasData && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    analytics.isHealthy ? "bg-green-500" : "bg-amber-500"
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {analytics.isHealthy ? "Healthy" : "Review"}
                </span>
              </div>
            )}

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
              title="Refresh insights"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>
        }
      />

      {/* Insights list */}
      <div className="divide-y divide-border">
        {generatedInsights.map((insight, index) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            index={index}
            highlighter={highlighter}
            className={index === 0 ? "bg-muted/20" : ""}
          />
        ))}
      </div>

      {/* Analytics footer */}
      {analytics.hasData && (
        <div className="px-4 pb-4 pt-3 border-t bg-muted/30 space-y-2">
          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                {analytics.recommendations[0]}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {metrics && (
              <>
                <span>{metrics.totalInsights} insights</span>
                <span>{metrics.totalComments} comments</span>
                <span>
                  {(
                    (metrics.aiGeneratedCount / metrics.totalInsights) *
                    100
                  ).toFixed(0)}
                  % AI-generated
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </DataCard>
  );
};
