#!/usr/bin/env bun

import { z } from "zod";

// Inline our fixed schema functions to avoid import issues
function findClosestInsightMatch(
  input: string, 
  validInsights: string[]
): string | null {
  if (input === "No insight") return input;
  
  // Direct match first
  if (validInsights.includes(input)) return input;
  
  // Normalize for comparison (lowercase, trim)
  const normalizedInput = input.toLowerCase().trim();
  
  // Look for exact case-insensitive match
  const exactMatch = validInsights.find(
    insight => insight.toLowerCase().trim() === normalizedInput
  );
  if (exactMatch) {
    console.log(`🔧 Fixed case mismatch: "${input}" → "${exactMatch}"`);
    return exactMatch;
  }
  
  // Look for substring matches
  const substringMatch = validInsights.find(
    insight => 
      insight.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(insight.toLowerCase())
  );
  if (substringMatch) {
    console.log(`🔧 Used fuzzy matching: "${input}" → "${substringMatch}"`);
    return substringMatch;
  }
  
  // If no match found, return null (will be filtered out)
  console.warn(`⚠️  No matching insight found for: "${input}"`);
  return null;
}

function createCommentAnalysisSchema(insights: Array<{name: string}>) {
  const insightOptions = ["No insight", ...insights.map((i) => i.name)] as [string, ...string[]];
  
  return z.object({
    results: z.array(
      z.object({
        commentIndex: z.number().describe("0-based index of the comment"),
        existingInsights: z
          .array(z.string())
          .describe("Array of matching existing insight names or 'No insight' if none match")
          .transform((values) => {
            // Filter and validate insight names, attempting to match close variants
            return values
              .map(val => findClosestInsightMatch(val, insightOptions))
              .filter((v): v is string => v !== null)
              .filter((v) => v !== "No insight"); // Remove "No insight" from final result
          }),
        newInsights: z
          .array(z.object({
            name: z.string(),
            description: z.string()
          }))
          .describe("Array of new insight categories needed"),
        confidence: z
          .number()
          .min(0)
          .max(10)
          .describe("Confidence in categorization (0-10)"),
        explanation: z
          .string()
          .describe("Brief explanation of categorization (20-100 chars)"),
      })
    ),
  });
}

/**
 * Test script to verify our fix for the validation errors
 * This simulates the exact scenarios that were failing
 */
async function testSchemaFix() {
  console.log("🧪 Testing AI Schema Fix for Comment Categorization\n");

  // Mock insights data (simplified structure)
  const mockInsights = [
    { name: "No se puede agendar una cita presencial desde la app, lo que dificulta gestiones en oficina." },
    { name: "La aplicación se cierra sola o no abre, dificultando su uso." },
    { name: "No se puede modificar la fecha de cobro de las cuotas de préstamos." },
  ];

  // Create the schema with our fix
  const schema = createCommentAnalysisSchema(mockInsights);

  // Test data that was causing the validation errors
  const testData = {
    results: [
      {
        commentIndex: 12,
        existingInsights: ["No se puede modificar la fecha de cobro de las cuotas de préstamos."],
        newInsights: [],
        confidence: 8,
        explanation: "Exact match with existing loan payment modification issue"
      },
      {
        commentIndex: 16, 
        existingInsights: ["No se puede acceder a la app fácilmente."], // This was causing validation error
        newInsights: [],
        confidence: 7,
        explanation: "Similar to app access difficulties"
      },
      {
        commentIndex: 20,
        existingInsights: ["No insight"], // Test the "No insight" option
        newInsights: [{ name: "New Test Insight", description: "A new insight for testing" }],
        confidence: 6,
        explanation: "No existing insights match, creating new one"
      }
    ]
  };

  try {
    console.log("📝 Testing with data that previously failed validation...");
    console.log("Input data:", JSON.stringify(testData, null, 2));
    
    // This should now pass validation with our fuzzy matching
    const validated = schema.parse(testData);
    
    console.log("✅ Validation PASSED!");
    console.log("Processed results:", JSON.stringify(validated, null, 2));
    
    // Check specific behaviors
    const result16 = validated.results.find(r => r.commentIndex === 16);
    if (result16) {
      console.log(`\n🔍 Fuzzy matching test: "${testData.results[1].existingInsights[0]}" → [${result16.existingInsights.length} matches]`);
    }
    
    const result20 = validated.results.find(r => r.commentIndex === 20);
    if (result20) {
      console.log(`🔍 "No insight" handling: Should have 0 existing insights: ${result20.existingInsights.length === 0 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error("❌ Validation FAILED!");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      if ('issues' in error && Array.isArray(error.issues)) {
        console.error("Zod validation issues:", error.issues);
      }
    }
  }
}

testSchemaFix().catch(console.error);