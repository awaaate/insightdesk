import { DataCard } from "@/components/data/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Network,
  AlertCircle,
  HelpCircle,
  Link2,
  ArrowRight,
  TrendingUp,
  Grid3x3,
  List,
} from "lucide-react";
import { useMemo } from "react";

interface InsightCorrelationsProps {
  className?: string;
}

const CORRELATION_METRICS = {
  TITLE: "Pattern Correlations",
  DESCRIPTION: "Insights that frequently appear together",
  TOOLTIP: {
    title: "Understanding Correlations",
    content:
      "These patterns often appear in the same comments, suggesting related themes or connected concepts. Strong correlations can reveal hidden relationships in your data.",
  },
  HELP_TEXT:
    "Correlations help identify pattern clusters and related themes in your data.",
} as const;

// Helper function to get color based on correlation strength
const getCorrelationColor = (strength: number) => {
  if (strength >= 9) return "bg-purple-600";
  if (strength >= 8) return "bg-purple-500";
  if (strength >= 7) return "bg-blue-500";
  if (strength >= 6) return "bg-blue-400";
  if (strength >= 5) return "bg-cyan-400";
  if (strength >= 4) return "bg-cyan-300";
  if (strength >= 3) return "bg-gray-300";
  return "bg-gray-200";
};

const getCorrelationGradient = (strength: number) => {
  const opacity = Math.min(100, (strength / 10) * 100);
  if (strength >= 7) return `bg-gradient-to-br from-purple-500 to-blue-500 opacity-${Math.round(opacity)}`;
  if (strength >= 5) return `bg-gradient-to-br from-blue-400 to-cyan-400 opacity-${Math.round(opacity)}`;
  return `bg-gray-200 opacity-${Math.round(opacity)}`;
};

