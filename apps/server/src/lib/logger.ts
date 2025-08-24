// src/config/logger.ts
import pino from "pino";
import { Env } from "@/env";

// Configuración del logger
export const logger = pino({
  level: Env.isProduction ? "warn" : "info",
  transport: Env.isProduction
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});
