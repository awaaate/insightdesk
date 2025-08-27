import { Bus } from "@/bus";
import { SharedTypes } from "@/types/shared";
import type { ServerWebSocket } from "bun";
import { AnalyzeComments } from "@/queues/workers/analyze-comments";
/**
 * WebSocket namespace for real-time event streaming
 */
export namespace WebSocketServer {
  /**
   * Connection management namespace
   */
  export namespace Connections {
    const connections = new Set<ServerWebSocket>();
    const subscriptions = new Map<string, Set<ServerWebSocket>>(); // jobId -> connections

    export function add(ws: ServerWebSocket): void {
      connections.add(ws);
    }

    export function remove(ws: ServerWebSocket): void {
      connections.delete(ws);
      // Remove from all subscriptions
      for (const [jobId, subs] of subscriptions.entries()) {
        subs.delete(ws);
        if (subs.size === 0) {
          subscriptions.delete(jobId);
        }
      }
    }

    export function subscribe(jobId: string, ws: ServerWebSocket): void {
      if (!subscriptions.has(jobId)) {
        subscriptions.set(jobId, new Set());
      }
      subscriptions.get(jobId)!.add(ws);
    }

    export function unsubscribe(jobId: string, ws: ServerWebSocket): void {
      subscriptions.get(jobId)?.delete(ws);
      if (subscriptions.get(jobId)?.size === 0) {
        subscriptions.delete(jobId);
      }
    }

    export function getSubscribers(jobId: string): Set<ServerWebSocket> {
      return subscriptions.get(jobId) || new Set();
    }

    export function broadcast(
      message: SharedTypes.WebSocket.Server.Message
    ): void {
      const messageStr = JSON.stringify(message);
      for (const ws of connections) {
        ws.send(messageStr);
      }
    }

    export function sendToSubscribers(
      jobId: string,
      message: SharedTypes.WebSocket.Server.Message
    ): void {
      const messageStr = JSON.stringify(message);
      for (const ws of getSubscribers(jobId)) {
        ws.send(messageStr);
      }
    }

    export function getStats() {
      return {
        totalConnections: connections.size,
        totalSubscriptions: subscriptions.size,
        subscriptionDetails: Array.from(subscriptions.entries()).map(
          ([jobId, subs]) => ({
            jobId,
            subscribers: subs.size,
          })
        ),
      };
    }
  }

  /**
   * Message sending utilities namespace
   */
  export namespace MessageSender {
    export function send(
      ws: ServerWebSocket,
      message: SharedTypes.WebSocket.Server.Message
    ): void {
      ws.send(JSON.stringify(message));
    }

    export function sendJobStarted(
      ws: ServerWebSocket,
      jobId: string,
      commentIds: string[]
    ): void {
      const message: SharedTypes.WebSocket.Server.JobStarted = {
        type: "job:started",
        timestamp: new Date().toISOString(),
        data: {
          jobId,
          commentIds,
          timestamp: new Date().toISOString(),
        },
      };
      send(ws, message);
    }

    export function sendJobCompleted(
      ws: ServerWebSocket,
      jobId: string,
      result: SharedTypes.Domain.Job.ProcessingResult,
      duration: number
    ): void {
      const message: SharedTypes.WebSocket.Server.JobCompleted = {
        type: "job:completed",
        timestamp: new Date().toISOString(),
        data: {
          jobId,
          result,
          duration,
          timestamp: new Date().toISOString(),
        },
      };
      send(ws, message);
    }

    export function sendStateChanged(
      ws: ServerWebSocket,
      stateData: SharedTypes.WebSocket.Server.StateChangedData
    ): void {
      const message: SharedTypes.WebSocket.Server.StateChanged = {
        type: "state:changed",
        timestamp: new Date().toISOString(),
        data: stateData,
      };
      send(ws, message);
    }

    export function sendError(ws: ServerWebSocket, errorMessage: string): void {
      const message: SharedTypes.WebSocket.Server.Error = {
        type: "error",
        timestamp: new Date().toISOString(),
        data: {
          message: errorMessage,
        },
      };
      send(ws, message);
    }

    export function sendPong(ws: ServerWebSocket): void {
      const message: SharedTypes.WebSocket.Server.Pong = {
        type: "pong",
        timestamp: new Date().toISOString(),
        data: {
          stats: {
            totalConnections: Connections.getStats().totalConnections,
            totalSubscriptions: Connections.getStats().totalSubscriptions,
          },
        },
      };
      send(ws, message);
    }
  }

  /**
   * Event handlers for Bus events
   */
  export namespace EventHandlers {
    const unsubscribers: Array<() => void> = [];