export const InsightCorrelations: React.FC<InsightCorrelationsProps> = ({
  className,
}) => {
  const {
    data: correlations,
    isLoading,
    error,
  } = useQuery(
    trpc.analytics.leti.insightCorrelations.queryOptions({
      minCoOccurrence: 2,
      limit: 20, // Get more for heatmap
    })
  );

  const { analysisData, heatmapData } = useMemo(() => {
    if (!correlations || correlations.length === 0) {
      return { analysisData: null, heatmapData: null };
    }

    const strongCorrelations = correlations.filter(
      (c) => c.correlationScore > 7
    );
    const topCorrelation = correlations[0];
    const avgCorrelation =
      correlations.reduce((sum, c) => sum + c.correlationScore, 0) /
      correlations.length;

    // Build heatmap data
    const insights = new Set<string>();
    correlations.forEach((c) => {
      insights.add(c.insightA);
      insights.add(c.insightB);
    });

    const insightList = Array.from(insights).sort();
    
    // Create correlation matrix
    const matrix: Record<string, Record<string, number>> = {};
    insightList.forEach((insight) => {
      matrix[insight] = {};
      insightList.forEach((other) => {
        matrix[insight][other] = 0;
      });
    });

    // Fill matrix with correlation scores
    correlations.forEach((c) => {
      matrix[c.insightA][c.insightB] = c.correlationScore;
      matrix[c.insightB][c.insightA] = c.correlationScore; // Symmetric
    });

    // Set diagonal to max (self-correlation)
    insightList.forEach((insight) => {
      matrix[insight][insight] = 10;
    });

    return {
      analysisData: {
        totalCorrelations: correlations.length,
        strongCount: strongCorrelations.length,
        topCorrelation,
        avgCorrelation,
      },
      heatmapData: {
        insights: insightList,
        matrix,
      },
    };
  }, [correlations]);

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load correlations. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </DataCard>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={CORRELATION_METRICS.TITLE}
          description={CORRELATION_METRICS.DESCRIPTION}
          icon={<Network className="h-5 w-5" />}
        />
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </DataCard>
    );
  }

  if (!analysisData || !correlations || correlations.length === 0) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={CORRELATION_METRICS.TITLE}
          description={CORRELATION_METRICS.DESCRIPTION}
          icon={<Network className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No correlations found</p>
          <p className="text-sm mt-2">
            Pattern relationships will appear here as more data is analyzed
          </p>
        </div>
      </DataCard>
    );
  }

  const maxCoOccurrence = Math.max(
    ...correlations.map((c) => c.coOccurrenceCount)
  );

  return (
    <DataCard className={cn(className, "flex flex-col h-full")}>
      <DataCard.Header
        title={CORRELATION_METRICS.TITLE}
        description={CORRELATION_METRICS.DESCRIPTION}
        icon={<Network className="h-5 w-5" />}
      />

      {/* Header Stats */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Correlations</p>
              <p className="text-xl font-semibold">
                {analysisData.totalCorrelations}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Strong Links</p>
              <p className="text-xl font-semibold">
                {analysisData.strongCount}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Avg Strength</p>
              <p className="text-xl font-semibold">
                {analysisData.avgCorrelation.toFixed(1)}
              </p>
            </div>
          </div>
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">
              {CORRELATION_METRICS.TOOLTIP.title}
            </p>
            <p className="text-xs">{CORRELATION_METRICS.TOOLTIP.content}</p>
          </IconTooltip>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 grid w-fit grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            Heatmap
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="flex-1 overflow-auto">
          <div className="p-6 space-y-3">
            {correlations.slice(0, 8).map((correlation, index) => {
              const strength = correlation.correlationScore;
              const percentage =
                (correlation.coOccurrenceCount / maxCoOccurrence) * 100;

              const strengthBadge =
                strength > 8
                  ? { label: "Very Strong", color: "default" as const }
                  : strength > 6
                    ? { label: "Strong", color: "secondary" as const }
                    : { label: "Moderate", color: "outline" as const };

              return (
                <div
                  key={`${correlation.insightA}-${correlation.insightB}`}
                  className={cn(
                    "group relative p-4 rounded-lg border transition-all",
                    "hover:bg-accent hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {/* Pattern A */}
                        <div className="flex-1 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate">
                                {correlation.insightA}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="font-medium mb-1">
                                {correlation.insightA}
                              </p>
                              <p className="text-xs">
                                {correlation.insightADesc}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Connection Arrow */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Pattern B */}
                        <div className="flex-1 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate">
                                {correlation.insightB}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="font-medium mb-1">
                                {correlation.insightB}
                              </p>
                              <p className="text-xs">
                                {correlation.insightBDesc}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {correlation.coOccurrenceCount} co-occurrences
                          </span>
                          <Badge
                            variant={strengthBadge.color}
                            className="text-xs"
                          >
                            {strengthBadge.label}
                          </Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              strength > 8
                                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                : strength > 6
                                  ? "bg-blue-500"
                                  : "bg-gray-400"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {strength.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">strength</p>
                    </div>
                  </div>

                  {/* Position Badge */}
                  {index === 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 text-xs gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Strongest
                    </Badge>
                  )}
                </div>
              );
            })}

            {correlations.length > 8 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Showing top 8 of {correlations.length} correlations
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Heatmap View */}
        <TabsContent value="heatmap" className="flex-1 overflow-auto">
          <div className="p-6">
            {heatmapData && heatmapData.insights.length > 0 ? (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 justify-center mb-4">
                  <span className="text-xs text-muted-foreground">Weak</span>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                      <div
                        key={val}
                        className={cn(
                          "w-6 h-6 rounded",
                          getCorrelationColor(val)
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Strong</span>
                </div>

                {/* Heatmap Grid */}
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* Column Headers */}
                    <div className="flex gap-1 mb-1 ml-32">
                      {heatmapData.insights.map((insight) => (
                        <Tooltip key={`col-${insight}`}>
                          <TooltipTrigger asChild>
                            <div className="w-8 h-32 flex items-end justify-center">
                              <span className="text-xs -rotate-45 transform origin-center whitespace-nowrap">
                                {insight.length > 15
                                  ? insight.substring(0, 15) + "..."
                                  : insight}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{insight}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>

                    {/* Rows */}
                    {heatmapData.insights.map((rowInsight) => (
                      <div key={`row-${rowInsight}`} className="flex gap-1 mb-1">
                        {/* Row Header */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-32 h-8 flex items-center justify-end pr-2">
                              <span className="text-xs truncate">
                                {rowInsight.length > 20
                                  ? rowInsight.substring(0, 20) + "..."
                                  : rowInsight}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{rowInsight}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Cells */}
                        {heatmapData.insights.map((colInsight) => {
                          const score =
                            heatmapData.matrix[rowInsight][colInsight];
                          const isSelf = rowInsight === colInsight;

                          return (
                            <Tooltip key={`cell-${rowInsight}-${colInsight}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded transition-all cursor-pointer",
                                    isSelf
                                      ? "bg-gray-300"
                                      : score > 0
                                      ? getCorrelationColor(score)
                                      : "bg-gray-100",
                                    !isSelf && score > 0 && "hover:ring-2 hover:ring-primary"
                                  )}
                                />
                              </TooltipTrigger>
                              {!isSelf && score > 0 && (
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium text-xs">
                                      {rowInsight} ↔ {colInsight}
                                    </p>
                                    <p className="text-xs">
                                      Strength: {score.toFixed(1)}
                                    </p>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Darker cells indicate stronger correlations between patterns.
                    Hover over cells to see correlation details.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not enough data for heatmap visualization</p>
                <p className="text-sm mt-2">
                  Need at least 3 unique patterns to generate a heatmap
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-6 pb-4 pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          {CORRELATION_METRICS.HELP_TEXT}
        </p>
      </div>
    </DataCard>
  );
};