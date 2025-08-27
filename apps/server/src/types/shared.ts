import { z } from "zod";

/**
 * Shared Types Namespace
 * Contains all types that need to be shared between frontend and backend
 * These types are organized by domain and purpose
 */
export namespace SharedTypes {
  /**
   * Domain Types - Core entities
   */
  export namespace Domain {
    /**
     * Comment Types
     */
    export namespace Comment {
      export const Schema = z.object({
        id: z.string().uuid(),
        content: z.string().min(1),
        created_at: z.date().or(z.string().datetime()),
        updated_at: z.date().or(z.string().datetime()),
      });

      export type Entity = z.infer<typeof Schema>;

      export const CreateInputSchema = z.object({
        content: z.string().min(1),
      });

      export type CreateInput = z.infer<typeof CreateInputSchema>;

      export const CreateManyInputSchema = z.object({
        comments: z.array(CreateInputSchema).min(1),
      });

      export type CreateManyInput = z.infer<typeof CreateManyInputSchema>;

      export const FilterSchema = z.object({
        businessUnit: z.string().optional(),
        source: z.string().optional(),
      });

      export type Filter = z.infer<typeof FilterSchema>;

      // Extended filter schema with all relationships
      export const ExtendedFilterSchema = z.object({
        // Basic filters
        source: z.string().optional(), // From comments table
        businessUnit: z.string().optional(), // From insights table via JOIN
        // Date range filters
        startDate: z.date().or(z.string().datetime()).optional(),
        endDate: z.date().or(z.string().datetime()).optional(),
        // Insight filters
        insightId: z.number().optional(),
        insightIds: z.array(z.number()).optional(),
        hasInsights: z.boolean().optional(),
        // Intention filters
        intentionId: z.number().optional(),
        intentionType: z.string().optional(),
        hasIntention: z.boolean().optional(),
        // Sentiment filters
        sentimentLevelId: z.number().optional(),
        sentimentLevels: z.array(z.string()).optional(),
        sentimentSeverity: z.string().optional(),
        minConfidence: z.number().min(0).max(10).optional(),
      });

      export type ExtendedFilter = z.infer<typeof ExtendedFilterSchema>;

      export const ListInputSchema = z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          filter: FilterSchema.optional(),
        })
        .optional();

      export type ListInput = z.infer<typeof ListInputSchema>;

