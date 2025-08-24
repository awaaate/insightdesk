import {
  Eye,
  Shield,
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
  Building2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Config } from "config";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";

type OwnedSourceData = RouterOutput["sources"]["topOwnedSources"][number];

// Constants for owned sources metrics
const OWNED_SOURCES_METRICS = {
  TITLE: "Top AI Owned Sources",
  DESCRIPTION: "Most frequently cited sources from your official channels in AI responses",
  TOOLTIP: {
    title: "Understanding AI Owned Sources",
    content:
      "These are references from your brand's official websites and controlled platforms that AI systems cite. High activity here indicates strong content distribution from your owned channels in AI responses.",
  },
  HELP_TEXT:
    "These sources are directly controlled by your brand. Optimize content here for maximum AI visibility and impact.",
  INSIGHTS: {
    HIGH_ENGAGEMENT: "Strong AI engagement on owned channels",
    LOW_ENGAGEMENT: "Consider increasing content on owned platforms for better AI visibility",
    GOOD_DISTRIBUTION: "Well-balanced owned source activity in AI responses",
  },
} as const;

// Get category colors
const categoryColors = constructCategoryColors(
  Config.constants.sourcesGroup.map((c) => c.name),
  AvailableChartColors
);

// Helper function to get category icon
const getCategoryIcon = (categoryName: string) => {
  const icons: Record<string, any> = {
    "Ford Official": Shield,
    Reference: Globe,
    "General Media": Activity,
    Automotive: Building2,
    "Electric Mobility": TrendingUp,
    Competitors: Building2,
  };
  return icons[categoryName] || Globe;
};

// Helper function to analyze owned source performance
const analyzeOwnedSourcePerformance = (sources: OwnedSourceData[]) => {
  if (!sources || sources.length === 0) return null;

  const totalResponses = sources.reduce(
    (sum, source) => sum + source.total_responses,
    0
  );

  const avgResponsesPerSource = totalResponses / sources.length;
  
  // Group by category
  const categoryCounts = sources.reduce((acc, source) => {
    const category = source.category || "other";
    if (!acc[category]) {
      acc[category] = { count: 0, responses: 0 };
    }
    acc[category].count++;
    acc[category].responses += source.total_responses;
    return acc;
  }, {} as Record<string, { count: number; responses: number }>);

  const dominantCategory = Object.entries(categoryCounts).sort(
    (a, b) => b[1].responses - a[1].responses
  )[0];

  const topSource = sources[0];
  const topSourcePercentage = (topSource.total_responses / totalResponses) * 100;

  return {
    totalResponses,
    avgResponsesPerSource,
    categoryCounts,
    dominantCategory: dominantCategory?.[0],
    topSource,
    topSourcePercentage,
    performanceLevel:
      avgResponsesPerSource > 50
        ? "high"
        : avgResponsesPerSource > 20
        ? "moderate"
        : "low",
  };
};

// Helper function to format URL for display
const formatUrlForDisplay = (url: string, maxLength: number = 40) => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const domain = urlObj.hostname.replace("www.", "");
    const path = urlObj.pathname;
    
    if (url.length <= maxLength) return url;
    
    if (domain.length > maxLength - 10) {
      return domain.substring(0, maxLength - 3) + "...";
    }
    
    const remainingLength = maxLength - domain.length - 3;
    if (path.length > remainingLength) {
      return `${domain}${path.substring(0, remainingLength)}...`;
    }
    
    return url;
  } catch {
    return url.length > maxLength
      ? url.substring(0, maxLength - 3) + "..."
      : url;
  }
};

interface TopOwnedSourcesSectionProps {
  className?: string;
}

