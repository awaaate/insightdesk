import { useMemo, useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  FileText,
  Search,
  ArrowUpDown,
  Shield,
  Building2,
  Activity,
  Zap,
  Car,
  Newspaper,
  Filter,
  SortDesc,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutput } from "@/utils/trpc";

// Get category colors map
const categoryColors = constructCategoryColors(
  Config.constants.sourcesGroup.map((c) => c.name),
  AvailableChartColors
);

// Helper function to get category icon
const getCategoryIcon = (categoryName: string) => {
  const icons: Record<string, any> = {
    "Ford Official": Shield,
    Reference: Globe,
    "General Media": Newspaper,
    Automotive: Car,
    "Electric Mobility": Zap,
    Competitors: Building2,
    Other: Activity,
  };
  return icons[categoryName] || Globe;
};

// Helper function to get favicon
const getFavicon = (url: string | null) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

// Helper function to get domain from URL
const getDomainFromUrl = (url: string | null) => {
  if (!url) return "Unknown";
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

// Helper function to format URL for display
const formatUrlForDisplay = (url: string | null, maxLength: number = 50) => {
  if (!url) return "—";
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
};

interface SourceData {
  source_url: string | null;
  website_domain: string | null;
  total_responses: number;
  category: string;
}

interface SourcesTableProps {
  onExport?: () => void;
}

export function SourcesTable({ onExport }: SourcesTableProps) {
  // Local state for immediate UI updates
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<"all" | "owned" | "earned">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<
    "total_responses" | "website_domain" | "source_url" | "category"
  >("total_responses");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search input to avoid too many API calls
  const debouncedSearch = useDebounce(searchInput, 500);

  // Build query input
  const queryInput = useMemo(
    () => ({
      pagination: {
        page: currentPage,
        pageSize,
      },
      sorting: {
        field: sortField,
        order: sortOrder,
      },
      filters: {
        search: debouncedSearch || undefined,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        sourceType,
      },
    }),
    [
      currentPage,
      pageSize,
      sortField,
      sortOrder,
      debouncedSearch,
      selectedCategories,
      sourceType,
    ]
  );

  // Fetch data with the query parameters
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.sources.get.queryOptions(queryInput));

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, sourceType]);

  // Extract data from response
  const sourcesData = response?.data || [];
  const pagination = response?.pagination;
  const availableCategories = response?.filters?.availableCategories || [];

  const columns = useMemo<ColumnDef<SourceData>[]>(
    () => [
      {
        accessorKey: "website_domain",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSort("website_domain")}
              className="-ml-4 h-auto p-2 hover:bg-transparent"
            >
              Domain
              {sortField === "website_domain" && (
                <ArrowUpDown
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform",
                    sortOrder === "asc" && "rotate-180"
                  )}
                />
              )}
              {sortField !== "website_domain" && (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const domain = row.getValue("website_domain") as string | null;
          const sourceUrl = row.original.source_url;
          const favicon = getFavicon(sourceUrl);
          const isOwned = Config.constants.sourcesGroup
            .find((c) => c.type === "owned")
            ?.patterns.some((p) => domain?.includes(p));

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                {favicon && <AvatarImage src={favicon} alt={domain || ""} />}
                <AvatarFallback className="text-xs">
                  <Globe className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{domain || "Unknown"}</span>
                {isOwned && (
                  <Badge variant="brand" className="text-xs w-fit mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Owned
                  </Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSort("category")}
              className="-ml-4 h-auto p-2 hover:bg-transparent"
            >
              Category
              {sortField === "category" && (
                <ArrowUpDown
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform",
                    sortOrder === "asc" && "rotate-180"
                  )}
                />
              )}
              {sortField !== "category" && (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const category = row.getValue("category") as string;
          if (!category || category === "other") {
            return (
              <Badge variant="outline" className="font-normal">
                Other
              </Badge>
            );
          }

          const CategoryIcon = getCategoryIcon(category);
          const color = categoryColors.get(category) || "gray";

          return (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-1 rounded-full",
                  getColorClassName(color, "bg")
                )}
              />
              <Badge
                variant="secondary"
                className={cn(
                  "font-normal gap-1",
                  getColorClassName(color, "text")
                )}
              >
                <CategoryIcon className="h-3 w-3" />
                {category}
              </Badge>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "total_responses",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSort("total_responses")}
              className="-ml-4 h-auto p-2 hover:bg-transparent"
            >
              Mentions
              {sortField === "total_responses" && (
                <SortDesc
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform",
                    sortOrder === "asc" && "rotate-180"
                  )}
                />
              )}
              {sortField !== "total_responses" && (
                <SortDesc className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const count = row.getValue("total_responses") as number;
          const maxCount = sourcesData?.[0]?.total_responses || 1;
          const percentage = (count / maxCount) * 100;

          return (
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-[100px]">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="font-semibold tabular-nums text-sm">
                {count.toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "source_url",
        header: "Source URL",
        cell: ({ row }) => {
          const url = row.getValue("source_url") as string | null;
          if (!url) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <div className="flex items-center gap-2 max-w-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary truncate inline-block max-w-[400px]"
                  >
                    {formatUrlForDisplay(url, 60)}
                  </a>
                </TooltipTrigger>
                <TooltipContent className="max-w-lg">
                  <p className="text-xs break-all">{url}</p>
                </TooltipContent>
              </Tooltip>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
          );
        },
      },
    ],
    []
  );

  // Handle column sorting
  const handleSort = useCallback(
    (field: typeof sortField) => {
      if (field === sortField) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("desc");
      }
      setCurrentPage(1);
    },
    [sortField]
  );

  // Table configuration (simplified since pagination is server-side)
  const table = useReactTable({
    data: sourcesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination?.totalPages || 0,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  // Handle error state
  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load sources. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Handle loading state
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
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get unique categories for filter from available categories
  const uniqueCategories = availableCategories.filter((c) => c !== "other");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sources, domains..."
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
              ✕
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Source Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              {(["all", "owned", "earned"] as const).map((type) => (
                <Badge
                  key={type}
                  variant={sourceType === type ? "default" : "outline"}
                  className="cursor-pointer transition-all capitalize"
                  onClick={() => setSourceType(type)}
                >
                  {type === "owned" && <Shield className="h-3 w-3 mr-1" />}
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Categories:</span>
            {uniqueCategories.map((category) => {
              const isActive = selectedCategories.includes(category);
              const CategoryIcon = getCategoryIcon(category);
              const color = categoryColors.get(category) || "gray";

              return (
                <Badge
                  key={category}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    isActive && getColorClassName(color, "bg"),
                    isActive && "text-white border-transparent"
                  )}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategories((prev) =>
                        prev.filter((c) => c !== category)
                      );
                    } else {
                      setSelectedCategories((prev) => [...prev, category]);
                    }
                  }}
                >
                  <CategoryIcon className="h-3 w-3" />
                  {category}
                </Badge>
              );
            })}
            {selectedCategories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategories([])}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground ml-auto">
            {pagination && (
              <>
                <strong>{sourcesData.length}</strong> of{" "}
                <strong>{pagination.totalCount}</strong> total
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
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
                const isOwned = Config.constants.sourcesGroup
                  .find((c) => c.type === "owned")
                  ?.patterns.some((p) =>
                    row.original.website_domain?.includes(p)
                  );

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      isOwned && "bg-primary/5 hover:bg-primary/10"
                    )}
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
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Globe className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchInput ||
                      selectedCategories.length > 0 ||
                      sourceType !== "all"
                        ? "No sources match your filters"
                        : "No sources found"}
                    </p>
                    {(searchInput ||
                      selectedCategories.length > 0 ||
                      sourceType !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchInput("");
                          setSelectedCategories([]);
                          setSourceType("all");
                        }}
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

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {pagination.totalCount} total results
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
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
                disabled={!pagination.hasPreviousPage}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(pagination.totalPages, prev + 1)
                  )
                }
                disabled={!pagination.hasNextPage}
                className="h-8"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages}
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
