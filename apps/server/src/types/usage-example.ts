/**
 * Example of how to use SharedTypes in the existing codebase
 * This file demonstrates the integration patterns
 */

import { SharedTypes } from "./SharedTypes";
import type { ServerWebSocket } from "bun";

// ============================================
// EXAMPLE 1: WebSocket Server Integration
// ============================================

class TypedWebSocketServer {
  private connections = new Set<ServerWebSocket>();

  // Handle incoming client messages with type safety
  handleMessage(ws: ServerWebSocket, message: string | Buffer) {
    try {
      const data = SharedTypes.WebSocket.Client.MessageSchema.parse(
        JSON.parse(message.toString())
      );

      switch (data.type) {
        case "subscribe:jobs":
          this.handleSubscription(ws, data.jobIds);
          break;
        case "unsubscribe:jobs":
          this.handleUnsubscription(ws, data.jobIds);
          break;
        case "ping":
          this.sendPong(ws);
          break;
      }
    } catch (error) {
      this.sendError(ws, error instanceof Error ? error.message : "Invalid message");
    }
  }

  // Send typed messages to client
  sendMessage(ws: ServerWebSocket, message: SharedTypes.WebSocket.Server.Message) {
    ws.send(JSON.stringify(message));
  }

  // Send specific message types
  sendJobStarted(ws: ServerWebSocket, jobId: string, commentIds: string[]) {
    const message: SharedTypes.WebSocket.Server.JobStarted = {
      type: "job:started",
      timestamp: new Date().toISOString(),
      data: {
        jobId,
        commentIds,
        timestamp: new Date().toISOString(),
      },
    };
    this.sendMessage(ws, message);
  }

  sendStateChanged(
    ws: ServerWebSocket,
    jobId: string,
    state: SharedTypes.Domain.Job.State,
    progress: number
  ) {
    const message: SharedTypes.WebSocket.Server.StateChanged = {
      type: "state:changed",
      timestamp: new Date().toISOString(),
      data: {
        jobId,
        state,
        progress,
        timestamp: new Date().toISOString(),
      },
    };
    this.sendMessage(ws, message);
  }

  private handleSubscription(ws: ServerWebSocket, jobIds?: string[]) {
    // Implementation
  }

  private handleUnsubscription(ws: ServerWebSocket, jobIds?: string[]) {
    // Implementation
  }

  private sendPong(ws: ServerWebSocket) {
    const message: SharedTypes.WebSocket.Server.Pong = {
      type: "pong",
      timestamp: new Date().toISOString(),
      data: {
        stats: {
          totalConnections: this.connections.size,
          totalSubscriptions: 0, // Get from subscription manager
        },
      },
    };
    this.sendMessage(ws, message);
  }

  private sendError(ws: ServerWebSocket, errorMessage: string) {
    const message: SharedTypes.WebSocket.Server.Error = {
      type: "error",
      timestamp: new Date().toISOString(),
      data: {
        message: errorMessage,
      },
    };
    this.sendMessage(ws, message);
  }
}

// ============================================
// EXAMPLE 2: API Endpoint Integration
// ============================================

import { publicProcedure, router } from "@/lib/trpc";

const typedProcessingRouter = router({
  categorizeComments: publicProcedure
    .input(SharedTypes.API.Processing.CategorizeInputSchema)
    .mutation(async ({ input }): Promise<SharedTypes.API.Processing.CategorizeResponse> => {
      // input is now fully typed as CategorizeInput
      const { commentIds, metadata } = input;

      // Process comments...
      
      return {
        success: true,
        message: `Queued ${commentIds.length} comments for processing`,
        details: {
          totalComments: commentIds.length,
          batchSize: 20,
          jobsCreated: Math.ceil(commentIds.length / 20),
          batches: [],
        },
      };
    }),
});

const typedCommentsRouter = router({
  create: publicProcedure
    .input(SharedTypes.Domain.Comment.CreateManyInputSchema)
    .mutation(async ({ input }): Promise<SharedTypes.API.Comments.CreateResponse> => {
      // Create comments in database...
      
      return {
        success: true,
        message: "Comments created successfully",
        commentIds: [],
        comments: [],
      };
    }),

  list: publicProcedure
    .input(SharedTypes.Domain.Comment.ListInputSchema)
    .query(async ({ input }): Promise<SharedTypes.API.Comments.ListResponse> => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      // Fetch from database...

      return {
        comments: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      };
    }),
});

// ============================================
// EXAMPLE 3: Event Bus Integration
// ============================================

import { Bus } from "@/bus";

class TypedEventEmitter {
  // Emit WebSocket-ready events
  emitJobStarted(jobId: string, commentIds: string[]) {
    const eventData: SharedTypes.WebSocket.Server.JobStarted["data"] = {
      jobId,
      commentIds,
      timestamp: new Date().toISOString(),
    };

    // Use with existing Bus system
    Bus.publish(
      Bus.event("job:started", SharedTypes.WebSocket.Server.JobStartedSchema.shape.data),
      eventData
    );
  }

  emitStateChanged(jobId: string, state: SharedTypes.Domain.Job.State, progress: number) {
    const eventData: SharedTypes.WebSocket.Server.StateChanged["data"] = {
      jobId,
      state,
      progress,
      timestamp: new Date().toISOString(),
    };

    Bus.publish(
      Bus.event("state:changed", SharedTypes.WebSocket.Server.StateChangedSchema.shape.data),
      eventData
    );
  }

