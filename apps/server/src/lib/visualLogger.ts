import chalk from "chalk";
import ora, { type Ora } from "ora";
import Table from "cli-table3";
import { logger as pinoLogger } from "./logger";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface CommentInfo {
  id: string;
  text: string;
  brandName?: string;
  brandId?: string;
}

interface ResponseInfo {
  id: string;
  text: string;
  sources?: Array<{ url: string; title?: string }>;
  latencyMs?: number;
}

interface BrandInfo {
  name: string;
  count: number;
  confidence?: number;
}

class VisualLogger {
  private spinners: Map<string, Ora> = new Map();
  private currentPrompt: CommentInfo | null = null;
  private processedCount = 0;
  private failedCount = 0;
  private startTime = Date.now();

  private formatTimestamp(): string {
    const now = new Date();
    return chalk.gray(`[${now.toTimeString().split(" ")[0]}]`);
  }

  private formatLevel(level: LogLevel): string {
    const levels = {
      info: chalk.blue("INFO"),
      warn: chalk.yellow("WARN"),
      error: chalk.red("ERROR"),
      success: chalk.green("✓ SUCCESS"),
      debug: chalk.gray("DEBUG"),
    };
    return levels[level] || chalk.white(level.toUpperCase());
  }

  private truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  log(level: LogLevel, message: string, data?: any) {
    const timestamp = this.formatTimestamp();
    const levelStr = this.formatLevel(level);
    console.log(`${timestamp} ${levelStr} ${message}`);
    
    if (data) {
      pinoLogger[level === "success" ? "info" : level](data, message);
    }
  }

  startSpinner(id: string, text: string): void {
    if (this.spinners.has(id)) {
      this.spinners.get(id)?.stop();
    }
    const spinner = ora({
      text,
      color: "cyan",
      spinner: "dots",
    }).start();
    this.spinners.set(id, spinner);
  }

  updateSpinner(id: string, text: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.text = text;
    }
  }

  succeedSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.succeed(text || spinner.text);
      this.spinners.delete(id);
    }
  }

  failSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.fail(text || spinner.text);
      this.spinners.delete(id);
    }
  }

  stopSpinner(id: string): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.stop();
      this.spinners.delete(id);
    }
  }
  logPromptStart(prompt: CommentInfo): void {
    this.log("info", "Processing prompt", prompt);
  }

  logPromptStart(prompt: CommentInfo): void {
    this.currentPrompt = prompt;
    console.log("\n" + chalk.cyan("━".repeat(80)));
    console.log(chalk.bold.cyan("🎯 PROCESSING PROMPT"));
    console.log(chalk.cyan("━".repeat(80)));
    console.log(chalk.white("ID:      ") + chalk.yellow(prompt.id));
    console.log(chalk.white("Text:    ") + chalk.white(this.truncateText(prompt.text)));
    if (prompt.engineName) {
      console.log(chalk.white("Engine:  ") + chalk.magenta(prompt.engineName));
    }
    if (prompt.personaName) {
      console.log(chalk.white("Persona: ") + chalk.blue(prompt.personaName));
    }
    console.log(chalk.cyan("━".repeat(80)) + "\n");
  }

  logResponseGenerated(response: ResponseInfo): void {
    console.log(chalk.bold.green("\n✨ RESPONSE GENERATED"));
    console.log(chalk.gray("─".repeat(80)));
    console.log(chalk.white("ID:       ") + chalk.yellow(response.id));
    console.log(chalk.white("Response: ") + chalk.white(this.truncateText(response.text)));
    
    if (response.latencyMs) {
      const latencyColor = response.latencyMs < 1000 ? chalk.green : 
                          response.latencyMs < 3000 ? chalk.yellow : 
                          chalk.red;
      console.log(chalk.white("Latency:  ") + latencyColor(`${response.latencyMs}ms`));
    }
    
    if (response.sources && response.sources.length > 0) {
      console.log(chalk.white("\n📚 Sources:"));
      response.sources.forEach((source, idx) => {
        console.log(chalk.gray(`  ${idx + 1}. `) + chalk.blue(source.url));
        if (source.title) {
          console.log(chalk.gray(`     └─ `) + chalk.white(source.title));
        }
      });
    }
    console.log(chalk.gray("─".repeat(80)) + "\n");
  }

  logBrandsDetected(brands: BrandInfo[]): void {
    if (brands.length === 0) return;
    
    console.log(chalk.bold.magenta("\n🏷️  BRANDS DETECTED"));
    const table = new Table({
      head: [
        chalk.white("Brand"),
        chalk.white("Count"),
        chalk.white("Confidence"),
      ],
      style: {
        head: [],
        border: ["gray"],
      },
    });

    brands.forEach((brand) => {
      const confidence = brand.confidence 
        ? `${(brand.confidence * 100).toFixed(1)}%`
        : "N/A";
      
      const confidenceColor = brand.confidence 
        ? brand.confidence > 0.8 ? chalk.green :
          brand.confidence > 0.5 ? chalk.yellow :
          chalk.red
        : chalk.gray;
        
      table.push([
        chalk.cyan(brand.name),
        chalk.white(brand.count.toString()),
        confidenceColor(confidence),
      ]);
    });

    console.log(table.toString());
  }

  logNoBrandsFound(info?: { responseId?: string; promptText?: string }): void {
    console.log("\n" + chalk.yellow("━".repeat(60)));
    console.log(chalk.yellow("⚠️  NO BRANDS DETECTED"));
    console.log(chalk.yellow("━".repeat(60)));
    if (info?.responseId) {
      console.log(chalk.gray("Response ID: ") + chalk.white(info.responseId));
    }
    if (info?.promptText) {
      console.log(chalk.gray("Prompt: ") + chalk.white(this.truncateText(info.promptText, 80)));
    }
    console.log(chalk.gray("\nThis response did not contain any mentions of tracked brands."));
    console.log(chalk.yellow("━".repeat(60)) + "\n");
  }

  logProgress(): void {
    const elapsed = Date.now() - this.startTime;
    const elapsedStr = this.formatDuration(elapsed);
    const rate = this.processedCount > 0 
      ? (this.processedCount / (elapsed / 1000)).toFixed(2)
      : "0";
    
    console.log(chalk.bold.white("\n📊 PROGRESS UPDATE"));
    console.log(chalk.gray("─".repeat(50)));
    console.log(chalk.white("Processed:  ") + chalk.green(`${this.processedCount} prompts`));
    console.log(chalk.white("Failed:     ") + chalk.red(`${this.failedCount} prompts`));
    console.log(chalk.white("Rate:       ") + chalk.cyan(`${rate} prompts/sec`));
    console.log(chalk.white("Elapsed:    ") + chalk.yellow(elapsedStr));
    console.log(chalk.gray("─".repeat(50)) + "\n");
  }

  incrementProcessed(): void {
    this.processedCount++;
  }

  incrementFailed(): void {
    this.failedCount++;
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  logQueueStatus(queues: Array<{ name: string; waiting: number; active: number; completed: number; failed: number }>): void {
    console.log(chalk.bold.blue("\n📋 QUEUE STATUS"));
    const table = new Table({
      head: [
        chalk.white("Queue"),
        chalk.white("Waiting"),
        chalk.white("Active"),
        chalk.white("Completed"),
        chalk.white("Failed"),
      ],
      style: {
        head: [],
        border: ["gray"],
      },
    });

    queues.forEach((queue) => {
      table.push([
        chalk.cyan(queue.name),
        chalk.yellow(queue.waiting.toString()),
        chalk.blue(queue.active.toString()),
        chalk.green(queue.completed.toString()),
        chalk.red(queue.failed.toString()),
      ]);
    });

    console.log(table.toString());
  }

  clear(): void {
    // Disabled to preserve logs
    // console.clear();
  }
}

export const visualLogger = new VisualLogger();