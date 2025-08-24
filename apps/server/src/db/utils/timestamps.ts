import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const createdAtColumn = timestamp("created_at")
  .notNull()
  .default(sql`CURRENT_TIMESTAMP`);

export const updatedAtColumn = timestamp("updated_at")
  .notNull()
  .default(sql`CURRENT_TIMESTAMP`);
