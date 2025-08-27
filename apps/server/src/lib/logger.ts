import pino from "pino";
import { Env } from "@/env";
import chalk from "chalk";

export const logger = pino({
  level: Env.isProduction ? "warn" : "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
