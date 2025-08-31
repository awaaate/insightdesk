import { cn } from "@/lib/utils";
import { LetiKeyInsights } from "./components/leti-key-insights";
import { KeyInsightsSummary } from "./components/key-insights-summary";
import { TopInsightsSection } from "./components/top-insights-section";
import { InsightCorrelations } from "./components/insight-correlations";
import { EmergentInsightsCard } from "./components/emergent-insights-card";
import { SentimentDistribution } from "../pix/components/sentiment-distribution";
import { IntentionDistribution } from "../gro/components/intention-distribution";
import { CommentsTable } from "@/components/comments/comments-table";
import { DataCard } from "@/components/data/card";
import { CommentsTableEnhanced } from "@/components/comments/comments-table-enhanced";
import { AIAgentsBrainBar } from "./components/ai-agents-brainbar";
import { AnalyticsFilterBar } from "@/components/dashboard/shared/analytics-filter-bar";

interface LetiDashboardProps {
  className?: string;
}

export const LetiDashboard: React.FC<LetiDashboardProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Global Analytics Filters - Applied to all components */}
      <AnalyticsFilterBar className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />

      {/* AI Agent Key Insights - Top Section */}

      {/* Key Insights Summary - Second Row */}
      <KeyInsightsSummary />
      <div className="grid grid-cols-2 gap-4">
        <TopInsightsSection />
        <SentimentDistribution />
      </div>
      <IntentionDistribution />

      {/* AI Agents Brain-bar - Analysis insights from specialized agents */}
      <AIAgentsBrainBar />

      {/* Main Content Grid */}

      {/*       <InsightCorrelations />
      <div id="leti-key-insight">
        <LetiKeyInsights />
      </div> */}
      <DataCard className="w-full">
        <DataCard.Header
          title="Comments"
          description="Comments from the AI Agent"
        />
        <div className="h-[500px] p-4 max-w-full overflow-auto">
          <CommentsTableEnhanced />
        </div>
      </DataCard>
    </div>
  );
};
