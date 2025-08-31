import { router } from "@/lib/trpc";
import { processingRouter } from "./processing";
import { commentsRouter } from "./comments";
import { insightsRouter } from "./insights";
import { agentLogsRouter } from "./agent-logs";
import { letiRouter } from "./analytics/leti";
import { pixeRouter } from "./analytics/pixe";
import { groRouter } from "./analytics/gro";
import { analyticsRouters } from "./analyticsv2/v2-router";
import { v2CommentsRouter } from "./v2-comments";

export const appRouter = router({
  processing: processingRouter,
  comments: commentsRouter,
  insights: insightsRouter,
  agentLogs: agentLogsRouter,
  analytics: analyticsRouters,
  v2Comments: v2CommentsRouter,
});

export type AppRouter = typeof appRouter;
