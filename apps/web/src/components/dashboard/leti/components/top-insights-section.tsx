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
  Sparkles,
  Award,
  Star,
  TrendingUp,
  Bot,
  User,
  PieChart,
} from "lucide-react";
import { useMemo } from "react";
import { LETI_METRICS } from "../helpers/leti-constants";
import { DonutChart } from "@/components/data/donut-chart";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface TopInsightsSectionProps {
  className?: string;
}

interface InsightData {
  id: number;
  name: string;
  description: string;
  totalComments: number;
  aiGenerated: boolean;
}

// Component for the insights list on the left side
const InsightsList: React.FC<{
  insights: InsightData[];
  maxComments: number;
}> = ({ insights, maxComments }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {insights.slice(0, 10).map((insight, index) => {
            const performanceBadge = LETI_METRICS.TOP_INSIGHTS.getBadge(
              index + 1
            );
            const percentage = (insight.totalComments / maxComments) * 100;

            return (
              <div
                key={insight.id}
                className={cn(
                  "group relative flex items-center justify-between p-3 transition-all",
                  "hover:bg-background rounded-lg"
                )}
              >
                <div className="flex items-baseline gap-3 flex-1 min-w-0 relative z-10">
                  {/* Rank number */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-brand/30 rounded-full ring-2 ring-brand/80 ">
                    <span className="text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium truncate max-w-[250px] inline-block">
                            {insight.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p className="font-medium mb-1">{insight.name}</p>
                          <p className="text-xs">{insight.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      {insight.aiGenerated && (
                        <Bot className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {insight.totalComments.toLocaleString()} occurrences
                      </span>
                      {performanceBadge && index < 3 && (
                        <Badge
                          variant={performanceBadge.color}
                          className="text-xs gap-1 h-5"
                        >
                          {performanceBadge.icon && (
                            <performanceBadge.icon className="h-3 w-3" />
                          )}
                          {performanceBadge.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Progress Bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r bg-brand/10 rounded"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {insights.length > 10 && (
        <div className="px-6 py-2 text-center border-t">
          <p className="text-xs text-muted-foreground">
            Showing top 10 of {insights.length} patterns
          </p>
        </div>
      )}
    </div>
  );
};

// Component for the donut chart on the right side
const InsightsChart: React.FC<{
  insights: InsightData[];
}> = ({ insights }) => {
  const chartData = useMemo(() => {
    const top10 = insights.slice(0, 10);
    const totalComments = top10.reduce((sum, i) => sum + i.totalComments, 0);

    return top10.map((insight, index) => ({
      name:
        insight.name.length > 30
          ? insight.name.substring(0, 30) + "..."
          : insight.name,
      value: insight.totalComments,
      percentage: ((insight.totalComments / totalComments) * 100).toFixed(1),
      aiGenerated: insight.aiGenerated,
    }));
  }, [insights]);

  const categoryColors = useMemo(() => {
    return constructCategoryColors(
      chartData.map((d) => d.name),
      AvailableChartColors
    );
  }, [chartData]);

  return (
    <div className="flex-1 flex flex-col border-l">
      <h3 className="text-muted-foreground/60 text-sm text-center mt-4">
        Top 10 patterns by occurrence
      </h3>
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
          const aiGenerated = item.aiGenerated;
          return (
            <div
              key={item.name}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors  justify-between  ",
                aiGenerated
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
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
                  <p className={cn("text-sm", aiGenerated && "font-semibold")}>
                    {item.name}
                  </p>
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

              {aiGenerated && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Emergent
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TopInsightsSection: React.FC<TopInsightsSectionProps> = ({
  className,
}) => {
  const {
    data: insights,
    isLoading,
    error,
  } = useQuery(
    trpc.analytics.leti.topInsights.queryOptions({
      minComments: 1,
      limit: 20,
    })
  );

  const analysis = useMemo(() => {
    if (!insights || insights.length === 0) return null;

    const totalComments = insights.reduce((sum, i) => sum + i.totalComments, 0);
    const topInsight = insights[0];
    const topPercentage = (topInsight.totalComments / totalComments) * 100;

    return {
      totalComments,
      topInsight,
      topPercentage,
      totalPatterns: insights.length,
      maxComments: Math.max(...insights.map((i) => i.totalComments)),
    };
  }, [insights]);

  if (error) {
    return (
      <DataCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load patterns. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </DataCard>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={LETI_METRICS.TOP_INSIGHTS.TITLE}
          description={LETI_METRICS.TOP_INSIGHTS.DESCRIPTION}
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

  if (!insights || insights.length === 0 || !analysis) {
    return (
      <DataCard className={cn(className)}>
        <DataCard.Header
          title={LETI_METRICS.TOP_INSIGHTS.TITLE}
          description={LETI_METRICS.TOP_INSIGHTS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pattern data available</p>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard className={cn(className, "flex flex-col h-full")}>
      <DataCard.Header
        title={LETI_METRICS.TOP_INSIGHTS.TITLE}
        description={LETI_METRICS.TOP_INSIGHTS.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* Header Stats */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Pattern Analysis</span>
            <Badge variant="outline" className="text-xs">
              {analysis.totalPatterns} patterns •{" "}
              {analysis.totalComments.toLocaleString()} total occurrences
            </Badge>
          </div>
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">
              {LETI_METRICS.TOP_INSIGHTS.TOOLTIP.title}
            </p>
            <p className="text-xs">
              {LETI_METRICS.TOP_INSIGHTS.TOOLTIP.content}
            </p>
          </IconTooltip>
        </div>
      </div>

      <div className="px-6 py-4">
        <Tabs defaultValue="pie">
          <TabsList className=" w-full flex ">
            <TabsTrigger value="list" className="w-">
              Insights
            </TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <InsightsList
              insights={insights}
              maxComments={analysis.maxComments}
            />
          </TabsContent>
          <TabsContent value="pie">
            <InsightsChart insights={insights} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t">
        <p className="text-xs text-muted-foreground">
          {LETI_METRICS.TOP_INSIGHTS.TOOLTIP.content}
        </p>
      </div>
    </DataCard>
  );
};
