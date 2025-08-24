import {
  Eye,
  ExternalLink,
  Link,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Info,
  Globe,
  Award,
  Star,
  Activity,
  BarChart3,
} from "lucide-react";
import { StatCard, StatHeader } from "@/components/data/stats";
import { BarList } from "@/components/data/bar-list";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { useMemo } from "react";
import type { RouterOutput } from "@/utils/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BREAKDOWN_METRICS } from "./sources-breakdow";
import { Config } from "config";

type SourceData = RouterOutput["sources"]["topSources"][number];

// Constants for top sources metrics
const TOP_SOURCES_METRICS = {
  TITLE: "Top AI Source URLs",
  DESCRIPTION: "Most frequently cited sources by AI systems across all platforms",
  TOOLTIP: {
    title: "Understanding Top AI Sources",
    content:
      "These are the specific URLs that AI systems reference most frequently when mentioning your brand. A diverse set of top AI sources indicates broad coverage, while concentration in few sources may indicate limited reach in AI responses.",
  },
  HELP_TEXT:
    "Monitor these AI sources regularly for brand mentions and optimization opportunities.",
  INSIGHTS: {
    HIGH_CONCENTRATION: "High concentration in top AI sources",
    GOOD_DISTRIBUTION: "Well-distributed AI source coverage",
    SINGLE_SOURCE_DOMINANCE: "Single AI source dominates mentions",
  },
} as const;

// Helper function to analyze source concentration
const analyzeSourceConcentration = (sources: SourceData[]) => {
  if (!sources || sources.length === 0) return null;

  const totalResponses = sources.reduce(
    (sum, source) => sum + source.total_responses,
    0
  );

  const topSource = sources[0];
  const topSourcePercentage =
    (topSource.total_responses / totalResponses) * 100;

  const top3Total = sources
    .slice(0, 3)
    .reduce((sum, source) => sum + source.total_responses, 0);
  const top3Percentage = (top3Total / totalResponses) * 100;

  // Categorize concentration
  const concentrationLevel =
    topSourcePercentage > 50
      ? "very_high"
      : topSourcePercentage > 30
      ? "high"
      : top3Percentage > 70
      ? "moderate"
      : "low";

  return {
    totalResponses,
    topSource,
    topSourcePercentage,
    top3Percentage,
    concentrationLevel,
    averageResponsesPerSource: totalResponses / sources.length,
  };
};

function getFavicon(source_url: string) {
  const domain = getDomainFromUrl(source_url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Helper function to get domain from URL
const getDomainFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

// Helper function to format URL for display
const formatUrlForDisplay = (url: string, maxLength: number = 40) => {
  const domain = getDomainFromUrl(url);
  const path = url.replace(/^https?:\/\/[^\/]+/, "");

  if (url.length <= maxLength) return url;

  if (domain.length > maxLength - 10) {
    return domain.substring(0, maxLength - 3) + "...";
  }

  const remainingLength = maxLength - domain.length - 3;
  if (path.length > remainingLength) {
    return `${domain}${path.substring(0, remainingLength)}...`;
  }

  return url;
};

// Helper function to get performance badge
const getPerformanceBadge = (position: number) => {
  if (position === 1)
    return { label: "Top AI Source", color: "default" as const, icon: Award };
  if (position <= 3)
    return { label: "High AI Impact", color: "secondary" as const, icon: Star };
  if (position <= 5)
    return { label: "Notable AI", color: "outline" as const, icon: TrendingUp };
  return null;
};

interface TopSourcesSectionProps {
  className?: string;
}

export const TopSourcesSection = ({ className }: TopSourcesSectionProps) => {
  const {
    data: topSources,
    isLoading,
    error,
  } = useQuery(trpc.sources.topSources.queryOptions());

  // Memoize analysis
  const analysis = useMemo(() => {
    if (!topSources || topSources.length === 0) return null;
    return analyzeSourceConcentration(topSources);
  }, [topSources]);

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load top AI sources. Please try refreshing the page.
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
          title={TOP_SOURCES_METRICS.TITLE}
          description={TOP_SOURCES_METRICS.DESCRIPTION}
          icon={<Link className="h-5 w-5 text-blue-500" />}
        />
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </StatCard>
    );
  }

  // Handle no data state
  if (!topSources || topSources.length === 0) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={TOP_SOURCES_METRICS.TITLE}
          description={TOP_SOURCES_METRICS.DESCRIPTION}
          icon={<Link className="h-5 w-5 text-blue-500" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI source data available</p>
          <p className="text-sm mt-2">
            AI source URLs will appear here once mentions are tracked
          </p>
        </div>
      </StatCard>
    );
  }

  const concentrationBadge = analysis
    ? analysis.concentrationLevel === "very_high"
      ? { label: "Very AI Concentrated", color: "destructive" as const }
      : analysis.concentrationLevel === "high"
      ? { label: "AI Concentrated", color: "secondary" as const }
      : analysis.concentrationLevel === "moderate"
      ? { label: "Moderate AI", color: "outline" as const }
      : { label: "Well AI Distributed", color: "default" as const }
    : null;
  return (
    <StatCard className={cn(className, "flex flex-col h-full")}>
      <StatHeader
        title={TOP_SOURCES_METRICS.TITLE}
        description={TOP_SOURCES_METRICS.DESCRIPTION}
        icon={<Link className="h-5 w-5 text-blue-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {concentrationBadge && (
              <Badge variant={concentrationBadge.color}>
                {concentrationBadge.label}
              </Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {TOP_SOURCES_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">{TOP_SOURCES_METRICS.TOOLTIP.content}</p>
            </IconTooltip>
          </div>
        }
      />

      {/* Sources List */}
      <div className="p-6 bg-muted/30  flex-1">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">AI Source Rankings</span>
          <Badge variant="outline" className="text-xs">
            Top {Math.min(topSources.length, 8)} of {topSources.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {topSources.slice(0, 8).map((source, index) => {
            const domain = getDomainFromUrl(source.source_url);
            const performanceBadge = getPerformanceBadge(index + 1);
            const isOwned = Config.constants.sourcesGroup
              .find((c) => c.type === "owned")
              ?.patterns.some((p) => source.source_url?.includes(p));
            const favicon = getFavicon(source.source_url || "");

            return (
              <div
                key={source.source_url}
                className={cn(
                  "group relative flex items-center justify-between p-3  transition-all overflow-hidden",
                  "hover:bg-background"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                  <Avatar className={cn("h-5 w-5  rounded-full")}>
                    {favicon ? (
                      <AvatarImage src={favicon} alt={domain} />
                    ) : null}
                    <AvatarFallback className={cn("text-xs")}>
                      <Globe className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-primary transition-colors truncate max-w-[300px] inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {formatUrlForDisplay(source.source_url || "", 100)}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p className="text-xs break-all">
                            {source.source_url}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {domain}
                      </span>
                      {source.category && source.category !== "other" && (
                        <Badge variant="outline" className="text-xs h-5">
                          {source.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  {performanceBadge && (
                    <Badge variant={performanceBadge.color} className="gap-1">
                      {performanceBadge.icon && (
                        <performanceBadge.icon className="h-3 w-3" />
                      )}
                      {performanceBadge.label}
                    </Badge>
                  )}
                  {isOwned && (
                    <Badge variant="brand" className="text-xs h-5">
                      Owned
                    </Badge>
                  )}

                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {source.total_responses.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">mentions</p>
                  </div>
                </div>
                <div
                  className="absolute top-0 left-0 h-full bg-brand/20"
                  style={{
                    width: `${
                      (source.total_responses /
                        (analysis?.topSource?.total_responses || 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          {TOP_SOURCES_METRICS.HELP_TEXT}
        </p>
      </div>
    </StatCard>
  );
};
