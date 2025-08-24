import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  StatCard,
  StatHeader,
  StatValue,
  StatComparison,
} from "@/components/data/stats";
import { trpc } from "@/utils/trpc";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  AlertCircle,
  Target,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { ProgressCircle } from "@/components/data/progress-circle";

// Constants for attribute metrics
const ATTRIBUTE_METRICS = {
  SENTIMENT_ANALYSIS: {
    title: "AI Sentiment Analysis",
    description:
      "Distribution of positive, neutral, and negative attribute mentions in AI responses",
    tooltip:
      "Attributes are specific characteristics or features that AI systems mention about your brand. GEORADAR sentiment analysis shows whether these AI-detected mentions are positive, negative, or neutral.",
    helpText:
      "A healthy sentiment balance indicates positive brand perception in key attributes as presented by AI systems.",
  },
  TOTAL_ATTRIBUTES: {
    title: "Total AI Attribute Detections",
    shortTitle: "Total Detections",
    description:
      "Total number of brand attributes detected across all AI responses",
    tooltip:
      "Every mention of your brand's attributes (features, qualities, characteristics) detected by GEORADAR in AI-generated responses and conversations.",
    unit: "mentions",
    helpText:
      "More AI attribute mentions indicate higher engagement and detailed discussions about your brand in AI systems.",
  },
  SENTIMENT_HEALTH: {
    title: "AI Sentiment Health Score",
    shortTitle: "Health Score",
    description:
      "Overall sentiment health based on positive vs negative attribute mentions in AI responses",
    tooltip:
      "Calculated as (Positive - Negative) / Total * 100. A higher score indicates better overall AI sentiment towards your brand attributes.",
    unit: "%",
    helpText:
      "This score helps you understand if AI systems perceive your brand attributes positively or negatively.",
  },
} as const;

// Helper function to calculate sentiment health score
const calculateSentimentHealth = (
  positive: number,
  negative: number,
  total: number
): number => {
  if (total === 0) return 0;
  return ((positive - negative) / total) * 100;
};

// Helper function to get sentiment performance indicator
const getSentimentPerformanceIndicator = (healthScore: number) => {
  if (healthScore >= 40)
    return { label: "Excellent AI Sentiment", color: "default" as const, icon: CheckCircle };
  if (healthScore >= 20)
    return { label: "Good AI Sentiment", color: "secondary" as const, icon: TrendingUp };
  if (healthScore >= 0)
    return { label: "Neutral AI Sentiment", color: "outline" as const, icon: Target };
  if (healthScore >= -20)
    return {
      label: "Concerning AI Sentiment",
      color: "destructive" as const,
      icon: AlertTriangle,
    };
  return {
    label: "Critical AI Sentiment",
    color: "destructive" as const,
    icon: TrendingDown,
  };
};

// Helper function to get progress variant for visual indicators
const getAttributeHealthVariant = (healthScore: number) => {
  if (healthScore >= 40) return "success";
  if (healthScore >= 20) return "default";
  if (healthScore >= 0) return "neutral";
  if (healthScore >= -20) return "warning";
  return "error";
};

// Helper function to get dominant sentiment
const getDominantSentiment = (
  positive: number,
  neutral: number,
  negative: number
) => {
  const max = Math.max(positive, neutral, negative);
  console.log(max, positive, neutral, negative);
  if (max === positive)
    return {
      type: "positive",
      count: positive,
      percentage: (positive / (positive + neutral + negative)) * 100,
    };
  if (max === neutral)
    return {
      type: "neutral",
      count: neutral,
      percentage: (neutral / (positive + neutral + negative)) * 100,
    };
  return {
    type: "negative",
    count: negative,
    percentage: (negative / (positive + neutral + negative)) * 100,
  };
};

interface AttributesSummarySectionProps {
  className?: string;
}

export const AttributesSummarySection: React.FC<
  AttributesSummarySectionProps