      export const ExtendedListInputSchema = z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        filter: ExtendedFilterSchema.optional(),
        includeRelations: z.boolean().default(false),
        sortBy: z.enum(["created_at", "updated_at", "sentiment_intensity", "confidence"]).default("created_at"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      });

      export type ExtendedListInput = z.infer<typeof ExtendedListInputSchema>;

      export const WithInsightsSchema = z.object({
        comment: Schema,
        insights: z.array(z.lazy(() => Domain.Insight.Schema)),
      });

      export type WithInsights = z.infer<typeof WithInsightsSchema>;

      export const GetByIdsInputSchema = z.object({
        ids: z.array(z.string().uuid()),
      });

      export type GetByIdsInput = z.infer<typeof GetByIdsInputSchema>;

      // Extended comment with full relations
      export const WithFullRelationsSchema = Schema.extend({
        insights: z.array(z.object({
          id: z.number(),
          name: z.string(),
          content: z.string(),
          description: z.string(),
          ai_generated: z.boolean(),
          confidence: z.number().nullable(),
          sentiment_level_id: z.number().nullable(),
          sentiment_confidence: z.number().nullable(),
          emotional_drivers: z.array(z.string()).nullable(),
          sentiment_reasoning: z.string().nullable(),
          sentiment_level: z.string().nullable(),
          sentiment_name: z.string().nullable(),
          sentiment_severity: z.string().nullable(),
          sentiment_intensity: z.number().nullable(),
        })).optional(),
        intention: z.object({
          id: z.number(),
          type: z.string(),
          name: z.string(),
          description: z.string(),
          primary_intention: z.string(),
          secondary_intentions: z.array(z.string()).nullable(),
          confidence: z.number(),
          reasoning: z.string().nullable(),
          context_factors: z.string().nullable(),
        }).nullable().optional(),
      });

      export type WithFullRelations = z.infer<typeof WithFullRelationsSchema>;
    }

    /**
     * Insight Types
     */
    export namespace Insight {
      export const Schema = z.object({
        id: z.number(),
        name: z.string(),
        content: z.string(),
        description: z.string(),
        ai_generated: z.boolean(),
        created_at: z.date().or(z.string().datetime()),
        updated_at: z.date().or(z.string().datetime()),
      });

      export type Entity = z.infer<typeof Schema>;

      export const WithCommentCountSchema = Schema.extend({
        commentCount: z.number(),
      });

      export type WithCommentCount = z.infer<typeof WithCommentCountSchema>;

      export const ListInputSchema = z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          onlyAiGenerated: z.boolean().optional(),
        })
        .optional();

      export type ListInput = z.infer<typeof ListInputSchema>;

      export const WithCommentsSchema = z.object({
        insight: Schema,
        comments: z.array(Domain.Comment.Schema),
      });

      export type WithComments = z.infer<typeof WithCommentsSchema>;

      export const StatsSchema = z.object({
        totalInsights: z.number(),
        aiGeneratedInsights: z.number(),
        manualInsights: z.number(),
        avgCommentsPerInsight: z.number(),
        recentInsights: z.number(),
        aiGenerationRate: z.number(),
      });

      export type Stats = z.infer<typeof StatsSchema>;

      // Para nuevos insights creados por IA
      export const NewInsightSchema = z.object({
        name: z.string(),
        description: z.string(),
      });

      export type NewInsight = z.infer<typeof NewInsightSchema>;

      export const GetByIdsInputSchema = z.object({
        ids: z.array(z.number()),
      });

      export type GetByIdsInput = z.infer<typeof GetByIdsInputSchema>;
    }

    /**
     * Agent Processing Logs Types
     */
    export namespace AgentLogs {
      export const AgentNameSchema = z.enum(["leti", "gro", "pix"]);

      export type AgentName = z.infer<typeof AgentNameSchema>;

      // Agent-specific metadata schemas
      export const LetiMetadataSchema = z.object({
        commentId: z.string().uuid(),
        insightsDetected: z
          .array(
            z.object({
              insightId: z.number(),
              insightName: z.string(),
              confidence: z.number(),
              isNew: z.boolean(),
            })
          )
          .default([]),
        newInsightsCreated: z
          .array(
            z.object({
              insightId: z.number(),
              insightName: z.string(),
            })
          )
          .default([]),
        processingTimeMs: z.number(),
        provider: z.string(),
        performance: z.string(),
      });

      export type LetiMetadata = z.infer<typeof LetiMetadataSchema>;

      export const GroMetadataSchema = z.object({
        commentId: z.string().uuid(),
        intentionDetected: z
          .object({
            intentionId: z.number(),
            primaryIntention: z.string(),
            secondaryIntentions: z.array(z.string()).default([]),
            confidence: z.number(),
          })
          .nullable(),
        processingTimeMs: z.number(),
        provider: z.string(),
        performance: z.string(),
      });

      export type GroMetadata = z.infer<typeof GroMetadataSchema>;

      export const PixMetadataSchema = z.object({
        commentId: z.string().uuid(),
        sentimentsAnalyzed: z
          .array(
            z.object({
              insightId: z.number(),
              insightName: z.string(),
              sentimentLevelId: z.number(),
              sentimentLevel: z.string(),
              confidence: z.number(),
              emotionalDrivers: z.array(z.string()).default([]),
            })
          )
          .default([]),
        processingTimeMs: z.number(),
        provider: z.string(),
        performance: z.string(),
      });

      export type PixMetadata = z.infer<typeof PixMetadataSchema>;

      // Discriminated union for agent metadata
      export const AgentMetadataSchema = z.discriminatedUnion("agentName", [
        z.object({
          agentName: z.literal("leti"),
          data: LetiMetadataSchema,
        }),
        z.object({
          agentName: z.literal("gro"),
          data: GroMetadataSchema,
        }),
        z.object({
          agentName: z.literal("pix"),
          data: PixMetadataSchema,
        }),
      ]);

      export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

      export const LogEntrySchema = z.object({
        id: z.string().uuid(),
        job_id: z.string(),
        comment_id: z.string().uuid(),
        agent_name: AgentNameSchema,
        processing_time_ms: z.number().nullable(),
        success: z.boolean(),
        error_message: z.string().nullable(),
        metadata: z.string().nullable(), // JSON string
        created_at: z.date().or(z.string().datetime()),
      });

      export type LogEntry = z.infer<typeof LogEntrySchema>;

      export const CreateLogInputSchema = z.object({
        job_id: z.string(),
        comment_id: z.string().uuid().optional().nullable(),
        agent_name: AgentNameSchema,
        processing_time_ms: z.number().optional().nullable(),
        success: z.boolean(),
        error_message: z.string().optional().nullable(),
        metadata: AgentMetadataSchema.optional(),
      });

      export type CreateLogInput = z.infer<typeof CreateLogInputSchema>;

      export const BatchLogInputSchema = z.object({
        job_id: z.string(),
        agent_name: AgentNameSchema,
        logs: z.array(
          z.object({
            comment_id: z.string().uuid(),
            processing_time_ms: z.number().optional(),
            success: z.boolean(),
            error_message: z.string().optional().nullable(),
            metadata: AgentMetadataSchema.optional(),
          })
        ),
      });

      export type BatchLogInput = z.infer<typeof BatchLogInputSchema>;

      // Helper function to stringify metadata
      export const stringifyMetadata = (
        metadata?: AgentMetadata
      ): string | null => {
        if (!metadata) return null;
        try {
          return JSON.stringify(metadata);
        } catch {
          return null;
        }
      };

      // Helper function to parse metadata
      export const parseMetadata = (
        metadataStr?: string | null
      ): AgentMetadata | null => {
        if (!metadataStr) return null;
        try {
          return JSON.parse(metadataStr);
        } catch {
          return null;
        }
      };
    }

    /**
     * Job/Processing Types
     */
    export namespace Job {
      export const StateSchema = z.enum([
        "initializing",
        "fetching_data",
        "analyzing",
        "creating_insights",
        "creating_relationships",
        "completed",
        "failed",
      ]);

      export type State = z.infer<typeof StateSchema>;

      export const ProcessingResultSchema = z.object({
        processedComments: z.number(),
        matchedInsights: z.number(),
        createdInsights: z.number(),
      });

      export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

      export const MetadataSchema = z
        .object({
          batchIndex: z.number().optional(),
          totalBatches: z.number().optional(),
          totalComments: z.number().optional(),
          source: z.string().optional(),
          priority: z.string().optional(),
        })
        .catchall(z.any());

      export type Metadata = z.infer<typeof MetadataSchema>;

      export const BatchInfoSchema = z.object({
        index: z.number(),
        size: z.number(),
        commentIds: z.array(z.string().uuid()),
      });

      export type BatchInfo = z.infer<typeof BatchInfoSchema>;
    }
  }

  /**
   * API Types - Request/Response schemas
   */
  export namespace API {
    /**
     * Common response types
     */
    export const PaginationSchema = z.object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    });

    export type Pagination = z.infer<typeof PaginationSchema>;

    export const SuccessResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
    });

    export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

    /**
     * Processing API Types
     */
    export namespace Processing {
      export const AnalyzeCommentsInputSchema = z.object({
        commentIds: z.array(z.string().uuid()).min(1),
        metadata: Domain.Job.MetadataSchema.optional(),
      });

      export type AnalyzeCommentsInput = z.infer<
        typeof AnalyzeCommentsInputSchema
      >;

      export const AnalyzeCommentsResponseSchema = SuccessResponseSchema.extend(
        {
          details: z.object({
            totalComments: z.number(),
            batchSize: z.number(),
            jobsCreated: z.number(),
            batches: z.array(Domain.Job.BatchInfoSchema),
          }),
        }
      );

      export type AnalyzeCommentsResponse = z.infer<
        typeof AnalyzeCommentsResponseSchema
      >;
    }

    /**
     * Comments API Types
     */
    export namespace Comments {
      export const CreateResponseSchema = SuccessResponseSchema.extend({
        commentIds: z.array(z.string().uuid()),
        comments: z.array(Domain.Comment.Schema),
      });

      export type CreateResponse = z.infer<typeof CreateResponseSchema>;

      export const ListResponseSchema = z.object({
        comments: z.array(Domain.Comment.Schema),
        pagination: PaginationSchema,
      });

      export type ListResponse = z.infer<typeof ListResponseSchema>;

      export const GetWithInsightsInputSchema = z.object({
        commentId: z.string().uuid(),
      });

      export type GetWithInsightsInput = z.infer<
        typeof GetWithInsightsInputSchema
      >;

      // Extended list response with full relations
      export const ExtendedListResponseSchema = z.object({
        comments: z.array(Domain.Comment.WithFullRelationsSchema),
        pagination: PaginationSchema,
      });

      export type ExtendedListResponse = z.infer<typeof ExtendedListResponseSchema>;

      // Stats by sentiment response
      export const StatsBySentimentResponseSchema = z.object({
        stats: z.array(z.object({
          level: z.string(),
          name: z.string(),
          severity: z.string(),
          intensity: z.number(),
          count: z.number(),
          avgConfidence: z.number().nullable(),
        })),
      });

      export type StatsBySentimentResponse = z.infer<typeof StatsBySentimentResponseSchema>;

      // Stats by intention response  
      export const StatsByIntentionResponseSchema = z.object({
        stats: z.array(z.object({
          type: z.string(),
          name: z.string(),
          description: z.string(),
          count: z.number(),
          avgConfidence: z.number().nullable(),
        })),
      });

      export type StatsByIntentionResponse = z.infer<typeof StatsByIntentionResponseSchema>;
    }

    /**
     * Insights API Types
     */
    export namespace Insights {
      export const ListResponseSchema = z.object({
        insights: z.array(Domain.Insight.WithCommentCountSchema),
        pagination: PaginationSchema,
      });

      export type ListResponse = z.infer<typeof ListResponseSchema>;

      export const GetWithCommentsInputSchema = z.object({
        insightId: z.number(),
      });

      export type GetWithCommentsInput = z.infer<
        typeof GetWithCommentsInputSchema
      >;

      export const StatsPerInsightResponseSchema = z.object({
        insights: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            count: z.number(),
            aiGenerated: z.boolean(),
          })
        ),
      });

      export type StatsPerInsightResponse = z.infer<
        typeof StatsPerInsightResponseSchema
      >;
    }

    export namespace AgentLogs {
      export const ListInputSchema = z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        agentName: Domain.AgentLogs.AgentNameSchema.optional(),
        success: z.boolean().optional(),
        createdAt: z.date().or(z.string().datetime()).optional(),
      });

      export type ListInput = z.infer<typeof ListInputSchema>;

      export const ListResponseSchema = z.object({
        logs: z.array(Domain.AgentLogs.LogEntrySchema),
        pagination: API.PaginationSchema,
      });

      export type ListResponse = z.infer<typeof ListResponseSchema>;
    }

    export namespace Analytics {
      export const TimeRangeSchema = z.object({
        start: z.date().or(z.string().datetime()),
        end: z.date().or(z.string().datetime()),
        granularity: z.enum(["hour", "day", "week", "month"]),
      });

      export type TimeRange = z.infer<typeof TimeRangeSchema>;

      export const PaginationParamsSchema = z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
      });

      export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

      export namespace LETI {
        export const InsightMetricsSchema = z.object({
          id: z.number(),
          name: z.string(),
          description: z.string(),
          aiGenerated: z.boolean(),
          totalComments: z.number(),
          avgConfidence: z.number(),
          confidenceDistribution: z.object({
            high: z.number(),
            medium: z.number(),
            low: z.number(),
          }),
          growthRate: z.number(),
          emergenceDate: z.date().or(z.string().datetime()),
          lastSeenDate: z.date().or(z.string().datetime()),
        });

        export type InsightMetrics = z.infer<typeof InsightMetricsSchema>;

        export const InsightTrendSchema = z.object({
          insightId: z.number(),
          insightName: z.string(),
          timeSeries: z.array(
            z.object({
              timestamp: z.date().or(z.string().datetime()),
              commentCount: z.number(),
              avgConfidence: z.number(),
              newComments: z.number(),
            })
          ),
        });

        export type InsightTrend = z.infer<typeof InsightTrendSchema>;

        export const EmergentInsightsSchema = z.object({
          insights: z.array(
            z.object({
              name: z.string(),
              firstDetected: z.date().or(z.string().datetime()),
              rapidGrowth: z.boolean(),
              commentCount: z.number(),
              avgConfidence: z.number(),
            })
          ),
        });

        export type EmergentInsights = z.infer<typeof EmergentInsightsSchema>;

        export const InsightCorrelationSchema = z.object({
          insightA: z.string(),
          insightB: z.string(),
          insightADesc: z.string(),
          insightBDesc: z.string(),
          coOccurrenceCount: z.number(),
          correlationScore: z.number(),
          confidenceCorrelation: z.number(),
        });

        export type InsightCorrelation = z.infer<
          typeof InsightCorrelationSchema
        >;

        export namespace Router {
          export const TopInsightsInputSchema = z.object({
            timeRange: TimeRangeSchema.optional(),
            limit: z.number().min(1).max(50).default(20),
            minComments: z.number().min(1).default(5),
            metric: z.enum(["volume", "growth"]).default("volume"),
          });

          export type TopInsightsInput = z.infer<typeof TopInsightsInputSchema>;

          export const InsightCorrelationsInputSchema = z.object({
            insightId: z.number().optional(),
            minCoOccurrence: z.number().min(2).default(5),
            timeRange: TimeRangeSchema.optional(),
            limit: z.number().min(1).max(20).default(10),
          });

          export type InsightCorrelationsInput = z.infer<
            typeof InsightCorrelationsInputSchema
          >;
        }
      }

      export namespace PIXE {
        export namespace Router {}
      }
    }
  }

  /**
   * WebSocket Types - Real-time communication
   */
  export namespace WebSocket {
    /**
     * Client to Server Messages
     */
    export namespace Client {
      export const MessageSchema = z.discriminatedUnion("type", [
        z.object({
          type: z.literal("subscribe:jobs"),
          jobIds: z.array(z.string()).optional(),
        }),
        z.object({
          type: z.literal("unsubscribe:jobs"),
          jobIds: z.array(z.string()).optional(),
        }),
        z.object({
          type: z.literal("ping"),
        }),
      ]);

      export type Message = z.infer<typeof MessageSchema>;

      export type MessageType = Message["type"];
    }

    /**
     * Server to Client Messages
     */
    export namespace Server {
      // Base schema for all server messages
      const BaseMessageSchema = z.object({
        type: z.string(),
        timestamp: z.string().datetime(),
      });

      // Connection Messages
      export const ConnectionEstablishedSchema = BaseMessageSchema.extend({
        type: z.literal("connection:established"),
        data: z.object({
          message: z.string(),
          stats: z.object({
            totalConnections: z.number(),
            totalSubscriptions: z.number(),
            subscriptionDetails: z.array(
              z.object({
                jobId: z.string(),
                subscribers: z.number(),
              })
            ),
          }),
        }),
      });

      export type ConnectionEstablished = z.infer<
        typeof ConnectionEstablishedSchema
      >;

      // Subscription Messages
      export const SubscriptionConfirmedSchema = BaseMessageSchema.extend({
        type: z.literal("subscription:confirmed"),
        data: z.object({
          jobIds: z.array(z.string()),
        }),
      });

      export type SubscriptionConfirmed = z.infer<
        typeof SubscriptionConfirmedSchema
      >;

      export const UnsubscriptionConfirmedSchema = BaseMessageSchema.extend({
        type: z.literal("unsubscription:confirmed"),
        data: z.object({
          jobIds: z.array(z.string()),
        }),
      });

      export type UnsubscriptionConfirmed = z.infer<
        typeof UnsubscriptionConfirmedSchema
      >;

      // Job Lifecycle Messages
      export const JobStartedSchema = BaseMessageSchema.extend({
        type: z.literal("job:started"),
        data: z.object({
          jobId: z.string(),
          commentIds: z.array(z.string()),
          timestamp: z.string().datetime(),
        }),
      });

      export type JobStarted = z.infer<typeof JobStartedSchema>;

      export const JobCompletedSchema = BaseMessageSchema.extend({
        type: z.literal("job:completed"),
        data: z.object({
          jobId: z.string(),
          result: Domain.Job.ProcessingResultSchema,
          duration: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type JobCompleted = z.infer<typeof JobCompletedSchema>;

      export const JobFailedSchema = BaseMessageSchema.extend({
        type: z.literal("job:failed"),
        data: z.object({
          jobId: z.string(),
          error: z.string(),
          errorType: z.string(),
          timestamp: z.string().datetime(),
          errorContext: z.record(z.any()).optional(),
          originalError: z.any().optional(),
        }),
      });

      export type JobFailed = z.infer<typeof JobFailedSchema>;

      // State Change Messages with type-safe details
      // Base data schema for state changes
      const StateChangeDataBase = z.object({
        jobId: z.string(),
        progress: z.number().min(0).max(100),
        timestamp: z.string().datetime(),
        commentIds: z.array(z.string()), // Track which comments are being processed
      });

      // Specific data schemas for each state
      const StateChangeDataMap = {
        initializing: StateChangeDataBase.extend({
          state: z.literal("initializing"),
        }),
        fetching_data: StateChangeDataBase.extend({
          state: z.literal("fetching_data"),
        }),
        analyzing: StateChangeDataBase.extend({
          state: z.literal("analyzing"),
          currentCommentIndex: z.number().optional(),
          totalComments: z.number().optional(),
        }),
        creating_insights: StateChangeDataBase.extend({
          state: z.literal("creating_insights"),
          processedCount: z.number().optional(),
          totalToProcess: z.number().optional(),
        }),
        creating_relationships: StateChangeDataBase.extend({
          state: z.literal("creating_relationships"),
        }),
        completed: StateChangeDataBase.extend({
          state: z.literal("completed"),
          details: z.object({
            processedComments: z.number(),
            matchedInsights: z.number(),
            createdInsights: z.number(),
            relationships: z.array(
              z.object({
                commentId: z.string(),
                insightId: z.number(),
                isNew: z.boolean(),
              })
            ),
          }),
        }),
        failed: StateChangeDataBase.extend({
          state: z.literal("failed"),
          details: z.object({
            error: z.object({
              name: z.string(),
              message: z.string(),
              stack: z.string().optional(),
            }),
            chain: z.array(z.string()),
            summary: z.string(),
          }),
        }),
      };

      // Create a discriminated union for the data field
      const StateChangeDataSchema = z.discriminatedUnion("state", [
        StateChangeDataMap.initializing,
        StateChangeDataMap.fetching_data,
        StateChangeDataMap.analyzing,
        StateChangeDataMap.creating_insights,
        StateChangeDataMap.creating_relationships,
        StateChangeDataMap.completed,
        StateChangeDataMap.failed,
      ]);

      export const StateChangedSchema = BaseMessageSchema.extend({
        type: z.literal("state:changed"),
        data: StateChangeDataSchema,
      });

      export type StateChanged = z.infer<typeof StateChangedSchema>;

      // Helper types for specific states
      export type StateChangedData = z.infer<typeof StateChangeDataSchema>;
      export type StateChangedByState<T extends Domain.Job.State> = Extract<
        StateChangedData,
        { state: T }
      >;

      // LETI Agent Messages
      export const LetiStartedSchema = BaseMessageSchema.extend({
        type: z.literal("leti:started"),
        data: z.object({
          commentCount: z.number(),
          existingInsightCount: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type LetiStarted = z.infer<typeof LetiStartedSchema>;

      export const LetiInsightDetectedSchema = BaseMessageSchema.extend({
        type: z.literal("leti:insight:detected"),
        data: z.object({
          commentId: z.string(),
          insightId: z.number(),
          insightName: z.string(),
          confidence: z.number(),
          isEmergent: z.boolean(),
          commentInsightId: z.string(), // DB ID for frontend
          timestamp: z.string().datetime(),
        }),
      });

      export type LetiInsightDetected = z.infer<
        typeof LetiInsightDetectedSchema
      >;

      export const LetiNewInsightCreatedSchema = BaseMessageSchema.extend({
        type: z.literal("leti:insight:created"),
        data: z.object({
          insightId: z.number(),
          insightName: z.string(),
          description: z.string(),
          timestamp: z.string().datetime(),
        }),
      });

      export type LetiNewInsightCreated = z.infer<
        typeof LetiNewInsightCreatedSchema
      >;

      export const LetiCompletedSchema = BaseMessageSchema.extend({
        type: z.literal("leti:completed"),
        data: z.object({
          totalDetected: z.number(),
          newInsightsCreated: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type LetiCompleted = z.infer<typeof LetiCompletedSchema>;

      // GRO Agent Messages
      export const GroStartedSchema = BaseMessageSchema.extend({
        type: z.literal("gro:started"),
        data: z.object({
          commentCount: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type GroStarted = z.infer<typeof GroStartedSchema>;

      export const GroIntentionDetectedSchema = BaseMessageSchema.extend({
        type: z.literal("gro:intention:detected"),
        data: z.object({
          commentId: z.string(),
          commentIntentionId: z.string(), // DB ID for frontend
          primaryIntention: z.string(),
          secondaryIntentions: z.array(z.string()),
          confidence: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type GroIntentionDetected = z.infer<
        typeof GroIntentionDetectedSchema
      >;

      export const GroCompletedSchema = BaseMessageSchema.extend({
        type: z.literal("gro:completed"),
        data: z.object({
          totalProcessed: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type GroCompleted = z.infer<typeof GroCompletedSchema>;

      // PIX Agent Messages
      export const PixStartedSchema = BaseMessageSchema.extend({
        type: z.literal("pix:started"),
        data: z.object({
          pairsToAnalyze: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type PixStarted = z.infer<typeof PixStartedSchema>;

      export const PixSentimentAnalyzedSchema = BaseMessageSchema.extend({
        type: z.literal("pix:sentiment:analyzed"),
        data: z.object({
          commentId: z.string(),
          commentInsightId: z.string(), // DB ID for frontend
          insightName: z.string(),
          sentimentLevel: z.string(), // PIXE scale level (e.g., doubt, concern, anger)
          confidence: z.number(), // 0-10 confidence score
          emotionalDrivers: z.array(z.string()).default([]), // Key emotional factors
          reasoning: z.string(),
          timestamp: z.string().datetime(),
          intensityValue: z.number(),
        }),
      });

      export type PixSentimentAnalyzed = z.infer<
        typeof PixSentimentAnalyzedSchema
      >;

      export const PixCompletedSchema = BaseMessageSchema.extend({
        type: z.literal("pix:completed"),
        data: z.object({
          totalAnalyzed: z.number(),
          timestamp: z.string().datetime(),
        }),
      });

      export type PixCompleted = z.infer<typeof PixCompletedSchema>;

      // Utility Messages
      export const PongSchema = BaseMessageSchema.extend({
        type: z.literal("pong"),
        data: z.object({
          stats: z.object({
            totalConnections: z.number(),
            totalSubscriptions: z.number(),
          }),
        }),
      });

      export type Pong = z.infer<typeof PongSchema>;

      export const ErrorSchema = BaseMessageSchema.extend({
        type: z.literal("error"),
        data: z.object({
          message: z.string(),
        }),
      });

      export type Error = z.infer<typeof ErrorSchema>;

      // Union of all server messages
      export const MessageSchema = z.discriminatedUnion("type", [
        ConnectionEstablishedSchema,
        SubscriptionConfirmedSchema,
        UnsubscriptionConfirmedSchema,
        JobStartedSchema,
        JobCompletedSchema,
        JobFailedSchema,
        StateChangedSchema,
        LetiStartedSchema,
        LetiInsightDetectedSchema,
        LetiNewInsightCreatedSchema,
        LetiCompletedSchema,
        GroStartedSchema,
        GroIntentionDetectedSchema,
        GroCompletedSchema,
        PixStartedSchema,
        PixSentimentAnalyzedSchema,
        PixCompletedSchema,
        PongSchema,
        ErrorSchema,
      ]);

      export type Message = z.infer<typeof MessageSchema>;
      export type MessageType = Message["type"];

      // Generic server message interface (for backwards compatibility)
      export interface GenericMessage {
        type: string;
        timestamp: string;
        data?: any;
      }
    }

    /**
     * Event Map for type-safe event handling
     */
    export type EventMap = {
      "connection:established": Server.ConnectionEstablished;
      "subscription:confirmed": Server.SubscriptionConfirmed;
      "unsubscription:confirmed": Server.UnsubscriptionConfirmed;
      "job:started": Server.JobStarted;
      "job:completed": Server.JobCompleted;
      "job:failed": Server.JobFailed;
      "state:changed": Server.StateChanged;
      "leti:started": Server.LetiStarted;
      "leti:insight:detected": Server.LetiInsightDetected;
      "leti:insight:created": Server.LetiNewInsightCreated;
      "leti:completed": Server.LetiCompleted;
      "gro:started": Server.GroStarted;
      "gro:intention:detected": Server.GroIntentionDetected;
      "gro:completed": Server.GroCompleted;
      "pix:started": Server.PixStarted;
      "pix:sentiment:analyzed": Server.PixSentimentAnalyzed;
      "pix:completed": Server.PixCompleted;
      pong: Server.Pong;
      error: Server.Error;
    };

    export type EventType = keyof EventMap;
  }

  /**
   * Error Types - Standardized error handling
   */
  export namespace Errors {
    export const ErrorContextSchema = z
      .object({
        jobId: z.string().optional(),
        commentIds: z.array(z.string()).optional(),
        insightId: z.number().optional(),
        phase: z.string().optional(),
        provider: z.string().optional(),
        originalError: z.string().optional(),
      })
      .catchall(z.any());

    export type ErrorContext = z.infer<typeof ErrorContextSchema>;

    export const ProcessingErrorSchema = z.object({
      type: z.enum([
        "DataFetchError",
        "AnalysisError",
        "InsightCreationError",
        "RelationshipCreationError",
      ]),
      message: z.string(),
      context: ErrorContextSchema,
      timestamp: z.string().datetime(),
    });

    export type ProcessingError = z.infer<typeof ProcessingErrorSchema>;
  }

  /**
   * Utility Types
   */
  export namespace Utils {
    /**
     * Extract data type from a WebSocket message
     */
    export type ExtractMessageData<T extends WebSocket.Server.Message> =
      T extends { data: infer D } ? D : never;

    /**
     * Type guard helpers
     */
    export const isJobStartedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.JobStarted => msg.type === "job:started";

    export const isJobCompletedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.JobCompleted => msg.type === "job:completed";

    export const isJobFailedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.JobFailed => msg.type === "job:failed";

    export const isStateChangedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.StateChanged => msg.type === "state:changed";

    export const isLetiInsightDetectedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.LetiInsightDetected =>
      msg.type === "leti:insight:detected";

    export const isGroIntentionDetectedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.GroIntentionDetected =>
      msg.type === "gro:intention:detected";

    export const isPixSentimentAnalyzedMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.PixSentimentAnalyzed =>
      msg.type === "pix:sentiment:analyzed";

    export const isErrorMessage = (
      msg: WebSocket.Server.Message
    ): msg is WebSocket.Server.Error => msg.type === "error";
  }
}