  emitInsightCreated(insightId: number, name: string, aiGenerated: boolean) {
    const eventData: SharedTypes.WebSocket.Server.InsightCreated["data"] = {
      insightId,
      name,
      aiGenerated,
      timestamp: new Date().toISOString(),
    };

    Bus.publish(
      Bus.event("insight:created", SharedTypes.WebSocket.Server.InsightCreatedSchema.shape.data),
      eventData
    );
  }
}

// ============================================
// EXAMPLE 4: Type Guards Usage
// ============================================

function processWebSocketMessage(message: SharedTypes.WebSocket.Server.Message) {
  // Use type guards for specific message handling
  if (SharedTypes.Utils.isJobStartedMessage(message)) {
    console.log(`Job ${message.data.jobId} started with ${message.data.commentIds.length} comments`);
  } else if (SharedTypes.Utils.isJobCompletedMessage(message)) {
    console.log(`Job ${message.data.jobId} completed in ${message.data.duration}ms`);
    console.log(`Processed: ${message.data.result.processedComments} comments`);
    console.log(`Matched: ${message.data.result.matchedInsights} insights`);
    console.log(`Created: ${message.data.result.createdInsights} new insights`);
  } else if (SharedTypes.Utils.isJobFailedMessage(message)) {
    console.error(`Job ${message.data.jobId} failed: ${message.data.error}`);
    if (message.data.errorContext) {
      console.error("Error context:", message.data.errorContext);
    }
  } else if (SharedTypes.Utils.isStateChangedMessage(message)) {
    updateProgressBar(message.data.progress);
    updateStateIndicator(message.data.state);
  }
}

function updateProgressBar(progress: number) {
  // Update UI
}

function updateStateIndicator(state: SharedTypes.Domain.Job.State) {
  // Update UI based on state
  switch (state) {
    case "initializing":
      // Show initializing state
      break;
    case "fetching_data":
      // Show fetching state
      break;
    case "analyzing":
      // Show analyzing state
      break;
    case "creating_insights":
      // Show creating insights state
      break;
    case "creating_relationships":
      // Show creating relationships state
      break;
    case "completed":
      // Show completed state
      break;
    case "failed":
      // Show failed state
      break;
  }
}

// ============================================
// EXAMPLE 5: Frontend Client Usage
// ============================================

class TypedWebSocketClient {
  private ws: WebSocket | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        // Parse and validate message
        const message = SharedTypes.WebSocket.Server.MessageSchema.parse(
          JSON.parse(event.data)
        );

        // Process with full type safety
        this.handleServerMessage(message);
      } catch (error) {
        console.error("Invalid server message:", error);
      }
    };
  }

  // Send typed messages to server
  send(message: SharedTypes.WebSocket.Client.Message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Helper methods for common operations
  subscribeToJobs(jobIds: string[]) {
    this.send({
      type: "subscribe:jobs",
      jobIds,
    });
  }

  unsubscribeFromJobs(jobIds: string[]) {
    this.send({
      type: "unsubscribe:jobs",
      jobIds,
    });
  }

  ping() {
    this.send({
      type: "ping",
    });
  }

  private handleServerMessage(message: SharedTypes.WebSocket.Server.Message) {
    // Type-safe message handling
    switch (message.type) {
      case "connection:established":
        console.log("Connected!", message.data.stats);
        break;
      case "job:started":
        console.log(`Job ${message.data.jobId} started`);
        break;
      case "job:completed":
        console.log(`Job ${message.data.jobId} completed`, message.data.result);
        break;
      case "state:changed":
        console.log(`Job ${message.data.jobId} state: ${message.data.state} (${message.data.progress}%)`);
        break;
      case "insight:created":
        console.log(`New insight created: ${message.data.name}`);
        break;
      // ... handle other message types
    }
  }
}

// ============================================
// EXAMPLE 6: React Hook Integration
// ============================================

import { useState, useEffect, useCallback } from "react";

function useTypedWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SharedTypes.WebSocket.Server.Message | null>(null);

  const sendMessage = useCallback((message: SharedTypes.WebSocket.Client.Message) => {
    // Send implementation
  }, []);

  const subscribeToJobs = useCallback((jobIds: string[]) => {
    sendMessage({
      type: "subscribe:jobs",
      jobIds,
    });
  }, [sendMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribeToJobs,
  };
}

// Usage in React component
function JobProgressComponent({ jobIds }: { jobIds: string[] }) {
  const { lastMessage, subscribeToJobs } = useTypedWebSocket("ws://localhost:3000/ws");
  const [jobStates, setJobStates] = useState<Map<string, SharedTypes.Domain.Job.State>>(new Map());

  useEffect(() => {
    subscribeToJobs(jobIds);
  }, [jobIds, subscribeToJobs]);

  useEffect(() => {
    if (lastMessage && SharedTypes.Utils.isStateChangedMessage(lastMessage)) {
      setJobStates(prev => {
        const updated = new Map(prev);
        updated.set(lastMessage.data.jobId, lastMessage.data.state);
        return updated;
      });
    }
  }, [lastMessage]);

  return (
    <div>
      {Array.from(jobStates.entries()).map(([jobId, state]) => (
        <div key={jobId}>
          Job {jobId}: {state}
        </div>
      ))}
    </div>
  );
}

export {}; // Make this a module