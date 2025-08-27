import { router, publicProcedure } from "@/lib/trpc";
import { Queues } from "@/queues";
import { SharedTypes } from "@/types/shared";
import type { JobsOptions } from "bullmq";
import { chunk } from "remeda";

const BATCH_SIZE = 5; // Maximum comments per job

export const processingRouter = router({
  analyzeComments: publicProcedure
    .input(SharedTypes.API.Processing.AnalyzeCommentsInputSchema)
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<SharedTypes.API.Processing.AnalyzeCommentsResponse> => {
        const { queues } = ctx;
        const { commentIds, metadata } = input;

        try {
          // Split comments into batches
          const batches = chunk(commentIds, BATCH_SIZE);

          // Create jobs for each batch
          const jobs = batches.map((batch, index) => ({
            name: Queues.Names.ANALYZE_COMMENTS_BATCH,
            data: {
              commentIds: batch,
              metadata: {
                ...metadata,
                batchIndex: index,
                totalBatches: batches.length,
                totalComments: commentIds.length,
              },
            } as Queues.AnalyzeComments.Types.JobData,
            opts: {
              removeOnComplete: 1000,
              removeOnFail: 500,

              attempts: 3,
              backoff: {
                type: "exponential" as const,
                delay: 2000,
              },
            } as JobsOptions,
          }));

          // Queue all jobs
          await queues[Queues.Names.ANALYZE_COMMENTS_BATCH].addBulk(jobs);

          return {
            success: true,
            message: `Queued ${jobs.length} jobs for ${commentIds.length} comments`,
            details: {
              totalComments: commentIds.length,
              batchSize: BATCH_SIZE,
              jobsCreated: jobs.length,
              batches: batches.map((batch, index) => ({
                index,
                size: batch.length,
                commentIds: batch,
              })),
            },
          };
        } catch (error) {
          throw new Error(
            error instanceof Error
              ? error.message
              : "Failed to queue categorization jobs"
          );
        }
      }
    ),
});
