import { StatCard, StatHeader } from "@/components/data/stats";
import { AttributesTable } from "@/components/data/tables/attributes-table";
import { Construction, Eye } from "lucide-react";

interface AttributesContextTableSectionProps {
  className?: string;
}

export const AttributesContextTableSection: React.FC<
  AttributesContextTableSectionProps
> = ({ className }) => {
  return (
    <StatCard>
      <StatHeader
        title="AI Context Table"
        description="Click on any row to view the full AI response context where the brand attribute was detected"
        icon={<Eye className="h-4 w-4 text-blue-400" />}
      />
      <div className="p-6 bg-muted/30 relative flex h-[400px] pb-10">
        <div className="mt-4 flex h-full items-center justify-center  absolute top-0 left-0 w-full z-10 bg-black/10 backdrop-blur-sm">
          <div className="text-center">
            <Construction
              className="mx-auto size-7 text-blue-400"
              aria-hidden={true}
            />
            <p className="mt-2 ont-medium ">Under construction</p>
            <p className="text-sm text-muted-foreground">
              This feature is under construction and will be available soon.
            </p>
          </div>
        </div>
        <div className="overflow-y-hidden  w-full">
          <AttributesTable />
        </div>
      </div>
    </StatCard>
  );
};