> = ({ className }) => {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery(trpc.attributes.summary.queryOptions());

  // Calculate derived metrics
  const sentimentHealth = summary
    ? calculateSentimentHealth(
        summary.positive,
        summary.negative,
        summary.total
      )
    : 0;

  const performanceIndicator =
    getSentimentPerformanceIndicator(sentimentHealth);
  const dominantSentiment = summary
    ? getDominantSentiment(summary.positive, summary.neutral, summary.negative)
    : null;

  console.log(dominantSentiment);

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI attribute metrics. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </StatCard>
    );
  }

  return (
    <StatCard className={cn("overflow-hidden", className)}>
      {/* Header with tooltip */}
      <StatHeader
        title="AI Attribute Analytics"
        description={ATTRIBUTE_METRICS.SENTIMENT_ANALYSIS.description}
        icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {summary && (
              <Badge variant={performanceIndicator.color} className="gap-1">
                {React.createElement(performanceIndicator.icon, {
                  className: "h-3 w-3",
                })}
                {performanceIndicator.label}
              </Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                Understanding AI Attribute Analytics
              </p>
              <p className="text-xs">
                {ATTRIBUTE_METRICS.SENTIMENT_ANALYSIS.tooltip}
              </p>
            </IconTooltip>
          </div>
        }
      />

      <div className="">
        {/* Total Attributes Section */}
        <div className="flex  items-start justify-between">
          <div className="flex flex-col space-y-3 flex-1 justify-center p-4 ">
            <div className="flex  items-center gap-2  ">
              <h3 className="text-sm font-medium">
                {ATTRIBUTE_METRICS.TOTAL_ATTRIBUTES.shortTitle}
              </h3>
              <IconTooltip
                icon={<Info className="h-3 w-3 text-muted-foreground" />}
              >
                <p>{ATTRIBUTE_METRICS.TOTAL_ATTRIBUTES.tooltip}</p>
              </IconTooltip>
            </div>

            <AttributeMetricDisplay
              isLoading={isLoading}
              value={summary?.total || 0}
              label="Total Detections"
              description="AI attribute mentions detected"
            />
          </div>
          {/* Sentiment Health Score */}
          {summary && summary.total > 0 && (
            <div className="flex-1  flex justify-between flex-col items-center  gap-2 p-4 b">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium">
                  {ATTRIBUTE_METRICS.SENTIMENT_HEALTH.shortTitle}
                </h3>
                <IconTooltip
                  icon={<Info className="h-3 w-3 text-muted-foreground" />}
                >
                  <p>{ATTRIBUTE_METRICS.SENTIMENT_HEALTH.tooltip}</p>
                </IconTooltip>
              </div>

              <div className="flex items-center justify-center mb-4">
                <ProgressCircle
                  value={Math.abs(sentimentHealth)}
                  max={100}
                  strokeWidth={8}
                  width={80}
                  height={80}
                  showAnimation={true}
                  variant={getAttributeHealthVariant(sentimentHealth)}
                  className="transition-transform hover:scale-105"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">
                      {sentimentHealth >= 0 ? "+" : ""}
                      {sentimentHealth.toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground">score</span>
                  </div>
                </ProgressCircle>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {dominantSentiment?.type === "positive" &&
                    "Positive AI sentiment dominates"}
                  {dominantSentiment?.type === "neutral" &&
                    "Neutral AI sentiment dominates"}
                  {dominantSentiment?.type === "negative" &&
                    "Negative AI sentiment dominates"}{" "}
                  ({dominantSentiment?.percentage.toFixed(0)}% of AI mentions)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment Breakdown */}
        <div className="border-y ">
          <StatComparison
            before={{
              label: "Negative Attributes",
              value: summary?.negative?.toLocaleString() ?? "0",
              description: "Negative AI sentiment mentions",
              valueClassName: "text-red-500",
            }}
            after={{
              label: "Positive Attributes",
              value: summary?.positive?.toLocaleString() ?? "0",
              description: "Positive AI sentiment mentions",
              valueClassName: "text-emerald-500",
            }}
          />

          {/* Neutral count */}
          {summary && summary.neutral > 0 && (
            <div className="  p-4 bg-muted/30 border-t ">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Neutral AI Attributes
                </span>
                <span className="font-medium">
                  {summary.neutral.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {summary && summary.total > 0 && (
          <div className="pt-4 space-y-2 m-4">
            {/* Excellent performance */}
            {sentimentHealth >= 40 && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                <Award className="h-3 w-3 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-xs">
                  Outstanding AI attribute sentiment! {summary.positive} positive
                  AI mentions vs {summary.negative} negative.
                </AlertDescription>
              </Alert>
            )}

            {/* Warning for negative trend */}
            {sentimentHealth < -10 && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs">
                  AI attribute sentiment needs attention - {summary.negative}{" "}
                  negative AI mentions outweigh {summary.positive} positive ones.
                </AlertDescription>
              </Alert>
            )}

            {/* Low activity insight */}
            {summary.total < 10 && (
              <Alert>
                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs">
                  Low AI attribute activity detected. Consider increasing
                  online presence to gather more AI insights.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </StatCard>
  );
};

// Helper component for displaying metric values with loading states
interface AttributeMetricDisplayProps {
  isLoading: boolean;
  value: number;
  label: string;
  description?: string;
  className?: string;
}

const AttributeMetricDisplay = ({
  isLoading,
  value,
  label,
  description,
  className,
}: AttributeMetricDisplayProps) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
