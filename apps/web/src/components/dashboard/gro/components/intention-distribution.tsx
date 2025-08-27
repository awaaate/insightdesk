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
  BarChart3,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useMemo } from "react";
import {
  GRO_METRICS,
  INTENTION_TYPES,
  INTENTION_PRIORITY,
  getIntentionByType,
} from "../helpers/gro-constants";
import { DonutChart } from "@/components/data/donut-chart";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IntentionDistributionProps {
  className?: string;
}

// Component for the intention levels list
export const IntentionLevelsList: React.FC<{
  className?: string;
}> = ({ className }) => {
  const {
    data: dataGro,
    isLoading,
    error,
  } = useQuery(trpc.analytics.gro.overview.queryOptions());

  const analysis = useMemo(() => {
    if (!dataGro) return null;

    const { raw, statistics } = dataGro;
    const maxCount = Math.max(...raw.intentionDistribution.map((i) => i.count));
    const totalComments = statistics.totalAnalyzed;

    // Calculate high-risk intentions (cancel, complain)
    const highRiskCount = raw.intentionDistribution
      .filter((i) => ["cancel", "complain"].includes(i.type))
      .reduce((sum, i) => sum + i.count, 0);

    const highRiskPercentage = (highRiskCount / totalComments) * 100;

    return {
      maxCount,
      totalComments,
      highRiskPercentage,
      hasHighRisk: highRiskPercentage > 20,
      hasCancellations:
        raw.intentionDistribution.find((i) => i.type === "cancel")?.count > 0,
    };
  }, [dataGro]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load intention distribution. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(className, "space-y-3")}>
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!dataGro || !analysis) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No intention data available</p>
      </div>
    );
  }

  const maxCount = analysis?.maxCount || 0;
  const data = dataGro.raw.intentionDistribution;

  // Sort by priority for display
  const sortedData = [...data].sort((a, b) => {
    return b.count - a.count;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {sortedData.slice(0, 10).map((item, index) => {
            const intentionConfig = getIntentionByType(item.type);
            const percentage = (item.count / maxCount) * 100;
            const isHighRisk = ["cancel", "complain"].includes(item.type);

            return (
              <div
                key={item.intentionId}
                className={cn(
                  "group relative flex items-center justify-between p-3 transition-all",
                  "hover:bg-background rounded-lg"
                )}
              >
                <div className="flex items-baseline gap-3 flex-1 min-w-0 relative z-10">
                  {/* Intention Icon */}
                  <div
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: intentionConfig?.color + "20",
                      color: intentionConfig?.color,
                    }}
                  >
                    {intentionConfig && (
                      <intentionConfig.icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium cursor-help">
                            {item.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">{item.name}</p>
                          <p className="text-xs">{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      {isHighRisk && (
                        <Badge variant="destructive" className="text-xs">
                          Priority
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {item.count.toLocaleString()} comments
                      </span>
                      <span className="text-xs text-muted-foreground">
                        •{" "}
                        {(
                          (item.count /
                            data.reduce((sum, d) => sum + d.count, 0)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Most Common
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Progress Bar */}
                <div
                  className="absolute top-0 left-0 h-full rounded"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: intentionConfig?.color + "15",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {data.length > 10 && (
        <div className="px-6 py-2 text-center border-t">
          <p className="text-xs text-muted-foreground">
            Showing all {data.length} intention types
          </p>
        </div>
      )}
    </div>
  );
};

// Component for the type distribution pie chart
const IntentionTypePie: React.FC<{
  data: any;
}> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data?.pieChart) return [];

    return data.pieChart.labels.map((label: string, index: number) => ({
      name: label,
      value: data.pieChart.datasets[0].data[index],
      percentage: data.pieChart.datasets[0].percentages[index],
    }));
  }, [data]);

  const categoryColors = useMemo(() => {
    const colorMap: Record<string, string> = {
      resolve: "emerald",
      complain: "red",
      compare: "blue",
      cancel: "orange",
      inquire: "purple",
      praise: "green",
      suggest: "cyan",
      other: "gray",
    };

    const colors = new Map();
    chartData.forEach((item) => {
      colors.set(item.name, colorMap[item.name] || "gray");
    });
    return colors;
  }, [chartData]);

  return (
    <div className="flex-1 flex flex-col border-l">
      <h3 className="text-muted-foreground/60 text-sm text-center mt-4">
        Intention type distribution
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center">
        <DonutChart
          data={chartData}
          category="name"
          value="value"
          variant="donut"
          colors={[
            "emerald",
            "red",
            "blue",
            "orange",
            "purple",
            "green",
            "cyan",
            "gray",
          ]}
          valueFormatter={(value) => value.toLocaleString()}
          showTooltip={true}
          className="h-56 w-56"
        />
      </div>

      <div className="py-4 px-6">
        {chartData.slice(0, 6).map((item) => {
          const intentionConfig = getIntentionByType(item.name);
          const color = categoryColors.get(item.name);
          return (
            <div
              key={item.name}
              className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    getColorClassName(color, "bg")
                  )}
                />
                {intentionConfig && (
                  <intentionConfig.icon
                    className="h-3 w-3"
                    style={{ color: intentionConfig.color }}
                  />
                )}
                <p className="text-sm capitalize">{item.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.value}</span>
                <span className="text-xs text-muted-foreground">
                  ({item.percentage?.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const IntentionDistribution: React.FC<IntentionDistributionProps> = ({
  className,
}) => {
  const { data, isLoading, error } = useQuery(
    trpc.analytics.gro.overview.queryOptions()
  );

  const analysis = useMemo(() => {
    if (!data) return null;

    const { raw, statistics } = data;
    const maxCount = Math.max(...raw.intentionDistribution.map((i) => i.count));
    const totalComments = statistics.totalAnalyzed;

    // Calculate high-risk intentions
    const highRiskCount = raw.intentionDistribution
      .filter((i) => ["cancel", "complain"].includes(i.type))
      .reduce((sum, i) => sum + i.count, 0);

    const highRiskPercentage = (highRiskCount / totalComments) * 100;

    return {
      maxCount,
      totalComments,
      highRiskPercentage,
      hasHighRisk: highRiskPercentage > 20,
      hasCancellations:
        raw.intentionDistribution.find((i) => i.type === "cancel")?.count > 0,
      multipleIntentions: statistics.multipleIntentionsCount,
    };
  }, [data]);

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load intention distribution. Please try refreshing the
            page.
          </AlertDescription>
        </Alert>
      </DataCard>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={GRO_METRICS.DISTRIBUTION.TITLE}
          description={GRO_METRICS.DISTRIBUTION.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="p-6 flex gap-6">
          <div className="flex-1 space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-56 w-56 rounded-full" />
          </div>
        </div>
      </DataCard>
    );
  }

  if (!data || !analysis) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={GRO_METRICS.DISTRIBUTION.TITLE}
          description={GRO_METRICS.DISTRIBUTION.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No intention data available</p>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard className={cn(className, "flex flex-col h-full")}>
      <DataCard.Header
        title={GRO_METRICS.DISTRIBUTION.TITLE}
        description={GRO_METRICS.DISTRIBUTION.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* Header Stats */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Intention Analysis</span>
            <Badge variant="outline" className="text-xs">
              {analysis.totalComments.toLocaleString()} analyzed
            </Badge>
            {analysis.hasHighRisk && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                High Risk ({analysis.highRiskPercentage.toFixed(0)}%)
              </Badge>
            )}
            {analysis.hasCancellations && (
              <Badge variant="destructive" className="text-xs">
                Cancellation Risk
              </Badge>
            )}
            {analysis.multipleIntentions > 0 && (
              <Badge variant="secondary" className="text-xs">
                {analysis.multipleIntentions} complex
              </Badge>
            )}
          </div>
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">
              {GRO_METRICS.DISTRIBUTION.TOOLTIP.title}
            </p>
            <p className="text-xs">
              {GRO_METRICS.DISTRIBUTION.TOOLTIP.content}
            </p>
          </IconTooltip>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className="flex-1 px-6 py-4">
        <Tabs defaultValue="list">
          <TabsList className="w-full flex">
            <TabsTrigger value="list">Intentions</TabsTrigger>
            <TabsTrigger value="pie">Type Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <IntentionLevelsList className="flex-1" />
          </TabsContent>
          <TabsContent value="pie">
            <IntentionTypePie data={data} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t">
        <p className="text-xs text-muted-foreground">
          {GRO_METRICS.OVERVIEW.HELP_TEXT}
        </p>
      </div>
    </DataCard>
  );
};
