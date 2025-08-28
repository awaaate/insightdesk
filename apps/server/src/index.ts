import "dotenv/config";
import { Env } from "./env";
Env.validate();

import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { visualLogger } from "./lib/visualLogger";
import { createContext } from "./lib/context";
import { Queues } from "./queues";
import { appRouter } from "./routers/index";
import { WebSocketServer } from "./websocket";

import { HonoAdapter } from "@bull-board/hono";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { serveStatic } from "@hono/node-server/serve-static";
import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { AI } from "./ai";
import { readFile } from "fs/promises";
import { join } from "path";


const app = new Hono({ strict: false });

let chatSystemPrompt = "";

// Setup Bull Board with all queues
const serverAdapter = new HonoAdapter(serveStatic);
const basePath = "/ui";
serverAdapter.setBasePath(basePath);

// Mount Bull Board UI

createBullBoard({
  queues: Object.values(Queues.queues).map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "Comment Insights - Queue Dashboard",
      boardLogo: {
        path: "https://api.dicebear.com/7.x/shapes/svg?seed=insights",
        width: "50px",
        height: "50px",
      },
      miscLinks: [
        { text: "API Docs", url: "/api" },
        { text: "WebSocket Status", url: "/ws-status" },
      ],
    },
  },
});
app.route(basePath, serverAdapter.registerPlugin());
// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// tRPC endpoint
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

//server static files from public folder
app.get("/*", serveStatic({ root: "./public" }));

// API Documentation
app.get("/api", (c) => {
  return c.json({
    title: "Comment Insights API",
    description: "AI-powered comment categorization system",
    version: "2.0.0",
    endpoints: {
      tRPC: {
        "POST /trpc/processing.categorizeComments":
          "Categorize comments into insights",
        "POST /trpc/comments.create": "Create new comments",
        "POST /trpc/comments.list": "List comments",
        "POST /trpc/insights.list": "List insights",
      },
      WebSocket: {
        "ws://localhost:8080": "Real-time event streaming",
        events: [
          "connection:established",
          "job:started",
          "job:completed",
          "job:failed",
          "state:changed",
          "analysis:started",
          "analysis:completed",
          "insight:created",
          "insight:matched",
        ],
      },
      UI: {
        "GET /ui": "Bull Board queue dashboard",
        "GET /ws-status": "WebSocket connection status",
      },
    },
  });
});

// WebSocket Status endpoint
app.get("/ws-status", (c) => {
  return c.json({
    status: "active",
    stats: WebSocketServer.Connections.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// Root redirect
app.get("/", (c) => {
  return c.redirect("/api");
});


app.post("/api/chat", async (c) => {
  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await c.req.json();

    if (!chatSystemPrompt) {
      const promptPath = join(process.cwd(), "prompts", "chat-system-prompt.txt");
      chatSystemPrompt = await readFile(promptPath, "utf-8");
      visualLogger.log("info", "Chat system prompt loaded");
    }


  return AI.streamText({
    messages,
    provider: "openai",
    performance: "medium",
    system: chatSystemPrompt,
  });
});

// Initialize WebSocket server
WebSocketServer.initialize();

// Initialize Comment Categorization Worker
Queues.AnalyzeComments.createWorker().then(() => {
  visualLogger.log("success", "Analyze Comments Worker started");
});

// Create Bun server with WebSocket support
const server = Bun.serve({
  port: 8080,
  hostname: "0.0.0.0", // Listen on all interfaces for Docker
  fetch(request, server) {
    // Check if this is a WebSocket upgrade request
    const upgradeHeader = request.headers.get("upgrade");
    if (upgradeHeader === "websocket") {
      // Let Bun handle the WebSocket upgrade
      if (server.upgrade(request)) {
        return; // Upgrade successful
      }
      // Upgrade failed
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    // Handle regular HTTP requests through Hono
    return app.fetch(request);
  },
  websocket: WebSocketServer.handlers,
  error(error) {
    console.error(error);
    return new Response(`Internal Error: ${error.message || error}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

visualLogger.log("success", `🚀 Server running on http://0.0.0.0:8080`);
visualLogger.log("info", "📊 Bull Board UI: http://localhost:8080/ui");
visualLogger.log("info", "📡 WebSocket: ws://localhost:8080");
visualLogger.log("info", "📚 API Docs: http://localhost:8080/api");

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  WebSocketServer.cleanup();
  server.stop();
  process.exit(0);
});
