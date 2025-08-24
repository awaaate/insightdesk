import {
  StatCard,
  StatComparison,
  StatHeader,
  StatValue,
} from "@/components/data/stats";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Globe,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Info,
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  FileText,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { useMemo } from "react";
import { DonutChart } from "@/components/data/donut-chart";
import { ProgressCircle } from "@/components/data/progress-circle";
import type { RouterOutput } from "@/utils/trpc";

type OverviewData = RouterOutput["sources"]["overview"];
type CategoryData = RouterOutput["sources"]["overviewPerCategory"][number];

// Add missing imports for icons
import { Edit, ShoppingCart, MessageCircle, Zap, Users, Building2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Constants for sources metrics
const SOURCES_METRICS = {
  OVERVIEW: {
    title: "AI Source Coverage",
    description: "Analysis of where AI systems find information about your brand",
    tooltip: {
      title: "Understanding AI Source Coverage",
      content:
        "This GEORADAR metric shows how widely your brand information is distributed across different websites and domains that AI systems reference. Higher diversity indicates broader digital reach and influence in AI responses.",
    },
  },
  UNIQUE_SOURCES: {
    title: "Unique AI Sources",
    shortTitle: "AI Sources",
    description: "Total unique URLs that AI systems reference for your brand",
    tooltip:
      "Each unique URL where AI systems find information about your brand. More AI sources indicate wider coverage and visibility in AI responses.",
    unit: "sources",
    icon: FileText,
  },
  UNIQUE_DOMAINS: {
    title: "Unique AI Domains",
    shortTitle: "AI Domains",
    description: "Number of different websites that AI systems reference for your brand",
    tooltip:
      "The count of unique websites (domains) that AI systems use as sources about your brand. Higher domain diversity suggests broader digital influence in AI responses.",
    unit: "domains",
    icon: Globe,
  },
  CONCENTRATION: {
    title: "AI Source Concentration",
    shortTitle: "AI Concentration",
    description: "How concentrated your brand references are in AI sources",
    tooltip:
      "Shows the ratio of unique AI sources to total AI responses. Lower percentages indicate better distribution across multiple AI sources.",
    getIndicator: (ratio: number) => {
      if (ratio < 10)
        return { label: "Highly Concentrated", color: "destructive" as const };
      if (ratio < 30)
        return { label: "Concentrated", color: "secondary" as const };
      if (ratio < 50) return { label: "Balanced", color: "default" as const };
      return { label: "Well Distributed", color: "default" as const };
    },
  },
  DIVERSITY_SCORE: {
    title: "AI Diversity Score",
    shortTitle: "AI Diversity",
    description: "AI source diversity health indicator",
    tooltip:
      "Calculated based on the ratio of AI domains to sources. Higher scores indicate your brand appears across many different websites in AI responses, not just concentrated in a few.",
    calculate: (domains: number, sources: number) => {
      if (sources === 0) return 0;
      return (domains / sources) * 100;
    },
    getIndicator: (score: number) => {
      if (score >= 40) return { label: "Excellent", color: "default" as const };
      if (score >= 25) return { label: "Good", color: "secondary" as const };
      if (score >= 15) return { label: "Average", color: "outline" as const };
      return { label: "Poor", color: "destructive" as const };
    },
  },
} as const;

// Helper function to analyze source distribution
const analyzeSourceDistribution = (data: OverviewData) => {
  const concentration = data.totalSources
    ? (data.totalSources / data.totalResponses) * 100
    : 0;

  const diversityScore = SOURCES_METRICS.DIVERSITY_SCORE.calculate(
    data.totalDomains,
    data.totalSources
  );

  const avgSourcesPerDomain = data.totalDomains
    ? data.totalSources / data.totalDomains
    : 0;

  return {
    concentration,
    diversityScore,
    avgSourcesPerDomain,
    isWellDistributed: concentration > 30 && diversityScore > 25,
    needsImprovement: concentration < 10 || diversityScore < 15,
  };
};

interface SourcesOverviewProps {
  className?: string;
}

export const SourcesOverview: React.FC<SourcesOverviewProps> = ({
  className,
}) => {
  const {
    data: overview,
    isLoading,
    error,
  } = useQuery(trpc.sources.overview.queryOptions());

  // Memoize analysis
  const analysis = useMemo(() => {
    if (!overview) return null;
    return analyzeSourceDistribution(overview);
  }, [overview]);

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI source metrics. Please try refreshing the page.
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
          title={SOURCES_METRICS.OVERVIEW.title}
          description={SOURCES_METRICS.OVERVIEW.description}
          icon={<Link className="h-5 w-5 text-blue-500" />}
        />
        <div className="space-y-4 p-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </StatCard>
    );
  }

  if (!overview || !analysis) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={SOURCES_METRICS.OVERVIEW.title}
          description={SOURCES_METRICS.OVERVIEW.description}
          icon={<Link className="h-5 w-5 text-blue-500" />}
        />
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI source data available</p>
        </div>
      </StatCard>
    );
  }

  const concentrationIndicator = SOURCES_METRICS.CONCENTRATION.getIndicator(
    analysis.concentration
  );
  const diversityIndicator = SOURCES_METRICS.DIVERSITY_SCORE.getIndicator(
    analysis.diversityScore
  );
  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={SOURCES_METRICS.OVERVIEW.title}
        description={SOURCES_METRICS.OVERVIEW.description}
        icon={<Link className="h-5 w-5 text-blue-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            <Badge variant={diversityIndicator.color}>
              {diversityIndicator.label} Diversity
            </Badge>
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {SOURCES_METRICS.OVERVIEW.tooltip.title}
              </p>
              <p className="text-xs">
                {SOURCES_METRICS.OVERVIEW.tooltip.content}
              </p>
            </IconTooltip>
          </div>
        }
      />
      {/* Key Metrics Comparison */}
      <StatComparison
        before={{
          label: (
            <div className="flex items-center gap-2">
              <SOURCES_METRICS.UNIQUE_SOURCES.icon className="h-4 w-4 text-muted-foreground" />
              <span>{SOURCES_METRICS.UNIQUE_SOURCES.shortTitle}</span>
              <IconTooltip
                icon={<Info className="h-3 w-3 text-muted-foreground" />}
              >
                <p className="text-xs">
                  {SOURCES_METRICS.UNIQUE_SOURCES.tooltip}
                </p>
              </IconTooltip>
            </div>
          ),
          value: overview.totalSources.toLocaleString(),
          description: (
            <span className="text-xs">
              {analysis.avgSourcesPerDomain.toFixed(1)} per domain
            </span>
          ),
        }}
        after={{
          label: (
            <div className="flex items-center gap-2">
              <SOURCES_METRICS.UNIQUE_DOMAINS.icon className="h-4 w-4 text-muted-foreground" />
              <span>{SOURCES_METRICS.UNIQUE_DOMAINS.shortTitle}</span>
              <IconTooltip
                icon={<Info className="h-3 w-3 text-muted-foreground" />}
              >
                <p className="text-xs">
                  {SOURCES_METRICS.UNIQUE_DOMAINS.tooltip}
                </p>
              </IconTooltip>
            </div>
          ),
          value: overview.totalDomains.toLocaleString(),
          description: (
            <span className="text-xs">
              {((overview.totalDomains / overview.totalSources) * 100).toFixed(
                0
              )}
              % of sources
            </span>
          ),
        }}
      />

      {/* Concentration Metric */}
      <div className="border-t  bg-muted/30 ">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Distribution Analysis</h4>
          </div>
          <Badge variant={concentrationIndicator.color} className="text-xs">
            {concentrationIndicator.label}
          </Badge>
        </div>

        <div className="flex flex-col  justify-center  gap-0 ">
          {/* Concentration Score */}
          <div className="flex items-center  p-1">
            <ProgressCircle
              value={Math.min(analysis.concentration, 100)}
              max={100}
              strokeWidth={6}
              width={60}
              height={60}
              variant={
                analysis.concentration > 50
                  ? "success"
                  : analysis.concentration > 30
                  ? "default"
                  : analysis.concentration > 10
                  ? "warning"
                  : "error"
              }
              showAnimation={true}
              className="m-4"
            >
              <span className="text-md font-semibold">
                {analysis.concentration.toFixed(0)}%
              </span>
            </ProgressCircle>
            <div className="border-l p-2 w-full border-brand">
              <div className="flex items-center justify-between w-full gap-2">
                <p className="tex-sm text-muted-foreground mt-2">
                  {SOURCES_METRICS.CONCENTRATION.title}
                </p>
                <IconTooltip
                  icon={<Info className="h-3 w-3 text-muted-foreground" />}
                >
                  <p className="text-xs">
                    {SOURCES_METRICS.DIVERSITY_SCORE.tooltip}
                  </p>
                </IconTooltip>
              </div>
              <p className=" text-muted-foreground text-xs mt-1">
                {SOURCES_METRICS.CONCENTRATION.tooltip.split(".")[0]}
              </p>
            </div>
          </div>

          {/* Diversity Score */}
          <div className="flex items-center   p-1">
            <ProgressCircle
              value={Math.min(analysis.diversityScore, 100)}
              max={100}
              strokeWidth={6}
              width={60}
              height={60}
              variant={
                analysis.diversityScore > 40
                  ? "success"
                  : analysis.diversityScore > 25
                  ? "default"
                  : analysis.diversityScore > 15
                  ? "warning"
                  : "error"
              }
              showAnimation={true}
              className="m-4"
            >
              <span className="text-md font-semibold">
                {analysis.diversityScore.toFixed(0)}%
              </span>
            </ProgressCircle>
            <div className="border-l p-2 w-full ">
              <div className="flex items-center justify-between w-full gap-2">
                <p className="tex-sm text-muted-foreground mt-2">
                  {SOURCES_METRICS.DIVERSITY_SCORE.title}
                </p>
                <IconTooltip
                  icon={<Info className="h-3 w-3 text-muted-foreground" />}
                >
                  <p className="text-xs">
                    {SOURCES_METRICS.DIVERSITY_SCORE.tooltip}
                  </p>
                </IconTooltip>
              </div>

              <p className=" text-muted-foreground text-xs mt-1">
                {SOURCES_METRICS.DIVERSITY_SCORE.tooltip.split(".")[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="px-4 pb-4 space-y-2">
        {analysis.isWellDistributed && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs">
              Excellent AI source distribution! Your brand appears across{" "}
              {overview.totalDomains} different domains in AI responses.
            </AlertDescription>
          </Alert>
        )}

        {analysis.needsImprovement && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs">
              AI source concentration is high. Consider diversifying your brand
              presence across more platforms for better AI coverage.
            </AlertDescription>
          </Alert>
        )}

        {overview.totalResponses > 100 && overview.totalSources < 20 && (
          <Alert>
            <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs">
              High AI response volume from limited sources. This indicates strong
              presence in specific platforms that AI systems frequently reference.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </StatCard>
  );
};
