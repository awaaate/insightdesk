import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { BarChart } from "@/components/data/bar-chart";
import { StatCard } from "@/components/data/stats";
import { StatHeader } from "@/components/data/stats";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  Info,
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { useMemo } from "react";
import type { RouterOutput } from "@/utils/trpc";

type AttributeData = RouterOutput["attributes"]["top"][number];

// Constants for top attributes metrics
const TOP_ATTRIBUTES_METRICS = {
  TITLE: "Most Discussed AI Attributes",
  DESCRIPTION:
    "Top brand attributes by AI mention frequency and sentiment breakdown",
  TOOLTIP: {
    title: "Understanding Top AI Attributes",
    content:
      "This GEORADAR chart shows the most frequently mentioned attributes for your brand in AI-generated responses. Each bar is divided by sentiment (positive, neutral, negative) to help you understand not just what AI systems discuss, but how they perceive each attribute.",
  },
  HELP_TEXT:
    "Focus on attributes with high negative AI sentiment for improvement opportunities, and leverage positive AI attributes in your content strategy.",
  INSIGHTS: {
    HIGH_POSITIVE: "Strong positive AI perception",
    HIGH_NEGATIVE: "Needs immediate AI optimization",
    BALANCED: "Mixed AI sentiment - opportunity for improvement",
    LOW_VOLUME: "Limited AI discussion - consider increasing digital presence",
  },
} as const;

// Helper function to analyze attribute sentiment distribution
const analyzeAttributeSentiment = (attr: AttributeData) => {
  const total = attr.positive_count + attr.neutral_count + attr.negative_count;
  const positiveRatio = attr.positive_count / total;
  const negativeRatio = attr.negative_count / total;
  const neutralRatio = attr.neutral_count / total;

  if (positiveRatio > 0.6) {
    return {
      type: "positive" as const,
      label: "Strong Positive AI",
      icon: CheckCircle,
      color: "default" as const,
    };
  }
  if (negativeRatio > 0.4) {
    return {
      type: "negative" as const,
      label: "Needs AI Attention",
      icon: AlertTriangle,
      color: "destructive" as const,
    };
  }
  if (neutralRatio > 0.5) {
    return {
      type: "neutral" as const,
      label: "Mostly Neutral AI",
      icon: Info,
      color: "secondary" as const,
    };
  }
  return {
    type: "balanced" as const,
    label: "Mixed AI Sentiment",
    icon: TrendingUp,
    color: "outline" as const,
  };
};

// Helper function to get top performing attributes
const getTopPerformers = (attributes: AttributeData[]) => {
  if (!attributes || attributes.length === 0) return null;

  // Sort by positive ratio
  const sorted = [...attributes].sort((a, b) => {
    const aTotal = a.positive_count + a.neutral_count + a.negative_count;
    const bTotal = b.positive_count + b.neutral_count + b.negative_count;
    const aRatio = a.positive_count / aTotal;
    const bRatio = b.positive_count / bTotal;
    return bRatio - aRatio;
  });

  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1],
    mostDiscussed: attributes[0], // Already sorted by total mentions
  };
};

// Helper function to calculate overall sentiment health
const calculateOverallSentiment = (attributes: AttributeData[]) => {
  if (!attributes || attributes.length === 0) return 0;

  const totals = attributes.reduce(
    (acc, attr) => {
      acc.positive += attr.positive_count;
      acc.neutral += attr.neutral_count;
      acc.negative += attr.negative_count;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const total = totals.positive + totals.neutral + totals.negative;
  if (total === 0) return 0;

  return ((totals.positive - totals.negative) / total) * 100;
};

interface TopAttributesSectionProps {
  className?: string;
}

export const TopAttributesSection = ({
  className,
}: TopAttributesSectionProps) => {
  const {
    data: topAttributes,
    isLoading,
    error,
  } = useQuery(trpc.attributes.top.queryOptions());

  // Memoize analysis data
  const analysisData = useMemo(() => {
    if (!topAttributes || topAttributes.length === 0) return null;

    const topPerformers = getTopPerformers(topAttributes);
    const overallSentiment = calculateOverallSentiment(topAttributes);
    const sentimentAnalysis = topAttributes.map((attr) => ({
      ...attr,
      analysis: analyzeAttributeSentiment(attr),
    }));

    // Count attributes by sentiment type
    const sentimentCounts = sentimentAnalysis.reduce(
      (acc, attr) => {
        acc[attr.analysis.type]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0, balanced: 0 }
    );

    return {
      topPerformers,
      overallSentiment,
      sentimentAnalysis,
      sentimentCounts,
      totalAttributes: topAttributes.length,
    };
  }, [topAttributes]);
  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load top AI attributes. Please try refreshing the page.
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
          title={TOP_ATTRIBUTES_METRICS.TITLE}
          description={TOP_ATTRIBUTES_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </StatCard>
    );
  }

  // Handle no data state
  if (!topAttributes || topAttributes.length === 0) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={TOP_ATTRIBUTES_METRICS.TITLE}
          description={TOP_ATTRIBUTES_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI attribute data available</p>
          <p className="text-sm mt-2">
            AI attribute mentions will appear here once collected
          </p>
        </div>
      </StatCard>
    );
  }

  const overallHealthBadge = analysisData
    ? analysisData.overallSentiment >= 20
      ? { label: "Healthy AI Sentiment", color: "default" as const }
      : analysisData.overallSentiment >= 0
      ? { label: "Neutral AI Sentiment", color: "secondary" as const }
      : { label: "Needs AI Improvement", color: "destructive" as const }
    : null;

  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={TOP_ATTRIBUTES_METRICS.TITLE}
        description={TOP_ATTRIBUTES_METRICS.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {overallHealthBadge && (
              <Badge variant={overallHealthBadge.color}>
                {overallHealthBadge.label}
              </Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {TOP_ATTRIBUTES_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">
                {TOP_ATTRIBUTES_METRICS.TOOLTIP.content}
              </p>
            </IconTooltip>
          </div>
        }
      />
      {/* Key Insights Section */}

      {/* Bar Chart */}
      <div className="p-6 bg-muted/30">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI Sentiment Breakdown</span>
            <Badge variant="outline" className="text-xs">
              Top {topAttributes.length} AI attributes
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Click bars for details</span>
          </div>
        </div>

        <BarChart
          index="name"
          data={topAttributes.map((attr) => {
            const total =
              attr.positive_count + attr.neutral_count + attr.negative_count;
            const analysis = analyzeAttributeSentiment(attr);
            return {
              name: attr.name,
              Positive: attr.positive_count,
              Neutral: attr.neutral_count,
              Negative: attr.negative_count,
              _total: total,
              _analysis: analysis,
            };
          })}
          categories={["Positive", "Neutral", "Negative"]}
          type="stacked"
          colors={["emerald", "gray", "red"]}
          valueFormatter={(value) => value.toLocaleString()}
          showLegend={true}
          className="h-80"
        />

        {/* Legend with counts */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gray-500" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Negative</span>
          </div>
        </div>
      </div>

      {/* Additional Context */}
      {analysisData && (
        <div className="px-6 pb-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {TOP_ATTRIBUTES_METRICS.HELP_TEXT}
          </p>
        </div>
      )}
    </StatCard>
  );
};
