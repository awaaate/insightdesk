import { IconTooltip } from "@/components/common/icon-tooltip";
import { DonutChart } from "@/components/data/donut-chart";
import { ProgressCircle } from "@/components/data/progress-circle";
import { StatCard, StatComparison, StatHeader } from "@/components/data/stats";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RouterOutput } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Car,
  CheckCircle,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Link,
  Newspaper,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Config } from "config";
// Add missing imports at the top
import { Edit, ShoppingCart, MessageCircle } from "lucide-react";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";
import { SiteHeader } from "@/layouts/dashboard/site-header";

type OverviewData = RouterOutput["sources"]["overview"];
type CategoryData = RouterOutput["sources"]["overviewPerCategory"][number];

const categoryColors = constructCategoryColors(
  Config.constants.sourcesGroup.map((c) => c.name),
  AvailableChartColors
);
// Constants for breakdown metrics
export const BREAKDOWN_METRICS = {
  TITLE: "AI Sources by Category",
  DESCRIPTION: "Distribution of AI sources across different platform types",
  TOOLTIP: {
    title: "AI Platform Categories",
    content:
      "GEORADAR sources are categorized by platform type (social media, news, forums, etc.) to help you understand where AI systems are finding information about your brand for their responses.",
  },
  CATEGORIES: {
    getIcon: (categoryName: string) => {
      const icons: Record<string, any> = {
        "Ford Official": Shield,
        Reference: Globe,
        "General Media": Newspaper,
        Automotive: Car,
        "Electric Mobility": Zap,
        Competitors: Building2,
        "Social Media": Activity,
        "News & Media": FileText,
        Forums: MessageCircle,
        Blogs: Edit,
        "E-commerce": ShoppingCart,
        Other: Sparkles,
      };
      return icons[categoryName] || Globe;
    },
    getColor: (category: string) => {
      return categoryColors.get(category) || "gray";
    },
    getFavicon: (categoryName: string, patterns: string[] = []) => {
      // Get a representative domain from patterns
      const representativeDomains: Record<string, string> = {
        "Ford Official": "https://www.ford.com",
        Reference: "https://wikipedia.org",
        "General Media": "https://elpais.com",
        Automotive: "https://motor1.com",
        "Electric Mobility": "https://movilidadelectrica.com",
        Competitors: "https://www.toyota.com",
      };

      const domain =
        representativeDomains[categoryName] ||
        (patterns[0] ? `https://${patterns[0]}` : null);

      return domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        : null;
    },
    getColorClass: (categoryName: string) => {
      const colors: Record<string, string> = {
        "Ford Official": "bg-blue-500/10 text-blue-600 border-blue-200",
        Reference: "bg-gray-500/10 text-gray-600 border-gray-200",
        "General Media": "bg-purple-500/10 text-purple-600 border-purple-200",
        Automotive: "bg-orange-500/10 text-orange-600 border-orange-200",
        "Electric Mobility": "bg-green-500/10 text-green-600 border-green-200",
        Competitors: "bg-red-500/10 text-red-600 border-red-200",
      };
      return (
        colors[categoryName] || "bg-gray-500/10 text-gray-600 border-gray-200"
      );
    },
  },
} as const;

interface PlatformBreakdownProps {
  className?: string;
}

