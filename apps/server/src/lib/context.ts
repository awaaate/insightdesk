import { Queues } from "@/queues";
import { DB } from "@/db";
import { visualLogger } from "@/lib/visualLogger";
import { progressMonitor } from "@/lib/progressMonitor";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // No auth configured
  return {
    session: null,
    db: DB.client,
    queues: Queues.queues,
    visualLogger,
    progressMonitor,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
