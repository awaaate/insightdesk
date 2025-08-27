import { z } from "zod";
import Handlebars from "handlebars";
import { readFile } from "fs/promises";
import { join } from "path";
import { NamedError } from "@/error";

export namespace PromptTemplates {
  export enum TemplateName {
    INSIGHT_DETECTION = "insight-detection",
    INTENTION_DETECTION = "intention-detection",
    SENTIMENT_ANALYSIS = "sentiment-analysis",
  }

  // Cache for compiled templates
  const compiledTemplateCache = new Map<string, HandlebarsTemplateDelegate>();
  // Register Handlebars helpers
  Handlebars.registerHelper("add", function (a, b) {
    return a + b;
  });

  /**
   * Initialize a template
   * @param templateName - The name of the template to initialize
   * @returns The compiled template -> the return is a function that takes variables and returns a string
   */
  async function initializeTemplates(templateName: TemplateName) {
    const templatePath = join(
      process.cwd(),
      "templates",
      `${templateName}.hbs`
    );
    const template = await readFile(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(template);
    compiledTemplateCache.set(templateName, compiledTemplate);

    return compiledTemplate;
  }

  export const INSIGHT_DETECTION = {
    version: 1,
    schema: z.object({
      insights: z.array(z.string()).describe("List of existing insights"),
      comments: z.array(z.string()).describe("Comments to analyze"),
    }),
    compile: async function (variables: z.infer<typeof this.schema>) {
      const cacheKey = TemplateName.INSIGHT_DETECTION;
      let template = compiledTemplateCache.get(cacheKey);
      if (!template) {
        template = await initializeTemplates(TemplateName.INSIGHT_DETECTION);
      }
      return template(variables);
    },
  };

  export const INTENTION_DETECTION = {
    version: 1,
    schema: z.object({
      comments: z
        .array(z.string())
        .describe("Comments to analyze for intentions"),
      intentionTypes: z.array(z.string()).describe("Available intention types"),
    }),
    compile: async function (variables: z.infer<typeof this.schema>) {
      const cacheKey = TemplateName.INTENTION_DETECTION;
      let template = compiledTemplateCache.get(cacheKey);
      if (!template) {
        template = await initializeTemplates(TemplateName.INTENTION_DETECTION);
      }
      return template(variables);
    },
  };

  export const SENTIMENT_ANALYSIS = {
    version: 1,
    schema: z.object({
      commentInsightPairs: z
        .array(
          z.object({
            commentIndex: z.number(),
            comment: z.string(),
            insightName: z.string(),
          })
        )
        .describe("Comment-insight pairs to analyze sentiment"),
      sentimentLevels: z
        .array(
          z.object({
            level: z.string(),
            name: z.string(),
            description: z.string(),
            severity: z.string(),
            intensityValue: z.number(),
          })
        )
        .describe("Available sentiment levels with their metadata"),
    }),
    compile: async function (variables: z.infer<typeof this.schema>) {
      const cacheKey = TemplateName.SENTIMENT_ANALYSIS;
      let template = compiledTemplateCache.get(cacheKey);
      if (!template) {
        template = await initializeTemplates(TemplateName.SENTIMENT_ANALYSIS);
      }
      return template(variables);
    },
  };

  export const promptRegistry = {
    [TemplateName.INSIGHT_DETECTION]: INSIGHT_DETECTION,
    [TemplateName.INTENTION_DETECTION]: INTENTION_DETECTION,
    [TemplateName.SENTIMENT_ANALYSIS]: SENTIMENT_ANALYSIS,
  } as const;

  export const PromptValidationError = NamedError.create(
    "PromptValidationError",
    z.object({
      promptName: z.nativeEnum(TemplateName),
      variables: z.unknown(),
    })
  );
  /**
   * Processes a prompt template with variables
   *
   * @param promptName - Name of the prompt from registry
   * @param variables - Variables to interpolate into the prompt
   * @returns The processed prompt with variables interpolated
   */
  export async function processPrompt<T extends TemplateName>(
    promptName: T,
    variables: z.infer<(typeof promptRegistry)[T]["schema"]>
  ): Promise<string> {
    // Get the prompt template from the registry
    const promptTemplate = promptRegistry[promptName];

    // Validate variables against the schema
    try {
      promptTemplate.schema.parse(variables);
    } catch (error) {
      throw new PromptValidationError(
        {
          promptName,
          variables,
        },
        { cause: error }
      );
    }

    return await promptTemplate.compile(variables as any);
  }
}
