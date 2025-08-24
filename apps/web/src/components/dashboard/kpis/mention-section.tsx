import { StatCard } from "@/components/data/stats/stat-card";
import { StatHeader } from "@/components/data/stats/stat-header";
import { StatComparison } from "@/components/data/stats/stat-comparison";
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  Target,
  BarChart3,
} from "lucide-react";
import { DonutChart } from "@/components/data/donut-chart";
import { AvailableChartColorsKeys } from "@/lib/chartUtils";
import { cn } from "@/lib/utils";
import { getColorClassName } from "@/lib/chartUtils";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import { Config } from "config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPerformanceIndicator } from "./voice-metrics-section";
import { IconTooltip } from "@/components/common/icon-tooltip";

// Constants for sentiment analysis
const SENTIMENT_METRICS = {
  POSITIVE: {
    label: "Positive",
    color: "emerald" as const,
    icon: TrendingUp,
    description: "Favorable mentions in AI responses",
    tooltip:
      "Positive mentions indicate when AI systems speak favorably about your brand, highlighting strengths and recommending your products or services.",
  },
  NEUTRAL: {
    label: "Neutral",
    color: "gray" as const,
    icon: BarChart3,
    description: "Factual mentions without sentiment in AI responses",
    tooltip:
      "Neutral mentions are factual references to your brand in AI responses without positive or negative emotion - simply stating facts or including your brand in lists.",
  },
  NEGATIVE: {
    label: "Negative",
    color: "red" as const,
    icon: TrendingDown,
    description: "Critical mentions in AI responses requiring attention",
    tooltip:
      "Negative mentions show when AI systems highlight problems, criticisms, or unfavorable aspects of your brand that need addressing.",
  },
} as const;

const MENTION_INSIGHTS = {
  title: "Mention Breakdown",
  description:
    "Analyze the sentiment distribution of your brand mentions in AI-generated responses",
  helpText:
    "Understanding mention sentiment in AI responses helps you identify how artificial intelligence systems perceive and present your brand to users. This impacts millions of potential customers who rely on AI for recommendations.",
} as const;

// Helper functions for sentiment analysis
const getSentimentScore = (
  positive: number,
  neutral: number,
  negative: number
) => {
  const total = positive + neutral + negative;
  if (total === 0) return 0;
  return ((positive - negative) / total) * 100;
};

const getSentimentInsight = (sentimentScore: number) => {
  if (sentimentScore > 20)
    return { type: "positive", message: "Strong positive AI sentiment" };
  if (sentimentScore > 5)
    return { type: "good", message: "Generally positive AI sentiment" };
  if (sentimentScore > -5)
    return { type: "neutral", message: "Balanced AI sentiment" };
  if (sentimentScore > -20)
    return { type: "concern", message: "Some negative AI sentiment" };
  return {
    type: "alert",
    message: "High negative AI sentiment - needs attention",
  };
};

const getSentimentColor = (sentimentScore: number) => {
  if (sentimentScore > 20) return "bg-green-200";
  if (sentimentScore > 5) return "bg-yellow-200";
  if (sentimentScore > -5) return "bg-gray-200";
  if (sentimentScore > -20) return "bg-red-200";
  return "red";
};

const getMentionHealthScore = (
  positive: number,
  neutral: number,
  negative: number
) => {
  const total = positive + neutral + negative;
  if (total === 0) return 0;
  const positiveRatio = positive / total;
  const negativeRatio = negative / total;
  return Math.max(0, Math.min(100, (positiveRatio - negativeRatio) * 100 + 50));
};

type SentimentKey = keyof typeof SENTIMENT_METRICS;

export interface MentionSectionProps {
  className?: string;
}

export const MentionSection = ({ className }: MentionSectionProps) => {
  const { data: kpisData, isLoading: kpisLoading } = useQuery(
    trpc.metrics.kpis.queryOptions()
  );
  const { data, isLoading, error } = useQuery(
    trpc.mentions.breakdown.queryOptions()
  );

  const mentionAnalysis = useMemo(() => {
    if (!data) return null;

    const positive = data.positive_count || 0;
    const neutral = data.neutral_count || 0;
    const negative = data.negative_count || 0;
    const total = positive + neutral + negative;

    const sentimentScore = getSentimentScore(positive, neutral, negative);
    const healthScore = getMentionHealthScore(positive, neutral, negative);
    const insight = getSentimentInsight(sentimentScore);

    return {
      positive,
      neutral,
      negative,
      total,
      sentimentScore,
      healthScore,
      insight,
      distribution: {
        positive: total > 0 ? (positive / total) * 100 : 0,
        neutral: total > 0 ? (neutral / total) * 100 : 0,
        negative: total > 0 ? (negative / total) * 100 : 0,
      },
    };
  }, [data]);

  const isLoadingAny = isLoading || kpisLoading;

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn("col-span-2", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI mention data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </StatCard>
    );
  }

  return (
    <StatCard className={cn("col-span-2", className)}>
      <StatHeader
        title={MENTION_INSIGHTS.title}
        description={MENTION_INSIGHTS.description}
        icon={<MessageCircle className="h-5 w-5" />}
        tooltip={
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "flex items-center gap-1",
                getSentimentColor(mentionAnalysis?.sentimentScore || 0)
              )}
            >
              <Target className="h-3 w-3" />
              {
                getSentimentInsight(mentionAnalysis?.sentimentScore || 0)
                  .message
              }
            </Badge>
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                Understanding AI Mention Analysis
              </p>
              <p className="text-xs">{MENTION_INSIGHTS.helpText}</p>
            </IconTooltip>
          </div>
        }
      />
      <StatComparison
        before={{
          label: "Total Mentions",
          value: mentionAnalysis?.total || kpisData?.mention_count || 0,
          description: "All brand references in AI",
        }}
        after={{
          label: "Response Coverage",
          value: kpisData?.total_responses || 0,
          description: "AI responses analyzed",
        }}
      />

      <div className="flex  gap-4 w-full border-t pt-4 flex-wrap">
        <div className=" flex items-center justify-center min-h-[300px] p-16 ">
          {isLoadingAny ? (
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="w-48 h-48 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : mentionAnalysis && mentionAnalysis.total > 0 ? (
            <div className="relative">
              <DonutChart
                data={[
                  {
                    category: SENTIMENT_METRICS.POSITIVE.label,
                    value: mentionAnalysis.positive,
                  },
                  {
                    category: SENTIMENT_METRICS.NEUTRAL.label,
                    value: mentionAnalysis.neutral,
                  },
                  {
                    category: SENTIMENT_METRICS.NEGATIVE.label,
                    value: mentionAnalysis.negative,
                  },
                ]}
                category="category"
                value="value"
                showLabel={true}
                colors={[
                  SENTIMENT_METRICS.POSITIVE.color,
                  SENTIMENT_METRICS.NEUTRAL.color,
                  SENTIMENT_METRICS.NEGATIVE.color,
                ]}
                style={{
                  width: 200,
                  height: 200,
                }}
                className="w-full h-ful aspect-square max-h-[250px"
                valueFormatter={(value) => value.toString()}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No AI mention data available</p>
            </div>
          )}
        </div>
        {/* Detailed Sentiment Breakdown */}
        <div className="flex-1 px-4 py-2">
          <div className="space-y-3">
            {Object.entries(SENTIMENT_METRICS).map(([key, config]) => {
              const sentimentKey = key.toLowerCase() as
                | "positive"
                | "neutral"
                | "negative";
              const count = mentionAnalysis?.[sentimentKey] || 0;
              const percentage =
                mentionAnalysis?.distribution[sentimentKey] || 0;
              const Icon = config.icon;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Icon
                        className={cn(
                          getColorClassName(
                            config.color as AvailableChartColorsKeys,
                            "text"
                          ),
                          "h-8 w-8"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {config.label}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">
                              {config.label} Mentions
                            </p>
                            <p className="text-xs">{config.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1 ">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        mentions
                      </span>
                    </div>
                    {mentionAnalysis && mentionAnalysis.total > 0 && (
                      <div className="flex items-center justify-end gap-1">
                        <div
                          className={cn(
                            "h-1.5 rounded-full",
                            getColorClassName(
                              config.color as AvailableChartColorsKeys,
                              "bg"
                            )
                          )}
                          style={{
                            width: `${Math.max(percentage * 1.5, 20)}px`,
                          }}
                        />
                        <span className="text-xs font-mono text-muted-foreground fle">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StatCard>
  );
};

export { SENTIMENT_METRICS, getSentimentScore, getMentionHealthScore };
