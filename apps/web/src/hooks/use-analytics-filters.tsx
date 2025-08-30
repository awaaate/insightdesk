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
  
  // Actions
  setTimeRange: (timeRange: TimeRange) => void;
  setBusinessUnit: (businessUnit: string[]) => void;
  setOperationalArea: (operationalArea: string[]) => void;
  setSource: (source: string[]) => void;
  setMinComments: (minComments: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
}

const defaultFilters: Omit<AnalyticsFilters, 
  | "setTimeRange" 
  | "setBusinessUnit" 
  | "setOperationalArea" 
  | "setSource" 
  | "setMinComments" 
  | "setLimit" 
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
  limit: 20,
};

export const useAnalyticsFilters = create<AnalyticsFilters>((set) => ({
  ...defaultFilters,
  
  setTimeRange: (timeRange) => set({ timeRange }),
  setBusinessUnit: (businessUnit) => set({ businessUnit }),
  setOperationalArea: (operationalArea) => set({ operationalArea }),
  setSource: (source) => set({ source }),
  setMinComments: (minComments) => set({ minComments }),
  setLimit: (limit) => set({ limit }),
  resetFilters: () => set(defaultFilters),
}));