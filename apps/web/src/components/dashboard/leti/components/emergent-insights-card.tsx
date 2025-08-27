import { DataCard } from "@/components/data/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconTooltip } from "@/components/common/icon-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  Bot,
  Lightbulb,
} from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface EmergentInsightsCardProps {
  className?: string;
}

const EMERGENT_METRICS = {
  TITLE: "AI-Discovered Patterns",
  DESCRIPTION: "Emerging patterns automatically detected by AI analysis",
  TOOLTIP: {
    title: "AI Pattern Discovery",
    content:
      "These patterns were automatically discovered by AI. They represent potential new trends that weren't previously defined in the system.",
  },
  HELP_TEXT:
    "Monitor emergent patterns to identify new trends and opportunities.",
} as const;

export const EmergentInsightsCard: React.FC<EmergentInsightsCardProps> = ({
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

  const emergentData = useMemo(() => {
    if (!insights || insights.length === 0) return null;

    // Filter for AI-generated insights
    const emergentInsights = insights
      .filter((insight) => insight.aiGenerated)
      .sort((a, b) => b.totalComments - a.totalComments)
      .slice(0, 6); // Top 6 emergent insights

    if (emergentInsights.length === 0) return null;

    const totalEmergentComments = emergentInsights.reduce(
      (sum, insight) => sum + insight.totalComments,
      0
    );

    // Find newest
    const newestInsight = [...emergentInsights].sort(
      (a, b) =>
        new Date(b.emergenceDate).getTime() - new Date(a.emergenceDate).getTime()
    )[0];

    return {
      insights: emergentInsights,
      totalEmergentComments,
      newestInsight,
      count: emergentInsights.length,
    };
  }, [insights]);

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load emergent insights. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </DataCard>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={EMERGENT_METRICS.TITLE}
          description={EMERGENT_METRICS.DESCRIPTION}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DataCard>
    );
  }

  if (!emergentData) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={EMERGENT_METRICS.TITLE}
          description={EMERGENT_METRICS.DESCRIPTION}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI-discovered patterns yet</p>
          <p className="text-sm mt-2">
            Emergent patterns will appear here as they are detected
          </p>
        </div>
      </DataCard>
    );
  }

  const maxComments = Math.max(...emergentData.insights.map((i) => i.totalComments));

  return (
    <DataCard className={cn(className)}>
      <DataCard.Header
        title={EMERGENT_METRICS.TITLE}
        description={EMERGENT_METRICS.DESCRIPTION}
        icon={<Sparkles className="h-5 w-5" />}
      />

      {/* Header Stats */}
      <div className="px-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="gap-1">
              <Bot className="h-3 w-3" />
              {emergentData.count} Patterns
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              {emergentData.totalEmergentComments.toLocaleString()} Total Occurrences
            </Badge>
            {emergentData.newestInsight && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Latest: {formatDistanceToNow(new Date(emergentData.newestInsight.emergenceDate), {
                  addSuffix: true,
                })}
              </Badge>
            )}
          </div>
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">
              {EMERGENT_METRICS.TOOLTIP.title}
            </p>
            <p className="text-xs">{EMERGENT_METRICS.TOOLTIP.content}</p>
          </IconTooltip>
        </div>
      </div>

      {/* Emergent Insights Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergentData.insights.map((insight) => {
            const percentage = (insight.totalComments / maxComments) * 100;
            const isNew = 
              Math.floor(
                (new Date().getTime() - new Date(insight.emergenceDate).getTime()) / 
                (1000 * 60 * 60 * 24)
              ) <= 7;

            return (
              <div
                key={insight.id}
                className="group relative p-4 rounded-lg border bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:shadow-md transition-all"
              >
                {isNew && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 text-xs gap-1"
                  >
                    <Zap className="h-3 w-3" />
                    New
                  </Badge>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">
                      {insight.totalComments} occurrences
                    </Badge>
                  </div>

                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className="font-medium text-sm line-clamp-2">
                          {insight.name}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-medium mb-1">{insight.name}</p>
                        <p className="text-xs">{insight.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(insight.emergenceDate), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{insight.avgConfidence.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          {EMERGENT_METRICS.HELP_TEXT}
        </p>
      </div>
    </DataCard>
  );
};