import { Bus } from "@/bus";
import { CommentCategorization } from "@/queues/workers/commentCategorization";
import { z } from "zod";
import type { ServerWebSocket } from "bun";

/**
 * WebSocket namespace for real-time event streaming
 */
export namespace WebSocketServer {
  /**
   * WebSocket message types
   */
  export namespace Messages {
    export const ClientMessage = z.discriminatedUnion("type", [
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

    export type ClientMessage = z.infer<typeof ClientMessage>;

    export interface ServerMessage {
      type: string;
      timestamp: string;
      data?: any;
    }
  }

  /**
   * Connection management
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

    export function broadcast(message: Messages.ServerMessage): void {
      const messageStr = JSON.stringify(message);
      for (const ws of connections) {
        ws.send(messageStr);
      }
    }

    export function sendToSubscribers(
      jobId: string,
      message: Messages.ServerMessage
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
   * Event handlers for Bus events
   */
  export namespace EventHandlers {
    const unsubscribers: Array<() => void> = [];

    export function initialize(): void {
      // Subscribe to all CommentCategorization events
      
      // Job lifecycle events
      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.jobStarted, (event) => {
          const jobId = event.properties.jobId;
          const message: Messages.ServerMessage = {
            type: "job:started",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message); // Also broadcast to all
        })
      );

      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.jobCompleted, (event) => {
          const jobId = event.properties.jobId;
          const message: Messages.ServerMessage = {
            type: "job:completed",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message);
        })
      );

      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.jobFailed, (event) => {
          const jobId = event.properties.jobId;
          const message: Messages.ServerMessage = {
            type: "job:failed",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          };
          Connections.sendToSubscribers(jobId, message);
          Connections.broadcast(message);
        })
      );

      // State changes
      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.stateChanged, (event) => {
          const jobId = event.properties.jobId;
          const message: Messages.ServerMessage = {
            type: "state:changed",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          };
          Connections.sendToSubscribers(jobId, message);
        })
      );

      // Analysis events
      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.analysisStarted, (event) => {
          Connections.broadcast({
            type: "analysis:started",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          });
        })
      );

      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.analysisCompleted, (event) => {
          Connections.broadcast({
            type: "analysis:completed",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          });
        })
      );

      // Insight events
      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.insightCreated, (event) => {
          Connections.broadcast({
            type: "insight:created",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          });
        })
      );

      unsubscribers.push(
        Bus.subscribe(CommentCategorization.Events.insightMatched, (event) => {
          Connections.broadcast({
            type: "insight:matched",
            timestamp: event.properties.timestamp.toISOString(),
            data: event.properties,
          });
        })
      );

      console.log("✅ WebSocket event handlers initialized");
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
      ws.send(
        JSON.stringify({
          type: "connection:established",
          timestamp: new Date().toISOString(),
          data: {
            message: "Connected to Comment Categorization stream",
            stats: Connections.getStats(),
          },
        } as Messages.ServerMessage)
      );
    },

    message(ws: ServerWebSocket, message: string | Buffer) {
      try {
        const data = Messages.ClientMessage.parse(
          JSON.parse(message.toString())
        );

        switch (data.type) {
          case "subscribe:jobs":
            if (data.jobIds) {
              for (const jobId of data.jobIds) {
                Connections.subscribe(jobId, ws);
              }
              ws.send(
                JSON.stringify({
                  type: "subscription:confirmed",
                  timestamp: new Date().toISOString(),
                  data: { jobIds: data.jobIds },
                } as Messages.ServerMessage)
              );
            }
            break;

          case "unsubscribe:jobs":
            if (data.jobIds) {
              for (const jobId of data.jobIds) {
                Connections.unsubscribe(jobId, ws);
              }
              ws.send(
                JSON.stringify({
                  type: "unsubscription:confirmed",
                  timestamp: new Date().toISOString(),
                  data: { jobIds: data.jobIds },
                } as Messages.ServerMessage)
              );
            }
            break;

          case "ping":
            ws.send(
              JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString(),
                data: { stats: Connections.getStats() },
              } as Messages.ServerMessage)
            );
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            timestamp: new Date().toISOString(),
            data: {
              message: error instanceof Error ? error.message : "Invalid message",
            },
          } as Messages.ServerMessage)
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