export const TopOwnedSourcesSection = ({
  className,
}: TopOwnedSourcesSectionProps) => {
  const { data: topOwnedSources, isLoading, error } = useQuery(
    trpc.sources.topOwnedSources.queryOptions()
  );

  // Memoize analysis
  const analysis = useMemo(() => {
    if (!topOwnedSources || topOwnedSources.length === 0) return null;
    return analyzeOwnedSourcePerformance(topOwnedSources);
  }, [topOwnedSources]);

  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI owned sources. Please try refreshing the page.
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
          title={OWNED_SOURCES_METRICS.TITLE}
          description={OWNED_SOURCES_METRICS.DESCRIPTION}
          icon={<Shield className="h-5 w-5 text-blue-500" />}
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
  if (!topOwnedSources || topOwnedSources.length === 0) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={OWNED_SOURCES_METRICS.TITLE}
          description={OWNED_SOURCES_METRICS.DESCRIPTION}
          icon={<Shield className="h-5 w-5 text-blue-500" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI owned source data available</p>
          <p className="text-sm mt-2">
            Your official channel mentions in AI responses will appear here
          </p>
        </div>
      </StatCard>
    );
  }

  const performanceBadge = analysis
    ? analysis.performanceLevel === "high"
      ? { label: "High AI Activity", color: "default" as const }
      : analysis.performanceLevel === "moderate"
      ? { label: "Moderate AI Activity", color: "secondary" as const }
      : { label: "Low AI Activity", color: "destructive" as const }
    : null;
  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={OWNED_SOURCES_METRICS.TITLE}
        description={OWNED_SOURCES_METRICS.DESCRIPTION}
        icon={<Shield className="h-5 w-5 text-blue-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {performanceBadge && (
              <Badge variant={performanceBadge.color}>
                {performanceBadge.label}
              </Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {OWNED_SOURCES_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">{OWNED_SOURCES_METRICS.TOOLTIP.content}</p>
            </IconTooltip>
          </div>
        }
      />

      {/* Key Insights */}
      {analysis && (
        <div className="px-6 pb-4 space-y-3">
          {/* Performance Overview */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Owned Source */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Most Active
                </span>
              </div>
              <p className="text-sm font-semibold truncate">
                {formatUrlForDisplay(analysis.topSource.source_url, 30)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {analysis.topSource.total_responses} mentions
                </span>
                <Badge variant="outline" className="text-xs h-5">
                  {analysis.topSourcePercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Coverage
                </span>
              </div>
              <p className="text-sm font-semibold">
                {topOwnedSources.length} Sources
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {Math.round(analysis.avgResponsesPerSource)} per source
              </p>
            </div>
          </div>

          {/* Performance Alerts */}
          {analysis.performanceLevel === "high" && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs">
                {OWNED_SOURCES_METRICS.INSIGHTS.HIGH_ENGAGEMENT} - Your official
                channels are generating strong AI engagement.
              </AlertDescription>
            </Alert>
          )}

          {analysis.performanceLevel === "low" && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs">
                {OWNED_SOURCES_METRICS.INSIGHTS.LOW_ENGAGEMENT} - Consider
                increasing content frequency on your official channels.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sources List */}
      <div className="p-6 bg-muted/30">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI Official Channel Rankings</span>
            <Badge variant="default" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            Top {Math.min(topOwnedSources.length, 8)}
          </Badge>
        </div>

        <div className="space-y-2">
          {topOwnedSources.slice(0, 8).map((source, index) => {
            const category = source.category || "Ford Official";
            const CategoryIcon = getCategoryIcon(category);
            const categoryColor = categoryColors.get(category) || "blue";
            
            return (
              <div
                key={source.source_url}
                className={cn(
                  "group relative flex items-center justify-between p-3 rounded-lg transition-all",
                  "hover:bg-background border border-primary/20 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold",
                      "bg-primary/10 text-primary"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Category Indicator */}
                  <div
                    className={cn(
                      "h-8 w-1 rounded-full",
                      getColorClassName(categoryColor, "bg")
                    )}
                  />

                  {/* Source Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-primary transition-colors truncate max-w-[300px] inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {formatUrlForDisplay(source.source_url, 45)}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p className="text-xs break-all">{source.source_url}</p>
                        </TooltipContent>
                      </Tooltip>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs h-5",
                          getColorClassName(categoryColor, "text")
                        )}
                      >
                        {category}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs h-5 gap-1">
                          <Star className="h-3 w-3" />
                          Top
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {source.total_responses.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">mentions</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More */}
        {topOwnedSources.length > 8 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              +{topOwnedSources.length - 8} more owned sources
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Info className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {OWNED_SOURCES_METRICS.HELP_TEXT}
          </p>
        </div>
      </div>
    </StatCard>
  );
};
