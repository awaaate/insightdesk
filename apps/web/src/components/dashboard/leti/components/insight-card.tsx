import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GeneratedInsight } from "../helpers/leti-types";

interface InsightCardProps {
  insight: GeneratedInsight;
  index: number;
  className?: string;
  highlighter?: {
    highlight: (text: string) => ReactNode;
  };
}

/**
 * Individual insight card component
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  index,
  className,
  highlighter,
}) => {
  const getTypeColors = () => {
    switch (insight.type) {
      case "discovery":
        return {
          border: "border-purple-200",
          text: "text-purple-700",
          bg: "bg-purple-50",
        };
      case "correlation":
        return {
          border: "border-blue-200",
          text: "text-blue-700",
          bg: "bg-blue-50",
        };
      case "trend":
        return {
          border: "border-green-200",
          text: "text-green-700",
          bg: "bg-green-50",
        };
      case "intelligence":
        return {
          border: "border-amber-200",
          text: "text-amber-700",
          bg: "bg-amber-50",
        };
      case "dominance":
        return {
          border: "border-red-200",
          text: "text-red-700",
          bg: "bg-red-50",
        };
      default:
        return {
          border: "border-gray-200",
          text: "text-gray-700",
          bg: "bg-gray-50",
        };
    }
  };

  const getPriorityBadge = () => {
    if (!insight.priority) return null;

    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };

    return (
      <Badge variant={variants[insight.priority]} className="text-xs">
        {insight.priority}
      </Badge>
    );
  };

  const colors = getTypeColors();

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {/* Avatar/Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "border-2 shadow-sm",
            colors.bg,
            colors.border,
            colors.text
          )}
        >
          {insight.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Insight text */}
        <div className="text-sm leading-relaxed text-foreground">
          {insight.renderInsight && highlighter ? (
            insight.renderInsight(highlighter)
          ) : (
            <p>"{insight.text}"</p>
          )}
        </div>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs capitalize">
            {insight.type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Confidence: {insight.confidence.toFixed(1)}/10
          </Badge>
          {getPriorityBadge()}
          {index === 0 && (
            <Badge variant="default" className="text-xs">
              Principal
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
