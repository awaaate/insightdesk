import { BarChart } from "@/components/data/bar-chart";
import { StatCard } from "@/components/data/stats/stat-card";
import { StatHeader } from "@/components/data/stats/stat-header";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  TrendingUp,
  BarChart3,
  Target,
  AlertCircle,
  HelpCircle,
  Award,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { useMemo } from "react";
import { Config } from "config";
import {
  MetricCard,
  MetricCardList,
} from "@/components/data/stats/metric-card";
import type { RouterOutput } from "@/utils/trpc";

type RankingData = RouterOutput["metrics"]["ranking"]["data"][number];

// Constants for competitive metrics
const COMPETITIVE_METRICS = {
  BIS: {
    title: "Brand Impact Score (BIS)",
    shortTitle: "BIS",
    description: "Your overall brand impact in AI-generated responses",
    tooltip:
      "BIS combines Mention Score (30%), Position Score (20%), Sentiment Score (30%), and Competitive Score (20%) to provide a comprehensive brand impact measure on a scale of 0-100.",
    unit: "points",
    color: "blue" as const,
    icon: Target,
  },
  POSITION_SCORE: {
    title: "Position Score",
    shortTitle: "Position",
    description: "How prominently your brand appears in AI responses",
    tooltip:
      "Position Score measures where your brand is mentioned in AI responses. Beginning mentions score higher (1.0), middle mentions score lower (0.3), and end mentions score moderately (0.7).",
    unit: "points",
    color: "green" as const,
    icon: TrendingUp,
  },
} as const;

const ANALYSIS_INSIGHTS = {
  title: "Competitive Analysis",
  description:
    "Compare your brand performance against competitors in AI-generated responses",
  helpText:
    "This GEORADAR analysis shows how your brand performs versus competitors when AI systems like ChatGPT or Perplexity generate responses. Higher scores indicate better visibility and positioning in AI responses.",
} as const;

// Helper functions for competitive analysis
const getCompetitivePosition = (rankings: RankingData["rankings"]) => {
  const position = {
    bis: rankings?.bis || 99,
    sentiment_score: rankings?.sentiment_score || 99,
    position_score: rankings?.position_score || 99,
  };

  const avgPosition =
    (position.bis + position.sentiment_score + position.position_score) / 3;

  if (avgPosition <= 2)
    return { label: "AI Leader", color: "default" as const };
  if (avgPosition <= 4)
    return { label: "Strong AI Presence", color: "secondary" as const };
  if (avgPosition <= 6)
    return { label: "AI Challenger", color: "outline" as const };
  return { label: "Emerging in AI", color: "destructive" as const };
};

const getMetricInsight = (
  value: number,
  metric: keyof typeof COMPETITIVE_METRICS
) => {
  const thresholds = {
    BIS: { excellent: 80, good: 60, average: 40 },
    POSITION_SCORE: { excellent: 80, good: 60, average: 40 },
    SENTIMENT_SCORE: { excellent: 70, good: 50, average: 30 },
  };

  const threshold = thresholds[metric];
  if (value >= threshold.excellent) return "Excellent AI performance";
  if (value >= threshold.good) return "Good AI performance";
  if (value >= threshold.average) return "Average AI performance";
  return "Needs AI optimization";
};

interface CompetitiveAnalysisSectionProps {
  className?: string;
}

export const CompetitiveAnalysisSection = ({
  className,
}: CompetitiveAnalysisSectionProps) => {
  const {
    data: rankings,
    isLoading,
    error,
  } = useQuery(trpc.metrics.ranking.queryOptions());

  const analysisData = useMemo(() => {
    if (!rankings) return null;

    const targetBrand = Config.constants.target_brand.name;
    const targetBrandData = rankings.data.find(
      (brand) => brand.brand === targetBrand
    );

    if (!targetBrandData) return null;

    const competitivePosition = getCompetitivePosition(
      targetBrandData.rankings
    );

    const chartData = rankings.data.map((brand) => ({
      brand: brand.brand,
      "Brand Impact Score": brand.metrics.bis,
      "Position Score": brand.metrics.position_score,
      "Sentiment Score": brand.metrics.sentiment_score,
    }));

    return {
      targetBrandData,
      competitivePosition,
      chartData,
      totalCompetitors: rankings.data.length,
    };
  }, [rankings]);

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load competitive analysis. Please try refreshing the page.
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
          title={ANALYSIS_INSIGHTS.title}
          description={ANALYSIS_INSIGHTS.description}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </StatCard>
    );
  }

  if (!analysisData) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={ANALYSIS_INSIGHTS.title}
          description={ANALYSIS_INSIGHTS.description}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI competitive data available</p>
        </div>
      </StatCard>
    );
  }

  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={ANALYSIS_INSIGHTS.title}
        description={ANALYSIS_INSIGHTS.description}
        icon={<BarChart3 className="h-5 w-5" />}
        tooltip={
          <div className="flex items-center gap-2">
            <Badge variant={analysisData.competitivePosition.color}>
              <Award className="h-3 w-3 mr-1" />
              {analysisData.competitivePosition.label}
            </Badge>
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                Understanding Competitive Analysis
              </p>
              <p className="text-xs">{ANALYSIS_INSIGHTS.helpText}</p>
            </IconTooltip>
          </div>
        }
      />

      {/* Key Metrics Summary */}
      <MetricCardList className="grid grid-cols-1 md:grid-cols-2  gap-4 py-8 px-4">
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <COMPETITIVE_METRICS.BIS.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {COMPETITIVE_METRICS.BIS.shortTitle}
              </span>
            </div>
          }
          value={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {analysisData.targetBrandData.metrics.bis.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {COMPETITIVE_METRICS.BIS.unit}
              </span>
            </div>
          }
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{analysisData.targetBrandData.rankings.bis}
              </Badge>
              <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
                <p className="font-semibold mb-1">
                  {COMPETITIVE_METRICS.BIS.title}
                </p>
                <p className="text-xs">{COMPETITIVE_METRICS.BIS.tooltip}</p>
              </IconTooltip>
            </div>
          }
        >
          <p className="text-xs text-muted-foreground">
            {getMetricInsight(
              analysisData.targetBrandData.metrics.bis,
              "BIS" as keyof typeof COMPETITIVE_METRICS
            )}
          </p>
        </MetricCard>
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <COMPETITIVE_METRICS.POSITION_SCORE.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {COMPETITIVE_METRICS.POSITION_SCORE.shortTitle}
              </span>
            </div>
          }
          value={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {analysisData.targetBrandData.metrics.position_score.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {COMPETITIVE_METRICS.POSITION_SCORE.unit}
              </span>
            </div>
          }
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{analysisData.targetBrandData.rankings.position_score}
              </Badge>
              <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
                <p className="font-semibold mb-1">
                  {COMPETITIVE_METRICS.BIS.title}
                </p>
                <p className="text-xs">
                  {COMPETITIVE_METRICS.POSITION_SCORE.tooltip}
                </p>
              </IconTooltip>
            </div>
          }
        >
          <p className="text-xs text-muted-foreground">
            {getMetricInsight(
              analysisData.targetBrandData.metrics.position_score,
              "POSITION_SCORE" as keyof typeof COMPETITIVE_METRICS
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            This score is equivalent to an average position of{" "}
            <span className="font-medium text-foreground">
              {analysisData.targetBrandData.metrics.position.toFixed(1)}
            </span>{" "}
            in the conversation
          </p>
        </MetricCard>
      </MetricCardList>

      {/* Competitive Insights */}

      {/* Bar Chart */}
      <div className="bg-muted/30 px-6 py-8">
        <div className="mb-4 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Competing against {analysisData.totalCompetitors - 1} brands in AI responses
            </span>
          </div>

          {analysisData.targetBrandData.rankings.bis === 1 && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 px-3 py-2">
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs">
                🏆 AI leader in Brand Impact Score!
              </AlertDescription>
            </Alert>
          )}
        </div>
        <BarChart
          index="brand"
          categories={[
            "Brand Impact Score",
            "Position Score",
            "Sentiment Score",
          ]}
          valueFormatter={(value) => `${value.toFixed(1)}`}
          data={analysisData.chartData}
          className="h-80"
          colors={["blue", "emerald", "violet"]}
        />
      </div>
    </StatCard>
  );
};
