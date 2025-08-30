import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, X, RefreshCw, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters";
import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsFilterBarProps {
  className?: string;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  className,
}) => {
  const {
    timeRange,
    businessUnit,
    operationalArea,
    source,
    setTimeRange,
    setBusinessUnit,
    setOperationalArea,
    setSource,
    resetFilters,
  } = useAnalyticsFilters();

  const [dateOpen, setDateOpen] = useState(false);
  const [businessUnitOpen, setBusinessUnitOpen] = useState(false);
  const [operationalAreaOpen, setOperationalAreaOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  // Fetch filter options from database
  const { data: filterOptions, isLoading } = useQuery(
    trpc.analytics.getFilterOptions.queryOptions()
  );

  const availableBusinessUnits = filterOptions?.businessUnits || [];
  const availableOperationalAreas = filterOptions?.operationalAreas || [];
  const availableSources = filterOptions?.sources || [];

  const hasActiveFilters = 
    businessUnit.length > 0 || 
    operationalArea.length > 0 || 
    source.length > 0;

  const toggleBusinessUnit = (unit: string) => {
    if (businessUnit.includes(unit)) {
      setBusinessUnit(businessUnit.filter((u) => u !== unit));
    } else {
      setBusinessUnit([...businessUnit, unit]);
    }
  };

  const toggleOperationalArea = (area: string) => {
    if (operationalArea.includes(area)) {
      setOperationalArea(operationalArea.filter((a) => a !== area));
    } else {
      setOperationalArea([...operationalArea, area]);
    }
  };

  const toggleSource = (src: string) => {
    if (source.includes(src)) {
      setSource(source.filter((s) => s !== src));
    } else {
      setSource([...source, src]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Filter className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {businessUnit.length + operationalArea.length + source.length} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Date Range Filter */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal h-8",
                !timeRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {timeRange ? (
                <>
                  {format(timeRange.start, "MMM d")} -{" "}
                  {format(timeRange.end, "MMM d, yyyy")}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: timeRange.start,
                to: timeRange.end,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setTimeRange({
                    start: range.from,
                    end: range.to,
                    granularity: timeRange.granularity,
                  });
                  setDateOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Business Unit Filter */}
        <Popover open={businessUnitOpen} onOpenChange={setBusinessUnitOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isLoading || availableBusinessUnits.length === 0}
            >
              Business Unit
              {businessUnit.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {businessUnit.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search business units..." />
              {availableBusinessUnits.length === 0 ? (
                <CommandEmpty>No business units available.</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>No business unit found.</CommandEmpty>
                  <CommandGroup>
                    {availableBusinessUnits.map((unit) => (
                      <CommandItem
                        key={unit}
                        onSelect={() => toggleBusinessUnit(unit)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            businessUnit.includes(unit) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {unit}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {/* Operational Area Filter */}
        <Popover open={operationalAreaOpen} onOpenChange={setOperationalAreaOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isLoading || availableOperationalAreas.length === 0}
            >
              Operational Area
              {operationalArea.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {operationalArea.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search areas..." />
              {availableOperationalAreas.length === 0 ? (
                <CommandEmpty>No operational areas available.</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>No area found.</CommandEmpty>
                  <CommandGroup>
                    {availableOperationalAreas.map((area) => (
                      <CommandItem
                        key={area}
                        onSelect={() => toggleOperationalArea(area)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            operationalArea.includes(area) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {area}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {/* Source Filter */}
        <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isLoading || availableSources.length === 0}
            >
              Source
              {source.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {source.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search sources..." />
              {availableSources.length === 0 ? (
                <CommandEmpty>No sources available.</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>No source found.</CommandEmpty>
                  <CommandGroup>
                    {availableSources.map((src) => (
                      <CommandItem
                        key={src}
                        onSelect={() => toggleSource(src)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            source.includes(src) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {src}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {/* Granularity Selector */}
        <Select
          value={timeRange.granularity}
          onValueChange={(value) =>
            setTimeRange({
              ...timeRange,
              granularity: value as "hour" | "day" | "week" | "month",
            })
          }
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Hourly</SelectItem>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading Skeleton for Filters */}
      {isLoading && (
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}

      {/* No Data Message */}
      {!isLoading && 
       availableBusinessUnits.length === 0 && 
       availableOperationalAreas.length === 0 && 
       availableSources.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          No filter data available. Start by adding some data to your insights.
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !isLoading && (
        <div className="flex flex-wrap gap-1">
          {businessUnit.map((unit) => (
            <Badge
              key={unit}
              variant="secondary"
              className="text-xs h-6 px-2"
            >
              BU: {unit}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleBusinessUnit(unit)}
              />
            </Badge>
          ))}
          {operationalArea.map((area) => (
            <Badge
              key={area}
              variant="secondary"
              className="text-xs h-6 px-2"
            >
              Area: {area}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleOperationalArea(area)}
              />
            </Badge>
          ))}
          {source.map((src) => (
            <Badge
              key={src}
              variant="secondary"
              className="text-xs h-6 px-2"
            >
              Source: {src}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleSource(src)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};