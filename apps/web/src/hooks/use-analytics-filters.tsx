import { create } from "zustand";
import { subDays } from "date-fns";

interface TimeRange {
  start: Date;
  end: Date;
  granularity: "hour" | "day" | "week" | "month";
}

interface AnalyticsFilters {
  timeRange: TimeRange;
  businessUnit: string[];
  operationalArea: string[];
  source: string[];
  minComments: number;
  limit: number;

  // Comment-specific filters
  searchText: string;
  sentimentLevels: string[];
  intentionType: string | undefined;
  insightId: number | undefined;
  insightIds: number[];
  minConfidence: number | undefined;
  sortBy: "created_at" | "updated_at" | "sentiment_intensity" | "confidence";
  sortOrder: "asc" | "desc";

  // Actions
  setTimeRange: (timeRange: TimeRange) => void;
  setBusinessUnit: (businessUnit: string[]) => void;
  setOperationalArea: (operationalArea: string[]) => void;
  setSource: (source: string[]) => void;
  setMinComments: (minComments: number) => void;
  setLimit: (limit: number) => void;

  // Comment-specific actions
  setSearchText: (searchText: string) => void;
  setSentimentLevels: (sentimentLevels: string[]) => void;
  setIntentionType: (intentionType: string | undefined) => void;
  setInsightId: (insightId: number | undefined) => void;
  setInsightIds: (insightIds: number[]) => void;
  setMinConfidence: (minConfidence: number | undefined) => void;
  setSortBy: (
    sortBy: "created_at" | "updated_at" | "sentiment_intensity" | "confidence"
  ) => void;
  setSortOrder: (sortOrder: "asc" | "desc") => void;

  resetFilters: () => void;
}

const defaultFilters: Omit<
  AnalyticsFilters,
  | "setTimeRange"
  | "setBusinessUnit"
  | "setOperationalArea"
  | "setSource"
  | "setMinComments"
  | "setLimit"
  | "setSearchText"
  | "setSentimentLevels"
  | "setIntentionType"
  | "setInsightId"
  | "setInsightIds"
  | "setMinConfidence"
  | "setSortBy"
  | "setSortOrder"
  | "resetFilters"
> = {
  timeRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
    granularity: "day",
  },
  businessUnit: [],
  operationalArea: [],
  source: [],
  minComments: 5,
  limit: 5,
  searchText: "",
  sentimentLevels: [],
  intentionType: undefined,
  insightId: undefined,
  insightIds: [],
  minConfidence: undefined,
  sortBy: "created_at",
  sortOrder: "desc",
};

export const useAnalyticsFilters = create<AnalyticsFilters>((set) => ({
  ...defaultFilters,

  setTimeRange: (timeRange) => set({ timeRange }),
  setBusinessUnit: (businessUnit) => set({ businessUnit }),
  setOperationalArea: (operationalArea) => set({ operationalArea }),
  setSource: (source) => set({ source }),
  setMinComments: (minComments) => set({ minComments }),
  setLimit: (limit) => set({ limit }),

  setSearchText: (searchText) => set({ searchText }),
  setSentimentLevels: (sentimentLevels) => set({ sentimentLevels }),
  setIntentionType: (intentionType) => set({ intentionType }),
  setInsightId: (insightId) => set({ insightId }),
  setInsightIds: (insightIds) => set({ insightIds }),
  setMinConfidence: (minConfidence) => set({ minConfidence }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),

  resetFilters: () => set(defaultFilters),
}));
