import { visualLogger } from "./visualLogger";
import { Queues } from "../queues";

class ProgressMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(intervalMs: number = 30000) {
    if (this.isRunning) return;

    this.isRunning = true;
    visualLogger.log(
      "info",
      `Starting progress monitor (updates every ${intervalMs / 1000}s)`
    );

    // Show initial status
    await this.showProgress();

    // Set up periodic updates
    this.intervalId = setInterval(async () => {
      await this.showProgress();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      visualLogger.log("info", "Progress monitor stopped");
    }
  }

  private async showProgress() {
    try {
      // Get queue statistics
      const queueStats = await Promise.all(
        Object.entries(Queues.queues).map(async ([name, queue]) => ({
          name,
          waiting: await queue.getWaitingCount(),
          active: await queue.getActiveCount(),
          completed: await queue.getCompletedCount(),
          failed: await queue.getFailedCount(),
        }))
      );

      // Check if there's any activity
      const hasActivity = queueStats.some((q) => q.waiting > 0 || q.active > 0);

      if (hasActivity) {
        // Don't clear console to preserve logs
        // visualLogger.clear();
        visualLogger.logProgress();
        visualLogger.logQueueStatus(queueStats);
      } else if (this.isRunning) {
        // Stop monitoring if no activity
        this.stop();
      }
    } catch (error) {
      visualLogger.log("error", "Error showing progress", { error });
    }
  }
}

export const progressMonitor = new ProgressMonitor();
