// src/config/env.ts
import { z, ZodError } from "zod";
import { NamedError } from "./error";
export namespace Env {
  export const InvalidEnvironmentVariablesError = NamedError.create(
    "InvalidEnvironmentVariablesError",
    z.object({
      errors: z.instanceof(ZodError),
    })
  );

  export const Schema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  });

  export type Schema = z.infer<typeof Schema>;

  export const config = Schema.parse(process.env);

  export const isProduction = config.NODE_ENV === "production";

  export function validate() {
    const result = Schema.safeParse(process.env);
    if (!result.success) {
      throw new InvalidEnvironmentVariablesError({
        errors: result.error,
      });
    }
  }
}
