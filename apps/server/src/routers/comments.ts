import { router, publicProcedure } from "@/lib/trpc";
import { DB } from "@/db";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";

export const commentsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        comments: z.array(
          z.object({
            content: z.string().min(1),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      try {
        const newComments = await db
          .insert(DB.schema.comments)
          .values(
            input.comments.map((comment) => ({
              id: sql`gen_random_uuid()`,
              content: comment.content,
            }))
          )
          .returning();
        
        return {
          success: true,
          message: `Created ${newComments.length} comments`,
          commentIds: newComments.map((c) => c.id),
          comments: newComments,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to create comments"
        );
      }
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      
      try {
        const [comments, totalResult] = await Promise.all([
          db
            .select()
            .from(DB.schema.comments)
            .orderBy(desc(DB.schema.comments.created_at))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(DB.schema.comments),
        ]);
        
        const total = Number(totalResult[0]?.count ?? 0);
        
        return {
          comments,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to list comments"
        );
      }
    }),

  getWithInsights: publicProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      try {
        const result = await db
          .select({
            comment: DB.schema.comments,
            insight: DB.schema.insights,
          })
          .from(DB.schema.comments)
          .leftJoin(
            DB.schema.comment_insights,
            sql`${DB.schema.comments.id} = ${DB.schema.comment_insights.comment_id}`
          )
          .leftJoin(
            DB.schema.insights,
            sql`${DB.schema.comment_insights.insight_id} = ${DB.schema.insights.id}`
          )
          .where(sql`${DB.schema.comments.id} = ${input.commentId}`);
        
        if (result.length === 0) {
          throw new Error("Comment not found");
        }
        
        const comment = result[0].comment;
        const insights = result
          .filter((r) => r.insight !== null)
          .map((r) => r.insight!);
        
        return {
          comment,
          insights,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to get comment with insights"
        );
      }
    }),
});