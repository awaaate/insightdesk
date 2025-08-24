import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AttributesTable } from "@/components/data/tables/attributes-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Eye } from "lucide-react";
import {
  StatCard,
  StatComparison,
  StatHeader,
  StatValue,
} from "@/components/data/stats";
import { BarChart } from "@/components/data/bar-chart";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { constructCategoryColors, getColorClassName } from "@/lib/chartUtils";
import { cn } from "@/lib/utils";
import { AttributesSummarySection } from "@/components/dashboard/attributes/attributes-sumary-section";
import { AttributesRadarSection } from "@/components/dashboard/attributes/attributes-radar-section";
import { TopAttributesSection } from "@/components/dashboard/attributes/top-attributes-section";
import { AttributesContextTableSection } from "@/components/dashboard/attributes/attributes-context-table-section";

export const Route = createFileRoute("/dashboard/attributes")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: summary } = useQuery(trpc.attributes.summary.queryOptions());
  const { data: attributes } = useQuery(trpc.attributes.get.queryOptions());
  const { data: topAttributes } = useQuery(trpc.attributes.top.queryOptions());
  const { data: matrix } = useQuery(trpc.attributes.matrix.queryOptions());
  // Calculate summary statistics
  const stats = attributes?.reduce(
    (acc, attr) => {
      acc.total++;
      switch (attr.sentiment) {
        case "positive":
          acc.positive++;
          break;
        case "negative":
          acc.negative++;
          break;
        case "neutral":
          acc.neutral++;
          break;
      }
      return acc;
    },
    { total: 0, positive: 0, negative: 0, neutral: 0 }
  ) || { total: 0, positive: 0, negative: 0, neutral: 0 };

  // Extract brands from matrix data (they are the keys except for 'attribute_name')
  const brands =
    matrix && matrix.length > 0
      ? Object.keys(matrix[0]).filter((key) => key !== "attribute_name")
      : [];
  const categoryColors = constructCategoryColors(brands, [
    "emerald",
    "gray",
    "lime",
  ]);
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AttributesSummarySection className="col-span-1" />
        <AttributesRadarSection className="col-span-2" />
      </div>

      <TopAttributesSection />

      <AttributesContextTableSection />
    </div>
  );
}
