import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { SourcesTable } from "@/components/data/tables/sources-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  FileText,
  Link,
  TrendingUp,
  BarChart3,
  Eye,
  Layers,
} from "lucide-react";
import {
  StatCard,
  StatComparison,
  StatHeader,
  StatValue,
} from "@/components/data/stats";
import { BarChart } from "@/components/data/bar-chart";
import { DonutChart } from "@/components/data/donut-chart";
import { BarList } from "@/components/data/bar-list";
import { ProgressCircle } from "@/components/data/progress-circle";
import { cn } from "@/lib/utils";
import { SourcesOverview } from "@/components/dashboard/sources/sources-overview";
import { SourcesBreakdown } from "@/components/dashboard/sources/sources-breakdow";
import { PlatformBreakdown } from "@/components/dashboard/sources/platform-breakdown";
import { TopSourcesSection } from "@/components/dashboard/sources/top-sources-section";
import { TopOwnedSourcesSection } from "@/components/dashboard/sources/top-owned-sources-section";
import { SourcesTableSection } from "@/components/dashboard/sources/sources-table-section";

export const Route = createFileRoute("/dashboard/sources")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: overview } = useQuery(trpc.sources.overview.queryOptions());
  const { data: categoriesData } = useQuery(
    trpc.sources.overviewPerCategory.queryOptions()
  );
  const { data: topSources } = useQuery(trpc.sources.topSources.queryOptions());
  const { data: topDomains } = useQuery(trpc.sources.topDomains.queryOptions());

  // Prepare data for the donut chart
  const categoryChartData =
    categoriesData?.map((cat) => ({
      name: cat.name,
      value: cat.data.totalResponses,
      category: cat.name,
    })) || [];

  // Prepare data for the bar chart showing top domains
  const topDomainsChartData =
    topDomains?.slice(0, 10).map((domain) => ({
      name: domain.website_domain,
      responses: domain.total_responses,
      category: domain.category || "Other",
    })) || [];

  // Calculate AI vs non-AI sources
  const aiSources =
    categoriesData?.find((cat) => cat.name === "AI Chatbots")?.data
      .totalResponses || 0;
  const totalResponses = overview?.totalResponses || 0;
  const nonAiSources = totalResponses - aiSources;
  const aiPercentage =
    totalResponses > 0 ? (aiSources / totalResponses) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <SourcesOverview className="col-span-7" />
        <SourcesBreakdown className="col-span-2" />
        <PlatformBreakdown className="col-span-5" />
        <TopSourcesSection className="col-span-7" />
      </div>

      <SourcesTableSection />
    </div>
  );
}
