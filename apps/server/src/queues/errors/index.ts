import { z } from "zod";
import { NamedError } from "@/error";

/**
 * Sistema centralizado de manejo de errores para workers
 * Garantiza la serialización correcta para Bull Dashboard
 */
export namespace WorkerErrors {
  /**
   * Error serializable para Bull Dashboard
   */
  export interface SerializedError {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    data?: any;
    timestamp: string;
    chain?: SerializedError[];
  }

  /**
   * Estructura mejorada para error chains
   */
  export interface ErrorChainItem {
    level: number;
    name: string;
    message: string;
    stack?: string;
    data?: any;
    timestamp: string;
    source?: string;
  }

  /**
   * Resultado completo del error para Bull
   */
  export interface WorkerErrorResult {
    error: SerializedError;
    chain: ErrorChainItem[];
    summary: string;
    context: Record<string, any>;
    jobId: string;
    timestamp: string;
    duration?: number;
  }

  /**
   * Serializa un error para Bull Dashboard
   */
  export function serializeError(error: unknown): SerializedError {
    const timestamp = new Date().toISOString();

    if (error instanceof NamedError) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        data: error.toObject(),
        timestamp,
        chain: error.cause ? [serializeError(error.cause)] : undefined,
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name || "Error",
        message: error.message || "Unknown error",
        stack: error.stack,
        code: (error as any).code,
        data: {
          ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
            if (!["name", "message", "stack"].includes(key)) {
              acc[key] = (error as any)[key];
            }
            return acc;
          }, {} as any),
        },
        timestamp,
        chain: (error as any).cause ? [serializeError((error as any).cause)] : undefined,
      };
    }

    // Para errores no estándar
    return {
      name: "UnknownError",
      message: String(error),
      timestamp,
      data: error,
    };
  }

  /**
   * Construye la cadena completa de errores
   */
  export function buildErrorChain(error: unknown): ErrorChainItem[] {
    const chain: ErrorChainItem[] = [];
    let currentError = error;
    let level = 0;

    while (currentError) {
      const item: ErrorChainItem = {
        level,
        name: "UnknownError",
        message: "Unknown error",
        timestamp: new Date().toISOString(),
      };

      if (currentError instanceof NamedError) {
        item.name = currentError.name;
        item.message = currentError.message;
        item.stack = currentError.stack;
        item.data = currentError.toObject();
        item.source = "NamedError";
      } else if (currentError instanceof Error) {
        item.name = currentError.name || "Error";
        item.message = currentError.message || "Unknown error";
        item.stack = currentError.stack;
        item.source = currentError.constructor.name;
        
        // Capturar propiedades adicionales
        const additionalProps = Object.getOwnPropertyNames(currentError).reduce(
          (acc, key) => {
            if (!["name", "message", "stack", "cause"].includes(key)) {
              acc[key] = (currentError as any)[key];
            }
            return acc;
          },
          {} as any
        );
        
        if (Object.keys(additionalProps).length > 0) {
          item.data = additionalProps;
        }
      } else {
        item.message = String(currentError);
        item.data = currentError;
        item.source = typeof currentError;
      }

      chain.push(item);
      currentError = (currentError as any)?.cause;
      level++;
    }

    return chain;
  }

  /**
   * Genera un resumen legible del error
   */
  export function generateErrorSummary(chain: ErrorChainItem[]): string {
    if (chain.length === 0) return "Unknown error occurred";

    const rootError = chain[0];
    const rootCause = chain[chain.length - 1];

    if (chain.length === 1) {
      return `${rootError.name}: ${rootError.message}`;
    }

    return `${rootError.name}: ${rootError.message} (caused by ${rootCause.name}: ${rootCause.message})`;
  }

  /**
   * Formatea el error para logging en consola
   */
  export function formatErrorForConsole(result: WorkerErrorResult): string {
    const lines: string[] = [];
    
    lines.push("╔════════════════════════════════════════════════════════════════════════════╗");
    lines.push("║ 🚨 WORKER JOB FAILED                                                      ║");
    lines.push("╠════════════════════════════════════════════════════════════════════════════╣");
    lines.push(`║ Job ID: ${(result.jobId || "unknown").padEnd(66)} ║`);
    lines.push(`║ Duration: ${((result.duration || 0) + "ms").padEnd(64)} ║`);
    lines.push(`║ Summary: ${(result.summary || "Unknown error").substring(0, 65).padEnd(65)} ║`);
    
    if (result.summary && result.summary.length > 65) {
      const remaining = result.summary.substring(65);
      const chunks = remaining.match(/.{1,73}/g) || [];
      chunks.forEach(chunk => {
        lines.push(`║   ${chunk.padEnd(72)} ║`);
      });
    }
    
    lines.push("╠════════════════════════════════════════════════════════════════════════════╣");
    lines.push("║ ERROR CHAIN:                                                              ║");
    
    result.chain.forEach((item, index) => {
      const indent = "  ".repeat(item.level || 0);
      const prefix = index === 0 ? "🔴" : index === result.chain.length - 1 ? "🎯" : "↳";
      
      lines.push(`║ ${prefix} ${indent}${(item.name || "Unknown").padEnd(68 - indent.length)} ║`);
      
      // Mensaje con word wrap
      const messageLines = wrapText(item.message || "No message", 70 - indent.length);
      messageLines.forEach(line => {
        lines.push(`║    ${indent}${line.padEnd(70 - indent.length)} ║`);
      });
      
      if (item.source && item.source !== "Error") {
        lines.push(`║    ${indent}[${item.source}]`.padEnd(78) + " ║");
      }
      
      if (index < result.chain.length - 1) {
        lines.push(`║    ${indent}${"─".repeat(Math.max(1, 70 - indent.length))} ║`);
      }
    });
    
    // Contexto importante
    if (Object.keys(result.context).length > 0) {
      lines.push("╠════════════════════════════════════════════════════════════════════════════╣");
      lines.push("║ CONTEXT:                                                                  ║");
      
      Object.entries(result.context).slice(0, 5).forEach(([key, value]) => {
        let valueStr: string;
        try {
          valueStr = JSON.stringify(value) ?? "undefined";
        } catch {
          valueStr = String(value);
        }
        const displayValue = valueStr.length > 50 ? valueStr.substring(0, 47) + "..." : valueStr;
        lines.push(`║  ${key}: ${displayValue}`.padEnd(78) + " ║");
      });
    }
    
    lines.push("╚════════════════════════════════════════════════════════════════════════════╝");
    
    return lines.join("\n");
  }

  /**
   * Helper para wrap de texto
   */
  function wrapText(text: string | undefined | null, maxWidth: number): string[] {
    if (!text) return [""];
    
    const safeText = String(text);
    const words = safeText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [""];
  }

  /**
   * Procesa un error para Bull Dashboard
   * Este es el método principal que deben usar los workers
   */
  export function processWorkerError(
    error: unknown,
    jobId: string,
    context: Record<string, any> = {},
    startTime?: number
  ): WorkerErrorResult {
    const chain = buildErrorChain(error);
    const serialized = serializeError(error);
    const summary = generateErrorSummary(chain);
    const duration = startTime ? Date.now() - startTime : undefined;

    const result: WorkerErrorResult = {
      error: serialized,
      chain,
      summary,
      context,
      jobId,
      timestamp: new Date().toISOString(),
      duration,
    };

    // Log en consola para debugging
    console.error(formatErrorForConsole(result));

    return result;
  }

  /**
   * Prepara un error para ser lanzado en workers
   * Mantiene toda la información pero sin depender de Bull
   */
  export function prepareErrorForThrow(
    error: unknown,
    jobId: string,
    context: Record<string, any> = {},
    startTime?: number
  ): Error {
    const result = processWorkerError(error, jobId, context, startTime);
    
    // Crear un error estándar con toda la información adjunta
    const preparedError = new Error(result.summary);
    preparedError.name = result.error.name;
    
    // Adjuntar el resultado completo como propiedad
    (preparedError as any).workerErrorResult = result;
    (preparedError as any).originalError = error;
    
    return preparedError;
  }
}