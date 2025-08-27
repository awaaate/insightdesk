import { AI } from "@/ai";
import { Bus } from "@/bus";
import { DB } from "@/db";
import { NamedError } from "@/error";
import { logger } from "@/lib/logger";
import { SharedTypes } from "@/types/shared";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { WorkerErrors } from "../errors";
import { Names } from "../names";

/**
 * Analyze Comments Worker
 * Processes comments through LETI, GRO, and PIX agents for comprehensive analysis
 */
export namespace AnalyzeComments {
  export const QUEUE_NAME = Names.ANALYZE_COMMENTS_BATCH;

  export const DEFAULT_PROVIDER = "openai";
  export const DEFAULT_PERFORMANCE = "low";

  /**
   * Input/Output Types
   */
  export namespace Types {
    export const JobDataSchema = z.object({
      commentIds: z.array(z.string()),
      userId: z.string().optional(),
      metadata: SharedTypes.Domain.Job.MetadataSchema.optional(),
    });

    export type JobData = z.infer<typeof JobDataSchema>;

    export interface ProcessingResult
      extends SharedTypes.Domain.Job.ProcessingResult {
      // LETI results
      detectedInsights: number;
      newInsightsCreated: number;
      // GRO results
      intentionsDetected: number;
      // PIX results
      sentimentsAnalyzed: number;
      // Relationship IDs for frontend consumption
      commentInsightIds: string[];
      commentIntentionIds: string[];
    }
  }

  /**
   * Domain-specific Errors
   */
  export namespace Errors {
    export const DataFetchError = NamedError.create(
      "AnalyzeComments.DataFetchError",
      z.object({
        commentIds: z.array(z.string()),
        message: z.string(),
      })
    );

    export const AnalysisError = NamedError.create(
      "AnalyzeComments.AnalysisError",
      z.object({
        phase: z.enum(["prompt_generation", "ai_generation", "result_parsing"]),
        agent: z.enum(["leti", "gro", "pix"]),
        commentCount: z.number(),
        provider: z.string(),
        originalError: z.string(),
      })
    );

    export const InsightCreationError = NamedError.create(
      "AnalyzeComments.InsightCreationError",
      z.object({
        insightName: z.string(),
        reason: z.string(),
      })
    );

    export const IntentionCreationError = NamedError.create(
      "AnalyzeComments.IntentionCreationError",
      z.object({
        commentId: z.string(),
        intentionType: z.string(),
        reason: z.string(),
      })
    );

