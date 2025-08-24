import { router } from "@/lib/trpc";
import { processingRouter } from "./processing";
import { commentsRouter } from "./comments";
import { insightsRouter } from "./insights";

export const appRouter = router({
  processing: processingRouter,
  comments: commentsRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;