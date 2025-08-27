import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "@tanstack/react-router";
import { sortBy } from "remeda";
// Types
export type ProcessingStatus = "idle" | "processing" | "completed" | "error";
export type CommentStatus = "idle" | "processing" | "completed" | "failed";

interface ProcessingComment {
  id: string;
  status: CommentStatus;
  jobId: string;
  insightIds: number[];
}

interface ProcessingInsight {
  id: number;
  type: "created" | "matched";
  commentId: string;
}

// State shape - normalized and flat
interface ProcessingState {
  // Global status
  status: ProcessingStatus;
  currentJobId: string | null;
  isConnected: boolean;
  error: string | null;

  // Normalized entities
  comments: Record<string, ProcessingComment>;
  insights: Record<number, ProcessingInsight>;

  // Order and quick access arrays
  commentIds: string[];
  activeCommentIds: string[]; // Currently processing
}

// Actions - generic and simple
interface ProcessingActions {
  // Status management
  setStatus: (status: ProcessingStatus) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;

  // Comment operations
  upsertComments: (comments: ProcessingComment[]) => void;
  updateComment: (id: string, updates: Partial<ProcessingComment>) => void;
  removeComment: (id: string) => void;

  // Insight operations
  addInsight: (commentId: string, insight: ProcessingInsight) => void;
  removeInsight: (insightId: number) => void;

  // Batch operations
  startProcessing: (commentIds: string[], jobId: string) => void;
  completeComments: (commentIds: string[]) => void;
  failComments: (commentIds: string[]) => void;

  // Reset
  reset: () => void;
}

export type ProcessingStore = ProcessingState & ProcessingActions;

// Initial state
const initialState: ProcessingState = {
  status: "idle",
  currentJobId: null,
  isConnected: false,
  error: null,
  comments: {},
  insights: {},
  commentIds: [],
  activeCommentIds: [],
};

// Store creation
export const useProcessingStore = createWithEqualityFn<ProcessingStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Status management
      setStatus: (status) => set({ status }),
      setConnected: (isConnected) => set({ isConnected }),
      setError: (error) => set({ error, status: error ? "error" : "idle" }),

      // Comment operations
      upsertComments: (newComments) =>
        set((state) => {
          const comments = { ...state.comments };
          const commentIds = new Set(state.commentIds);

          newComments.forEach((comment) => {
            comments[comment.id] = comment;
            commentIds.add(comment.id);
          });

          return {
            comments,
            commentIds: Array.from(commentIds),
          };
        }),

      updateComment: (id, updates) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [id]: {
              ...state.comments[id],
              ...updates,
            },
          },
        })),

      removeComment: (id) =>
        set((state) => {
          const { [id]: removed, ...comments } = state.comments;
          return {
            comments,
            commentIds: state.commentIds.filter((cId) => cId !== id),
            activeCommentIds: state.activeCommentIds.filter(
              (cId) => cId !== id
            ),
          };
        }),

      // Insight operations
      addInsight: (commentId, insight) =>
        set((state) => {
          const comment = state.comments[commentId];
          if (!comment) return state;

          return {
            insights: {
              ...state.insights,
              [insight.id]: insight,
            },
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                insightIds: [...comment.insightIds, insight.id],
              },
            },
          };
        }),

      removeInsight: (insightId) =>
        set((state) => {
          const { [insightId]: removed, ...insights } = state.insights;
          const commentId = removed?.commentId;

          if (!commentId) return { insights };

          const comment = state.comments[commentId];
          return {
            insights,
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                insightIds: comment.insightIds.filter((id) => id !== insightId),
              },
            },
          };
        }),

      // Batch operations
      startProcessing: (commentIds, jobId) =>
        set((state) => {
          const comments = { ...state.comments };
          const newCommentIds = new Set(state.commentIds);

          commentIds.forEach((id) => {
            comments[id] = {
              id,
              status: "processing",
              jobId,
              insightIds: comments[id]?.insightIds || [],
            };
            newCommentIds.add(id);
          });

          return {
            status: "processing",
            currentJobId: jobId,
            comments,
            commentIds: Array.from(newCommentIds),
            activeCommentIds: commentIds,
            error: null,
          };
        }),

      completeComments: (commentIds) =>
        set((state) => {
          const comments = { ...state.comments };

          commentIds.forEach((id) => {
            if (comments[id]) {
              comments[id] = {
                ...comments[id],
                status: "completed",
              };
            }
          });

          const activeCommentIds = state.activeCommentIds.filter(
            (id) => !commentIds.includes(id)
          );

          return {
            comments,
            activeCommentIds,
            status: activeCommentIds.length > 0 ? "processing" : "completed",
          };
        }),

      failComments: (commentIds) =>
        set((state) => {
          const comments = { ...state.comments };

          commentIds.forEach((id) => {
            if (comments[id]) {
              comments[id] = {
                ...comments[id],
                status: "failed",
              };
            }
          });

          const activeCommentIds = state.activeCommentIds.filter(
            (id) => !commentIds.includes(id)
          );

          return {
            comments,
            activeCommentIds,
            status: activeCommentIds.length > 0 ? "processing" : "error",
          };
        }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "processing-store",
    }
  ),
  shallow
);

// ============================================
// SELECTORS - Simple and memoized
// ============================================

// Get a single comment
export const useComment = (id: string) =>
  useProcessingStore((state) => state.comments[id]);

// Get comment with its insights
export const useCommentWithInsights = (id: string) =>
  useProcessingStore((state) => {
    const comment = state.comments[id];
    if (!comment) return null;

    return {
      ...comment,
      insights: comment.insightIds
        .map((insightId) => state.insights[insightId])
        .filter(Boolean),
    };
  });

// Get all comment IDs
export const useCommentIds = () =>
  useProcessingStore((state) => state.commentIds);

// Get active/processing comments
export const useActiveComments = () =>
  useProcessingStore((state) =>
    state.activeCommentIds.map((id) => state.comments[id]).filter(Boolean)
  );

// Get processing stats
export const useProcessingStats = () =>
  useProcessingStore((state) => {
    const comments = Object.values(state.comments);
    return {
      total: comments.length,
      completed: comments.filter((c) => c.status === "completed").length,
      failed: comments.filter((c) => c.status === "failed").length,
      processing: comments.filter((c) => c.status === "processing").length,
      insights: Object.keys(state.insights).length,
      progress: comments.length
        ? (comments.filter((c) => c.status === "completed").length /
            comments.length) *
          100
        : 0,
    };
  });

// Get connection status
export const useConnectionStatus = () =>
  useProcessingStore((state) => state.isConnected);

// Get global status
export const useProcessingStatus = () =>
  useProcessingStore((state) => ({
    status: state.status,
    error: state.error,
    currentJobId: state.currentJobId,
  }));