    export const SentimentUpdateError = NamedError.create(
      "AnalyzeComments.SentimentUpdateError",
      z.object({
        commentInsightId: z.string(),
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
      SharedTypes.WebSocket.Server.JobStartedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.JobStartedSchema.shape.data
    );

    export const jobCompleted = createEvent(
      SharedTypes.WebSocket.Server.JobCompletedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.JobCompletedSchema.shape.data
    );

    export const jobFailed = createEvent(
      SharedTypes.WebSocket.Server.JobFailedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.JobFailedSchema.shape.data
    );

    // State change event for WebSocket
    export const stateChanged = createEvent(
      SharedTypes.WebSocket.Server.StateChangedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.StateChangedSchema.shape.data
    );

    // LETI Agent Events
    export const letiStarted = createEvent(
      SharedTypes.WebSocket.Server.LetiStartedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.LetiStartedSchema.shape.data
    );

    export const letiInsightDetected = createEvent(
      SharedTypes.WebSocket.Server.LetiInsightDetectedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.LetiInsightDetectedSchema.shape.data
    );

    export const letiNewInsightCreated = createEvent(
      SharedTypes.WebSocket.Server.LetiNewInsightCreatedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.LetiNewInsightCreatedSchema.shape.data
    );

    export const letiCompleted = createEvent(
      SharedTypes.WebSocket.Server.LetiCompletedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.LetiCompletedSchema.shape.data
    );

    // GRO Agent Events
    export const groStarted = createEvent(
      SharedTypes.WebSocket.Server.GroStartedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.GroStartedSchema.shape.data
    );

    export const groIntentionDetected = createEvent(
      SharedTypes.WebSocket.Server.GroIntentionDetectedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.GroIntentionDetectedSchema.shape.data
    );

    export const groCompleted = createEvent(
      SharedTypes.WebSocket.Server.GroCompletedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.GroCompletedSchema.shape.data
    );

    // PIX Agent Events
    export const pixStarted = createEvent(
      SharedTypes.WebSocket.Server.PixStartedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.PixStartedSchema.shape.data
    );

    export const pixSentimentAnalyzed = createEvent(
      SharedTypes.WebSocket.Server.PixSentimentAnalyzedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.PixSentimentAnalyzedSchema.shape.data
    );

    export const pixCompleted = createEvent(
      SharedTypes.WebSocket.Server.PixCompletedSchema.shape.type.value,
      SharedTypes.WebSocket.Server.PixCompletedSchema.shape.data
    );
  }

  /**
   * Core processing functions
   */
  namespace Processing {
    /**
     * Log agent processing activity per comment
     */
    async function logAgentProcessing(
      tx: DB.DBTransaction,
      input: {
        jobId: string;
        commentId: string;
        agentName: SharedTypes.Domain.AgentLogs.AgentName;
        startTime: number;
        success: boolean;
        error?: Error | unknown;
        metadata?: SharedTypes.Domain.AgentLogs.AgentMetadata;
      }
    ) {
      const processingTime = Date.now() - input.startTime;

      try {
        const upsertData = {
          success: input.success,
          error_message: input.error
            ? input.error instanceof Error
              ? input.error.message
              : String(input.error)
            : null,
          metadata: SharedTypes.Domain.AgentLogs.stringifyMetadata(
            input.metadata
          ),
        };
        await tx
          .insert(DB.schema.agent_processing_logs)
          .values({
            job_id: input.jobId,
            comment_id: input.commentId,
            agent_name: input.agentName,
            processing_time_ms: processingTime,
            ...upsertData,
          })
          .onConflictDoUpdate({
            target: [
              DB.schema.agent_processing_logs.job_id,
              DB.schema.agent_processing_logs.agent_name,
              DB.schema.agent_processing_logs.comment_id,
            ],
            set: upsertData,
          });

        logger.debug(
          {
            jobId: input.jobId,
            commentId: input.commentId,
            agent: input.agentName,
            processingTime,
            success: input.success,
          },
          `Agent processing logged: ${input.agentName} for comment ${input.commentId}`
        );
      } catch (logError) {
        // Don't fail the main process if logging fails
        logger.warn(
          {
            jobId: input.jobId,
            commentId: input.commentId,
            agent: input.agentName,
            error: logError instanceof Error ? logError.message : logError,
          },
          "Failed to log agent processing"
        );
      }
    }
    /**
     * Fetch comments and insights from database
     */
    export async function fetchData(
      tx: DB.DBTransaction,
      commentIds: string[]
    ) {
      try {
        const [comments, insights, sentimentLevels] = await Promise.all([
          tx
            .select()
            .from(DB.schema.comments)
            .where(inArray(DB.schema.comments.id, commentIds)),
          tx.select().from(DB.schema.insights),
          tx
            .select()
            .from(DB.schema.sentiment_levels)
            .orderBy(DB.schema.sentiment_levels.intensity_value),
        ]);

        return { comments, insights, sentimentLevels };
      } catch (error) {
        logger.error(
          {
            operation: "fetchData",
            commentIds,
            error: error instanceof Error ? error.message : error,
          },
          "Failed to fetch data"
        );

        throw new Errors.DataFetchError(
          {
            commentIds,
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { cause: error }
        );
      }
    }

    /**
     * LETI Agent - Detect insights in comments
     */
    export async function detectInsights(
      tx: DB.DBTransaction,
      data: Awaited<ReturnType<typeof fetchData>>,
      options: {
        provider?: AI.Provider;
        performance?: AI.Performance;
        jobId?: string;
      } = {}
    ) {
      const { insights, comments } = data;
      const provider = options.provider ?? DEFAULT_PROVIDER;
      const performance = options.performance ?? DEFAULT_PERFORMANCE;
      const jobId = options.jobId ?? "unknown";
      const startTime = Date.now();

      // Generate prompt
      const systemPrompt = await AI.PromptTemplates.processPrompt(
        AI.PromptTemplates.TemplateName.INSIGHT_DETECTION,
        {
          insights: insights.map((i) => i.name),
          comments: comments.map((c) => c.content),
        }
      );

      // Generate analysis
      const schema = AI.Schemas.createInsightDetectionSchema({ insights });

      let results: Array<{
        commentIndex: number;
        detectedInsights: Array<{
          insightName: string;
          confidence: number;
          reasoning: string;
          isEmergent: boolean;
        }>;
        suggestedNewInsights: Array<{
          name: string;
          description: string;
        }>;
      }> = [];

      try {
        const response = await AI.generateObject({
          provider,
          performance,
          schema,
          messages: [
            AI.message("system", systemPrompt),
            AI.message("user", "Detect all insights present in each comment."),
          ],
          temperature: 0.3,
        });
        results = (response.results || []).map((r) => ({
          commentIndex: r.commentIndex,
          detectedInsights: r.detectedInsights || [],
          suggestedNewInsights: r.suggestedNewInsights || [],
        }));
      } catch (error) {
        logger.error(
          {
            operation: "detectInsights",
            error: error instanceof Error ? error.message : error,
            commentCount: comments.length,
          },
          "Failed to generate insight detection"
        );

        // If AI fails, return empty results rather than crashing
        if (error instanceof AI.NoObjectGeneratedError) {
          logger.warn(
            "AI failed to generate insights, returning empty results"
          );
          results = [];
        } else {
          throw new Errors.AnalysisError(
            {
              phase: "ai_generation",
              agent: "leti",
              commentCount: comments.length,
              provider,
              originalError:
                error instanceof Error ? error.message : String(error),
            },
            { cause: error }
          );
        }
      }

      // Process results
      const commentInsightIds: string[] = [];
      let newInsightsCreated = 0;
      let totalDetected = 0;

      for (const item of results) {
        const comment = comments[item.commentIndex];
        if (!comment) continue;

        const commentStartTime = Date.now();
        const letiMetadata: SharedTypes.Domain.AgentLogs.LetiMetadata = {
          commentId: comment.id,
          insightsDetected: [],
          newInsightsCreated: [],
          processingTimeMs: 0,
          provider,
          performance,
        };

        // Create new insights if needed
        for (const newInsight of item.suggestedNewInsights) {
          const [created] = await tx
            .insert(DB.schema.insights)
            .values({
              name: newInsight.name.toLowerCase(),
              content: newInsight.name || newInsight.description,
              description: newInsight.description,
              ai_generated: true,
            })
            .onConflictDoUpdate({
              target: [DB.schema.insights.name],
              set: { updated_at: new Date() },
            })
            .returning();

          await Bus.publish(Events.letiNewInsightCreated, {
            insightId: created.id,
            insightName: created.name,
            description: created.description,
            timestamp: new Date().toISOString(),
          });

          letiMetadata.newInsightsCreated.push({
            insightId: created.id,
            insightName: created.name,
          });

          newInsightsCreated++;
        }

        // Process detected insights
        for (const detected of item.detectedInsights) {
          // Find or create insight
          let insightId: number;

          if (!detected.isEmergent) {
            const existing = insights.find(
              (i) => i.name === detected.insightName
            );
            if (!existing) continue;
            insightId = existing.id;
          } else {
            // Find the newly created insight
            const [found] = await tx
              .select()
              .from(DB.schema.insights)
              .where(
                eq(DB.schema.insights.name, detected.insightName.toLowerCase())
              );
            if (!found) continue;
            insightId = found.id;
          }

          // Create comment-insight relationship
          const [relationship] = await tx
            .insert(DB.schema.comment_insights)
            .values({
              comment_id: comment.id,
              insight_id: insightId,
              confidence: detected.confidence,
              detected_by: "leti",
            })
            .returning();

          commentInsightIds.push(relationship.id);
          totalDetected++;

          letiMetadata.insightsDetected.push({
            insightId,
            insightName: detected.insightName,
            confidence: detected.confidence,
            isNew: detected.isEmergent,
          });

          await Bus.publish(Events.letiInsightDetected, {
            commentId: comment.id,
            insightId,
            insightName: detected.insightName,
            confidence: detected.confidence,
            isEmergent: detected.isEmergent,
            commentInsightId: relationship.id,
            timestamp: new Date().toISOString(),
          });
        }

        // Log LETI processing for this comment
        letiMetadata.processingTimeMs = Date.now() - commentStartTime;
        await logAgentProcessing(tx, {
          jobId,
          commentId: comment.id,
          agentName: "leti",
          startTime: commentStartTime,
          success: true,
          metadata: {
            agentName: "leti",
            data: letiMetadata,
          },
        });
      }

      await Bus.publish(Events.letiCompleted, {
        totalDetected,
        newInsightsCreated,
        timestamp: new Date().toISOString(),
      });

      return { commentInsightIds, newInsightsCreated, totalDetected };
    }

    /**
     * GRO Agent - Detect intentions in comments
     */
    export async function detectIntentions(
      tx: DB.DBTransaction,
      comments: DB.Comment.Select[],
      options: {
        provider?: AI.Provider;
        performance?: AI.Performance;
        jobId?: string;
      } = {}
    ) {
      const provider = options.provider ?? DEFAULT_PROVIDER;
      const performance = options.performance ?? DEFAULT_PERFORMANCE;
      const jobId = options.jobId ?? "unknown";
      const startTime = Date.now();

      // First, fetch all intentions from the database
      const intentionsFromDb = await tx.select().from(DB.schema.intentions);

      // Create a map for quick lookup by type
      const intentionMap = new Map(intentionsFromDb.map((i) => [i.type, i]));

      // Generate prompt
      const systemPrompt = await AI.PromptTemplates.processPrompt(
        AI.PromptTemplates.TemplateName.INTENTION_DETECTION,
        {
          comments: comments.map((c) => c.content),
          intentionTypes: intentionsFromDb.map((i) => i.type),
        }
      );

      // Generate analysis
      const schema = AI.Schemas.createIntentionDetectionSchema();

      let results: Array<{
        commentIndex: number;
        primaryIntention:
          | "resolve"
          | "complain"
          | "compare"
          | "cancel"
          | "inquire"
          | "praise"
          | "suggest"
          | "other";
        secondaryIntentions: Array<
          | "resolve"
          | "complain"
          | "compare"
          | "cancel"
          | "inquire"
          | "praise"
          | "suggest"
          | "other"
        >;
        confidence: number;
        reasoning: string;
        contextFactors: string;
      }> = [];

      try {
        const response = await AI.generateObject({
          provider,
          performance,
          schema,
          messages: [
            AI.message("system", systemPrompt),
            AI.message(
              "user",
              "Identify the primary intention behind each comment."
            ),
          ],
          temperature: 0.3,
        });
        results = (response.results || []).map((r) => ({
          commentIndex: r.commentIndex,
          primaryIntention: r.primaryIntention,
          secondaryIntentions: r.secondaryIntentions || [],
          confidence: r.confidence,
          reasoning: r.reasoning,
          contextFactors: r.contextFactors,
        }));
      } catch (error) {
        logger.error(
          {
            operation: "detectIntentions",
            error: error instanceof Error ? error.message : error,
            commentCount: comments.length,
          },
          "Failed to generate intention detection"
        );

        // If AI fails, return empty results rather than crashing
        if (error instanceof AI.NoObjectGeneratedError) {
          logger.warn(
            "AI failed to generate intentions, returning empty results"
          );
          results = [];
        } else {
          throw new Errors.AnalysisError(
            {
              phase: "ai_generation",
              agent: "gro",
              commentCount: comments.length,
              provider,
              originalError:
                error instanceof Error ? error.message : String(error),
            },
            { cause: error }
          );
        }
      }

      // Process results
      const commentIntentionIds: string[] = [];

      for (const item of results) {
        const comment = comments[item.commentIndex];
        if (!comment) continue;

        const commentStartTime = Date.now();
        const groMetadata: SharedTypes.Domain.AgentLogs.GroMetadata = {
          commentId: comment.id,
          intentionDetected: null,
          processingTimeMs: 0,
          provider,
          performance,
        };

        // Find the intention ID from our map
        const primaryIntentionData = intentionMap.get(item.primaryIntention);
        if (!primaryIntentionData) {
          logger.warn(
            { primaryIntention: item.primaryIntention },
            "Primary intention type not found in database"
          );
          continue;
        }

        logger.info({ item, comment }, "Intention detected");

        const [intention] = await tx
          .insert(DB.schema.comment_intentions)
          .values({
            comment_id: comment.id,
            intention_id: primaryIntentionData.id,
            primary_intention: item.primaryIntention,
            secondary_intentions: item.secondaryIntentions || [],
            confidence: item.confidence,
            reasoning: item.reasoning,
            context_factors: item.contextFactors,
          })
          .returning();

        commentIntentionIds.push(intention.id);

        groMetadata.intentionDetected = {
          intentionId: primaryIntentionData.id,
          primaryIntention: item.primaryIntention,
          secondaryIntentions: item.secondaryIntentions || [],
          confidence: item.confidence,
        };

        await Bus.publish(Events.groIntentionDetected, {
          commentId: comment.id,
          commentIntentionId: intention.id,
          primaryIntention: item.primaryIntention,
          secondaryIntentions: item.secondaryIntentions,
          confidence: item.confidence,
          timestamp: new Date().toISOString(),
        });

        // Log GRO processing for this comment
        groMetadata.processingTimeMs = Date.now() - commentStartTime;
        await logAgentProcessing(tx, {
          jobId,
          commentId: comment.id,
          agentName: "gro",
          startTime: commentStartTime,
          success: true,
          metadata: {
            agentName: "gro",
            data: groMetadata,
          },
        });
      }

      await Bus.publish(Events.groCompleted, {
        totalProcessed: results.length,
        timestamp: new Date().toISOString(),
      });

      return { commentIntentionIds };
    }

    /**
     * PIX Agent - Analyze sentiment for each comment-insight pair using PIXE scale
     */
    export async function analyzeSentiment(
      tx: DB.DBTransaction,
      comments: DB.Comment.Select[],
      commentInsightIds: string[],
      sentimentLevels: DB.SentimentLevel.Select[],
      options: {
        provider?: AI.Provider;
        performance?: AI.Performance;
        jobId?: string;
      } = {}
    ) {
      if (commentInsightIds.length === 0) return { sentimentsAnalyzed: 0 };

      const provider = options.provider ?? DEFAULT_PROVIDER;
      const performance = options.performance ?? DEFAULT_PERFORMANCE;
      const jobId = options.jobId ?? "unknown";
      const startTime = Date.now();

      // Create a map for quick sentiment level lookup
      const sentimentLevelMap = new Map(
        sentimentLevels.map((s) => [s.level, s])
      );

      // Fetch comment-insight pairs with insight names and IDs
      const pairs = await tx
        .select({
          id: DB.schema.comment_insights.id,
          commentId: DB.schema.comment_insights.comment_id,
          insightId: DB.schema.insights.id,
          insightName: DB.schema.insights.name,
        })
        .from(DB.schema.comment_insights)
        .innerJoin(
          DB.schema.insights,
          eq(DB.schema.insights.id, DB.schema.comment_insights.insight_id)
        )
        .where(inArray(DB.schema.comment_insights.id, commentInsightIds));

      // Map comments by ID for quick lookup
      const commentMap = new Map(comments.map((c) => [c.id, c]));

      // Prepare pairs for sentiment analysis
      const commentInsightPairs = pairs.map((pair, index) => ({
        commentIndex: index,
        comment: commentMap.get(pair.commentId!)?.content || "",
        insightName: pair.insightName,
      }));

      // Generate prompt with sentiment levels
      const systemPrompt = await AI.PromptTemplates.processPrompt(
        AI.PromptTemplates.TemplateName.SENTIMENT_ANALYSIS,
        {
          commentInsightPairs,
          sentimentLevels: sentimentLevels.map((s) => ({
            level: s.level,
            name: s.name,
            description: s.description,
            severity: s.severity,
            intensityValue: s.intensity_value,
          })),
        }
      );

      // Generate analysis with PIXE scale
      const schema = AI.Schemas.createSentimentAnalysisSchema({
        commentInsightPairs: commentInsightPairs.map((p, i) => ({
          commentIndex: i,
          insightName: p.insightName,
        })),
        sentimentLevels: sentimentLevels.map((s) => ({
          level: s.level,
          name: s.name,
          severity: s.severity,
        })),
      });

      let results: Array<{
        commentIndex: number;
        insightName: string;
        sentimentLevel: string;
        confidence: number;
        emotionalDrivers: string[];
        reasoning: string;
      }> = [];

      try {
        const response = await AI.generateObject({
          provider,
          performance,
          schema,
          messages: [
            AI.message("system", systemPrompt),
            AI.message(
              "user",
              "Analyze the sentiment for each insight within its comment context."
            ),
          ],
          temperature: 0.3,
        });
        results = (response.results || []).map((r) => ({
          commentIndex: r.commentIndex,
          insightName: r.insightName,
          sentimentLevel: r.sentimentLevel,
          confidence: r.confidence,
          emotionalDrivers: r.emotionalDrivers || [],
          reasoning: r.reasoning,
        }));
      } catch (error) {
        logger.error(
          {
            operation: "analyzeSentiment",
            error: error instanceof Error ? error.message : error,
            pairsCount: commentInsightPairs.length,
          },
          "Failed to generate sentiment analysis"
        );

        // If AI fails, return empty results rather than crashing
        if (error instanceof AI.NoObjectGeneratedError) {
          logger.warn(
            "AI failed to generate sentiments, returning empty results"
          );
          results = [];
        } else {
          throw new Errors.AnalysisError(
            {
              phase: "ai_generation",
              agent: "pix",
              commentCount: comments.length,
              provider,
              originalError:
                error instanceof Error ? error.message : String(error),
            },
            { cause: error }
          );
        }
      }

      // Update comment-insight records with sentiment data
      let sentimentsAnalyzed = 0;

      // Group results by comment for logging
      const resultsByComment = new Map<string, typeof results>();
      for (const item of results) {
        const pair = pairs[item.commentIndex];
        if (!pair || !pair.commentId) continue;

        if (!resultsByComment.has(pair.commentId)) {
          resultsByComment.set(pair.commentId, []);
        }
        resultsByComment.get(pair.commentId)!.push(item);
      }

      for (const item of results) {
        const pair = pairs[item.commentIndex];
        if (!pair) continue;

        // Find the sentiment level data
        const sentimentLevelData = sentimentLevelMap.get(
          item.sentimentLevel as DB.SentimentLevel.Select["level"]
        );
        if (!sentimentLevelData) {
          logger.warn(
            { sentimentLevel: item.sentimentLevel },
            "Sentiment level not found in database"
          );
          continue;
        }

        // Update the comment-insight relationship with PIXE sentiment data
        await tx
          .update(DB.schema.comment_insights)
          .set({
            sentiment_level_id: sentimentLevelData.id,
            sentiment_confidence: item.confidence,
            emotional_drivers: item.emotionalDrivers,
            sentiment_reasoning: item.reasoning,
            updated_at: new Date(),
          })
          .where(eq(DB.schema.comment_insights.id, pair.id));

        sentimentsAnalyzed++;

        await Bus.publish(Events.pixSentimentAnalyzed, {
          commentId: pair.commentId!,
          commentInsightId: pair.id,
          insightName: item.insightName,
          sentimentLevel: item.sentimentLevel,
          confidence: item.confidence,
          emotionalDrivers: item.emotionalDrivers,
          reasoning: item.reasoning,
          intensityValue: sentimentLevelData.intensity_value,
          timestamp: new Date().toISOString(),
        });
      }

      // Log PIX processing per comment
      for (const [commentId, commentResults] of resultsByComment) {
        const commentStartTime = Date.now();
        const pixMetadata: SharedTypes.Domain.AgentLogs.PixMetadata = {
          commentId,
          sentimentsAnalyzed: [],
          processingTimeMs: 0,
          provider,
          performance,
        };

        for (const result of commentResults) {
          const pair = pairs[result.commentIndex];
          if (!pair) continue;

          const sentimentLevelData = sentimentLevelMap.get(
            result.sentimentLevel as DB.SentimentLevel.Select["level"]
          );

          if (sentimentLevelData) {
            pixMetadata.sentimentsAnalyzed.push({
              insightId: pair.insightId,
              insightName: result.insightName,
              sentimentLevelId: sentimentLevelData.id,
              sentimentLevel: result.sentimentLevel,
              confidence: result.confidence,
              emotionalDrivers: result.emotionalDrivers || [],
            });
          }
        }

        pixMetadata.processingTimeMs = Date.now() - commentStartTime;
        await logAgentProcessing(tx, {
          jobId,
          commentId,
          agentName: "pix",
          startTime: commentStartTime,
          success: true,
          metadata: {
            agentName: "pix",
            data: pixMetadata,
          },
        });
      }

      await Bus.publish(Events.pixCompleted, {
        totalAnalyzed: sentimentsAnalyzed,
        timestamp: new Date().toISOString(),
      });

      return { sentimentsAnalyzed };
    }
  }

  /**
   * Main Worker
   */
  export async function createWorker() {
    const { Queues } = await import("../index");
    return Queues.create.createWorker<
      typeof Queues.Names.ANALYZE_COMMENTS_BATCH,
      Types.JobData
    >(Names.ANALYZE_COMMENTS_BATCH, async (job) => {
      const startTime = Date.now();
      const jobId = job.id ?? "unknown";

      // Emit job started
      await Bus.publish(Events.jobStarted, {
        jobId,
        commentIds: job.data.commentIds,
        timestamp: new Date().toISOString(),
      });

      // Update state: initializing
      await Bus.publish(Events.stateChanged, {
        jobId,
        state: "initializing",
        progress: 0,
        timestamp: new Date().toISOString(),
        commentIds: job.data.commentIds,
      });

      try {
        const result = await DB.executeTransaction(async (tx) => {
          // Phase 1: Fetch data
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "fetching_data",
            progress: 10,
            timestamp: new Date().toISOString(),
            commentIds: job.data.commentIds,
          });

          const data = await Processing.fetchData(tx, job.data.commentIds);

          // Phase 2: LETI - Detect insights
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "analyzing",
            progress: 20,
            timestamp: new Date().toISOString(),
            commentIds: job.data.commentIds,
            currentCommentIndex: 0,
            totalComments: data.comments.length,
          });

          await Bus.publish(Events.letiStarted, {
            commentCount: data.comments.length,
            existingInsightCount: data.insights.length,
            timestamp: new Date().toISOString(),
          });

          const letiResults = await Processing.detectInsights(tx, data, {
            jobId,
          });

          // Phase 3: GRO - Detect intentions
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "analyzing",
            progress: 50,
            timestamp: new Date().toISOString(),
            commentIds: job.data.commentIds,
            currentCommentIndex: 0,
            totalComments: data.comments.length,
          });

          await Bus.publish(Events.groStarted, {
            commentCount: data.comments.length,
            timestamp: new Date().toISOString(),
          });

          const groResults = await Processing.detectIntentions(
            tx,
            data.comments,
            { jobId }
          );

          // Phase 4: PIX - Analyze sentiment
          await Bus.publish(Events.stateChanged, {
            jobId,
            state: "analyzing",
            progress: 75,
            timestamp: new Date().toISOString(),
            commentIds: job.data.commentIds,
            currentCommentIndex: 0,
            totalComments: data.comments.length,
          });

          await Bus.publish(Events.pixStarted, {
            pairsToAnalyze: letiResults.commentInsightIds.length,
            timestamp: new Date().toISOString(),
          });

          const pixResults = await Processing.analyzeSentiment(
            tx,
            data.comments,
            letiResults.commentInsightIds,
            data.sentimentLevels,
            { jobId }
          );

          // Compile final results
          const processingResult: Types.ProcessingResult = {
            processedComments: data.comments.length,
            matchedInsights:
              letiResults.totalDetected - letiResults.newInsightsCreated,
            createdInsights: letiResults.newInsightsCreated,
            detectedInsights: letiResults.totalDetected,
            newInsightsCreated: letiResults.newInsightsCreated,
            intentionsDetected: groResults.commentIntentionIds.length,
            sentimentsAnalyzed: pixResults.sentimentsAnalyzed,
            commentInsightIds: letiResults.commentInsightIds,
            commentIntentionIds: groResults.commentIntentionIds,
          };

          return processingResult;
        });

