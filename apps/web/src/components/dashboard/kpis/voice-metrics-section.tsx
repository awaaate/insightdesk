import { StatCard } from "@/components/data/stats/stat-card";
import { StatHeader } from "@/components/data/stats/stat-header";
import {
  Info,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ProgressCircle } from "@/components/data/progress-circle";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IconTooltip } from "@/components/common/icon-tooltip";

// Constants for labels and messages
const VOICE_METRICS = {
  SHARE_OF_VOICE: {
    title: "Share of Voice (SOV)",
    shortTitle: "SOV",
    description:
      "Percentage of total AI responses where your brand is mentioned",
    tooltip:
      "SOV measures your brand's penetration in AI responses. A higher percentage means your brand appears more frequently in AI-generated content compared to the total analyzed responses.",
    unit: "%",
    helpText:
      "This GEORADAR metric helps you understand your brand's presence in AI systems and how often it's referenced when users ask relevant questions.",
  },
  SHARE_OF_BRANDED_VOICE: {
    title: "Share of Branded Voice (SOBV)",
    shortTitle: "SOBV",
    description:
      "Your brand's share among all AI responses that mention any brand",
    tooltip:
      "SOBV shows your brand's competitive position when AI systems mention brands. This excludes generic product discussions and focuses on direct brand comparisons.",
    unit: "%",
    helpText:
      "This GEORADAR metric reveals your competitive position in AI responses with direct brand mentions, showing how you perform against competitors when AI systems compare brands.",
  },
} as const;

// Helper function to get performance indicator
export const getPerformanceIndicator = (value: number) => {
  if (value >= 50) return { label: "Excellent AI Presence", color: "default" as const };
  if (value >= 30) return { label: "Good AI Presence", color: "secondary" as const };
  if (value >= 10) return { label: "Average AI Presence", color: "outline" as const };
  return { label: "Needs AI Optimization", color: "destructive" as const };
};

// Helper function to get progress variant
const getProgressVariant = (value: number) => {
  if (value >= 30) return "success";
  if (value >= 20) return "default";
  if (value >= 10) return "warning";
  return "error";
};

interface VoiceMetricsSectionProps {
  className?: string;
}
export const VoiceMetricsSection = ({
  className,
}: VoiceMetricsSectionProps) => {
  const { data, isLoading, error } = useQuery(trpc.metrics.kpis.queryOptions());
  // Handle error state
  if (error) {
    return (
      <StatCard className={cn("col-span-1", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI voice metrics. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </StatCard>
    );
  }

  return (
    <StatCard className={cn("col-span-1 ", className)}>
      <StatHeader
        title="AI Voice Metrics"
        description="Track your brand's share of mentions in AI-generated responses"
        icon={<MessageCircle className="h-5 w-5" />}
        tooltip={
          <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
            <p className="font-semibold mb-1">Understanding AI Voice Metrics</p>
            <p className="text-xs">
              GEORADAR voice metrics help you understand how often your brand is
              mentioned in AI responses compared to total responses analyzed and your competitors.
            </p>
          </IconTooltip>
        }
      />

      <div className="flex w-full flex-col">
        {/* Share of Voice Metric */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[120px]  transition-all hover:bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium">
              {VOICE_METRICS.SHARE_OF_VOICE.shortTitle}
            </h3>
            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              <p>{VOICE_METRICS.SHARE_OF_VOICE.tooltip}</p>
            </IconTooltip>
          </div>

          <ProgressCircleVoiceMetrics
            isLoading={isLoading}
            value={data?.shareOfVoice || 0}
            variant={getProgressVariant(data?.shareOfVoice || 0)}
          />

          <div className="mt-3 w-full space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI Response Share</p>
              <Badge
                variant={getPerformanceIndicator(data?.shareOfVoice || 0).color}
              >
                {getPerformanceIndicator(data?.shareOfVoice || 0).label}
              </Badge>
            </div>
            {data?.shareOfVoice !== undefined && data.shareOfVoice > 0 && (
              <p className="text-xs text-muted-foreground">
                Your brand appears in{" "}
                <span className="font-medium text-foreground">
                  {data.shareOfVoice.toFixed(1)}%
                </span>{" "}
                of all AI responses analyzed
              </p>
            )}
          </div>
        </div>

        {/* Share of Branded Voice Metric */}
        <div className="flex-1 flex-col flex items-center justify-center p-4 min-h-[120px] border-t bg-muted/30 transition-all hover:bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium">
              {VOICE_METRICS.SHARE_OF_BRANDED_VOICE.shortTitle}
            </h3>
            <IconTooltip
              icon={
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              }
            >
              <p>{VOICE_METRICS.SHARE_OF_BRANDED_VOICE.tooltip}</p>
            </IconTooltip>
          </div>

          <ProgressCircleVoiceMetrics
            isLoading={isLoading}
            value={data?.shareOfBrandedVoice || 0}
            variant={getProgressVariant(data?.shareOfBrandedVoice || 0)}
          />

          <div className="mt-3 w-full space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI Competitive Share</p>
              <Badge
                variant={
                  getPerformanceIndicator(data?.shareOfBrandedVoice || 0).color
                }
              >
                {getPerformanceIndicator(data?.shareOfBrandedVoice || 0).label}
              </Badge>
            </div>
            {data?.shareOfBrandedVoice !== undefined &&
              data.shareOfBrandedVoice > 0 && (
                <p className="text-xs text-muted-foreground">
                  Among AI responses with brand mentions, your brand holds{" "}
                  <span className="font-medium text-foreground">
                    {data.shareOfBrandedVoice.toFixed(1)}%
                  </span>{" "}
                  of the conversation
                </p>
              )}
          </div>

          {/* Insight Alert */}
          {data?.shareOfBrandedVoice && data?.shareOfVoice && (
            <div className="mt-3 w-full">
              {data.shareOfBrandedVoice > data.shareOfVoice * 2 && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-xs">
                    Strong AI competitive position - your brand dominates branded
                    AI responses
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </StatCard>
  );
};

interface ProgressCircleSectionProps {
  isLoading: boolean;
  value: number | string;
  variant?: "default" | "neutral" | "warning" | "error" | "success";
}

const ProgressCircleVoiceMetrics = ({
  isLoading,
  value,
  variant = "default",
}: ProgressCircleSectionProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <Skeleton className="w-[100px] h-[100px] rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }
  const numericValue = Number(value);
  const formattedValue = numericValue.toFixed(1);

  return (
    <div className="relative group">
      <ProgressCircle
        value={numericValue}
        max={100}
        strokeWidth={10}
        width={120}
        height={120}
        showAnimation={true}
        variant={variant}
        className="transition-transform group-hover:scale-105"
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl font-semibold">{formattedValue}%</span>
          {numericValue > 0 && (
            <span className="text-xs text-muted-foreground mt-0.5">
              of total
            </span>
          )}
        </div>
      </ProgressCircle>
    </div>
  );
};
