import { DB } from "./index";
import { intentions, intentionTypeEnum } from "./schema/core";

const intentionData = [
  {
    type: "resolve" as const,
    name: "Resolve Issue",
    description: "User wants to resolve a problem or find a solution"
  },
  {
    type: "complain" as const,
    name: "Complain",
    description: "User is expressing dissatisfaction or frustration"
  },
  {
    type: "compare" as const,
    name: "Compare",
    description: "User is comparing products, services, or options"
  },
  {
    type: "cancel" as const,
    name: "Cancel",
    description: "User wants to cancel a service, subscription, or order"
  },
  {
    type: "inquire" as const,
    name: "Inquire",
    description: "User is asking for information or clarification"
  },
  {
    type: "praise" as const,
    name: "Praise",
    description: "User is expressing satisfaction or giving positive feedback"
  },
  {
    type: "suggest" as const,
    name: "Suggest",
    description: "User is providing suggestions or recommendations"
  },
  {
    type: "other" as const,
    name: "Other",
    description: "Other types of intentions not covered above"
  }
];

async function seedIntentions() {
  console.log("🌱 Seeding intentions table...");
  
  try {
    await DB.executeTransaction(async (tx) => {
      for (const intention of intentionData) {
        await tx
          .insert(intentions)
          .values(intention)
          .onConflictDoUpdate({
            target: [intentions.name],
            set: {
              description: intention.description,
              updated_at: new Date()
            }
          });
        console.log(`✅ Created/Updated intention: ${intention.name}`);
      }
    });
    
    console.log("✨ Intentions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding intentions:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedIntentions();