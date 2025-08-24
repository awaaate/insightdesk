import { AI } from "@/ai";
import { Bus } from "@/bus";
import { DB } from "@/db";
import { NamedError } from "@/error";
import { logger } from "@/lib/logger";
import { inArray } from "drizzle-orm";
import { flatMap, pipe, unique } from "remeda";
import { z } from "zod";
import { Queues } from "..";
import { visualLogger } from "@/lib/visualLogger";
import { WorkerErrors } from "../errors";

/**
 * Comment Categorization Worker
 * Processes comments to categorize them into existing insights or create new ones
 */
export namespace CommentCategorization {
  const QUEUE_NAME = Queues.Names.CATEGORIZE_COMMENT;

  export const DEFAULT_PROVIDER = "openai";
  export const DEFAULT_PERFORMANCE = "low";

  /**
   * Input/Output Types
   */
  export namespace Types {
    export const JobDataSchema = z.object({
      commentIds: z.array(z.string()),
      userId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    });

    export type JobData = z.infer<typeof JobDataSchema>;

    export interface ProcessingResult {
      processedComments: number;
      matchedInsights: number;
      createdInsights: number;
      relationships: Array<{
        commentId: string;
        insightId: number;
        isNew: boolean;
      }>;
    }

    export interface CommentAnalysisResult {
      comment: DB.Comment.Select;
      existingInsights: string[];
      newInsights: AI.Schemas.NewInsight[];
      confidence: number;
      explanation: string;
    }
  }

  /**
   * Domain-specific Errors
   */
  export namespace Errors {
    export const DataFetchError = NamedError.create(
      "CommentCategorization.DataFetchError",
      z.object({
        commentIds: z.array(z.string()),
        message: z.string(),
      })
    );

    export const AnalysisError = NamedError.create(
      "CommentCategorization.AnalysisError",
      z.object({
        phase: z.enum(["prompt_generation", "ai_generation", "result_parsing"]),
        commentCount: z.number(),
        insightCount: z.number(),
        provider: z.string(),
        originalError: z.string(),
      })
    );

    export const InsightCreationError = NamedError.create(
      "CommentCategorization.InsightCreationError",
      z.object({
        insightName: z.string(),
        reason: z.string(),
      })
    );

    export const RelationshipCreationError = NamedError.create(
      "CommentCategorization.RelationshipCreationError",
      z.object({
        commentId: z.string(),
        insightId: z.number().optional(),
        reason: z.string(),
      })
    );
  }

  /**
   * Events for tracking progress and state
   */
  export namespace Events {
    const createEvent = <T extends z.ZodType>(name: string, schema: T) =>
      Bus.event(`${QUEUE_NAME}.${name}`, schema);

    // Job lifecycle events
    export const jobStarted = createEvent(
      "job.started",
      z.object({
        jobId: z.string(),
        commentIds: z.array(z.string()),
        timestamp: z.date(),
      })
    );

    export const jobCompleted = createEvent(
      "job.completed",
      z.object({
        jobId: z.string(),
        result: z.object({
          processedComments: z.number(),
          matchedInsights: z.number(),
          createdInsights: z.number(),
        }),
        duration: z.number(),
        timestamp: z.date(),
      })
    );

    export const jobFailed = createEvent(
      "job.failed",
      z.object({
        jobId: z.string(),
        error: z.string(),
        errorType: z.string(),
        timestamp: z.date(),
        errorContext: z.record(z.any()).optional(),
        originalError: z.any().optional(),
      })
    );

    // Data fetching events
    export const dataFetchStarted = createEvent(
      "data.fetch.started",
      z.object({
        commentCount: z.number(),
        timestamp: z.date(),
      })
    );

    export const dataFetchCompleted = createEvent(
      "data.fetch.completed",
      z.object({
        comments: z.number(),
        existingInsights: z.number(),
        timestamp: z.date(),
      })
    );

    // Analysis events
    export const analysisStarted = createEvent(
      "analysis.started",
      z.object({
        commentCount: z.number(),
        insightCount: z.number(),
        provider: z.string(),
        performance: z.string(),
        timestamp: z.date(),
      })
    );

    export const analysisProgress = createEvent(
      "analysis.progress",
      z.object({
        processed: z.number(),
        total: z.number(),
        percentage: z.number(),
        timestamp: z.date(),
      })
    );

    export const analysisCompleted = createEvent(
      "analysis.completed",
      z.object({
        totalAnalyzed: z.number(),
        matchedExisting: z.number(),
        newInsightsFound: z.number(),
        averageConfidence: z.number(),
        timestamp: z.date(),
      })
    );

    // Insight creation events
    export const insightCreated = createEvent(
      "insight.created",
      z.object({
        insightId: z.number(),
        name: z.string(),
        aiGenerated: z.boolean(),
        timestamp: z.date(),
      })
    );

    export const insightMatched = createEvent(
      "insight.matched",
      z.object({
        insightId: z.number(),
        name: z.string(),
        commentId: z.string(),
        confidence: z.number(),
        timestamp: z.date(),
      })
    );

    // Relationship events
    export const relationshipsCreated = createEvent(
      "relationships.created",
      z.object({
        count: z.number(),
        newRelationships: z.number(),
        existingRelationships: z.number(),
        timestamp: z.date(),
      })
    );

    // State change event for WebSocket
    export const stateChanged = createEvent(
      "state.changed",
      z.object({
        jobId: z.string(),
        state: z.enum([
          "initializing",
          "fetching_data",
          "analyzing",
          "creating_insights",
          "creating_relationships",
          "completed",
          "failed",
        ]),
        progress: z.number().min(0).max(100),
        details: z.record(z.any()).optional(),
        timestamp: z.date(),
      })
    );
  }

  /**
   * Core processing functions
   */
  namespace Processing {
    /**
     * Fetch comments and insights from database
     */
    export async function fetchData(
      tx: DB.DBTransaction,
      commentIds: string[]
    ) {
      try {
        const [comments, insights] = await Promise.all([
          tx
            .select()
            .from(DB.schema.comments)
            .where(inArray(DB.schema.comments.id, commentIds)),
          tx.select().from(DB.schema.insights),
        ]);

        return { comments, insights };
      } catch (error) {
        // Log complete error context
        logger.error(
          {
            operation: "fetchData",
            commentIds,
            commentCount: commentIds.length,
            error:
              error instanceof Error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    cause: error.cause,
                  }
                : error,
          },
          "Failed to fetch comments and insights from database"
        );

        throw new Errors.DataFetchError(
          {
            commentIds,
            message:
              error instanceof Error
                ? `${error.name}: ${error.message}\n${error.stack}`
                : "Unknown error",
          },
          { cause: error }
        );
      }
    }

    /**
     * Analyze comments using AI to categorize into insights
     */
    export async function analyzeComments(
      data: Awaited<ReturnType<typeof fetchData>>,
      options: { provider?: AI.Provider; performance?: AI.Performance } = {}
    ): Promise<AI.Schemas.CommentAnalysis> {
      const { insights, comments } = data;
      const provider = options.provider ?? DEFAULT_PROVIDER;
      const performance = options.performance ?? DEFAULT_PERFORMANCE;

      // Generate prompt
      let systemPrompt: string;
      try {
        systemPrompt = await AI.PromptTemplates.processPrompt(
          AI.PromptTemplates.TemplateName.INSIGHT_CATEGORIZATION,
          {
            insights: insights.map((i) => i.name),
            comments: comments.map((c) => c.content),
          }
        );
      } catch (error) {
        // Log full error context before throwing
        logger.error(
          {
            phase: "prompt_generation",
            commentCount: comments.length,
            insightCount: insights.length,
            provider,
            error:
              error instanceof Error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    cause: error.cause,
                  }
                : error,
          },
          "Failed to generate prompt for comment categorization"
        );

        throw new Errors.AnalysisError(
          {
            phase: "prompt_generation",
            commentCount: comments.length,
            insightCount: insights.length,
            provider,
            originalError:
              error instanceof Error
                ? `${error.name}: ${error.message}\n${error.stack}`
                : String(error),
          },
          { cause: error }
        );
      }

      // Generate analysis
      try {
        const schema = AI.Schemas.createCommentAnalysisSchema({ insights });

        const { results } = await AI.generateObject({
          provider,
          performance,
          schema,
          messages: [
            AI.message("system", systemPrompt),
            AI.message(
              "user",
              "Analyze each comment and determine which existing insights apply or what new insights are needed. Be specific and accurate."
            ),
          ],
          temperature: 0.3, // Lower temperature for more consistent categorization
        });

        return results;
      } catch (error) {
        // Log complete error context with all details
        const errorDetails = {
          phase: "ai_generation",
          commentCount: comments.length,
          insightCount: insights.length,
          provider,
          performance,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                  cause: error.cause,
                }
              : error,
        };

        // Log specific AI errors with additional context
        if (AI.NoObjectGeneratedError.isInstance(error)) {
          logger.error(
            {
              ...errorDetails,
              aiErrorData: {
                provider: error.data.provider,
                model: error.data.model,
                generatedText: error.data.generatedText,
                finishReason: error.data.finishReason,
                usage: error.data.usage,
              },
            },
            "AI failed to generate valid categorization - NoObjectGeneratedError"
          );
        } else {
          logger.error(errorDetails, "Failed to analyze comments with AI");
        }

