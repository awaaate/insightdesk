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
  Filter,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SharedTypes } from "types/shared";
import { useQuery } from "@tanstack/react-query";

// Types for comment data with relations
type CommentWithRelations = SharedTypes.Domain.Comment.WithFullRelations;

// Sentiment color mapping
const sentimentColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  // Negative sentiments
  doubt: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  concern: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  annoyance: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  frustration: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  anger: { bg: "bg-red-200", text: "text-red-800", border: "border-red-400" },
  outrage: { bg: "bg-red-300", text: "text-red-900", border: "border-red-500" },
  contempt: {
    bg: "bg-purple-200",
    text: "text-purple-800",
    border: "border-purple-400",
  },
  fury: { bg: "bg-red-400", text: "text-white", border: "border-red-600" },
  // Neutral
  neutral: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  // Positive sentiments
  satisfaction: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  gratitude: {
    bg: "bg-emerald-200",
    text: "text-emerald-800",
    border: "border-emerald-400",
  },
};

// Intention type colors
const intentionColors: Record<string, { icon: any; color: string }> = {
  resolve: { icon: Target, color: "text-blue-600" },
  complain: { icon: AlertCircle, color: "text-red-600" },
  compare: { icon: TrendingUp, color: "text-purple-600" },
  cancel: { icon: X, color: "text-gray-600" },
  inquire: { icon: Search, color: "text-cyan-600" },
  praise: { icon: Heart, color: "text-green-600" },
  suggest: { icon: Sparkles, color: "text-amber-600" },
  other: { icon: MessageSquare, color: "text-gray-500" },
};

interface CommentsTableProps {
  onCommentSelect?: (commentId: string) => void;
}

