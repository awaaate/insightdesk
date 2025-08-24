import { sql } from "drizzle-orm";
import { uuid } from "drizzle-orm/pg-core";

export const generatePrimaryKey = () =>
  uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);
