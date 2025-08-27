import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schemaInternal from "./schema";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type * as SchemaTypes from "./schema";

export namespace DB {
  export namespace Insight {
    export type Insert = SchemaTypes.NewInsight;
    export type Select = SchemaTypes.Insight;
  }

  export namespace Comment {
    export type Insert = SchemaTypes.NewComment;
    export type Select = SchemaTypes.Comment;
  }

  export namespace SentimentLevel {
    export type Insert = SchemaTypes.NewSentimentLevel;
    export type Select = SchemaTypes.SentimentLevel;
  }

  const connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  export const client = drizzle(connectionPool, { schema: schemaInternal });
  export type DBClient = typeof client;

  export type DBTransaction = PgTransaction<
    NodePgQueryResultHKT,
    typeof schemaInternal,
    ExtractTablesWithRelations<typeof schemaInternal>
  >;

  export const schema = schemaInternal;

  export const executeTransaction = async <T>(
    operation: (transaction: DBTransaction) => Promise<T>
  ): Promise<T> => {
    const connection = await connectionPool.connect();

    try {
      await connection.query("BEGIN");
      const transaction = drizzle(connection, {
        schema,
      }) as unknown as DBTransaction;
      const result = await operation(transaction);
      await connection.query("COMMIT");
      return result;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  };
}