export function CommentsTable({ onCommentSelect }: CommentsTableProps) {
  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [includeRelations, setIncludeRelations] = useState(true);

  // Filters
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
  const [hasInsightsFilter, setHasInsightsFilter] = useState<
    boolean | undefined
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
        startDate: dateRange.from,
        endDate: dateRange.to,
        sentimentLevels:
          selectedSentiments.length > 0 ? selectedSentiments : undefined,
        intentionType: selectedIntention,
        hasInsights: hasInsightsFilter,
      },
      includeRelations,
      sortBy,
      sortOrder,
    }),
    [
      currentPage,
      pageSize,
      dateRange,
      selectedSentiments,
      selectedIntention,
      hasInsightsFilter,
      includeRelations,
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
  } = useQuery(trpc.comments.list.queryOptions(queryInput));

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    dateRange,
    selectedSentiments,
    selectedIntention,
    hasInsightsFilter,
  ]);

  // Extract data from response
  const comments = response?.comments || [];
  const pagination = response?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  // Toggle row expansion
  const toggleRowExpansion = (commentId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Table columns
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
            <div className="max-w-2xl">
              <div
                className={cn(
                  "text-sm cursor-pointer hover:text-foreground transition-colors",
                  !isExpanded && "line-clamp-2"
                )}
                onClick={() => toggleRowExpansion(comment.id)}
              >
                {isExpanded ? comment.content : contentPreview}
              </div>
              {comment.content.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => toggleRowExpansion(comment.id)}
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

          return (
            <div className="space-y-1.5 max-w-sm">
              {insights.slice(0, 2).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {insight.name}
                  </Badge>
                  {insight.confidence && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(insight.confidence * 10)}%
                    </span>
                  )}
                </div>
              ))}
              {insights.length > 2 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                    >
                      +{insights.length - 2} more
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <div className="font-semibold text-sm">All Insights</div>
                      {insights.map((insight, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {insight.name}
                            </span>
                            {insight.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(insight.confidence * 10)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.reasoning}
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
              level: i.sentiment_level,
              confidence: i.sentiment_confidence,
              drivers: i.emotional_drivers,
            }));

          if (sentiments.length === 0) {
            return (
              <Badge variant="outline" className="text-xs">
                Not analyzed
              </Badge>
            );
          }

          // Get dominant sentiment (highest confidence)
          const dominantSentiment = sentiments.reduce((prev, current) =>
            (current.confidence || 0) > (prev.confidence || 0) ? current : prev
          );

          const colors =
            sentimentColors[dominantSentiment.level!] ||
            sentimentColors.neutral;

          return (
            <div className="space-y-1">
              <Badge
                className={cn(
                  "text-xs font-medium",
                  colors.bg,
                  colors.text,
                  colors.border,
                  "border"
                )}
              >
                {dominantSentiment.level}
              </Badge>
              {dominantSentiment.confidence && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${dominantSentiment.confidence * 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(dominantSentiment.confidence * 10)}%
                  </span>
                </div>
              )}
              {dominantSentiment.drivers &&
                dominantSentiment.drivers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dominantSentiment.drivers
                      .slice(0, 2)
                      .map((driver, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-muted-foreground"
                        >
                          {driver}
                        </span>
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
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", intentionConfig.color)} />
                <Badge variant="outline" className="text-xs">
                  {intention.primary_intention}
                </Badge>
              </div>
              {intention.confidence && (
                <span className="text-xs text-muted-foreground">
                  Confidence: {Math.round(intention.confidence * 10)}%
                </span>
              )}
              {intention.secondary_intentions &&
                intention.secondary_intentions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {intention.secondary_intentions.map((sec, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs scale-90"
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
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              onClick={() => {
                if (sortBy === "created_at") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("created_at");
                  setSortOrder("desc");
                }
              }}
            >
              Date
              <ArrowUpDown
                className={cn(
                  "ml-2 h-4 w-4",
                  sortBy === "created_at" && sortOrder === "asc" && "rotate-180"
                )}
              />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          return (
            <div className="text-sm">
              <div className="font-medium">{format(date, "MMM d, yyyy")}</div>
              <div className="text-xs text-muted-foreground">
                {format(date, "h:mm a")}
              </div>
            </div>
          );
        },
      },
    ],
    [expandedRows, sortBy, sortOrder]
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
    setHasInsightsFilter(undefined);
  };

  const hasActiveFilters =
    searchInput ||
    dateRange.from ||
    dateRange.to ||
    selectedSentiments.length > 0 ||
    selectedIntention ||
    hasInsightsFilter !== undefined;

  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load comments. Please try refreshing the page.
        </p>
      </div>
    );
  }

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
                <Skeleton className="h-12 w-full max-w-xl" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
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

          {/* Date Range */}
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

          {/* Quick Filters */}
          <div className="flex gap-2">
            <Select
              value={hasInsightsFilter?.toString()}
              onValueChange={(v) =>
                setHasInsightsFilter(
                  v === "true" ? true : v === "false" ? false : undefined
                )
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Insights filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All comments</SelectItem>
                <SelectItem value="true">With insights</SelectItem>
                <SelectItem value="false">No insights</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={clearAllFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Sentiment Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sentiment:</span>
            <div className="flex flex-wrap gap-1">
              {Object.keys(sentimentColors).map((sentiment) => {
                const isActive = selectedSentiments.includes(sentiment);
                const colors = sentimentColors[sentiment];

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

          {/* Intention Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Intention:</span>
            <Select
              value={selectedIntention}
              onValueChange={setSelectedIntention}
            >
              <SelectTrigger className="w-[150px] h-7">
                <SelectValue placeholder="All intentions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All intentions</SelectItem>
                {Object.keys(intentionColors).map((intention) => {
                  const Icon = intentionColors[intention].icon;
                  return (
                    <SelectItem key={intention} value={intention}>
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "h-3 w-3",
                            intentionColors[intention].color
                          )}
                        />
                        {intention}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{comments.length}</strong> of{" "}
          <strong>{pagination?.total || 0}</strong> comments
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            Include relations:
          </label>
          <Button
            variant={includeRelations ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeRelations(!includeRelations)}
          >
            {includeRelations ? "On" : "Off"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onCommentSelect?.(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
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
                          : "No comments found"}
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

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {pagination.total} total results
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
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

            {/* Page navigation */}
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
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page numbers */}
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
                className="h-8"
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
        </div>
      )}
    </div>
  );
}
