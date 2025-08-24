import {
  generateText as aiGenerateText,
  generateObject as aiGenerateObject,
  type ModelMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z, type ZodRawShape } from "zod";
import { NamedError } from "@/error";
import { PromptTemplates as PT } from "./prompt-templates";
import { Schemas as S } from "./schemas";

/**
 * Simplified AI namespace for text and object generation
 */
export namespace AI {
  export import PromptTemplates = PT;
  export import Schemas = S;

  /** Available AI providers */
  export const providers = {
    openai: openai,
    google: google,
  } as const;

  /** Provider type */
  export type Provider = keyof typeof providers;

  /** Performance levels */
  export type Performance = "low" | "medium" | "high";

  /** Model configurations */
  const models = {
    openai: {
      high: "gpt-4o",
      medium: "gpt-4o-mini",
      low: "gpt-4o-mini",
    },
    google: {
      high: "gemini-2.0-flash-exp",
      medium: "gemini-1.5-flash",
      low: "gemini-1.5-flash-8b",
    },
  } as const;

  /** Get model instance for provider and performance level */
  function getModel(
    provider: Provider = "google",
    performance: Performance = "medium"
  ) {
    const modelId = models[provider][performance];
    return providers[provider](modelId);
  }

  /** Options for text generation */
  export interface TextOptions {
    provider?: Provider;
    performance?: Performance;
    messages: ModelMessage[];
    system?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }

  /** Options for object generation */
  export interface ObjectOptions<T> {
    provider?: Provider;
    performance?: Performance;
    messages: ModelMessage[];
    schema: z.ZodType<T>;
    system?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }

  /**
   * Generate text from messages
   * @param options Text generation options
   * @returns Generated text
   */
  export async function generateText(options: TextOptions): Promise<string> {
    const provider = options.provider ?? "google";
    const performance = options.performance ?? "medium";
    const model = getModel(provider, performance);
    const modelId = models[provider][performance];

    try {
      const result = await aiGenerateText({
        model,
        messages: options.messages,
        system: options.system,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens,
        abortSignal: AbortSignal.timeout(60000), // 60 second timeout
      });

      return result.text;
    } catch (error: any) {
      // Handle timeout errors
      if (error.name === "AbortError") {
        throw new GenerationTimeoutError(
          {
            provider,
            model: modelId,
            timeoutMs: 60000,
          },
          { cause: error }
        );
      }

      // Handle provider-specific errors
      if (error.statusCode || error.response?.status) {
        throw new ProviderError(
          {
            provider,
            model: modelId,
            statusCode: error.statusCode || error.response?.status,
            message: error.message || "Provider API error",
          },
          { cause: error }
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Generate structured object from messages
   * @param options Object generation options
   * @returns Generated object matching schema
   */
  export async function generateObject<T>(
    options: ObjectOptions<T>
  ): Promise<T> {
    const provider = options.provider ?? "google";
    const performance = options.performance ?? "medium";
    const model = getModel(provider, performance);
    const modelId = models[provider][performance];

    try {
      const result = await aiGenerateObject({
        model,
        messages: options.messages,
        schema: options.schema as unknown as z.ZodObject<ZodRawShape>,
        system: options.system,
        temperature: options.temperature ?? 0,
        maxOutputTokens: options.maxOutputTokens,
        abortSignal: AbortSignal.timeout(60000), // 60 second timeout
      });

      return result.object as T;
    } catch (error: any) {
      // Handle timeout errors
      if (error.name === "AbortError") {
        throw new GenerationTimeoutError(
          {
            provider,
            model: modelId,
            timeoutMs: 60000,
          },
          { cause: error }
        );
      }

      // Handle no object generated error (common AI SDK error)
      if (error.name === "AI_NoObjectGeneratedError") {
        throw new NoObjectGeneratedError(
          {
            provider,
            model: modelId,
            generatedText: error.text,
            finishReason: error.finishReason,
            usage: error.usage
              ? {
                  promptTokens: error.usage.promptTokens || 0,
                  completionTokens: error.usage.completionTokens || 0,
                  totalTokens: error.usage.totalTokens || 0,
                }
              : undefined,
            cause: error.cause,
          },
          { cause: error }
        );
      }

      // Handle schema validation errors
      if (error.name === "ZodError" || error.issues) {
        throw new SchemaValidationError(
          {
            provider,
            model: modelId,
            generatedObject: error.data || error.received,
            validationErrors: error.issues || [error.message],
          },
          { cause: error }
        );
      }

      // Handle provider-specific errors
      if (error.statusCode || error.response?.status) {
        throw new ProviderError(
          {
            provider,
            model: modelId,
            statusCode: error.statusCode || error.response?.status,
            message: error.message || "Provider API error",
          },
          { cause: error }
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Helper to create a message
   */
  export function message(
    role: "user" | "assistant" | "system",
    content: string
  ): ModelMessage {
    return { role, content };
  }

  /**
   * Named errors for AI operations
   */
  export const NoObjectGeneratedError = NamedError.create(
    "AI.NoObjectGeneratedError",
    z.object({
      provider: z.string(),
      model: z.string(),
      generatedText: z.string().optional(),
      finishReason: z.string().optional(),
      usage: z
        .object({
          promptTokens: z.number(),
          completionTokens: z.number(),
          totalTokens: z.number(),
        })
        .optional(),
      cause: z.any().optional(),
    })
  );

  export const SchemaValidationError = NamedError.create(
    "AI.SchemaValidationError",
    z.object({
      provider: z.string(),
      model: z.string(),
      generatedObject: z.any(),
      validationErrors: z.array(z.any()),
    })
  );

  export const GenerationTimeoutError = NamedError.create(
    "AI.GenerationTimeoutError",
    z.object({
      provider: z.string(),
      model: z.string(),
      timeoutMs: z.number(),
    })
  );

  export const ProviderError = NamedError.create(
    "AI.ProviderError",
    z.object({
      provider: z.string(),
      model: z.string(),
      statusCode: z.number().optional(),
      message: z.string(),
    })
  );
}
