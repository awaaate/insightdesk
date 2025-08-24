import { Bus } from "@/bus";
import { Env } from "@/env";
import { NamedError } from "@/error";
import { logger } from "@/lib/logger";
import { visualLogger } from "@/lib/visualLogger";
import { Queue, Worker, type Processor, type WorkerOptions } from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";

export namespace Queues {
  export const connection = new IORedis(Env.config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  export enum Names {
    CATEGORIZE_COMMENT = "categorize-comment-batch",
  }

  export const CategorizeCommentJobData = z.object({
    commentIds: z.array(z.string()),
  });

  export type CategorizeCommentJobData = z.infer<
    typeof CategorizeCommentJobData
  >;

  export const GenerateInsightsJobData = z.object({
    commentIds: z.array(z.string()),
  });

  export type JobData = {
    type: Queues.Names.CATEGORIZE_COMMENT;
    data: CategorizeCommentJobData;
  };
  export const JobCompletedEvent = Bus.event(
    "job.completed",
    z.object({
      jobId: z.string(),
      result: z.any(),
    })
  );

  export const JobFailedEvent = Bus.event(
    "job.failed",
    z.object({
      jobId: z.string(),
      queueName: z.string(),
      error: z.any(),
      errorContext: z.object({
        errorType: z.string(),
        errorMessage: z.string(),
        errorStack: z.string().optional(),
        errorChain: z.array(
          z.object({
            name: z.string(),
            message: z.string(),
            stack: z.string().optional(),
            data: z.any().optional(),
          })
        ),
        rootCause: z.any(),
        jobData: z.any(),
        timestamp: z.date(),
      }),
    })
  );

  export const create = {
    createQueue<T = any>(name: Names) {
      return new Queue<T, boolean>(name, { connection: Queues.connection });
    },
    createWorker<
      Type extends Names,
      TData extends Extract<JobData, { type: Type }>["data"],
      R = unknown
    >(
      name: Type,
      processor: Processor<TData, R>,
      opts?: Partial<WorkerOptions>
    ) {
      // Wrap processor with enhanced error handling and traceability
      const wrappedProcessor: Processor<TData, R> = async (job) => {
        const jobId = job.id ?? "unknown";
        const startTime = Date.now();

        try {
          logger.info(
            {
              queueName: name,
              jobId,
              jobData: job.data,
            },
            `Starting job processing for queue ${name}`
          );

          const result = await processor(job);

          logger.info(
            {
              queueName: name,
              jobId,
              duration: Date.now() - startTime,
            },
            `Job completed successfully for queue ${name}`
          );

          return result;
        } catch (error) {
          // Verificar si el error ya fue procesado por el worker
          const hasWorkerErrorResult = (error as any)?.workerErrorResult;
          
          if (hasWorkerErrorResult) {
            // El error ya fue procesado por el worker, usar esa información
            const errorResult = (error as any).workerErrorResult;
            
            // Crear error para Bull Dashboard
            const bullError = new Error(errorResult.summary);
            bullError.name = errorResult.error.name;
            
            // Hacer el error serializable para Bull Dashboard
            Object.defineProperty(bullError, "toJSON", {
              value: () => ({
                name: errorResult.error.name,
                message: errorResult.summary,
                errorChain: errorResult.chain,
                context: errorResult.context,
                timestamp: errorResult.timestamp,
                duration: errorResult.duration,
                jobId: errorResult.jobId
              }),
              enumerable: false,
            });
            
            // Log el error formateado
            logger.error(
              {
                queueName: name,
                jobId,
                errorResult,
                duration: Date.now() - startTime,
              },
              `Job failed in queue ${name}: ${errorResult.summary}`
            );
            
            throw bullError;
          }
          
          // Si el error no fue procesado, procesarlo aquí (fallback)
          const rootCause = (error as any)?.cause || error;
          const errorChain: any[] = [];
          let currentError = error;

          // Build complete error chain
          while (currentError) {
            errorChain.push({
              level: errorChain.length,
              name:
                currentError instanceof Error ? currentError.name : "Unknown",
              message:
                currentError instanceof Error
                  ? currentError.message
                  : String(currentError),
              stack:
                currentError instanceof Error ? currentError.stack : undefined,
              data:
                currentError instanceof NamedError
                  ? currentError.toObject()
                  : undefined,
              source: currentError instanceof Error ? currentError.constructor.name : typeof currentError,
              timestamp: new Date().toISOString()
            });
            currentError = (currentError as any)?.cause;
          }

          const errorSummary = errorChain.length > 1 
            ? `${errorChain[0].name}: ${errorChain[0].message} (caused by ${errorChain[errorChain.length - 1].name})`
            : `${errorChain[0]?.name || "Error"}: ${errorChain[0]?.message || "Unknown error"}`;

          // Crear error para Bull Dashboard
          const bullError = new Error(errorSummary);
          bullError.name = error instanceof Error ? error.name : "UnknownError";
          
          // Hacer el error serializable para Bull Dashboard
          const errorData = {
            name: bullError.name,
            message: errorSummary,
            errorChain,
            context: {
              jobData: job.data,
              queueName: name,
              jobId,
              duration: Date.now() - startTime,
            },
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            jobId
          };
          
          Object.defineProperty(bullError, "toJSON", {
            value: () => errorData,
            enumerable: false,
          });

          // Log comprehensive error details with full context
          logger.error(
            {
              ...errorData,
              fullError: error,
            },
            `Job failed in queue ${name}: ${errorSummary}`
          );

          throw bullError;
        }
      };

      const worker = new Worker<TData, R>(name, wrappedProcessor, {
        connection,
        concurrency: 20,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 },
        ...opts,
      });

      worker.on("completed", (job) => {
        Bus.publish(JobCompletedEvent, {
          jobId: job.id!,
          result: job.returnvalue,
        });
      });

      worker.on("failed", (job, err) => {
        const jobId = job?.id ?? "unknown";

        // Build error chain for event
        const rootCause = (err as any)?.cause || err;
        const errorChain: any[] = [];
        let currentError = err;

        while (currentError) {
          errorChain.push({
            name: currentError instanceof Error ? currentError.name : "Unknown",
            message:
              currentError instanceof Error
                ? currentError.message
                : String(currentError),
            stack:
              currentError instanceof Error ? currentError.stack : undefined,
            data:
              currentError instanceof NamedError
                ? currentError.toObject()
                : undefined,
          });
          currentError = (currentError as any)?.cause;
        }

        // Build comprehensive error context for the event
        const errorContext = {
          errorType: err instanceof Error ? err.name : "UnknownError",
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
          errorChain,
          rootCause:
            rootCause instanceof Error
              ? {
                  name: rootCause.name,
                  message: rootCause.message,
                  stack: rootCause.stack,
                }
              : rootCause,
          jobData: job?.data,
          timestamp: new Date(),
        };

        // Log the failed event
        logger.error(
          {
            queueName: name,
            jobId,
            errorContext,
            originalError: err,
          },
          `Worker event: Job failed in queue ${name}`
        );

        Bus.publish(JobFailedEvent, {
          jobId,
          queueName: name,
          error: err,
          errorContext,
        });
      });

      return worker;
    },
  };

  export const queues = {
    [Names.CATEGORIZE_COMMENT]: create.createQueue<CategorizeCommentJobData>(
      Names.CATEGORIZE_COMMENT
    ),
  };
}
