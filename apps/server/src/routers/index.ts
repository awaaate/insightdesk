import { router } from "@/lib/trpc";
import { processingRouter } from "./processing";
import { commentsRouter } from "./comments";
import { insightsRouter } from "./insights";
import { agentLogsRouter } from "./agent-logs";
import { letiRouter } from "./analytics/leti";
import { pixeRouter } from "./analytics/pixe";
import { groRouter } from "./analytics/gro";

export const appRouter = router({
  processing: processingRouter,
  comments: commentsRouter,
  insights: insightsRouter,
  agentLogs: agentLogsRouter,
  analytics: {
    leti: letiRouter,
    pixe: pixeRouter,
    gro: groRouter,
  },
});

export type AppRouter = typeof appRouter;
