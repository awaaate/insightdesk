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
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useMemo } from "react";
import {
  GRO_METRICS,
  INTENTION_TYPES,
  getIntentionByType,
} from "../helpers/gro-constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadialBar, RadialBarChart, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters";

interface IntentionDistributionProps {
  className?: string;
}

// Component for the intention levels list
export const IntentionLevelsList: React.FC<{
  className?: string;
}> = ({ className }) => {
  const filters = useAnalyticsFilters();
  
  const {
    data: dataGro,
    isLoading,
    error,
  } = useQuery(trpc.analytics.intentDistribution.queryOptions({
    timeRange: filters.timeRange,
    business_unit: filters.businessUnit,
    operational_area: filters.operationalArea,
    source: filters.source,
    limit: filters.limit,
    minComments: filters.minComments,
  }));

  const analysis = useMemo(() => {
    if (!dataGro || dataGro.length === 0) return null;

    const maxCount = Math.max(...dataGro.map((i) => i.count));
    const totalComments = dataGro.reduce((sum, i) => sum + i.count, 0);

    // Calculate high-risk intentions (cancel, complain)
    const highRiskCount = dataGro
      .filter((i) => ["cancel", "complain"].includes(i.type))
      .reduce((sum, i) => sum + i.count, 0);

    const highRiskPercentage = totalComments > 0 ? (highRiskCount / totalComments) * 100 : 0;

    return {
      maxCount,
      totalComments,
      highRiskPercentage,
      hasHighRisk: highRiskPercentage > 20,
      hasCancellations:
        dataGro.find((i) => i.type === "cancel")?.count > 0,
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
  const data = dataGro || [];

  // Sort by priority for display
  const sortedData = [...data].sort((a, b) => {
    return b.count - a.count;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {sortedData.slice(0, 10).map((item, index) => {
            const intentionConfig = getIntentionByType(item.type || "");
            const percentage = (item.count / maxCount) * 100;
            const isHighRisk = ["cancel", "complain"].includes(item.type || "");

            return (
              <div
                key={item.id}
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

// Component for the type distribution radial chart
const IntentionTypePie: React.FC<{
  data: Array<{
    id: number;
    type: string | null;
    name: string;
    description: string;
    count: number;
  }>;
}> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const totalValue = data.reduce((sum, item) => sum + item.count, 0);
    
    // Get top 5 intentions by count and aggregate the rest as "Other"
    const sortedData = [...data]
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        name: item.type || item.name,
        value: item.count,
        percentage: totalValue > 0 ? (item.count / totalValue) * 100 : 0,
      }));

    // Take top 5 and add others if needed
    const top5 = sortedData.slice(0, 5);
    const otherSum = sortedData.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (otherSum > 0) {
      top5.push({
        name: "other",
        value: otherSum,
        percentage: totalValue > 0 ? (otherSum / totalValue) * 100 : 0,
      });
    }

    // Process for radial chart - sort by value and assign angle
    return top5
      .sort((a, b) => b.value - a.value)
      .map((item, index) => {
        const intentionConfig = getIntentionByType(item.name.toLowerCase());
        return {
          name: item.name,
          displayName: item.name.charAt(0).toUpperCase() + item.name.slice(1),
          value: item.value,
          percentage: item.percentage,
          fill: intentionConfig?.color || "#6b7280",
        };
      });
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Comments",
      },
    };
    
    chartData.forEach((item) => {
      const intentionConfig = getIntentionByType(item.name.toLowerCase());
      config[item.name] = {
        label: item.displayName,
        color: intentionConfig?.color || "#6b7280",
      };
    });
    
    return config;
  }, [chartData]);

  const totalComments = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex-1 flex items-center justify-between gap-6 min-h-0">
      {/* Chart Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[400px] w-[400px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={450}
            innerRadius={60}
            outerRadius={180}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{name}:</span>
                      <span>{value.toLocaleString()} comments</span>
                    </div>
                  )}
                />
              }
            />
            <PolarAngleAxis
              type="number"
              domain={[0, totalComments]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={4}
              fill="#8884d8"
              className="stroke-transparent stroke-2"
            />
            {/* Center text */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-3xl font-bold"
            >
              {totalComments.toLocaleString()}
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
              dy={28}
            >
              Total
            </text>
          </RadialBarChart>
        </ChartContainer>
      </div>

      {/* Legend */}
      <div className="px-6 pb-4 space-y-2 flex-1">
        {chartData.map((item) => {
          const intentionConfig = getIntentionByType(item.name.toLowerCase());
          return (
            <div
              key={item.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="flex items-center gap-2">
                  {intentionConfig && (
                    <intentionConfig.icon 
                      className="h-3.5 w-3.5 opacity-70"
                      style={{ color: intentionConfig.color }}
                    />
                  )}
                  <span className="text-sm font-medium capitalize">
                    {item.displayName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-sm font-semibold">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground min-w-[45px]">
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
  const filters = useAnalyticsFilters();
  
  const { data, isLoading, error } = useQuery(
    trpc.analytics.intentDistribution.queryOptions({
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

    const maxCount = Math.max(...data.map((i) => i.count));
    const totalComments = data.reduce((sum, i) => sum + i.count, 0);

    // Calculate high-risk intentions
    const highRiskCount = data
      .filter((i) => ["cancel", "complain"].includes(i.type || ""))
      .reduce((sum, i) => sum + i.count, 0);

    const highRiskPercentage = totalComments > 0 ? (highRiskCount / totalComments) * 100 : 0;

    return {
      maxCount,
      totalComments,
      highRiskPercentage,
      hasHighRisk: highRiskPercentage > 20,
      hasCancellations:
        data.find((i) => i.type === "cancel")?.count > 0,
      multipleIntentions: 0, // This would need to be calculated separately if needed
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
        <Tabs defaultValue="pie" className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="pie" className="flex-1">Type Chart</TabsTrigger>
            <TabsTrigger value="list" className="flex-1">Intentions</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="flex-1 mt-4">
            <IntentionLevelsList className="flex-1" />
          </TabsContent>
          <TabsContent value="pie" className="flex-1 mt-4">
            <IntentionTypePie data={data} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t">
        <p className="text-xs text-muted-foreground">
          Monitor intention patterns to understand customer needs and improve service delivery.
        </p>
      </div>
    </DataCard>
  );
};