        throw new Errors.AnalysisError(
          {
            phase: "ai_generation",
            commentCount: comments.length,
            insightCount: insights.length,
            provider,
            originalError:
              error instanceof Error
                ? `${error.name}: ${error.message}\n${error.stack}`
                : String(error),
          },
          { cause: error }
        );
      }
    }

    /**
     * Create new insights in database
     */
    export async function createInsight(
      tx: DB.DBTransaction,
      insight: AI.Schemas.NewInsight
    ): Promise<number> {
      try {
        const [result] = await tx
          .insert(DB.schema.insights)
          .values({
            name: insight.name.toLowerCase(),
            content: insight.description,
            description: insight.description,
            ai_generated: true,
          })
          .onConflictDoUpdate({
            target: [DB.schema.insights.name],
            set: {
              updated_at: new Date(),
            },
          })
          .returning({ id: DB.schema.insights.id });

        await Bus.publish(Events.insightCreated, {
          insightId: result.id,
          name: insight.name,
          aiGenerated: true,
          timestamp: new Date(),
        });

        return result.id;
      } catch (error) {
        // Log complete error context
        logger.error(
          {
            operation: "createInsight",
            insightName: insight.name,
            insightDescription: insight.description,
            error:
              error instanceof Error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    cause: error.cause,
                  }
                : error,
          },
          "Failed to create new insight in database"
        );

        throw new Errors.InsightCreationError(
          {
            insightName: insight.name,
            reason:
              error instanceof Error
                ? `${error.name}: ${error.message}\n${error.stack}`
                : "Unknown error",
          },
          { cause: error }
        );
      }
    }

    /**
     * Process analysis results and create relationships
     */
    export async function processAnalysisResults(
      tx: DB.DBTransaction,
      analysis: AI.Schemas.CommentAnalysis,
      comments: DB.Comment.Select[]
    ): Promise<Types.ProcessingResult> {
      const commentMap = new Map(comments.map((c) => [comments.indexOf(c), c]));

      // Get existing insight name->id mapping
      const existingInsightNames = pipe(
        analysis,
        flatMap((a) => a.existingInsights),
        unique()
      );

      const existingInsights =
        existingInsightNames.length > 0
          ? await tx
              .select({
                id: DB.schema.insights.id,
                name: DB.schema.insights.name,
              })
              .from(DB.schema.insights)
              .where(inArray(DB.schema.insights.name, existingInsightNames))
          : [];

      const insightNameToId = new Map(
        existingInsights.map((i) => [i.name, i.id])
      );

      // Process each analysis result
      const relationships: Types.ProcessingResult["relationships"] = [];
      let createdInsights = 0;

      for (const item of analysis) {
        const comment = commentMap.get(item.commentIndex);
        if (!comment) continue;

        // Handle existing insights
        for (const insightName of item.existingInsights) {
          const insightId = insightNameToId.get(insightName);
          if (insightId) {
            relationships.push({
              commentId: comment.id,
              insightId,
              isNew: false,
            });

            await Bus.publish(Events.insightMatched, {
              insightId,
              name: insightName,
              commentId: comment.id,
              confidence: item.confidence,
              timestamp: new Date(),
            });
          }
        }

        // Create new insights
        for (const newInsight of item.newInsights) {
          const insightId = await createInsight(tx, newInsight);
          createdInsights++;

          relationships.push({
            commentId: comment.id,
            insightId,
            isNew: true,
          });
        }
      }

      // Create comment-insight relationships
      if (relationships.length > 0) {
        await tx.insert(DB.schema.comment_insights).values(
          relationships.map((r) => ({
            comment_id: r.commentId,
            insight_id: r.insightId,
          }))
        );

        await Bus.publish(Events.relationshipsCreated, {
          count: relationships.length,
          newRelationships: relationships.filter((r) => r.isNew).length,
          existingRelationships: relationships.filter((r) => !r.isNew).length,
          timestamp: new Date(),
        });
      }

      return {
        processedComments: comments.length,
        matchedInsights: relationships.filter((r) => !r.isNew).length,
        createdInsights,
        relationships,
      };
    }
  }

  /**
   * Main Worker
   */
  export async function createWorker() {
    return Queues.create.createWorker(QUEUE_NAME, async (job) => {
      const startTime = Date.now();
      const jobId = job.id ?? "unknown";

      // Emit job started
      await Bus.publish(Events.jobStarted, {
        jobId,
        commentIds: job.data.commentIds,
        timestamp: new Date(),
      });

      // Update state: initializing
      await Bus.publish(Events.stateChanged, {
        jobId,
        state: "initializing",
        progress: 0,
        timestamp: new Date(),
      });

      try {
        const result = await DB.executeTransaction(async (tx) => {
          // Phase 1: Fetch data
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "fetching_data",
            progress: 10,
            timestamp: new Date(),
          });

          await Bus.publish(Events.dataFetchStarted, {
            commentCount: job.data.commentIds.length,
            timestamp: new Date(),
          });

          const data = await Processing.fetchData(tx, job.data.commentIds);

          await Bus.publish(Events.dataFetchCompleted, {
            comments: data.comments.length,
            existingInsights: data.insights.length,
            timestamp: new Date(),
          });

          // Phase 2: Analyze comments
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "analyzing",
            progress: 30,
            timestamp: new Date(),
          });

          await Bus.publish(Events.analysisStarted, {
            commentCount: data.comments.length,
            insightCount: data.insights.length,
            provider: DEFAULT_PROVIDER,
            performance: DEFAULT_PERFORMANCE,
            timestamp: new Date(),
          });

          const analysis = await Processing.analyzeComments(data);

          // Calculate statistics
          const totalMatched = analysis.reduce(
            (sum, a) => sum + a.existingInsights.length,
            0
          );
          const totalNew = analysis.reduce(
            (sum, a) => sum + a.newInsights.length,
            0
          );
          const avgConfidence =
            analysis.reduce((sum, a) => sum + a.confidence, 0) /
            analysis.length;

          await Bus.publish(Events.analysisCompleted, {
            totalAnalyzed: analysis.length,
            matchedExisting: totalMatched,
            newInsightsFound: totalNew,
            averageConfidence: avgConfidence,
            timestamp: new Date(),
          });

          // Phase 3: Process results
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "creating_insights",
            progress: 60,
            timestamp: new Date(),
          });

          const processingResult = await Processing.processAnalysisResults(
            tx,
            analysis,
            data.comments
          );

          // Phase 4: Complete
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "creating_relationships",
            progress: 90,
            timestamp: new Date(),
          });

          return processingResult;
        });

        // Job completed successfully
        await Bus.publish(Events.stateChanged, {
          jobId,
          state: "completed",
          progress: 100,
          details: result,
          timestamp: new Date(),
        });

        await Bus.publish(Events.jobCompleted, {
          jobId,
          result: {
            processedComments: result.processedComments,
            matchedInsights: result.matchedInsights,
            createdInsights: result.createdInsights,
          },
          duration: Date.now() - startTime,
          timestamp: new Date(),
        });

        logger.info(
          {
            jobId,
            ...result,
            duration: Date.now() - startTime,
          },
          "Comment categorization completed"
        );

        return result;
      } catch (error) {
        // Construir contexto del error
        const errorContext: Record<string, any> = {
          jobData: job.data,
          commentIds: job.data.commentIds,
          commentCount: job.data.commentIds.length,
        };

        // Agregar contexto específico según el tipo de error
        if (Errors.AnalysisError.isInstance(error)) {
          errorContext.analysisPhase = error.data.phase;
          errorContext.provider = error.data.provider;
          errorContext.commentCount = error.data.commentCount;
          errorContext.insightCount = error.data.insightCount;
        } else if (Errors.DataFetchError.isInstance(error)) {
          errorContext.dataFetchCommentIds = error.data.commentIds;
          errorContext.dataFetchMessage = error.data.message;
        } else if (Errors.InsightCreationError.isInstance(error)) {
          errorContext.insightName = error.data.insightName;
          errorContext.insightReason = error.data.reason;
        } else if (Errors.RelationshipCreationError.isInstance(error)) {
          errorContext.relationshipCommentId = error.data.commentId;
          errorContext.relationshipInsightId = error.data.insightId;
          errorContext.relationshipReason = error.data.reason;
        } else if (AI.NoObjectGeneratedError.isInstance(error)) {
          errorContext.aiProvider = error.data.provider;
          errorContext.aiModel = error.data.model;
          errorContext.aiFinishReason = error.data.finishReason;
          errorContext.aiUsage = error.data.usage;
        }

        // Procesar el error con el sistema centralizado
        const errorResult = WorkerErrors.processWorkerError(
          error,
          jobId,
          errorContext,
          startTime
        );

        // Publicar eventos de error
        await Bus.publish(Events.jobFailed, {
          jobId,
          error: errorResult.summary,
          errorType: errorResult.error.name,
          timestamp: new Date(),
          errorContext: errorResult.context,
          originalError: errorResult,
        });

        await Bus.publish(Events.stateChanged, {
          jobId,
          state: "failed",
          progress: 0,
          details: {
            error: errorResult.error,
            chain: errorResult.chain,
            summary: errorResult.summary,
          },
          timestamp: new Date(),
        });

        // Log estructurado para debugging
        logger.error(
          {
            jobId,
            errorResult,
            duration: errorResult.duration,
          },
          `Comment categorization job failed: ${errorResult.summary}`
        );

        // Lanzar error preparado con toda la información
        throw WorkerErrors.prepareErrorForThrow(
          error,
          jobId,
          errorContext,
          startTime
        );
      }
    });
  }
}
