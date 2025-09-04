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
  TrendingDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useMemo } from "react";
import { PIX_METRICS, SENTIMENT_LEVELS } from "../helpers/pix-constants";
import { BarChart } from "@/components/data/bar-chart";
import { DonutChart } from "@/components/data/donut-chart";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters";

interface SentimentDistributionProps {
  className?: string;
}

// Component for the sentiment levels list
export const SentimentLevelsList: React.FC<{
  className?: string;
}> = ({ className }) => {
  const filters = useAnalyticsFilters();

  const {
    data: dataPixe,
    isLoading,
    error,
  } = useQuery(
    trpc.analytics.sentimentDistribution.queryOptions({
      timeRange: filters.timeRange,
      business_unit: filters.businessUnit,
      operational_area: filters.operationalArea,
      source: filters.source,
      limit: filters.limit,
      minComments: filters.minComments,
    })
  );

  const analysis = useMemo(() => {
    if (!dataPixe || dataPixe.length === 0) return null;

    const maxCount = Math.max(...dataPixe.map((s) => s.count));
    const totalComments = dataPixe.reduce((sum, s) => sum + s.count, 0);

    // Calculate sentiment balance
    const negativeCount = dataPixe
      .filter((s) => s.intensityValue < 0)
      .reduce((sum, s) => sum + s.count, 0);
    const positiveCount = dataPixe
      .filter((s) => s.intensityValue > 0)
      .reduce((sum, s) => sum + s.count, 0);

    const negativePercentage =
      totalComments > 0 ? (negativeCount / totalComments) * 100 : 0;

    return {
      maxCount,
      totalComments,
      negativePercentage,
      hasHighNegative: negativePercentage > 70,
      hasCritical: dataPixe.some((s) => s.severity === "critical"),
    };
  }, [dataPixe]);

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sentiment distribution. Please try refreshing the
            page.
          </AlertDescription>
        </Alert>
      </DataCard>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <Skeleton className="h-12 w-full" />
      </DataCard>
    );
  }

  if (!dataPixe || !analysis) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={PIX_METRICS.DISTRIBUTION.TITLE}
          description={PIX_METRICS.DISTRIBUTION.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sentiment data available</p>
        </div>
      </DataCard>
    );
  }
  const maxCount = analysis?.maxCount || 0;
  const data = dataPixe || [];
  const mostCommon = [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {mostCommon.map((item, index) => {
            const sentimentConfig = Object.values(SENTIMENT_LEVELS).find(
              (s) => s.level === item.level
            );
            const percentage = (item.count / maxCount) * 100;
            const isNegative = item.intensityValue < 0;
            const isPositive = item.intensityValue > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex items-center justify-between p-3 transition-all",
                  "hover:bg-background rounded-lg"
                )}
              >
                <div className="flex items-baseline gap-3 flex-1 min-w-0 relative z-10">
                  {/* Sentiment Icon */}
                  <div
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: sentimentConfig?.color + "20",
                      color: sentimentConfig?.color,
                    }}
                  >
                    {sentimentConfig && (
                      <sentimentConfig.icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: sentimentConfig?.color,
                          color: sentimentConfig?.color,
                        }}
                      >
                        {isPositive ? "+" : ""}
                        {item.intensityValue}
                      </Badge>
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
                    backgroundColor: sentimentConfig?.color + "15",
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
            Showing all {data.length} sentiment levels
          </p>
        </div>
      )}
    </div>
  );
};

