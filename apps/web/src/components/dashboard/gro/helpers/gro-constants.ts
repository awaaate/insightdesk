import {
  Target,
  MessageCircle,
  AlertTriangle,
  Search,
  XOctagon,
  ThumbsUp,
  Lightbulb,
  HelpCircle,
  Activity,
  BarChart3,
  TrendingUp,
  Shield,
  Users,
  Gauge,
  Brain,
} from "lucide-react";

/**
 * Constants for GRO Intentions Dashboard
 */

// Intention type configurations
export const INTENTION_TYPES = {
  RESOLVE: {
    type: "resolve",
    name: "Resolve",
    icon: Target,
    color: "#10b981", // emerald
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-200",
    description: "Customer seeking solution or resolution",
  },
  COMPLAIN: {
    type: "complain",
    name: "Complain",
    icon: AlertTriangle,
    color: "#ef4444", // red
    bgColor: "bg-red-500/10",
    borderColor: "border-red-200",
    description: "Expressing dissatisfaction or grievance",
  },
  COMPARE: {
    type: "compare",
    name: "Compare",
    icon: Users,
    color: "#3b82f6", // blue
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200",
    description: "Comparing options or alternatives",
  },
  CANCEL: {
    type: "cancel",
    name: "Cancel",
    icon: XOctagon,
    color: "#f97316", // orange
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-200",
    description: "Intent to cancel or discontinue",
  },
  INQUIRE: {
    type: "inquire",
    name: "Inquire",
    icon: Search,
    color: "#8b5cf6", // purple
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-200",
    description: "Seeking information or clarification",
  },
  PRAISE: {
    type: "praise",
    name: "Praise",
    icon: ThumbsUp,
    color: "#22c55e", // green
    bgColor: "bg-green-500/10",
    borderColor: "border-green-200",
    description: "Expressing satisfaction or appreciation",
  },
  SUGGEST: {
    type: "suggest",
    name: "Suggest",
    icon: Lightbulb,
    color: "#06b6d4", // cyan
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-200",
    description: "Providing suggestions or recommendations",
  },
  OTHER: {
    type: "other",
    name: "Other",
    icon: HelpCircle,
    color: "#6b7280", // gray
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-200",
    description: "Other or unclassified intentions",
  },
} as const;

// Main metrics configuration
export const GRO_METRICS = {
  OVERVIEW: {
    TITLE: "GRO Intention Agent",
    DESCRIPTION: "AI-powered customer intention detection and analysis system",
    TOOLTIP: {
      title: "Understanding GRO Intention Analysis",
      content:
        "GRO analyzes customer comments to identify their primary intentions - what they're trying to achieve or communicate. This helps prioritize responses and understand customer needs.",
    },
    HELP_TEXT:
      "Monitor intention patterns to understand customer needs and improve service delivery.",
  },
  DISTRIBUTION: {
    TITLE: "Intention Distribution",
    DESCRIPTION: "Breakdown of customer intentions across all analyzed comments",
    TOOLTIP: {
      title: "Intention Categories",
      content:
        "Each comment is categorized by its primary intention. Multiple secondary intentions may also be detected for complex requests.",
    },
  },
  CONFIDENCE: {
    TITLE: "Detection Confidence",
    DESCRIPTION: "AI confidence levels in intention detection",
    TOOLTIP: {
      title: "Confidence Scores",
      content:
        "Higher confidence scores indicate clearer intention signals. Low confidence may indicate ambiguous or complex requests requiring human review.",
    },
  },
  TYPE_ANALYSIS: {
    TITLE: "Type Analysis",
    DESCRIPTION: "Distribution by intention type",
    TOOLTIP: {
      title: "Intention Types",
      content:
        "Shows the breakdown of different intention types to identify common customer needs and potential service gaps.",
    },
  },
  KEY_METRICS: {
    TOTAL_ANALYZED: {
      label: "Comments Analyzed",
      icon: Activity,
      color: "text-blue-500",
      tooltip: "Total comments with intention analysis",
    },
    AVG_CONFIDENCE: {
      label: "Average Confidence",
      icon: Gauge,
      color: "text-purple-500",
      tooltip: "Average detection confidence (0-10)",
    },
    DOMINANT_TYPE: {
      label: "Dominant Type",
      icon: TrendingUp,
      color: "text-green-500",
      tooltip: "Most common intention type",
    },
    MULTIPLE_INTENTIONS: {
      label: "Complex Requests",
      icon: Brain,
      color: "text-orange-500",
      tooltip: "Comments with multiple intentions",
    },
  },
} as const;

// Helper functions
export const getIntentionByType = (type: string) => {
  return Object.values(INTENTION_TYPES).find((i) => i.type === type);
};

// Confidence level configurations
export const CONFIDENCE_LEVELS = {
  HIGH: {
    min: 8,
    max: 10,
    label: "High",
    color: "emerald",
    description: "Clear intention detected",
  },
  MEDIUM: {
    min: 5,
    max: 7.99,
    label: "Medium",
    color: "amber",
    description: "Moderate confidence",
  },
  LOW: {
    min: 0,
    max: 4.99,
    label: "Low",
    color: "red",
    description: "Ambiguous or unclear",
  },
} as const;

// Priority mapping based on intention type
export const INTENTION_PRIORITY = {
  cancel: 1, // Highest priority - retention risk
  complain: 2, // High priority - dissatisfaction
  resolve: 3, // Medium-high - needs solution
  inquire: 4, // Medium - information needed
  compare: 5, // Medium-low - considering options
  suggest: 6, // Low - feedback
  praise: 7, // Low - positive feedback
  other: 8, // Lowest - unclear
} as const;

// Empty states messages
export const GRO_EMPTY_STATES = {
  NO_DATA: {
    title: "No intention data available",
    description: "Intention analysis will appear here once comments are processed",
    icon: Brain,
  },
  PROCESSING: {
    title: "Analyzing intentions",
    description: "Detecting customer intentions and goals...",
    icon: Activity,
  },
} as const;

// Analysis insights messages
export const GRO_ANALYSIS_INSIGHTS = {
  HIGH_CHURN_RISK: "High cancellation intentions detected - retention action required",
  SERVICE_ISSUES: "Multiple complaint intentions - service quality review needed",
  INFO_GAPS: "High inquiry rate suggests information gaps in documentation",
  POSITIVE_TREND: "Increased praise intentions - positive customer sentiment",
  COMPLEX_NEEDS: "Many multi-intention comments - customers have complex needs",
} as const;