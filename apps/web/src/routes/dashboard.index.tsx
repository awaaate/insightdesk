import { CompetitiveAnalysisSection } from "@/components/dashboard/kpis/competitive-analysis-section";
import { MentionSection } from "@/components/dashboard/kpis/mention-section";
import { RankingTableSection } from "@/components/dashboard/kpis/ranking-table-section";
import { VoiceMetricsSection } from "@/components/dashboard/kpis/voice-metrics-section";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4 px-2 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VoiceMetricsSection />
        <MentionSection />
      </div>

      <CompetitiveAnalysisSection />
      <RankingTableSection />
    </div>
  );
}
