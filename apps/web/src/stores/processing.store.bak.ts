import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import { filter } from "remeda";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "@tanstack/react-router";
export type ProcessingStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

export type ProcessingCommentStatus =
  | "idle"
  | "processing"
  | "completed"
  | "failed";

export interface ProcessingInsight {
  id: number;
  type: "created" | "matched";
}

type InsightMap = Map<number, ProcessingInsight>;

export interface ProcessingComment {
  id: string;
  status: ProcessingCommentStatus;
  insights: InsightMap;
  jobId: string;
}

interface ProcessingState {
  // Processing status
  status: ProcessingStatus;
  currentBatchId: string | null;
  error: string | null;

  // WebSocket connection
  isConnected: boolean;

  // UI State
  selectedCommentId: string | null;

  processingComments: Map<string, ProcessingComment>;
}

interface ProcessingActions {
  enqueueComments: (commentIds: string[]) => void;

  // Processing actions
  startProcessing: (commentIds: string[], jobId: string) => void;
  completeComments: (commentIds: string[]) => void;
  updateCommentStatus: (
    commentId: string,
    status: ProcessingCommentStatus
  ) => void;

  setCommentInsight: (
    commentId: string,
    updated: (current: InsightMap) => InsightMap
  ) => void;
  failComments: (commentIds: string[]) => void;

  // Status actions
  setStatus: (status: ProcessingStatus) => void;
  setError: (error: string | null) => void;
  setCurrentBatch: (batchId: string | null) => void;

  // Connection
  setConnected: (isConnected: boolean) => void;

  // UI actions
  selectComment: (commentId: string | null) => void;

  // Reset
  reset: () => void;
}

export type ProcessingStore = ProcessingState & ProcessingActions;

const initialState: ProcessingState = {
  status: "idle",
  currentBatchId: null,
  error: null,
  isConnected: false,
  selectedCommentId: null,
  processingComments: new Map(),
};

export const useProcessingStore = createWithEqualityFn<ProcessingStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Processing actions
      startProcessing: (commentIds: string[], jobId: string) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);

          commentIds.forEach((id) => {
            const existing = newProcessingComments.get(id);
            if (existing) {
              newProcessingComments.set(id, {
                ...existing,
                status: "processing",
                jobId,
              });
            } else {
              newProcessingComments.set(id, {
                id,
                status: "processing",
                insights: new Map(),
                jobId,
              });
            }
          });

          return {
            status: "processing",
            processingComments: newProcessingComments,
            currentBatchId: jobId,
            error: null,
          };
        });
      },

      enqueueComments: (commentIds: string[]) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);
          commentIds.forEach((id) => {
            newProcessingComments.set(id, {
              id,
              status: "idle",
              insights: new Map(),
              jobId: state.currentBatchId || "",
            });
          });

          return {
            processingComments: newProcessingComments,
          };
        });
      },
      completeComments: (commentIds: string[]) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);

          commentIds.forEach((id) => {
            const comment = newProcessingComments.get(id);
            if (comment) {
              newProcessingComments.set(id, {
                ...comment,
                status: "completed",
              });
            }
          });

          console.log(
            "newProcessingComments",
            commentIds,
            newProcessingComments
          );

          const hasProcessing = Array.from(newProcessingComments.values()).some(
            (comment) => comment.status === "processing"
          );

          return {
            processingComments: newProcessingComments,
            status: hasProcessing ? "processing" : "completed",
          };
        });
      },

      failComments: (commentIds: string[]) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);

          commentIds.forEach((id) => {
            const comment = newProcessingComments.get(id);
            if (comment) {
              newProcessingComments.set(id, {
                ...comment,
                status: "failed",
              });
            }
          });

          const hasProcessing = Array.from(newProcessingComments.values()).some(
            (comment) => comment.status === "processing"
          );

          return {
            processingComments: newProcessingComments,
            status: hasProcessing ? "processing" : "error",
          };
        });
      },

      updateCommentStatus: (
        commentId: string,
        status: ProcessingCommentStatus
      ) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);
          const comment = newProcessingComments.get(commentId);

          if (comment) {
            newProcessingComments.set(commentId, {
              ...comment,
              status,
            });
          }

          return {
            processingComments: newProcessingComments,
          };
        });
      },

      setCommentInsight: (
        commentId: string,
        updated: (current: InsightMap) => InsightMap
      ) => {
        set((state) => {
          const newProcessingComments = new Map(state.processingComments);
          const comment = newProcessingComments.get(commentId);

          if (comment) {
            const newInsights = new Map(comment.insights);
            const updatedInsights = updated(newInsights);

            newProcessingComments.set(commentId, {
              ...comment,
              insights: updatedInsights,
            });
          }

          return {
            processingComments: newProcessingComments,
          };
        });
      },

      // Status actions
      setStatus: (status: ProcessingStatus) => {
        set({ status });
      },

      setError: (error: string | null) => {
        set({ error, status: error ? "error" : "idle" });
      },

      setCurrentBatch: (batchId: string | null) => {
        set({ currentBatchId: batchId });
      },

      // Connection
      setConnected: (isConnected: boolean) => {
        set({ isConnected });
      },

      // UI actions
      selectComment: (commentId: string | null) => {
        set({ selectedCommentId: commentId });
      },

      // Reset
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "processing-store",
    }
  ),
  shallow
);

export const selectProcessingProgress = (state: ProcessingStore) => {
  const total = state.processingComments.size;
  const completed = filter(
    [...state.processingComments.values()],
    (c) => c.status === "completed"
  ).length;
  return total > 0 ? (completed / total) * 100 : 0;
};

export const useProcessingStats = () => {
  const store = useProcessingStore();
  const progress = selectProcessingProgress(store);
  const stats = {
    total: store.processingComments.size,
    completed: filter(
      [...store.processingComments.values()],
      (c) => c.status === "completed"
    ).length,
    failed: filter(
      [...store.processingComments.values()],
      (c) => c.status === "failed"
    ).length,
    insights: filter(
      [...store.processingComments.values()],
      (c) => c.status === "completed"
    ).reduce((acc, c) => acc + c.insights.size, 0),
  };

  return { progress, stats };
};

// Selector for getting a specific comment with deep equality check
export const useProcessingComment = (commentId: string) => {
  return useProcessingStore((state) => {
    const comment = state.processingComments.get(commentId);
    if (!comment) return null;

    // Return a serializable version for proper change detection
    return {
      ...comment,
      insightsArray: Array.from(comment.insights.entries()),
      insightsCount: comment.insights.size,
    };
  });
};

// Selector for getting all comment IDs (for iteration)
export const useProcessingCommentIds = () => {
  return useProcessingStore((state) =>
    Array.from(state.processingComments.keys())
  );
};

// Selector for getting all comments - simplified to avoid re-creation
export const useProcessingComments = () => {
  return useProcessingStore((state) => state.processingComments);
};

// Selector for getting comments by jobId
export const useProcessingCommentsByJob = (jobId: string) => {
  return useProcessingStore((state) => {
    const filtered: string[] = [];
    state.processingComments.forEach((comment) => {
      if (comment.jobId === jobId) {
        filtered.push(comment.id);
      }
    });
    return filtered;
  });
};
