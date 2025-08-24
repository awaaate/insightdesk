import { IconTooltip } from "@/components/common/icon-tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RouterOutput } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Eye,
  Frown,
  Info,
  Meh,
  MessageSquare,
  Smile,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { BaseDataTable } from "./base-data-table";

type AttributeData = RouterOutput["attributes"]["get"][number];

// Attribute definitions with professional labels and descriptions
const ATTRIBUTE_DEFINITIONS = {
  sentiment: {
    title: "Sentiment Analysis",
    shortTitle: "Sentiment",
    description: "Emotional tone of the attribute mention",
    tooltip:
      "Sentiment analysis categorizes each attribute mention as positive, neutral, or negative based on the context in which it appears.",
    unit: "",
    icon: <MessageSquare className="h-4 w-4" />,
    format: (value: string) => value,
    getVariant: (value: string) => {
      switch (value) {
        case "positive":
          return "default";
        case "neutral":
          return "secondary";
        case "negative":
          return "destructive";
        default:
          return "outline";
      }
    },
    getIcon: (value: string) => {
      switch (value) {
        case "positive":
          return <Smile className="h-3 w-3 text-green-600" />;
        case "neutral":
          return <Meh className="h-3 w-3 text-gray-600" />;
        case "negative":
          return <Frown className="h-3 w-3 text-red-600" />;
        default:
          return <MessageSquare className="h-3 w-3" />;
      }
    },
  },
  confidence: {
    title: "Detection Confidence",
    shortTitle: "Confidence",
    description: "AI model confidence in attribute detection",
    tooltip:
      "Confidence score represents how certain our AI model is about correctly identifying and categorizing this attribute mention. Higher scores indicate more reliable detections.",
    unit: "%",
    icon: <TrendingUp className="h-4 w-4" />,
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    getVariant: (value: number) => {
      if (value >= 0.8) return "default";
      if (value >= 0.6) return "secondary";
      if (value >= 0.4) return "outline";
      return "destructive";
    },
  },
  context_snippet: {
    title: "Context Preview",
    shortTitle: "Context",
    description: "Text context where the attribute was mentioned",
    tooltip:
      "This shows the actual text snippet from the conversation where the attribute was detected, providing context for the sentiment analysis.",
    unit: "",
    icon: <Eye className="h-4 w-4" />,
    format: (value: string) => value,
  },
  attribute_name: {
    title: "Attribute Name",
    shortTitle: "Attribute",
    description: "The specific brand attribute or feature mentioned",
    tooltip:
      "Attributes are specific characteristics, features, or qualities of your brand that customers discuss in conversations.",
    unit: "",
    icon: <Tag className="h-4 w-4" />,
    format: (value: string) => value,
  },
} as const;

// Helper function to get sentiment color and styling
const getSentimentStyling = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return {
        bgColor: "bg-green-50 border-green-200",
        textColor: "text-green-800",
        iconColor: "text-green-600",
        darkBg: "dark:bg-green-950/20 dark:border-green-900",
        darkText: "dark:text-green-300",
      };
    case "neutral":
      return {
        bgColor: "bg-gray-50 border-gray-200",
        textColor: "text-gray-800",
        iconColor: "text-gray-600",
        darkBg: "dark:bg-gray-950/20 dark:border-gray-800",
        darkText: "dark:text-gray-300",
      };
    case "negative":
      return {
        bgColor: "bg-red-50 border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
        darkBg: "dark:bg-red-950/20 dark:border-red-900",
        darkText: "dark:text-red-300",
      };
    default:
      return {
        bgColor: "bg-gray-50 border-gray-200",
        textColor: "text-gray-800",
        iconColor: "text-gray-600",
        darkBg: "dark:bg-gray-950/20 dark:border-gray-800",
        darkText: "dark:text-gray-300",
      };
  }
};

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const AttributesTable = () => {
  const { data, isLoading, error } = useQuery(
    trpc.attributes.get.queryOptions()
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<
    string | undefined
  >(undefined);

  // Handle error state with professional UI
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load attributes data. Please check your connection and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRowClick = (responseId: string) => {
    setSelectedResponseId(responseId);
    setModalOpen(true);
  };

  const columns: ColumnDef<AttributeData>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {ATTRIBUTE_DEFINITIONS.attribute_name.icon}
          <span className="font-semibold">
            {ATTRIBUTE_DEFINITIONS.attribute_name.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {ATTRIBUTE_DEFINITIONS.attribute_name.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {ATTRIBUTE_DEFINITIONS.attribute_name.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: ({ row }) => {
        const attributeName = row.original.name;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <Tag className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{attributeName}</span>
              <span className="text-xs text-muted-foreground capitalize">
                Brand Attribute
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "context_snippet",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {ATTRIBUTE_DEFINITIONS.context_snippet.icon}
          <span className="font-semibold">
            {ATTRIBUTE_DEFINITIONS.context_snippet.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {ATTRIBUTE_DEFINITIONS.context_snippet.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {ATTRIBUTE_DEFINITIONS.context_snippet.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: ({ row }) => {
        const context = row.original.context_snippet || "";
        const sentiment = row.original.sentiment;
        const styling = getSentimentStyling(sentiment);

        return (
          <div
            className={cn(
              "max-w-md p-3 rounded-lg border transition-colors hover:shadow-sm text-wrap",
              styling.bgColor,
              styling.darkBg
            )}
          >
            <p
              className={cn(
                "text-sm leading-relaxed",
                styling.textColor,
                styling.darkText
              )}
            >
              "{truncateText(context, 150)}"
            </p>
            {context.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick(row.original.response_id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 font-medium"
              >
                Read full context →
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sentiment",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          {ATTRIBUTE_DEFINITIONS.sentiment.icon}
          <span className="font-semibold">
            {ATTRIBUTE_DEFINITIONS.sentiment.shortTitle}
          </span>
          <IconTooltip
            icon={<Info className="h-3 w-3 text-muted-foreground" />}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {ATTRIBUTE_DEFINITIONS.sentiment.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {ATTRIBUTE_DEFINITIONS.sentiment.tooltip}
              </p>
            </div>
          </IconTooltip>
        </div>
      ),
      cell: ({ row }) => {
        const sentiment = row.original.sentiment;
        const sentimentDef = ATTRIBUTE_DEFINITIONS.sentiment;
        const styling = getSentimentStyling(sentiment);

        return (
          <div className="flex flex-col gap-2">
            <Badge
              variant={sentimentDef.getVariant(sentiment)}
              className={cn(
                "w-fit",
                styling.bgColor,
                styling.textColor,
                styling.darkBg,
                styling.darkText
              )}
            >
              {sentimentDef.getIcon(sentiment)}
              <span className="capitalize font-medium">{sentiment}</span>
            </Badge>

            {/* Sentiment explanation */}
            <p className="text-xs text-muted-foreground">
              {sentiment === "positive" && "Favorable mention"}
              {sentiment === "neutral" && "Factual reference"}
              {sentiment === "negative" && "Critical feedback"}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <BaseDataTable
      columns={columns}
      data={data || []}
      loading={isLoading}
      error={error ? new Error(error) : null}
      searchKey="name"
      searchPlaceholder="Search by attribute name..."
      emptyMessage="No attribute data available. Attributes will appear as they are detected in conversations."
      pageSize={20}
      showColumnVisibility={true}
      showPagination={true}
      showSearch={true}
      //onRowClick={(row) => handleRowClick(row.original.response_id)}
    />
  );
};
