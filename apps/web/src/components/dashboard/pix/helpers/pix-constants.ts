import {
  Heart,
  HeartCrack,
  Frown,
  AlertCircle,
  Flame,
  Shield,
  Gauge,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Smile,
  Meh,
  XCircle,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react";

/**
 * Constants for PIX Sentiment Dashboard
 */

// Sentiment level configurations
export const SENTIMENT_LEVELS = {
  // Positive sentiments
  GRATITUDE: {
    level: "gratitude",
    name: "Gratitude",
    icon: Heart,
    color: "#10b981", // emerald-500
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-200",
    intensity: 2,
  },
  SATISFACTION: {
    level: "satisfaction",
    name: "Satisfaction",
    icon: Smile,
    color: "#34d399", // emerald-400
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-200",
    intensity: 1,
  },
  // Neutral sentiment
  NEUTRAL: {
    level: "neutral",
    name: "Neutral",
    icon: Meh,
    color: "#6b7280", // gray-500
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-200",
    intensity: 0,
  },
  // Negative sentiments (ordered by intensity)
  DOUBT: {
    level: "doubt",
    name: "Doubt",
    icon: AlertCircle,
    color: "#fbbf24", // amber-400
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-200",
    intensity: -1,
  },
  CONCERN: {
    level: "concern",
    name: "Concern",
    icon: AlertCircle,
    color: "#fb923c", // orange-400
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-200",
    intensity: -2,
  },
  ANNOYANCE: {
    level: "annoyance",
    name: "Annoyance",
    icon: Frown,
    color: "#f87171", // red-400
    bgColor: "bg-red-400/10",
    borderColor: "border-red-200",
    intensity: -3,
  },
  FRUSTRATION: {
    level: "frustration",
    name: "Frustration",
    icon: Frown,
    color: "#ef4444", // red-500
    bgColor: "bg-red-500/10",
    borderColor: "border-red-300",
    intensity: -4,
  },
  ANGER: {
    level: "anger",
    name: "Anger",
    icon: Flame,
    color: "#dc2626", // red-600
    bgColor: "bg-red-600/10",
    borderColor: "border-red-400",
    intensity: -5,
  },
  OUTRAGE: {
    level: "outrage",
    name: "Outrage",
    icon: Shield,
    color: "#b91c1c", // red-700
    bgColor: "bg-red-700/10",
    borderColor: "border-red-500",
    intensity: -6,
  },
  CONTEMPT: {
    level: "contempt",
    name: "Contempt",
    icon: XCircle,
    color: "#991b1b", // red-800
    bgColor: "bg-red-800/10",
    borderColor: "border-red-600",
    intensity: -7,
  },
  FURY: {
    level: "fury",
    name: "Fury",
    icon: HeartCrack,
    color: "#7f1d1d", // red-900
    bgColor: "bg-red-900/10",
    borderColor: "border-red-700",
    intensity: -8,
  },
} as const;

// Severity level configurations
export const SEVERITY_LEVELS = {
  POSITIVE: {
    name: "Positive",
    color: "#10b981",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-200",
    icon: TrendingUp,
    description: "Positive sentiment expressed",
  },
  NONE: {
    name: "None",
    color: "#6b7280",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-200",
    icon: Meh,
    description: "Neutral or no sentiment",
  },
  LOW: {
    name: "Low",
    color: "#fbbf24",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-200",
    icon: AlertCircle,
    description: "Minor negative sentiment",
  },
  MEDIUM: {
    name: "Medium",
    color: "#fb923c",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-200",
    icon: Gauge,
    description: "Moderate negative sentiment",
  },
  HIGH: {
    name: "High",
    color: "#f87171",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-200",
    icon: TrendingDown,
    description: "Significant negative sentiment",
  },
  CRITICAL: {
    name: "Critical",
    color: "#dc2626",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-400",
    icon: Flame,
    description: "Severe negative sentiment",
  },
} as const;

// Main metrics configuration
export const PIX_METRICS = {
  OVERVIEW: {
    TITLE: "PIX Sentiment Agent",
    DESCRIPTION: "AI-powered sentiment analysis and emotional intelligence system",
    TOOLTIP: {
      title: "Understanding PIX Sentiment Analysis",
      content:
        "PIX analyzes the emotional tone of comments using the PIXE scale, ranging from positive (gratitude) through neutral to increasingly negative sentiments (doubt to fury).",
    },
    HELP_TEXT:
      "Monitor sentiment patterns to understand customer satisfaction and identify areas requiring attention.",
  },
  DISTRIBUTION: {
    TITLE: "Sentiment Distribution",
    DESCRIPTION: "Breakdown of sentiment levels across all analyzed comments",
    TOOLTIP: {
      title: "Sentiment Scale",
      content:
        "The PIXE scale measures emotional intensity from -8 (fury) to +2 (gratitude). Most comments (90%) express negative sentiments, 8% are neutral, and 2% are positive.",
    },
  },
  SEVERITY: {
    TITLE: "Severity Analysis",
    DESCRIPTION: "Aggregated view of sentiment severity categories",
    TOOLTIP: {
      title: "Severity Categories",
      content:
        "Sentiments are grouped by severity: Critical (fury, contempt, outrage), High (anger, frustration), Medium (annoyance, concern), Low (doubt), None (neutral), and Positive (satisfaction, gratitude).",
    },
  },
  TRENDS: {
    TITLE: "Sentiment Trends",
    DESCRIPTION: "Track sentiment changes over time and by insight",
    TOOLTIP: {
      title: "Trend Analysis",
      content:
        "Monitor how sentiment evolves across different insights and time periods to identify patterns and areas of improvement.",
    },
  },
  KEY_METRICS: {
    TOTAL_ANALYZED: {
      label: "Comments Analyzed",
      icon: Activity,
      color: "text-blue-500",
      tooltip: "Total comments with sentiment analysis",
    },
    AVG_INTENSITY: {
      label: "Average Intensity",
      icon: ThermometerSun,
      color: "text-orange-500",
      tooltip: "Average emotional intensity (-8 to +2)",
    },
    DOMINANT_SEVERITY: {
      label: "Dominant Severity",
      icon: Gauge,
      color: "text-purple-500",
      tooltip: "Most common severity level",
    },
    SENTIMENT_DIVERSITY: {
      label: "Sentiment Levels",
      icon: BarChart3,
      color: "text-green-500",
      tooltip: "Number of different sentiment levels detected",
    },
  },
} as const;

// Helper functions
export const getSentimentByLevel = (level: string) => {
  return Object.values(SENTIMENT_LEVELS).find((s) => s.level === level);
};

export const getSeverityByName = (name: string) => {
  return Object.values(SEVERITY_LEVELS).find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
};

// Chart color mappings
export const SENTIMENT_CHART_COLORS = {
  positive: "#10b981",
  none: "#6b7280",
  low: "#fbbf24",
  medium: "#fb923c",
  high: "#f87171",
  critical: "#dc2626",
} as const;

// Empty states messages
export const PIX_EMPTY_STATES = {
  NO_DATA: {
    title: "No sentiment data available",
    description: "Sentiment analysis will appear here once comments are processed",
    icon: Activity,
  },
  PROCESSING: {
    title: "Analyzing sentiments",
    description: "Processing emotional patterns...",
    icon: ThermometerSun,
  },
} as const;

// Analysis insights messages
export const PIX_ANALYSIS_INSIGHTS = {
  HIGHLY_NEGATIVE: "High concentration of negative sentiments - immediate attention required",
  MODERATELY_NEGATIVE: "Moderate negative sentiment - monitor closely for escalation",
  BALANCED: "Balanced sentiment distribution - maintain current approach",
  POSITIVE_TREND: "Positive sentiment trending upward - good progress",
  CRITICAL_SPIKE: "Critical sentiment spike detected - urgent review needed",
} as const;