    export function initialize(): void {
      // Subscribe to all AnalyzeComments events

      // Job lifecycle events
      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.jobStarted, (event) => {
          const jobId = event.properties.jobId;
          const message: SharedTypes.WebSocket.Server.JobStarted = {
            type: "job:started",
            timestamp: event.properties.timestamp,
            data: {
              jobId: event.properties.jobId,
              commentIds: event.properties.commentIds,
              timestamp: event.properties.timestamp,
            },
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.jobCompleted, (event) => {
          const jobId = event.properties.jobId;
          const message: SharedTypes.WebSocket.Server.JobCompleted = {
            type: "job:completed",
            timestamp: event.properties.timestamp,
            data: {
              jobId: event.properties.jobId,
              result: event.properties.result,
              duration: event.properties.duration,
              timestamp: event.properties.timestamp,
            },
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.jobFailed, (event) => {
          const jobId = event.properties.jobId;
          const message: SharedTypes.WebSocket.Server.JobFailed = {
            type: "job:failed",
            timestamp: event.properties.timestamp,
            data: {
              jobId: event.properties.jobId,
              error: event.properties.error,
              errorType: event.properties.errorType,
              timestamp: event.properties.timestamp,
              errorContext: event.properties.errorContext,
              originalError: event.properties.originalError,
            },
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message);
        })
      );

      // State changes
      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.stateChanged, (event) => {
          const jobId = event.properties.jobId;
          const message: SharedTypes.WebSocket.Server.StateChanged = {
            type: "state:changed",
            timestamp: event.properties.timestamp,
            data: event.properties as SharedTypes.WebSocket.Server.StateChangedData,
          };
          Connections.sendToSubscribers(jobId, message);
        })
      );

      // LETI Agent Events
      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.letiStarted, (event) => {
          const message: SharedTypes.WebSocket.Server.LetiStarted = {
            type: "leti:started",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.letiInsightDetected, (event) => {
          const message: SharedTypes.WebSocket.Server.LetiInsightDetected = {
            type: "leti:insight:detected",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.letiNewInsightCreated, (event) => {
          const message: SharedTypes.WebSocket.Server.LetiNewInsightCreated = {
            type: "leti:insight:created",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.letiCompleted, (event) => {
          const message: SharedTypes.WebSocket.Server.LetiCompleted = {
            type: "leti:completed",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      // GRO Agent Events
      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.groStarted, (event) => {
          const message: SharedTypes.WebSocket.Server.GroStarted = {
            type: "gro:started",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.groIntentionDetected, (event) => {
          const message: SharedTypes.WebSocket.Server.GroIntentionDetected = {
            type: "gro:intention:detected",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.groCompleted, (event) => {
          const message: SharedTypes.WebSocket.Server.GroCompleted = {
            type: "gro:completed",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      // PIX Agent Events
      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.pixStarted, (event) => {
          const message: SharedTypes.WebSocket.Server.PixStarted = {
            type: "pix:started",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.pixSentimentAnalyzed, (event) => {
          const message: SharedTypes.WebSocket.Server.PixSentimentAnalyzed = {
            type: "pix:sentiment:analyzed",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(AnalyzeComments.Events.pixCompleted, (event) => {
          const message: SharedTypes.WebSocket.Server.PixCompleted = {
            type: "pix:completed",
            timestamp: event.properties.timestamp,
            data: event.properties,
          };
          Connections.broadcast(message);
        })
      );

      console.log(
        "✅ WebSocket event handlers initialized for AnalyzeComments multi-agent system"
      );
    }

    export function cleanup(): void {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      unsubscribers.length = 0;
      console.log("🧹 WebSocket event handlers cleaned up");
    }
  }

  /**
   * WebSocket handlers for Bun
   */
  export const handlers = {
    open(ws: ServerWebSocket) {
      console.log("🔌 WebSocket connection opened");
      Connections.add(ws);

      // Send welcome message
      const welcomeMessage: SharedTypes.WebSocket.Server.ConnectionEstablished =
        {
          type: "connection:established",
          timestamp: new Date().toISOString(),
          data: {
            message:
              "Connected to AnalyzeComments Multi-Agent Processing Stream",
            stats: Connections.getStats(),
          },
        };
      MessageSender.send(ws, welcomeMessage);
    },

    message(ws: ServerWebSocket, message: string | Buffer) {
      try {
        const data = SharedTypes.WebSocket.Client.MessageSchema.parse(
          JSON.parse(message.toString())
        );

        switch (data.type) {
          case "subscribe:jobs":
            handleSubscription(ws, data.jobIds);
            break;

          case "unsubscribe:jobs":
            handleUnsubscription(ws, data.jobIds);
            break;

          case "ping":
            MessageSender.sendPong(ws);
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        MessageSender.sendError(
          ws,
          error instanceof Error ? error.message : "Invalid message"
        );
      }
    },

    close(ws: ServerWebSocket) {
      console.log("❌ WebSocket connection closed");
      Connections.remove(ws);
    },

    error(ws: ServerWebSocket, error: Error) {
      console.error("WebSocket error:", error);
      Connections.remove(ws);
    },
  };

  /**
   * Handler functions for WebSocket operations
   */
  function handleSubscription(ws: ServerWebSocket, jobIds?: string[]): void {
    if (jobIds) {
      for (const jobId of jobIds) {
        Connections.subscribe(jobId, ws);
      }
      const confirmMessage: SharedTypes.WebSocket.Server.SubscriptionConfirmed =
        {
          type: "subscription:confirmed",
          timestamp: new Date().toISOString(),
          data: { jobIds },
        };
      MessageSender.send(ws, confirmMessage);
    }
  }

  function handleUnsubscription(ws: ServerWebSocket, jobIds?: string[]): void {
    if (jobIds) {
      for (const jobId of jobIds) {
        Connections.unsubscribe(jobId, ws);
      }
      const confirmMessage: SharedTypes.WebSocket.Server.UnsubscriptionConfirmed =
        {
          type: "unsubscription:confirmed",
          timestamp: new Date().toISOString(),
          data: { jobIds },
        };
      MessageSender.send(ws, confirmMessage);
    }
  }

  /**
   * Initialize the WebSocket server
   */
  export function initialize(): void {
    EventHandlers.initialize();
    console.log("🚀 WebSocket server initialized");
  }

  /**
   * Cleanup on shutdown
   */
  export function cleanup(): void {
    EventHandlers.cleanup();
    console.log("👋 WebSocket server cleaned up");
  }
}
