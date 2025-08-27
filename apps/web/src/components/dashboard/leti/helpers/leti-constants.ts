import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Zap,
  Award,
  Star,
  Activity,
  Lightbulb,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";

/**
 * Constants for Leti Insights Dashboard
 */

// Main metrics configuration
export const LETI_METRICS = {
  OVERVIEW: {
    TITLE: "Leti Intelligence Agent",
    DESCRIPTION: "AI-powered insight detection and pattern recognition system",
    TOOLTIP: {
      title: "Understanding Leti Insights",
      content:
        "Leti analyzes comments to identify patterns and insights. AI-generated insights represent emerging patterns discovered automatically, while human insights are predefined categories.",
    },
    HELP_TEXT:
      "Monitor these insights regularly to understand emerging patterns and trends in your data.",
  },
  TOP_INSIGHTS: {
    TITLE: "Top Insights Ranking",
    DESCRIPTION: "Most frequently detected patterns across all comments",
    TOOLTIP: {
      title: "Insight Rankings",
      content:
        "Insights are ranked by total comment volume. Higher confidence scores indicate stronger pattern matches. Emergent insights are discovered by AI and may represent new trends.",
    },
    BADGES: {
      TOP: { label: "Top Insight", color: "default" as const, icon: Award },
      HIGH: { label: "High Impact", color: "secondary" as const, icon: Star },
      NOTABLE: {
        label: "Notable",
        color: "outline" as const,
        icon: TrendingUp,
      },
    },
    getBadge: (index: number) => {
      if (index === 0) return LETI_METRICS.TOP_INSIGHTS.BADGES.TOP;
      if (index === 1) return LETI_METRICS.TOP_INSIGHTS.BADGES.HIGH;
      return LETI_METRICS.TOP_INSIGHTS.BADGES.NOTABLE;
    },
  },
  EMERGENT: {
    TITLE: "Emergent Insights",
    DESCRIPTION: "AI-discovered patterns and emerging trends",
    TOOLTIP: {
      title: "AI Pattern Discovery",
      content:
        "These insights were automatically discovered by Leti's AI. They represent potential new patterns that weren't previously defined in the system.",
    },
    INDICATORS: {
      NEW: { label: "New Pattern", color: "default" as const },
      GROWING: { label: "Growing", color: "secondary" as const },
      ESTABLISHED: { label: "Established", color: "outline" as const },
    },
  },
  CONFIDENCE: {
    TITLE: "Confidence Distribution",
    DESCRIPTION: "Breakdown of insight detection confidence levels",
    TOOLTIP: {
      title: "Confidence Levels",
      content:
        "Confidence scores indicate how strongly a comment matches an insight pattern. High (≥8): Strong match, Medium (5-7): Moderate match, Low (<5): Weak match.",
    },
    LEVELS: {
      HIGH: { min: 8, max: 10, label: "High", color: "emerald" },
      MEDIUM: { min: 5, max: 7.99, label: "Medium", color: "amber" },
      LOW: { min: 0, max: 4.99, label: "Low", color: "rose" },
    },
  },
  CONCENTRATION: {
    TITLE: "Insight Concentration",
    DESCRIPTION: "Distribution analysis of insight patterns",
    TOOLTIP: {
      title: "Concentration Analysis",
      content:
        "Shows how insights are distributed. High concentration means few insights dominate, while good distribution indicates diverse pattern detection.",
    },
    LEVELS: {
      VERY_HIGH: { label: "Very Concentrated", color: "destructive" as const },
      HIGH: { label: "Concentrated", color: "secondary" as const },
      MODERATE: { label: "Moderate", color: "outline" as const },
      LOW: { label: "Well Distributed", color: "default" as const },
    },
  },
  KEY_METRICS: {
    TOTAL_INSIGHTS: {
      label: "Total Insights",
      icon: Sparkles,
      color: "text-purple-500",
      tooltip: "Total insights detected",
    },
    TOTAL_COMMENTS: {
      label: "Comments Processed",
      icon: MessageSquare,
      color: "text-blue-500",
      tooltip: "Total comments processed",
    },
    MOST_POPULAR_INSIGHT: {
      label: "Most Popular Insight",
      icon: TrendingUp,
      color: "text-blue-500",
      tooltip: "Most popular insight",
    },
    LATEST_DISCOVERY: {
      label: "Latest Discovery",
      icon: Lightbulb,
      color: "text-blue-500",
      tooltip: "Latest discovery",
    },
  },
} as const;

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 8,
  MEDIUM: 5,
  LOW: 0,
} as const;

// Insight type configurations
export const INSIGHT_TYPES = {
  AI_GENERATED: {
    label: "AI Generated",
    icon: Bot,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-200",
  },
  HUMAN_DEFINED: {
    label: "Human Defined",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200",
  },
} as const;

// Icons for different insight categories
export const INSIGHT_ICONS = {
  getIcon: (insightName: string) => {
    const lowerName = insightName.toLowerCase();
    if (lowerName.includes("trend")) return TrendingUp;
    if (lowerName.includes("alert") || lowerName.includes("issue"))
      return AlertCircle;
    if (lowerName.includes("target") || lowerName.includes("goal"))
      return Target;
    if (lowerName.includes("performance") || lowerName.includes("speed"))
      return Zap;
    if (lowerName.includes("achievement") || lowerName.includes("success"))
      return Award;
    if (lowerName.includes("activity")) return Activity;
    if (lowerName.includes("idea") || lowerName.includes("innovation"))
      return Lightbulb;
    if (lowerName.includes("ai") || lowerName.includes("intelligence"))
      return Brain;
    return Sparkles;
  },
} as const;

// Empty states messages
export const EMPTY_STATES = {
  NO_DATA: {
    title: "No insights available",
    description: "Insights will appear here once comments are analyzed",
    icon: Brain,
  },
  NO_EMERGENT: {
    title: "No emergent insights",
    description: "AI-discovered patterns will appear here as they are detected",
    icon: Sparkles,
  },
  PROCESSING: {
    title: "Processing insights",
    description: "Analyzing patterns and generating insights...",
    icon: Activity,
  },
} as const;

// Analysis insights messages
export const ANALYSIS_INSIGHTS = {
  HIGH_CONCENTRATION:
    "High concentration in top insights - consider diversifying pattern detection",
  GOOD_DISTRIBUTION:
    "Well-distributed insight coverage - healthy pattern diversity",
  SINGLE_DOMINANCE:
    "Single insight dominates - may indicate strong trend or limited detection",
  LOW_CONFIDENCE:
    "Many low-confidence matches - consider refining pattern definitions",
  HIGH_CONFIDENCE:
    "Strong pattern matching across insights - reliable detection",
  EMERGENT_GROWTH: "Multiple emergent insights detected - new trends emerging",
} as const;
