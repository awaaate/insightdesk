import { DB } from "./index";
import { sentiment_levels } from "./schema/core";

const sentimentLevelData = [
  // Negative sentiments (90% of comments)
  {
    level: "doubt" as const,
    name: "Doubt",
    description: "Initial uncertainty, customer still confident but unsure",
    severity: "low" as const,
    intensity_value: -1
  },
  {
    level: "concern" as const,
    name: "Concern",
    description: "Growing unease, seeking confirmation and reassurance",
    severity: "low" as const,
    intensity_value: -2
  },
  {
    level: "annoyance" as const,
    name: "Annoyance",
    description: "First clear irritation, expectations not being met",
    severity: "medium" as const,
    intensity_value: -3
  },
  {
    level: "frustration" as const,
    name: "Frustration",
    description: "Loss of patience, needs urgent support",
    severity: "medium" as const,
    intensity_value: -4
  },
  {
    level: "anger" as const,
    name: "Anger",
    description: "Manifest anger, very negative experience",
    severity: "high" as const,
    intensity_value: -5
  },
  {
    level: "outrage" as const,
    name: "Outrage",
    description: "Sense of injustice, expectations far below standards",
    severity: "high" as const,
    intensity_value: -6
  },
  {
    level: "contempt" as const,
    name: "Contempt",
    description: "Total rejection of product or service",
    severity: "critical" as const,
    intensity_value: -7
  },
  {
    level: "fury" as const,
    name: "Fury",
    description: "Emotional explosion, threats, point of no return",
    severity: "critical" as const,
    intensity_value: -8
  },
  // Neutral sentiment (8% of comments)
  {
    level: "neutral" as const,
    name: "Neutral",
    description: "Objective reports without emotional charge",
    severity: "none" as const,
    intensity_value: 0
  },
  // Positive sentiments (2% of comments)
  {
    level: "satisfaction" as const,
    name: "Satisfaction",
    description: "Problem resolved, expectations met",
    severity: "positive" as const,
    intensity_value: 1
  },
  {
    level: "gratitude" as const,
    name: "Gratitude",
    description: "Explicit recognition of good service",
    severity: "positive" as const,
    intensity_value: 2
  }
];

async function seedSentimentLevels() {
  console.log("🌱 Seeding sentiment_levels table...");
  
  try {
    await DB.executeTransaction(async (tx) => {
      for (const sentimentLevel of sentimentLevelData) {
        await tx
          .insert(sentiment_levels)
          .values(sentimentLevel)
          .onConflictDoUpdate({
            target: [sentiment_levels.level],
            set: {
              name: sentimentLevel.name,
              description: sentimentLevel.description,
              severity: sentimentLevel.severity,
              intensity_value: sentimentLevel.intensity_value,
              updated_at: new Date()
            }
          });
        console.log(`✅ Created/Updated sentiment level: ${sentimentLevel.name} (${sentimentLevel.level})`);
      }
    });
    
    console.log("✨ Sentiment levels seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding sentiment levels:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedSentimentLevels();