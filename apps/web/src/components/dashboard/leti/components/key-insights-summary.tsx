import { DataCard } from "@/components/data/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Lightbulb,
  Activity,
  MessageSquare,
  Info,
} from "lucide-react";
import { useMemo } from "react";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { LETI_METRICS } from "../helpers/leti-constants";
import { divide } from "remeda";
import { AverageIntensityCard } from "../../pix/components/sentiment-summary";

interface KeyInsightsSummaryProps {
  className?: string;
}

export const KeyInsightsSummary: React.FC<KeyInsightsSummaryProps> = ({
  className,
}) => {
  const {
    data: insights,
    isLoading,
    error,
  } = useQuery(
    trpc.analytics.leti.topInsights.queryOptions({
      minComments: 1,
      limit: 50,
    })
  );

  const keyMetrics = useMemo(() => {
    if (!insights || insights.length === 0) return null;

    const totalComments = insights.reduce((sum, i) => sum + i.totalComments, 0);
    const aiGenerated = insights.filter((i) => i.aiGenerated);
    const topInsight = insights[0];

    // Find most recent emergent insight
    const recentEmergent = [...insights]
      .filter((i) => i.aiGenerated)
      .sort(
        (a, b) =>
          new Date(b.emergenceDate).getTime() -
          new Date(a.emergenceDate).getTime()
      )[0];

    // Find highest confidence insight
    const highestConfidence = [...insights].sort(
      (a, b) => b.avgConfidence - a.avgConfidence
    )[0];

    return {
      totalInsights: insights.length,
      totalComments,
      aiGeneratedCount: aiGenerated.length,
      aiPercentage: (aiGenerated.length / insights.length) * 100,
      topInsight: {
        ...topInsight,
        percentOfTotal: (topInsight.totalComments / totalComments) * 100,
      },
      recentEmergent,
      highestConfidence,
      avgCommentsPerInsight: Math.round(totalComments / insights.length),
    };
  }, [insights]);

  if (error) {
    return (
      <div className={cn("grid gap-4", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load insights. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <DataCard>
        {[...Array(4)].map((_, i) => (
          <div className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </DataCard>
    );
  }

  if (!keyMetrics) {
    return (
      <DataCard>
        <div className="p-6 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No insights data available</p>
        </div>
      </DataCard>
    );
  }

  return (
    <div>
      {/* Total Patterns */}
      <div className="grid md:grid-cols-4  rounded-xl overflow-hidden bg-card   items-center shadow-lg">
        {/* Left side - Total Insights */}
        <div className="flex flex-col gap-2 border-r border-border p-4 h-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LETI_METRICS.KEY_METRICS.TOTAL_INSIGHTS.icon className="h-4 w-4" />
            <span>{LETI_METRICS.KEY_METRICS.TOTAL_INSIGHTS.label}</span>
            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              {LETI_METRICS.KEY_METRICS.TOTAL_INSIGHTS.label}
            </IconTooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">
              {keyMetrics.totalInsights}
            </span>
            <div className="text-xs border rounded-md px-2 py-1 text-brand flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>AI powered</span>
            </div>
          </div>
        </div>

        {/* Right side - Total Comments */}
        <div className="flex flex-col gap-2 border-r border-border p-4 h-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LETI_METRICS.KEY_METRICS.TOTAL_COMMENTS.icon className="h-4 w-4" />
            <span>{LETI_METRICS.KEY_METRICS.TOTAL_COMMENTS.label}</span>
            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              {LETI_METRICS.KEY_METRICS.TOTAL_COMMENTS.label}
            </IconTooltip>
          </div>
          <span className="text-3xl font-bold">
            {keyMetrics.totalComments.toLocaleString()}
          </span>
        </div>

        {/* Most Popular Insight */}
        <div className="flex flex-col gap-2 border-r border-border p-4 h-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LETI_METRICS.KEY_METRICS.MOST_POPULAR_INSIGHT.icon className="h-4 w-4" />
            <span>{LETI_METRICS.KEY_METRICS.MOST_POPULAR_INSIGHT.label}</span>
            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              {LETI_METRICS.KEY_METRICS.MOST_POPULAR_INSIGHT.label}
            </IconTooltip>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-3xl font-bold">{keyMetrics.topInsight.name}</p>
              <p className="text-sm text-muted-foreground">
                {keyMetrics.topInsight.totalComments} occurrences
              </p>
            </div>
            <div className="text-sm w-min aspect-square p-0.5 mx-2 border flex items-center justify-center bg-brand/20 text-brand rounded-full">
              {keyMetrics.topInsight.percentOfTotal.toFixed(2)}%
            </div>
          </div>
        </div>
        {/* Latest Discovery */}
        {/* 
        <div className="flex flex-col gap-2 p-4 h-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
            <div className="flex items-center gap-2">
              <LETI_METRICS.KEY_METRICS.LATEST_DISCOVERY.icon className="h-4 w-4" />
              <span>{LETI_METRICS.KEY_METRICS.LATEST_DISCOVERY.label}</span>
              {keyMetrics.recentEmergent?.aiGenerated && (
                <Badge
                  variant="secondary"
                  className="text-xs text-brand rounded-full border-brand/30 bg-brand/10"
                >
                  emergent
                </Badge>
              )}
            </div>

            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              {LETI_METRICS.KEY_METRICS.LATEST_DISCOVERY.label}
            </IconTooltip>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xl font-bold">
                {keyMetrics.recentEmergent?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {keyMetrics.recentEmergent?.totalComments} occurrences
              </p>
            </div>
          </div>
        </div> */}

        <AverageIntensityCard />
      </div>
    </div>
  );
};
