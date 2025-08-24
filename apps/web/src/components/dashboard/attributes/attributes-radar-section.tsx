import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { StatCard, StatHeader } from "@/components/data/stats";
import {
  BarChart3,
  AlertCircle,
  HelpCircle,
  Info,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { cn } from "@/lib/utils";
import { constructCategoryColors, getColorClassName } from "@/lib/chartUtils";
import { ChartConfig } from "@/components/ui/chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { Config } from "config";
import { useMemo } from "react";

// Constants for radar chart metrics
const RADAR_METRICS = {
  TITLE: "AI Attribute Sentiment Radar",
  DESCRIPTION: "Compare sentiment scores across key brand attributes in AI responses",
  TOOLTIP: {
    title: "Understanding the AI Radar Chart",
    content:
      "This GEORADAR chart visualizes how different brands perform across various attributes in AI-generated responses. Each axis represents an attribute detected by AI systems, and the distance from the center indicates the sentiment score (-100 to +100). A wider shape indicates better overall sentiment in AI responses.",
  },
  HELP_TEXT:
    "The radar chart helps identify strengths and weaknesses in specific brand attributes as perceived by AI systems compared to competitors.",
  SCORE_RANGE: {
    min: -100,
    max: 100,
    description: "AI sentiment scale from negative (-100) to positive (+100)",
  },
} as const;

// Helper function to analyze radar performance
const analyzeRadarPerformance = (
  data: any[],
  targetBrand: string
): {
  dominantBrand: string;
  targetPosition: number;
  strongestAttribute: string;
  weakestAttribute: string;
  averageScore: number;
} | null => {
  if (!data || data.length === 0) return null;

  const brands = Object.keys(data[0]).filter((key) => key !== "attribute_name");

  // Calculate average scores for each brand
  const brandAverages = brands.map((brand) => {
    const scores = data.map((item) => item[brand] || 0);
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return { brand, average: avg };
  });

  // Sort by average score
  brandAverages.sort((a, b) => b.average - a.average);

  const targetBrandData = brandAverages.find((b) => b.brand === targetBrand);
  const targetPosition = targetBrandData
    ? brandAverages.indexOf(targetBrandData) + 1
    : brands.length;

  // Find strongest and weakest attributes for target brand
  let strongestAttribute = "";
  let weakestAttribute = "";
  let maxScore = -Infinity;
  let minScore = Infinity;

  data.forEach((item) => {
    const score = item[targetBrand];
    if (score > maxScore) {
      maxScore = score;
      strongestAttribute = item.attribute_name;
    }
    if (score < minScore) {
      minScore = score;
      weakestAttribute = item.attribute_name;
    }
  });

  return {
    dominantBrand: brandAverages[0].brand,
    targetPosition,
    strongestAttribute,
    weakestAttribute,
    averageScore: targetBrandData?.average || 0,
  };
};

// Helper function to get performance badge
const getPerformanceBadge = (position: number, totalBrands: number) => {
  const percentage = ((totalBrands - position + 1) / totalBrands) * 100;

  if (percentage >= 80)
    return { label: "AI Leader", color: "default" as const, icon: Award };
  if (percentage >= 60)
    return { label: "Strong AI Presence", color: "secondary" as const, icon: TrendingUp };
  if (percentage >= 40)
    return { label: "AI Competitive", color: "outline" as const, icon: Target };
  return { label: "AI Challenger", color: "destructive" as const, icon: Info };
};

interface AttributesRadarSectionProps {
  className?: string;
}

export const AttributesRadarSection = ({
  className,
}: AttributesRadarSectionProps) => {
  const {
    data: matrix,
    isLoading,
    error,
  } = useQuery(trpc.attributes.matrix.queryOptions());
  // Memoize analysis data
  const analysisData = useMemo(() => {
    if (!matrix || matrix.length === 0) return null;

    const brands = Object.keys(matrix[0]).filter(
      (key) => key !== "attribute_name"
    );
    const categoryColors = constructCategoryColors(brands, [
      "emerald",
      "gray",
      "lime",
    ]);

    const targetBrand = Config.constants.target_brand.name;
    const performance = analyzeRadarPerformance(matrix, targetBrand);

    return {
      brands,
      categoryColors,
      performance,
      targetBrand,
      hasData: matrix.length > 0,
      attributeCount: matrix.length,
    };
  }, [matrix]);
  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI attribute radar data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </StatCard>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={RADAR_METRICS.TITLE}
          description={RADAR_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
        />
        <div className="flex items-center justify-center h-[400px]">
          <Skeleton className="h-[350px] w-[350px] rounded-full" />
        </div>
        <div className="mt-4 px-6 pb-4">
          <Skeleton className="h-4 w-full" />
        </div>
      </StatCard>
    );
  }

  // Handle no data state
  if (!analysisData || !analysisData.hasData) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={RADAR_METRICS.TITLE}
          description={RADAR_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI attribute data available</p>
          <p className="text-sm mt-2">
            AI attribute analysis will appear here once data is collected
          </p>
        </div>
      </StatCard>
    );
  }

  const performanceBadge = analysisData.performance
    ? getPerformanceBadge(
        analysisData.performance.targetPosition,
        analysisData.brands.length
      )
    : null;

  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={RADAR_METRICS.TITLE}
        description={RADAR_METRICS.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {performanceBadge && (
              <Badge variant={performanceBadge.color} className="gap-1">
                {performanceBadge.icon && (
                  <performanceBadge.icon className="h-3 w-3" />
                )}
                {performanceBadge.label}
              </Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {RADAR_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">{RADAR_METRICS.TOOLTIP.content}</p>
            </IconTooltip>
          </div>
        }
      />
      {/* Performance Insights */}
      {analysisData.performance && (
        <div className="px-6 py-4 space-y-3">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Strongest Attribute
                </span>
              </div>
              <p className="text-sm font-semibold">
                {analysisData.performance.strongestAttribute}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Needs Improvement
                </span>
              </div>
              <p className="text-sm font-semibold">
                {analysisData.performance.weakestAttribute}
              </p>
            </div>
          </div>

          {/* Position Alert */}
          {analysisData.performance.targetPosition === 1 && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
              <Award className="h-3 w-3 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs">
                Leading in AI attribute sentiment with an average score of{" "}
                {analysisData.performance.averageScore.toFixed(1)}
              </AlertDescription>
            </Alert>
          )}

          {analysisData.performance.averageScore < 0 && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <Info className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs">
                Overall AI sentiment is negative. Focus on improving AI
                perception across key attributes in responses.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Radar Chart */}
      <ChartContainer
        config={analysisData.brands.reduce((acc, brand) => {
          acc[brand] = {
            label: brand,
            color: analysisData.categoryColors.get(brand) ?? "emerald",
          };
          return acc;
        }, {} as ChartConfig)}
        className="mx-auto aspect-square max-h-[500px] p-4"
      >
        <RadarChart data={matrix}>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const numValue = Number(value);
                  const sentiment =
                    numValue > 30
                      ? "Positive"
                      : numValue < -30
                      ? "Negative"
                      : "Neutral";
                  return [
                    `${numValue.toFixed(1)}`,
                    <div>
                      <span>{name}</span>
                      <span
                        key="sentiment"
                        className={cn(
                          "text-xs ml-1",
                          numValue > 30 && "text-green-500",
                          numValue < -30 && "text-red-500",
                          numValue >= -30 && numValue <= 30 && "text-gray-500"
                        )}
                      >
                        ({sentiment})
                      </span>
                    </div>,
                  ];
                }}
              />
            }
          />
          <PolarGrid radialLines={false} />
          <PolarAngleAxis
            dataKey="attribute_name"
            tick={{ fontSize: 12 }}
            className="text-xs"
          />
          {analysisData.brands.map((brand, index) => {
            const isTargetBrand = brand === analysisData.targetBrand;
            return (
              <Radar
                key={brand}
                name={brand}
                dataKey={brand}
                className={cn(
                  getColorClassName(
                    analysisData.categoryColors.get(brand) ?? "emerald",
                    "stroke"
                  ),
                  getColorClassName(
                    analysisData.categoryColors.get(brand) ?? "emerald",
                    "fill"
                  )
                )}
                strokeWidth={isTargetBrand ? 2.5 : 1.5}
                fillOpacity={isTargetBrand ? 0.3 : 0.1}
              />
            );
          })}
        </RadarChart>
      </ChartContainer>

      {/* Enhanced Legend */}
      <div className="mt-4 px-6 py-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Brand Comparison</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>{RADAR_METRICS.SCORE_RANGE.description}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {analysisData.brands.map((brand) => {
            const isTargetBrand = brand === analysisData.targetBrand;
            return (
              <div
                key={brand}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
                  isTargetBrand
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    getColorClassName(
                      analysisData.categoryColors.get(brand) ?? "emerald",
                      "bg"
                    )
                  )}
                />
                <span
                  className={cn("text-sm", isTargetBrand && "font-semibold")}
                >
                  {brand}
                </span>
                {isTargetBrand && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    You
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Context */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Analyzing the best {analysisData.attributeCount} AI-detected attributes across{" "}
            {analysisData.brands.length} brands. Wider coverage indicates better
            overall AI sentiment.
          </p>
        </div>
      </div>
    </StatCard>
  );
};
