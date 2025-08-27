import { useEffect, useRef, useCallback } from "react";
import { useProcessingStore } from "@/stores/processing.store";
import { SharedTypes } from "types/shared";
import { useQueryClient } from "@tanstack/react-query";

interface UseWebSocketUpdatesOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocketUpdates({
  url = "ws://localhost:8080/ws",
  autoConnect = true,
}: UseWebSocketUpdatesOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useProcessingStore();
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    (message: SharedTypes.WebSocket.Client.Message) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        console.log("Sent message:", message);
      } else {
        console.error("WebSocket is not connected");
      }
    },
    []
  );

  const subscribeToJob = useCallback(
    (jobId: string) => {
      sendMessage({
        type: "subscribe:jobs",
        jobIds: [jobId],
      });
    },
    [sendMessage]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        console.log("message", event.data);
        const message = SharedTypes.WebSocket.Server.MessageSchema.parse(
          JSON.parse(event.data)
        );

        switch (message.type) {
          case "connection:established":
            store.setConnected(true);
            break;

          case "job:started":
            console.log("job:started", message.data);
            
            // Ensure comments exist in store before starting
            const existingComments = message.data.commentIds.map(id => ({
              id,
              status: "processing" as const,
              jobId: message.data.jobId,
              insightIds: []
            }));
            store.upsertComments(existingComments);
            
            // Start processing with clean actions
            store.startProcessing(message.data.commentIds, message.data.jobId);
            
            // Subscribe to this specific job for state updates
            subscribeToJob(message.data.jobId);
            break;

          case "state:changed":
            console.log("state:changed", message.data);
            const { commentIds } = message.data;
            
            // Update global status based on state
            store.setStatus(
              message.data.state === "completed" ? "completed" :
              message.data.state === "failed" ? "error" :
              "processing"
            );
            
            // Update comment status based on state
            switch (message.data.state) {
              case "initializing":
              case "fetching_data":
                // Comments are being prepared
                commentIds.forEach(id => {
                  store.updateComment(id, { status: "processing" });
                });
                break;
                
              case "analyzing":
                // Track analysis progress
                if (message.data.currentCommentIndex !== undefined) {
                  console.log(`Analyzing comment ${message.data.currentCommentIndex + 1} of ${message.data.totalComments}`);
                }
                break;
                
              case "creating_insights":
                // Track insight creation progress
                if (message.data.processedCount !== undefined) {
                  console.log(`Processing insights: ${message.data.processedCount} of ${message.data.totalToProcess}`);
                }
                break;
                
              case "completed":
                if (message.data.details) {
                  const details = message.data.details;
                  console.log("Completion details:", details);
                  
                  // Complete comments and add insights
                  const processedIds = details.relationships.map((r) => r.commentId);
                  store.completeComments(processedIds);
                  
                  // Add all insights for the comments
                  details.relationships.forEach((r) => {
                    store.addInsight(r.commentId, {
                      id: r.insightId,
                      type: r.isNew ? "created" : "matched",
                      commentId: r.commentId,
                    });
                  });
                  
                  // Mark any comments without insights as completed too
                  commentIds.forEach(id => {
                    if (!processedIds.includes(id)) {
                      store.updateComment(id, { status: "completed" });
                    }
                  });
                }
                break;
                
              case "failed":
                // Mark all comments as failed
                store.failComments(commentIds);
                if (message.data.details?.error) {
                  console.error("Processing failed:", message.data.details.error);
                }
                break;
            }
            break;

          case "insight:created":
            console.log("insight:created", message.data);
            store.addInsight(message.data.commentId, {
              id: message.data.insightId,
              type: "created",
              commentId: message.data.commentId,
            });
            break;

          case "insight:matched":
            console.log("insight:matched", message.data);
            store.addInsight(message.data.commentId, {
              id: message.data.insightId,
              type: "matched",
              commentId: message.data.commentId,
            });
            break;

          case "job:completed":
            store.setStatus("completed");
            break;

          case "job:failed":
            store.setError(message.data.error);
            break;

          case "subscription:confirmed":
            console.log("Subscribed to jobs:", message.data.jobIds);
            break;

          default:
            console.log("Unhandled message type:", message.type);
            break;
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    },
    [store, queryClient, subscribeToJob]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      store.setConnected(true);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      store.setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [url, handleMessage, store]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    store.setConnected(false);
  }, [store]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    isConnected: store.isConnected,
    connect,
    disconnect,
  };
}
