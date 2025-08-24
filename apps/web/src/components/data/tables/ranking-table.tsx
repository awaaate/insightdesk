import type { RouterOutput } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { BaseDataTable } from "./base-data-table";
import {
  Medal,
  Award,
  Crown,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  Target,
  Brain,
  MessageCircle,
  Users,
  BarChart3,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { Config } from "config";
import { getPerformanceIndicator } from "@/components/dashboard/kpis/voice-metrics-section";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RankingData = RouterOutput["metrics"]["ranking"]["data"][number];

// Metrics definitions with professional labels and descriptions
const METRIC_DEFINITIONS = {
  sentiment_score: {
    title: "Sentiment Score",
    shortTitle: "Sentiment",
    description: "Average emotional tone of brand mentions",
    tooltip:
      "Sentiment score ranges from 0-100%, where higher values indicate more positive brand perception across all mentions.",
    unit: "%",
    icon: <Brain className="h-4 w-4" />,
    format: (value: number) => `${value.toFixed(1)}%`,
    getVariant: (value: number) => {
      if (value >= 70) return "success";
      if (value >= 50) return "default";
      if (value >= 30) return "warning";
      return "destructive";
    },
  },
  position_score: {
    title: "Position Score",
    shortTitle: "Position",
    description: "Average ranking position in search results and conversations",
    tooltip:
      "Position score reflects how prominently your brand appears in conversations. Higher scores indicate better visibility and mention placement.",
    unit: "pts",
    icon: <Target className="h-4 w-4" />,
    format: (value: number) => value.toFixed(2),
    getVariant: (value: number) => {
      if (value >= 80) return "success";
      if (value >= 60) return "default";
      if (value >= 40) return "warning";
      return "destructive";
    },
  },
  shareOfVoice: {
    title: "Share of Voice (SOV)",
    shortTitle: "SOV",
    description: "Brand's percentage of total market conversations",
    tooltip:
      "SOV measures your brand's visibility in the overall market. It shows what percentage of all relevant conversations mention your brand.",
    unit: "%",
    icon: <MessageCircle className="h-4 w-4" />,
    format: (value: number) => `${value.toFixed(1)}%`,
    getVariant: (value: number) => {
      if (value >= 30) return "success";
      if (value >= 20) return "default";
      if (value >= 10) return "warning";
      return "destructive";
    },
  },
  shareOfBrandedVoice: {
    title: "Share of Branded Voice (SOBV)",
    shortTitle: "SOBV",
    description: "Brand's share among all branded conversations",
    tooltip:
      "SOBV shows your competitive position when only considering conversations that mention any brand, excluding generic product discussions.",
    unit: "%",
    icon: <Users className="h-4 w-4" />,
    format: (value: number) => `${value.toFixed(1)}%`,
    getVariant: (value: number) => {
      if (value >= 40) return "success";
      if (value >= 25) return "default";
      if (value >= 15) return "warning";
      return "destructive";
    },
  },
  mention_count: {
    title: "Total Mentions",
    shortTitle: "Mentions",
    description: "Total number of brand mentions across all sources",
    tooltip:
      "The total count of times your brand has been mentioned in conversations, posts, and discussions across all monitored channels.",
    unit: "",
    icon: <BarChart3 className="h-4 w-4" />,
    format: (value: number) => value.toLocaleString(),
    getVariant: (value: number) => {
      if (value >= 1000) return "success";
      if (value >= 500) return "default";
      if (value >= 100) return "warning";
      return "destructive";
    },
  },
  bis: {
    title: "Brand Impact Score (BIS)",
    shortTitle: "BIS",
    description: "Overall brand visibility and influence metric",
    tooltip:
      "BIS is a composite metric that combines visibility, reach, and engagement to measure your brand's overall market impact.",
    unit: "pts",
    icon: <TrendingUp className="h-4 w-4" />,
    format: (value: number) => value.toFixed(1),
    getVariant: (value: number) => {
      if (value >= 80) return "success";
      if (value >= 60) return "default";
      if (value >= 40) return "warning";
      return "destructive";
    },
  },
  total_responses: {
    title: "Response Coverage",
    shortTitle: "Coverage",
    description: "Number of conversations where brand was mentioned",
    tooltip:
      "The total number of distinct conversations or responses where your brand has been mentioned.",
    unit: "",
    icon: <MessageCircle className="h-4 w-4" />,
    format: (value: number) => value.toLocaleString(),
    getVariant: (value: number) => {
      if (value >= 500) return "success";
      if (value >= 200) return "default";
      if (value >= 50) return "warning";
      return "destructive";
    },
  },
} as const;

// Enhanced rank badge with better styling and performance indicators
const getRankBadge = (position: number, total: number = 10) => {
  const isTopQuartile = position <= Math.ceil(total * 0.25);
  const isTopHalf = position <= Math.ceil(total * 0.5);

  switch (position) {
    case 1:
      return (
        <Badge
          variant="default"
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 hover:from-yellow-500 hover:to-yellow-700 shadow-sm"
        >
          <Crown className="w-3 h-3 mr-1" />
          1st
        </Badge>
      );
    case 2:
      return (
        <Badge
          variant="default"
          className="bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 hover:from-gray-400 hover:to-gray-600 shadow-sm"
        >
          <Medal className="w-3 h-3 mr-1" />
          2nd
        </Badge>
      );
    case 3:
      return (
        <Badge
          variant="default"
          className="bg-gradient-to-r from-orange-500 to-orange-700 text-white hover:from-orange-600 hover:to-orange-800 shadow-sm"
        >
          <Award className="w-3 h-3 mr-1" />
          3rd
        </Badge>
      );
    default:
      return (
        <Badge
          variant={
            isTopQuartile ? "secondary" : isTopHalf ? "outline" : "default"
          }
          className={`font-mono ${
            isTopQuartile
              ? "bg-green-50 text-green-700 border-green-200"
              : isTopHalf
              ? ""
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {isTopQuartile && <TrendingUp className="w-3 h-3 mr-1" />}
          {!isTopHalf && <TrendingDown className="w-3 h-3 mr-1" />}#{position}
        </Badge>
      );
  }
};

// Helper to create metric cell with enhanced UI
const createMetricCell = (
  metricKey: keyof typeof METRIC_DEFINITIONS,
  showRank: boolean = true
) => {
  const metric = METRIC_DEFINITIONS[metricKey];

  return ({ row }: { row: any }) => {
    const value = row.original.metrics[metricKey];
    const rank = showRank ? row.original.rankings[metricKey] : null;

    return (
      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{metric.format(value)}</span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-2">
              <p className="font-semibold text-sm">{metric.title}</p>
              <p className="text-xs text-muted-foreground">{metric.tooltip}</p>
              <div className="text-xs">
                <span className="text-muted-foreground">Current value: </span>
                <span className="font-medium">{metric.format(value)}</span>
              </div>
            </div>
          </IconTooltip>
        </div>

        <div className="flex items-center justify-between gap-2">
          {rank && (
            <div className="flex items-center gap-1">{getRankBadge(rank)}</div>
          )}
        </div>
      </div>
    );
  };
};

export const KpisRankingTable = () => {
  const { data, isLoading, error } = useQuery(
    trpc.metrics.ranking.queryOptions()
  );

  // Handle error state with professional UI
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load ranking data. Please check your connection and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const columns: ColumnDef<RankingData>[] = [
    {
      accessorKey: "brand",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">Brand</span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <p className="text-xs">
              Companies being tracked in competitive analysis
            </p>
          </IconTooltip>
        </div>
      ),
      cell: ({ row }) => {
        const brand = Config.constants.brands.find(
          (b) => b.name === row.original.brand
        )!;
        const isTarget = brand.name === Config.constants.target_brand?.name;

        return (
          <div
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors`}
          >
            <BrandLogo
              brand={brand}
              size="sm"
              updateFavicon={false}
              className="h-10 w-10 bg-white "
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 justify-between">
                <span className="font-medium">{brand.name}</span>
                {isTarget && (
                  <Badge
                    variant="secondary"
                    className="text-xs 5 bg-brand/80 text-brand-foreground s"
                  >
                    Your Brand
                  </Badge>
                )}
              </div>
              {brand.website && (
                <span className="text-xs text-muted-foreground">
                  {new URL(brand.website).hostname}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "metrics.sentiment_score",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.sentiment_score.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.sentiment_score.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.sentiment_score.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.sentiment_score.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("sentiment_score"),
    },
    {
      accessorKey: "metrics.position_score",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.position_score.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.position_score.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.position_score.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.position_score.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("position_score"),
    },
    {
      accessorKey: "metrics.shareOfVoice",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.shareOfVoice.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.shareOfVoice.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.shareOfVoice.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.shareOfVoice.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("shareOfVoice"),
    },
    {
      accessorKey: "metrics.shareOfBrandedVoice",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.shareOfBrandedVoice.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.shareOfBrandedVoice.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.shareOfBrandedVoice.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.shareOfBrandedVoice.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("shareOfBrandedVoice"),
    },
    {
      accessorKey: "metrics.mention_count",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.mention_count.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.mention_count.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.mention_count.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.mention_count.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("mention_count"),
    },
    {
      accessorKey: "metrics.bis",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.bis.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.bis.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.bis.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.bis.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("bis"),
    },
    {
      accessorKey: "metrics.total_responses",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {METRIC_DEFINITIONS.total_responses.icon}
          <span className="font-semibold">
            {METRIC_DEFINITIONS.total_responses.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {METRIC_DEFINITIONS.total_responses.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {METRIC_DEFINITIONS.total_responses.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: createMetricCell("total_responses", false),
    },
  ];

  return (
    <BaseDataTable
      columns={columns}
      data={data?.data || []}
      loading={isLoading}
      error={error ? new Error(error) : null}
      searchKey="brand"
      searchPlaceholder="Search brands by name..."
      emptyMessage="No competitive data available. Check your data sources and try again."
      pageSize={15}
      showColumnVisibility={true}
      showPagination={true}
      showSearch={true}
    />
  );
};

// Export metric definitions for reuse in other components
export { METRIC_DEFINITIONS, getRankBadge };