// Component for the donut chart on the right side
const SentimentDistributionPie: React.FC<{
  data: {
    name: string;
    count: number;
    intensityValue: number;
    level: string;
    id: number;
  }[];
}> = ({ data }) => {
  const chartData = useMemo(() => {
    const totalComments = data.reduce((sum, i) => sum + i.count, 0);

    return data.map((item, index) => ({
      name: item.name,
      value: item.count,
      percentage: ((item.count / totalComments) * 100).toFixed(1),
    }));
  }, [data]);

  const categoryColors = useMemo(() => {
    return constructCategoryColors(
      chartData.map((d) => d.name),
      AvailableChartColors
    );
  }, [chartData]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col items-center justify-center">
        <DonutChart
          data={chartData}
          category="name"
          value="value"
          variant="donut"
          colors={AvailableChartColors}
          valueFormatter={(value) => value.toLocaleString()}
          showTooltip={true}
          className="h-56 w-56"
        />
      </div>

      <div className="py-4 px-6 flex-1">
        {chartData.slice(0, 6).map((item, index) => {
          return (
            <div
              key={item.name}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors  justify-between  ",
                "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2  justify-between">
                <div
                  className={cn(
                    "h-9 w-1 rounded-full",
                    getColorClassName(
                      categoryColors.get(item.name) ?? "emerald",
                      "bg"
                    )
                  )}
                />
                <div>
                  <p className={cn("text-sm")}>{item.name}</p>
                  <p className="text-xs flex items-center gap-1">
                    <span className=" text-muted-foreground">
                      {item.value}{" "}
                    </span>
                    <span className="text-muted-foreground/80">
                      {item.percentage}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SentimentDistribution: React.FC<SentimentDistributionProps> = ({
  className,
}) => {
  const filters = useAnalyticsFilters();

  const { data, isLoading, error } = useQuery(
    trpc.analytics.sentimentDistribution.queryOptions({
      timeRange: filters.timeRange,
      business_unit: filters.businessUnit,
      operational_area: filters.operationalArea,
      source: filters.source,
      limit: filters.limit,
      minComments: filters.minComments,
    })
  );

  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map((s) => s.count));
    const totalComments = data.reduce((sum, s) => sum + s.count, 0);

    // Calculate sentiment balance
    const negativeCount = data
      .filter((s) => s.intensityValue < 0)
      .reduce((sum, s) => sum + s.count, 0);
    const positiveCount = data
      .filter((s) => s.intensityValue > 0)
      .reduce((sum, s) => sum + s.count, 0);

    const negativePercentage =
      totalComments > 0 ? (negativeCount / totalComments) * 100 : 0;

    return {
      maxCount,
      totalComments,
      negativePercentage,
      hasHighNegative: negativePercentage > 70,
      hasCritical: data.some((s) => s.severity === "critical"),
    };
  }, [data]);

  const colors = constructCategoryColors(
    data?.map((s) => s.name) || [],
    AvailableChartColors
  );

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sentiment distribution. Please try refreshing the
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
          title={PIX_METRICS.DISTRIBUTION.TITLE}
          description={PIX_METRICS.DISTRIBUTION.DESCRIPTION}
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
          title={PIX_METRICS.DISTRIBUTION.TITLE}
          description={PIX_METRICS.DISTRIBUTION.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sentiment data available</p>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard className={cn(className, "flex flex-col h-full")}>
      <DataCard.Header
        title={PIX_METRICS.DISTRIBUTION.TITLE}
        description={PIX_METRICS.DISTRIBUTION.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* Header Stats */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Sentiment Analysis</span>
            <Badge variant="outline" className="text-xs">
              {analysis.totalComments.toLocaleString()} analyzed
            </Badge>
            {analysis.hasHighNegative && (
              <Badge variant="destructive" className="text-xs gap-1">
                <TrendingDown className="h-3 w-3" />
                High Negative ({analysis.negativePercentage.toFixed(0)}%)
              </Badge>
            )}
            {analysis.hasCritical && (
              <Badge variant="destructive" className="text-xs">
                Critical Alerts
              </Badge>
            )}
          </div>
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">
              {PIX_METRICS.DISTRIBUTION.TOOLTIP.title}
            </p>
            <p className="text-xs">
              {PIX_METRICS.DISTRIBUTION.TOOLTIP.content}
            </p>
          </IconTooltip>
        </div>
      </div>

      {/* Main Content - Split Layout */}

      <div className="px-6 py-4">
        <Tabs defaultValue="list">
          <TabsList className="w-full flex">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4 h-[300px]">
            <SentimentLevelsList className="flex-1" />
          </TabsContent>
          <TabsContent value="pie" className="mt-4 h-[300px]">
            <SentimentDistributionPie data={data} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t">
        <p className="text-xs text-muted-foreground">
          {PIX_METRICS.OVERVIEW.HELP_TEXT}
        </p>
      </div>
    </DataCard>
  );
};
