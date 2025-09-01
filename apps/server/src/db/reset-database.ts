#!/usr/bin/env bun
import { DB } from "../db";
import { sql } from "drizzle-orm";
import chalk from "chalk";
import ora from "ora";

async function resetDatabase() {
  const spinner = ora("Resetting database...").start();
  
  try {
    // Desactivar verificación de foreign keys temporalmente
    await DB.client.execute(sql`SET session_replication_role = 'replica'`);
    
    // Borrar datos en orden inverso de dependencias
    spinner.text = "Deleting comment_intentions...";
    await DB.client.delete(DB.schema.comment_intentions);
    
    spinner.text = "Deleting comment_insights...";
    await DB.client.delete(DB.schema.comment_insights);
    
    spinner.text = "Deleting comments...";
    await DB.client.delete(DB.schema.comments);
    
    spinner.text = "Deleting insights...";
    await DB.client.delete(DB.schema.insights);
    
    spinner.text = "Deleting intentions...";
    await DB.client.delete(DB.schema.intentions);
    
    spinner.text = "Deleting sentiment_levels...";
    await DB.client.delete(DB.schema.sentiment_levels);
    
    // Reactivar verificación de foreign keys
    await DB.client.execute(sql`SET session_replication_role = 'origin'`);
    
    // Resetear secuencias (IDs autoincrementales)
    await DB.client.execute(sql`ALTER SEQUENCE insights_id_seq RESTART WITH 1`);
    await DB.client.execute(sql`ALTER SEQUENCE intentions_id_seq RESTART WITH 1`);
    await DB.client.execute(sql`ALTER SEQUENCE sentiment_levels_id_seq RESTART WITH 1`);
    
    spinner.succeed(chalk.green("✅ Database reset successfully!"));
    
    console.log(chalk.yellow("\n📝 Next steps:"));
    console.log(chalk.cyan("1. Run seed scripts to populate initial data:"));
    console.log(chalk.gray("   bun run db:seed"));
    console.log(chalk.cyan("2. Or import your new data using:"));
    console.log(chalk.gray("   bun src/cli/index.ts"));
    
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to reset database"));
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Confirmación de seguridad
console.log(chalk.yellow("⚠️  WARNING: This will DELETE ALL DATA from the database!"));
console.log(chalk.red("This action cannot be undone.\n"));

import prompts from "prompts";

const response = await prompts({
  type: "confirm",
  name: "confirm",
  message: "Are you sure you want to reset the database?",
  initial: false
});

if (response.confirm) {
  await resetDatabase();
} else {
  console.log(chalk.gray("Database reset cancelled."));
  process.exit(0);
}