import { DataCard } from "@/components/data/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Info, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { PIX_METRICS, getSeverityByName } from "../helpers/pix-constants";
import { CategoryBar } from "@/components/data/category-bar";

interface AverageIntensityCardProps {
  className?: string;
}

export const AverageIntensityCard: React.FC<AverageIntensityCardProps> = ({
  className,
}) => {
  const { data, isLoading, error } = useQuery(
    trpc.analytics.pixe.overview.queryOptions()
  );

  const keyMetrics = useMemo(() => {
    if (!data) return null;

    const { statistics, raw } = data;
    const dominantSeverity = getSeverityByName(statistics.dominantSeverity);

    // Calculate sentiment balance
    const positiveCount =
      raw.severitySummary.find((s) => s.severity === "positive")?.count || 0;
    const negativeCount = raw.severitySummary
      .filter((s) => ["low", "medium", "high", "critical"].includes(s.severity))
      .reduce((sum, s) => sum + s.count, 0);
    const neutralCount =
      raw.severitySummary.find((s) => s.severity === "none")?.count || 0;

    // Find most intense sentiment
    const mostIntense = raw.sentimentDistribution.reduce((prev, current) => {
      return Math.abs(current.intensityValue) > Math.abs(prev.intensityValue)
        ? current
        : prev;
    });

    return {
      totalAnalyzed: statistics.totalAnalyzed,
      averageIntensity: statistics.averageIntensity,
      dominantSeverity,
      sentimentLevelsCount: statistics.sentimentLevelsCount,
      positiveCount,
      negativeCount,
      neutralCount,
      mostIntense,
      balance: {
        positive: (positiveCount / statistics.totalAnalyzed) * 100,
        negative: (negativeCount / statistics.totalAnalyzed) * 100,
        neutral: (neutralCount / statistics.totalAnalyzed) * 100,
      },
    };
  }, [data]);

  if (error) {
    return (
      <div className={cn("grid gap-4", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sentiment data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <DataCard className={className}>
        <div className="grid md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 border-r last:border-r-0">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </DataCard>
    );
  }

  if (!keyMetrics) {
    return (
      <DataCard className={className}>
        <div className="p-6 text-center text-muted-foreground">
          <PIX_METRICS.KEY_METRICS.TOTAL_ANALYZED.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sentiment data available</p>
        </div>
      </DataCard>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-r border-border p-4 h-full">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PIX_METRICS.KEY_METRICS.AVG_INTENSITY.icon className="h-4 w-4" />
        <span>{PIX_METRICS.KEY_METRICS.AVG_INTENSITY.label}</span>
        <IconTooltip
          icon={<Info className="h-3 w-3 text-muted-foreground cursor-help" />}
        >
          {PIX_METRICS.KEY_METRICS.AVG_INTENSITY.tooltip}
        </IconTooltip>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold">
          {keyMetrics.averageIntensity &&
            keyMetrics.averageIntensity.toFixed(1)}
        </span>
        <Badge
          variant={
            keyMetrics.averageIntensity > 0
              ? "default"
              : keyMetrics.averageIntensity < -3
              ? "destructive"
              : "secondary"
          }
          className="text-xs"
        >
          {keyMetrics.averageIntensity > 0
            ? "Positive"
            : keyMetrics.averageIntensity === 0
            ? "Neutral"
            : keyMetrics.averageIntensity > -3
            ? "Mild"
            : "Intense"}
        </Badge>
      </div>
      <CategoryBar
        className="h-10"
        values={[
          keyMetrics.balance.negative,
          keyMetrics.balance.neutral,
          keyMetrics.balance.positive,
        ]}
        marker={{
          value: ((keyMetrics.averageIntensity + 8) / 10) * 100,
          tooltip: "Average Intensity",
          showAnimation: true,
        }}
        colors={["red", "gray", "emerald"]}
      />
    </div>
  );
};