export const PlatformBreakdown: React.FC<PlatformBreakdownProps> = ({
  className,
}) => {
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery(trpc.sources.overviewPerCategory.queryOptions());

  // Memoize analysis
  const analysisData = useMemo(() => {
    if (!categories || categories.length === 0) return null;

    const totalResponses = categories.reduce(
      (sum, cat) => sum + (cat.data?.totalResponses || 0),
      0
    );

    const categoriesWithPercentage = categories
      .map((cat) => ({
        ...cat,
        percentage: totalResponses
          ? ((cat.data?.totalResponses || 0) / totalResponses) * 100
          : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const dominantCategory = categoriesWithPercentage[0];
    const hasGoodDiversity =
      categoriesWithPercentage.filter((cat) => cat.percentage > 10).length >= 3;

    return {
      categories: categoriesWithPercentage,
      dominantCategory,
      totalResponses,
      hasGoodDiversity,
    };
  }, [categories]);
  // Handle error state
  if (error) {
    return (
      <StatCard className={cn(className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI category breakdown. Please try refreshing the page.
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
          title={BREAKDOWN_METRICS.TITLE}
          description={BREAKDOWN_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
        />
        <div className="p-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </StatCard>
    );
  }

  if (!analysisData || analysisData.categories.length === 0) {
    return (
      <StatCard className={cn(className)}>
        <StatHeader
          title={BREAKDOWN_METRICS.TITLE}
          description={BREAKDOWN_METRICS.DESCRIPTION}
          icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
        />
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No AI category data available</p>
        </div>
      </StatCard>
    );
  }

  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title="AI Platform Distribution"
        description="Distribution of AI sources across different platform types"
        icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            <Badge variant="default">Well Distributed</Badge>
          </div>
        }
      />

      <div className="space-y-2">
        {analysisData.categories.map((category, index) => (
          <CategoryDetail
            key={category.name}
            {...category}
            isLeading={category.name === analysisData.dominantCategory.name}
            className={cn(
              "px-6 py-2",
              index === 0 && "",
              index > 0 && "border-t",
              index === analysisData.categories.length - 1 && "pb-4"
            )}
          />
        ))}
      </div>

      {/* Insights */}
      {analysisData.dominantCategory && (
        <div className="px-6 pb-6 border-t pt-4 space-y-2">
          {analysisData.dominantCategory.percentage > 50 && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
              <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs">
                {analysisData.dominantCategory.name} dominates with{" "}
                {analysisData.dominantCategory.percentage.toFixed(0)}% of AI
                sources. Consider expanding presence in other platforms.
              </AlertDescription>
            </Alert>
          )}

          {analysisData.hasGoodDiversity && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs">
                Good AI platform diversity! Your brand appears across multiple
                platform types in AI responses.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </StatCard>
  );
};

const CategoryDetail: React.FC<
  CategoryData & { isLeading: boolean; percentage: number; className?: string }
> = (category) => {
  const Icon = BREAKDOWN_METRICS.CATEGORIES.getIcon(category.name);
  const favicon = BREAKDOWN_METRICS.CATEGORIES.getFavicon(
    category.name,
    category.patterns
  );
  const colorClass = BREAKDOWN_METRICS.CATEGORIES.getColorClass(category.name);

  // Calculate metrics
  const avgResponsesPerSource = category.data.totalSources
    ? (category.data.totalResponses / category.data.totalSources).toFixed(1)
    : "0";

  const isHighVolume = category.data.totalResponses > 100;
  const isLowVolume = category.data.totalResponses < 10;

  return (
    <div
      className={cn(
        category.className,
        "group flex items-center gap-3  transition-all"
      )}
    >
      {/* Main content */}
      <div className="flex-1 ">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {/* Avatar with favicon or icon */}
                <Avatar className={cn("h-5 w-5  rounded-full", colorClass)}>
                  {favicon ? (
                    <AvatarImage src={favicon} alt={category.name} />
                  ) : null}
                  <AvatarFallback className={cn("text-xs", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <h5 className="font-medium text-sm truncate cursor-help">
                  {category.name}
                </h5>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{category.name}</p>
              {category.description && (
                <p className="text-xs">{category.description}</p>
              )}
              {category.patterns && category.patterns.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Includes:</p>
                  <p className="text-xs text-muted-foreground">
                    {category.patterns.slice(0, 3).join(", ")}
                    {category.patterns.length > 3 &&
                      ` +${category.patterns.length - 3} more`}
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>

          {category.isLeading && (
            <Badge
              variant="default"
              className="text-xs px-1.5 py-0 bg-brand/10 text-brand"
            >
              Leading
            </Badge>
          )}
          {isHighVolume && !category.isLeading && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              High Volume
            </Badge>
          )}
          {isLowVolume && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Low Activity
            </Badge>
          )}

          {/* Type indicator */}
          {category.type && (
            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={
                      category.type === "owned" ? "default" : "secondary"
                    }
                    className={cn(
                      "text-xs",
                      category.type === "owned"
                        ? "bg-brand/10 text-brand"
                        : " text-brand/60 border-brand/10"
                    )}
                  >
                    {category.type === "owned" ? "Owned" : "Earned"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {category.type === "owned"
                      ? "Official brand-owned platforms in AI responses"
                      : "Third-party platforms mentioning your brand in AI responses"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {category.data.totalDomains}
            </span>
            domains
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {category.data.totalSources}
            </span>
            sources
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {avgResponsesPerSource}
            </span>
            avg/source
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2 ">
            <span className="text-xs text-muted-foreground">
              {category.data.totalResponses.toLocaleString()} responses
            </span>
            <span className="text-xs font-medium">
              {category.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-none overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                getColorClassName(
                  BREAKDOWN_METRICS.CATEGORIES.getColor(category.name) ??
                    "emerald",
                  "bg"
                )
              )}
              style={{ width: `${category.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
