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

interface SourcesBreakdownProps {
  className?: string;
}

export const SourcesBreakdown: React.FC<SourcesBreakdownProps> = ({
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
        title={BREAKDOWN_METRICS.TITLE}
        description={BREAKDOWN_METRICS.DESCRIPTION}
        icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            {analysisData.hasGoodDiversity ? (
              <Badge variant="default">Well Distributed</Badge>
            ) : (
              <Badge variant="secondary">Concentrated</Badge>
            )}
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {BREAKDOWN_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">{BREAKDOWN_METRICS.TOOLTIP.content}</p>
            </IconTooltip>
          </div>
        }
      />

      {/* Donut Chart */}
      <div className="p-6 flex flex-col items-center">
        <DonutChart
          data={analysisData.categories.map((cat) => ({
            name: cat.name,
            value: cat.data?.totalResponses || 0,
            percentage: cat.percentage,
          }))}
          category="name"
          value="value"
          variant="donut"
          colors={analysisData.categories.map(
            (cat) => BREAKDOWN_METRICS.CATEGORIES.getColor(cat.name) as any
          )}
          valueFormatter={(value) => value.toLocaleString()}
          showTooltip={true}
          className="h-64 w-64"
        />
      </div>
      <div className="px-2 py-4 border-t space-y-1">
        {analysisData.categories.map((category) => {
          const isOwned = category.type === "owned";
          return (
            <div
              key={category.name}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors  justify-between  ",
                isOwned
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2  justify-between">
                <div
                  className={cn(
                    "h-9 w-1 rounded-full",
                    getColorClassName(
                      BREAKDOWN_METRICS.CATEGORIES.getColor(category.name) ??
                        "emerald",
                      "bg"
                    )
                  )}
                />
                <div>
                  <p className={cn("text-sm", isOwned && "font-semibold")}>
                    {category.name}
                  </p>
                  <p className="text-xs flex items-center gap-1">
                    <span className=" text-muted-foreground">
                      {category.data?.totalResponses}{" "}
                    </span>
                    <span className="text-muted-foreground/80">sources</span>
                  </p>
                </div>
              </div>

              {isOwned && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Owned
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </StatCard>
  );
};
