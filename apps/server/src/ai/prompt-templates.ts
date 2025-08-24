import { z } from "zod";
import Handlebars from "handlebars";
import { readFile } from "fs/promises";
import { join } from "path";
import { NamedError } from "@/error";

export namespace PromptTemplates {
  export enum TemplateName {
    INSIGHT_CATEGORIZATION = "insight-categorization",
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

  export const INSIGHT_CATEGORIZATION = {
    version: 1,
    schema: z.object({
      insights: z.array(z.string()).describe("List of existing insights"),
      comments: z.array(z.string()).describe("Comments to categorize"),
    }),
    compile: async function (variables: z.infer<typeof this.schema>) {
      const cacheKey = TemplateName.INSIGHT_CATEGORIZATION;
      let template = compiledTemplateCache.get(cacheKey);
      if (!template) {
        template = await initializeTemplates(
          TemplateName.INSIGHT_CATEGORIZATION
        );
      }
      return template(variables);
    },
  };

  export const promptRegistry = {
    [TemplateName.INSIGHT_CATEGORIZATION]: INSIGHT_CATEGORIZATION,
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

    return await promptTemplate.compile(variables);
  }
}