        // Job completed successfully
        await Bus.publish(Events.stateChanged, {
          jobId,
          state: "completed",
          progress: 100,
          commentIds: job.data.commentIds,
          details: {
            processedComments: result.processedComments,
            matchedInsights: result.matchedInsights,
            createdInsights: result.createdInsights,
            relationships: result.commentInsightIds.map(() => ({
              commentId: "", // Would need to fetch if needed
              insightId: 0, // Would need to fetch if needed
              isNew: false,
            })),
          },
          timestamp: new Date().toISOString(),
        });

        await Bus.publish(Events.jobCompleted, {
          jobId,
          result: {
            processedComments: result.processedComments,
            matchedInsights: result.matchedInsights,
            createdInsights: result.createdInsights,
          },
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });

        logger.info(
          {
            jobId,
            ...result,
            duration: Date.now() - startTime,
          },
          "Comment analysis completed"
        );

        return result;
      } catch (error) {
        const errorContext: Record<string, any> = {
          jobData: job.data,
          commentIds: job.data.commentIds,
          commentCount: job.data.commentIds.length,
        };

        // Add specific error context
        if (Errors.AnalysisError.isInstance(error)) {
          errorContext.analysisPhase = error.data.phase;
          errorContext.agent = error.data.agent;
          errorContext.provider = error.data.provider;
        }

        // Process error
        const errorResult = WorkerErrors.processWorkerError(
          error,
          jobId,
          errorContext,
          startTime
        );

        // Publish error events
        await Bus.publish(Events.jobFailed, {
          jobId,
          error: errorResult.summary,
          errorType: errorResult.error.name,
          timestamp: new Date().toISOString(),
          errorContext: errorResult.context,
          originalError: errorResult,
        });

        await Bus.publish(Events.stateChanged, {
          jobId,
          state: "failed",
          progress: 0,
          commentIds: job.data.commentIds,
          details: {
            error: {
              name: errorResult.error.name,
              message: errorResult.error.message,
              stack: errorResult.error.stack,
            },
            chain: errorResult.chain.map((c) => c.message),
            summary: errorResult.summary,
          },
          timestamp: new Date().toISOString(),
        });

        logger.error(
          {
            jobId,
            errorResult,
            duration: errorResult.duration,
          },
          `Comment analysis job failed: ${errorResult.summary}`
        );

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
