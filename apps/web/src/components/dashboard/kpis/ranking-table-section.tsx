import { StatCard, StatHeader } from "@/components/data/stats";
import { KpisRankingTable } from "@/components/data/tables/ranking-table";
import { BarChart3, Crown } from "lucide-react";
import React from "react";

const ANALYSIS_INSIGHTS = {
  title: "AI Competitive Ranking",
  description:
    "Compare your brand performance against competitors in AI-generated responses",
  icon: <Crown className="h-5 w-5" />,
} as const;

interface RankingTableSectionProps {
  className?: string;
}

export const RankingTableSection: React.FC<RankingTableSectionProps> = ({
  className,
}) => {
  return (
    <StatCard className="">
      <StatHeader
        title={ANALYSIS_INSIGHTS.title}
        description={ANALYSIS_INSIGHTS.description}
        icon={ANALYSIS_INSIGHTS.icon}
      />
      <div className="p-6 bg-muted">
        <KpisRankingTable />
      </div>
    </StatCard>
  );
};
