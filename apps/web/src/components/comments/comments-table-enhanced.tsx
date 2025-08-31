import { useMemo, useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters";
import { trpc } from "@/utils/trpc";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  MessageSquare,
  Brain,
  Target,
  Heart,
  AlertCircle,
  TrendingUp,
  X,
  Sparkles,
  Download,
  SortDesc,
  FileText,
  Building2,
  MapPin,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentDetailsDrawer } from "@/components/comments/comment-details-drawer";
import type { SharedTypes } from "types/shared";
import { useQuery } from "@tanstack/react-query";

// Types for comment data with relations
type CommentWithRelations = SharedTypes.Domain.Comment.WithFullRelations;

// Sentiment color mapping using theme colors
const sentimentColors: Record<
  string,
  { bg: string; text: string; border: string; intensity: number }
> = {
  // Negative sentiments
  doubt: {
    bg: "bg-chart-5/10",
    text: "text-chart-5",
    border: "border-chart-5/5",
    intensity: 1,
  },
  concern: {
    bg: "bg-chart-5/15",
    text: "text-chart-5",
    border: "border-chart-5/10",
    intensity: 2,
  },
  annoyance: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/10",
    intensity: 3,
  },
  frustration: {
    bg: "bg-destructive/15",
    text: "text-destructive",
    border: "border-destructive/15",
    intensity: 4,
  },
  anger: {
    bg: "bg-destructive/20",
    text: "text-destructive",
    border: "border-destructive/20",
    intensity: 5,
  },
  outrage: {
    bg: "bg-destructive/25",
    text: "text-destructive",
    border: "border-destructive/25",
    intensity: 6,
  },
  contempt: {
    bg: "bg-chart-4/20",
    text: "text-chart-4",
    border: "border-chart-4/20",
    intensity: 7,
  },
  fury: {
    bg: "bg-destructive/30",
    text: "text-destructive",
    border: "border-destructive/30",
    intensity: 8,
  },
  // Neutral
  neutral: {
    bg: "bg-muted/30",
    text: "text-muted-foreground",
    border: "border-muted/10",
    intensity: 0,
  },
  // Positive sentiments
  satisfaction: {
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    border: "border-chart-2/10",
    intensity: -1,
  },
  gratitude: {
    bg: "bg-chart-2/20",
    text: "text-chart-2",
    border: "border-chart-2/20",
    intensity: -2,
  },
};

// Intention type configurations using theme colors
const intentionColors: Record<
  string,
  { icon: any; color: string; bgColor: string }
