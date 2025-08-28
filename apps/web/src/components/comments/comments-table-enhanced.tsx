import { useMemo, useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Calendar as CalendarIcon,
  MessageSquare,
  Brain,
  Target,
  Heart,
  AlertCircle,
  TrendingUp,
  X,
  ChevronDown,
  Sparkles,
  Download,
  Building2,
  MapPin,
  SortDesc,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  // State management
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Enhanced Filters
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [selectedIntention, setSelectedIntention] = useState<
    string | undefined
  >();
  const [selectedSource, setSelectedSource] = useState<string | undefined>();
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<
    string | undefined
  >();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 500);

  // Build query input
  const queryInput = useMemo(
    () => ({
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      filter: {
        searchText: debouncedSearch || undefined,
        startDate: dateRange.from,
        endDate: dateRange.to,
        sentimentLevels:
          selectedSentiments.length > 0 ? selectedSentiments : undefined,
        intentionType: selectedIntention,
        source: selectedSource,
        businessUnit: selectedBusinessUnit,
      },
      sortBy,
      sortOrder,
    }),
    [
      currentPage,
      pageSize,
      debouncedSearch,
      dateRange,
      selectedSentiments,
      selectedIntention,
      selectedSource,
      selectedBusinessUnit,
      sortBy,
      sortOrder,
    ]
  );

  // Fetch data
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.comments.listWithRelations.queryOptions(queryInput));

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    dateRange,
    selectedSentiments,
    selectedIntention,
    selectedSource,
    selectedBusinessUnit,
  ]);

  // Extract data from response
  const comments = response?.comments || [];
  const pagination = response?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  // Toggle row expansion
  const toggleRowExpansion = useCallback((commentId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // Handle column sorting
  const handleSort = useCallback(
    (field: typeof sortBy) => {
      if (field === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("desc");
      }
      setCurrentPage(1);
    },
    [sortBy]
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
          const isExpanded = expandedRows.has(comment.id);
          const contentPreview =
            comment.content.length > 150
              ? comment.content.substring(0, 150) + "..."
              : comment.content;

          return (
            <div className="max-w-2xl space-y-2">
              <div
                className={cn(
                  "text-sm leading-relaxed cursor-pointer transition-colors text-ellipsis max-w-full whitespace-pre-wrap break-words",
                  "text-foreground/90 hover:text-foreground",
                  !isExpanded && "line-clamp-1"
                )}
                onClick={() => toggleRowExpansion(comment.id)}
              >
                <p className="text-sm leading-relaxed cursor-pointer transition-colors text-ellipsis max-w-full w-full whitespace-pre-wrap break-words">
                  {isExpanded ? comment.content : contentPreview}
                </p>
              </div>

              {/* Source and Business Unit badges */}
              <div className="flex items-center gap-2">
                {comment.source && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <MapPin className="h-3 w-3" />
                    {comment.source}
                  </Badge>
                )}
                {comment.insights?.[0]?.business_unit && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Building2 className="h-3 w-3" />
                    {comment.insights[0].business_unit}
                  </Badge>
                )}
              </div>

              {comment.content.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(comment.id);
                  }}
                >
                  {isExpanded ? "Show less" : "Show more"}
                  <ChevronDown
                    className={cn(
                      "ml-1 h-3 w-3 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </Button>
              )}
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
            <div className="space-y-2 max-w-full">
              {/* Primary insight */}
              <div className="p-2 rounded-md bg-muted/30 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge
                      variant={
                        primaryInsight.ai_generated ? "default" : "secondary"
                      }
                      className="text-xs font-medium mb-1"
                    >
                      {primaryInsight.ai_generated && (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      {primaryInsight.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {primaryInsight.description}
                    </p>
                  </div>
                  {primaryInsight.confidence && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium">
                        {Math.round(primaryInsight.confidence * 10)}%
                      </span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${primaryInsight.confidence * 10}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional insights */}
              {insights.length > 1 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs hover:bg-muted"
                    >
                      <Brain className="h-3 w-3 mr-1" />+{insights.length - 1}{" "}
                      more insight{insights.length > 2 ? "s" : ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        All Insights ({insights.length})
                      </div>
                      {insights.map((insight, idx) => (
                        <div key={idx} className="p-2 rounded border bg-card">
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant={
                                insight.ai_generated ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {insight.name}
                            </Badge>
                            {insight.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(insight.confidence * 10)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {insight.description}
                          </p>
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
              {/* Sentiment badge */}
              <div
                className={cn(
                  "p-2 rounded-md",
                  colors.bg,
                  colors.border,
                  "border-l-4"
                )}
              >
                <Badge
                  className={cn(
                    "text-xs font-medium mb-1",
                    colors.text,
                    "bg-transparent border-none p-0"
                  )}
                >
                  {dominantSentiment.level}
                </Badge>

                {/* Intensity bar */}
                <div className="flex items-center gap-1 w-full">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
                    <div
                      className={cn(
                        "h-full transition-all",
                        colors.intensity >= 0 ? "bg-destructive" : "bg-chart-2"
                      )}
                      style={{ width: `${intensityPercent}%` }}
                    />
                  </div>
                  {dominantSentiment.confidence && (
                    <span className="text-xs mt-1 block text-muted-foreground">
                      {Math.round(dominantSentiment.confidence * 10)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Emotional drivers */}
              {dominantSentiment.drivers &&
                dominantSentiment.drivers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dominantSentiment.drivers
                      .slice(0, 2)
                      .map((driver, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs scale-90"
                        >
                          {driver}
                        </Badge>
                      ))}
                  </div>
                )}
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
            <div
              className={cn(
                "p-2 rounded-md space-y-2",
                intentionConfig.bgColor
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", intentionConfig.color)} />
                <Badge
                  variant="outline"
                  className="text-xs border-none bg-transparent"
                >
                  {intention.primary_intention}
                </Badge>
              </div>

              {/* Confidence meter */}
              {intention.confidence && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
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

              {/* Secondary intentions */}
              {intention.secondary_intentions &&
                intention.secondary_intentions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {intention.secondary_intentions
                      .slice(0, 2)
                      .map((sec, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs scale-90 bg-white/30"
                        >
                          {sec}
                        </Badge>
                      ))}
                  </div>
                )}
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
                  sortBy === "created_at" && sortOrder === "asc" && "rotate-180"
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
    ],
    [expandedRows, sortBy, sortOrder, handleSort, toggleRowExpansion]
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchInput("");
    setDateRange({ from: undefined, to: undefined });
    setSelectedSentiments([]);
    setSelectedIntention(undefined);
    setSelectedSource(undefined);
    setSelectedBusinessUnit(undefined);
  };

  const hasActiveFilters =
    searchInput ||
    dateRange.from ||
    dateRange.to ||
    selectedSentiments.length > 0 ||
    selectedIntention ||
    selectedSource ||
    selectedBusinessUnit;

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                onClick={() => setSearchInput("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} -{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span className="text-muted-foreground">
                    Pick a date range
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      })
                    }
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date(),
                      })
                    }
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range: any) =>
                  setDateRange(range || { from: undefined, to: undefined })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

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
                const isActive = selectedSentiments.includes(sentiment);

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
                        setSelectedSentiments((prev) =>
                          prev.filter((s) => s !== sentiment)
                        );
                      } else {
                        setSelectedSentiments((prev) => [...prev, sentiment]);
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

          {/* Source Filter */}
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-[140px] h-7">
              <MapPin className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="web">NPS</SelectItem>
              <SelectItem value="social">App Store</SelectItem>
              <SelectItem value="review">Scouting</SelectItem>
              <SelectItem value="nps-relacional">NPS-relacional</SelectItem>
            </SelectContent>
          </Select>

          {/* Business Unit Filter */}
          <Select
            value={selectedBusinessUnit}
            onValueChange={setSelectedBusinessUnit}
          >
            <SelectTrigger className="w-[160px] h-7">
              <Building2 className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              <SelectItem value="bu_teens_kids">BU Teens & Kids</SelectItem>
              <SelectItem value="bu_core_banking">BU Core Banking</SelectItem>
              <SelectItem value="sin_equipo">Sin equipo</SelectItem>
              <SelectItem value="bu_pasivos_activos_digitales">
                BU Pasivos y activos digitales
              </SelectItem>
              <SelectItem value="bu_engagement">BU Engagement</SelectItem>
              <SelectItem value="ux_ui">UX/UI</SelectItem>
              <SelectItem value="bu_growth">BU Growth</SelectItem>
              <SelectItem value="bu_activos_seguros">
                BU Activos y seguros
              </SelectItem>
              <SelectItem value="bu_payments">BU Payments</SelectItem>
              <SelectItem value="null">null</SelectItem>
              <SelectItem value="customer_centricity">
                Customer Centricity
              </SelectItem>
              <SelectItem value="caixabank_tech">CaixaBank Tech</SelectItem>
              <SelectItem value="caixabank">CaixaBank</SelectItem>
            </SelectContent>
          </Select>

          {/* Intention Filter */}
          <Select
            value={selectedIntention}
            onValueChange={setSelectedIntention}
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
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isEven && "bg-muted/5",
                        "hover:bg-muted/10"
                      )}
                      onClick={() => onCommentSelect?.(row.original.id)}
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
        </ScrollArea>
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
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
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
    </div>
  );
}
