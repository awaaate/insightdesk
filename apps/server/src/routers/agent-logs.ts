import { publicProcedure, router } from "@/lib/trpc";
import { DB } from "@/db";
import { SharedTypes } from "@/types/shared";
import { and, eq, gte, sql } from "drizzle-orm";

export const agentLogsRouter = router({
  list: publicProcedure
    .input(SharedTypes.API.AgentLogs.ListInputSchema)
    .query(
      async ({
        ctx: { db },
        input,
      }): Promise<SharedTypes.API.AgentLogs.ListResponse> => {
        const limit = input?.limit ?? 20;
        const offset = input?.offset ?? 0;

        const conditions = [];
        if (input.agentName) {
          conditions.push(
            eq(DB.schema.agent_processing_logs.agent_name, input.agentName)
          );
        }
        if (input.success) {
          conditions.push(
            eq(DB.schema.agent_processing_logs.success, input.success)
          );
        }
        if (input.createdAt) {
          conditions.push(
            gte(
              DB.schema.agent_processing_logs.created_at,
              new Date(input.createdAt)
            )
          );
        }

        const [logs, totalResult] = await Promise.all([
          db
            .select()
            .from(DB.schema.agent_processing_logs)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.agent_processing_logs),
        ]);

        const total = Number(totalResult[0]?.count ?? 0);

        return {
          logs: logs.map((log) => ({
            ...log,
            agent_name:
              log.agent_name as SharedTypes.Domain.AgentLogs.AgentName,
          })),
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      }
    ),
});