> = {
  resolve: {
    icon: Target,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  complain: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  compare: {
    icon: TrendingUp,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  cancel: {
    icon: X,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  inquire: {
    icon: Search,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  praise: {
    icon: Heart,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  suggest: {
    icon: Sparkles,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  other: {
    icon: MessageSquare,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
  },
};

interface CommentsTableEnhancedProps {
  onCommentSelect?: (commentId: string) => void;
  onExport?: () => void;
}

export function CommentsTableEnhanced({
  onCommentSelect,
  onExport,
}: CommentsTableEnhancedProps) {
  // Global analytics filters
  const filters = useAnalyticsFilters();
  // Local-only UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerComment, setDrawerComment] =
    useState<CommentWithRelations | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(filters.searchText, 500);

  // Build query input
  const queryInput = useMemo(
    () => ({
      limit: filters.limit,
      offset: (currentPage - 1) * filters.limit,
      filter: {
        searchText: debouncedSearch || undefined,
        startDate: filters.timeRange?.start,
        endDate: filters.timeRange?.end,
        sentimentLevels:
          filters.sentimentLevels.length > 0
            ? filters.sentimentLevels
            : undefined,
        intentionType: filters.intentionType || undefined,
        source: filters.source,
        business_unit: filters.businessUnit,
        operational_area: filters.operationalArea,
        minConfidence: filters.minConfidence,
      },
      sortBy: (filters.sortBy === "created_at" ||
      filters.sortBy === "updated_at"
        ? filters.sortBy
        : "created_at") as "created_at" | "updated_at",
      sortOrder: filters.sortOrder,
    }),
    [
      currentPage,
      filters.limit,
      debouncedSearch,
      filters.timeRange,
      filters.sentimentLevels,
      filters.intentionType,
      filters.source,
      filters.businessUnit,
      filters.operationalArea,
      filters.minConfidence,
      filters.sortBy,
      filters.sortOrder,
    ]
  );

  // Fetch data
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.v2Comments.listWithRelations.queryOptions(queryInput));

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    filters.timeRange,
    filters.sentimentLevels,
    filters.intentionType,
    filters.source,
    filters.businessUnit,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Extract data from response
  const comments = response?.comments || [];
  const pagination = response?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.total / filters.limit)
    : 0;

  // no inline expansion; details shown in drawer

  // Handle column sorting
  const handleSort = useCallback(
    (field: "created_at" | "updated_at") => {
      if (field === (filters.sortBy as any)) {
        filters.setSortOrder(filters.sortOrder === "asc" ? "desc" : "asc");
      } else {
        filters.setSortBy(field);
        filters.setSortOrder("desc");
      }
      setCurrentPage(1);
    },
    [filters]
  );

  // Table columns with enhanced visual design
  const columns = useMemo<ColumnDef<CommentWithRelations>[]>(
    () => [
      {
        id: "content",
        header: ({ column }) => {
          return (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>Comment</span>
            </div>
          );
        },
        cell: ({ row }) => {
          const comment = row.original;
          const contentPreview =
            comment.content.length > 140
              ? comment.content.substring(0, 140) + "…"
              : comment.content;

          return (
            <div className="max-w-lg w-full">
              <p className="text-sm leading-relaxed text-foreground/90 truncate">
                {contentPreview}
              </p>
            </div>
          );
        },
      },
      {
        id: "insights",
        header: ({ column }) => {
          return (
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span>Insights</span>
            </div>
          );
        },
        cell: ({ row }) => {
          const insights = row.original.insights || [];

          if (insights.length === 0) {
            return (
              <span className="text-muted-foreground text-xs">No insights</span>
            );
          }

          // Get primary insight (highest confidence)
          const primaryInsight = insights.reduce((prev, current) =>
            (current.confidence || 0) > (prev.confidence || 0) ? current : prev
          );

          return (
            <div className="space-y-2 w-full">
              <div className="p-2 bg-muted/30 rounded-full">
                <div className="flex items-center justify-between gap-1">
                  <Badge
                    variant={
                      primaryInsight.ai_generated ? "default" : "secondary"
                    }
                    className="text-xs font-medium"
                  >
                    {primaryInsight.ai_generated && (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    {primaryInsight.name}
                  </Badge>
                  {primaryInsight.confidence && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${primaryInsight.confidence * 10}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(primaryInsight.confidence * 10)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {insights.length > 1 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs hover:bg-muted"
                    >
                      <Brain className="h-3 w-3 mr-1" />+{insights.length - 1}{" "}
                      more
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-1">
                      {insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate">{insight.name}</span>
                          {insight.confidence && (
                            <span className="text-muted-foreground">
                              {Math.round(insight.confidence * 10)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
      },
      {
        id: "sentiment",
        header: ({ column }) => {
          return (
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span>Sentiment</span>
            </div>
          );
        },
        cell: ({ row }) => {
          const insights = row.original.insights || [];
          const sentiments = insights
            .filter((i) => i.sentiment_level)
            .map((i) => ({
              level: i.sentiment_level!,
              confidence: i.sentiment_confidence,
              drivers: i.emotional_drivers,
              intensity: i.sentiment_intensity,
            }));

          if (sentiments.length === 0) {
            return (
              <Badge variant="outline" className="text-xs">
                Not analyzed
              </Badge>
            );
          }

          // Get dominant sentiment
          const dominantSentiment = sentiments.reduce((prev, current) =>
            (current.confidence || 0) > (prev.confidence || 0) ? current : prev
          );

          const colors =
            sentimentColors[dominantSentiment.level] || sentimentColors.neutral;
          const maxIntensity = Math.max(
            ...Object.values(sentimentColors).map((s) => Math.abs(s.intensity))
          );
          const intensityPercent =
            (Math.abs(colors.intensity) / maxIntensity) * 100;

          return (
            <div className="space-y-2">
              <div
                className={cn(
                  "p-2 rounded-md",
                  colors.bg,
                  colors.border,
                  "border-l-4"
                )}
              >
                <div className="flex items-center justify-between">
                  <Badge
                    className={cn(
                      "text-xs font-medium",
                      colors.text,
                      "bg-transparent border-none p-0"
                    )}
                  >
                    {dominantSentiment.level}
                  </Badge>
                  <div className="flex items-center gap-2 w-28">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
                      <div
                        className={cn(
                          "h-full transition-all",
                          colors.intensity >= 0
                            ? "bg-destructive"
                            : "bg-chart-2"
                        )}
                        style={{ width: `${intensityPercent}%` }}
                      />
                    </div>
                    {dominantSentiment.confidence && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(dominantSentiment.confidence * 10)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "intention",
        header: ({ column }) => {
          return (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>Intention</span>
            </div>
          );
        },
        cell: ({ row }) => {
          const intention = row.original.intention;

          if (!intention) {
            return (
              <span className="text-muted-foreground text-xs">
                Not detected
              </span>
            );
          }

          const intentionConfig =
            intentionColors[intention.type] || intentionColors.other;
          const Icon = intentionConfig.icon;

          return (
            <div className={cn("p-2 rounded-md", intentionConfig.bgColor)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", intentionConfig.color)} />
                  <Badge
                    variant="outline"
                    className="text-xs border-none bg-transparent"
                  >
                    {intention.primary_intention}
                  </Badge>
                </div>
                {intention.confidence && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${intention.confidence * 10}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(intention.confidence * 10)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "context",
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Context</span>
          </div>
        ),
        cell: ({ row }) => {
          const comment = row.original as any;
          const insights = (comment.insights || []) as any[];
          const businessUnits: string[] = Array.from(
            new Set(
              insights
                .map((i) => i.business_unit)
                .filter((v): v is string => !!v)
            )
          );
          const operationalAreas: string[] = Array.from(
            new Set(
              insights
                .map((i) => i.operational_area)
                .filter((v): v is string => !!v)
            )
          );
          const source: string | undefined = comment.source || undefined;

          const renderBadgeList = (
            icon: React.ReactNode,
            items: string[],
            emptyLabel: string
          ) => {
            if (!items || items.length === 0) {
              return (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {icon}
                  <span>{emptyLabel}</span>
                </div>
              );
            }

            const head = items.slice(0, 2);
            const rest = items.slice(2);

            return (
              <div className="flex items-center gap-2 flex-wrap">
                {icon}
                {head.map((v) => (
                  <Badge key={v} variant="outline" className="text-xs">
                    {v}
                  </Badge>
                ))}
                {rest.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer"
                      >
                        +{rest.length} more
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-1">
                        {items.map((v) => (
                          <div key={v} className="text-xs">
                            {v}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-2 min-w-[260px]">
              <div className="flex items-center gap-3 flex-wrap">
                {renderBadgeList(
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />,
                  businessUnits,
                  "No BU"
                )}
                {renderBadgeList(
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />,
                  operationalAreas,
                  "No area"
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{source || "No source"}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "created_at",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent"
              onClick={() => handleSort("created_at")}
            >
              Date
              <SortDesc
                className={cn(
                  "ml-2 h-4 w-4 transition-transform",
                  filters.sortBy === "created_at" &&
                    filters.sortOrder === "asc" &&
                    "rotate-180"
                )}
              />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return (
            <div className="text-sm">
              <div className="font-medium">{format(date, "MMM d, yyyy")}</div>
              <div className="text-xs text-muted-foreground">
                {format(date, "h:mm a")}
              </div>
              {diffDays <= 7 && (
                <Badge variant="outline" className="text-xs mt-1 scale-90">
                  {diffDays === 0
                    ? "Today"
                    : diffDays === 1
                    ? "Yesterday"
                    : `${diffDays}d ago`}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "view",
        header: () => <span className="sr-only">View</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerComment(row.original);
                    setOpenDrawer(true);
                  }}
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [filters.sortBy, filters.sortOrder, handleSort]
  );

  // Table instance
  const table = useReactTable({
    data: comments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
  });

  // Clear only table-owned filters (keep global bar filters)
  const clearAllFilters = () => {
    filters.setSearchText("");
    filters.setSentimentLevels([]);
    filters.setIntentionType(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!filters.searchText ||
    filters.sentimentLevels.length > 0 ||
    !!filters.intentionType;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <Skeleton className="h-20 w-full max-w-xl" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load comments. Please try refreshing the page.
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Filters Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search with icon */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={filters.searchText}
              onChange={(e) => filters.setSearchText(e.target.value)}
              className="pl-9"
            />
            {filters.searchText && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                onClick={() => filters.setSearchText("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Date range moved to global filter bar */}

          {/* Export button */}
          <Button
            variant="outline"
            onClick={onExport}
            disabled
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Sentiment Multi-select */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sentiment:</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(sentimentColors).map(([sentiment, colors]) => {
                const isActive = filters.sentimentLevels.includes(sentiment);

                return (
                  <Badge
                    key={sentiment}
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      isActive && colors.bg,
                      isActive && colors.text,
                      isActive && colors.border,
                      isActive && "border"
                    )}
                    onClick={() => {
                      if (isActive) {
                        filters.setSentimentLevels(
                          filters.sentimentLevels.filter((s) => s !== sentiment)
                        );
                      } else {
                        filters.setSentimentLevels([
                          ...filters.sentimentLevels,
                          sentiment,
                        ]);
                      }
                    }}
                  >
                    {sentiment}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Source filter moved to global filter bar */}

          {/* Business unit filter moved to global filter bar */}

          {/* Intention Filter */}
          <Select
            value={filters.intentionType || undefined}
            onValueChange={(val) =>
              val === "all"
                ? filters.setIntentionType(undefined)
                : filters.setIntentionType(val)
            }
          >
            <SelectTrigger className="w-[150px] h-7">
              <Target className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All intentions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All intentions</SelectItem>
              {Object.entries(intentionColors).map(([intention, config]) => {
                const Icon = config.icon;
                return (
                  <SelectItem key={intention} value={intention}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-3 w-3", config.color)} />
                      {intention}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {pagination && (
            <>
              Showing <strong>{comments.length}</strong> of{" "}
              <strong>{pagination.total}</strong> comments with complete
              analysis
            </>
          )}
        </div>
        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
          <PanelRightOpen className="h-3.5 w-3.5" />
          <span>Click a row or the icon to view details</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="w-full overflow-x-auto">
          <Table className=" max-h-[500px]  w-[] overflow-auto">
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="max-h-[200px] overflow-auto">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "cursor-pointer transition-colors border-border/60",
                        isEven && "bg-muted/5",
                        "hover:bg-muted/10"
                      )}
                      onClick={() => {
                        setDrawerComment(row.original);
                        setOpenDrawer(true);
                        onCommentSelect?.(row.original.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {hasActiveFilters
                          ? "No comments match your filters"
                          : "No comments with complete analysis found"}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Enhanced Pagination Controls */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={String(filters.limit)}
                onValueChange={(value) => {
                  filters.setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {/* Page numbers with better visual */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-3" />
            </Button>
          </div>
        </div>
      )}

      <CommentDetailsDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        comment={drawerComment}
      />
    </div>
  );
}
