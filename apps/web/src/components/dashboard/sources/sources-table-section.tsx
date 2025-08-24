import { StatCard, StatHeader } from "@/components/data/stats";
import { SourcesTable } from "@/components/data/tables/sources-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Eye,
  Download,
  Table as TableIcon,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";

// Constants for sources table
const SOURCES_TABLE_METRICS = {
  TITLE: "Detailed AI Source Analysis",
  DESCRIPTION:
    "Explore all AI sources where your brand is being referenced across platforms",
  TOOLTIP: {
    title: "AI Source Analysis Table",
    content:
      "This comprehensive GEORADAR table shows all sources that AI systems reference when mentioning your brand. You can filter by category, search for specific domains, and export the data for further analysis.",
  },
  EXPORT: {
    title: "Export AI Sources to Excel",
    description: "Download AI source data for offline analysis",
    helpText:
      "Exports all AI source data including domains, categories, and mention counts to an Excel file.",
  },
} as const;

interface SourcesTableSectionProps {
  className?: string;
}

export const SourcesTableSection = ({
  className,
}: SourcesTableSectionProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Call the export endpoint
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
        }/api/sources/export`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from headers or use default
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `sources-export-${new Date().toISOString().split("T")[0]}.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("AI sources exported successfully", {
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export AI sources", {
        description: "Please try again later",
      });
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <StatCard className={cn(className)}>
      <StatHeader
        title={SOURCES_TABLE_METRICS.TITLE}
        description={SOURCES_TABLE_METRICS.DESCRIPTION}
        icon={<TableIcon className="h-5 w-5 text-violet-500" />}
        tooltip={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Interactive Table
            </Badge>
            <IconTooltip icon={<HelpCircle className="h-4 w-4" />}>
              <p className="font-semibold mb-1">
                {SOURCES_TABLE_METRICS.TOOLTIP.title}
              </p>
              <p className="text-xs">{SOURCES_TABLE_METRICS.TOOLTIP.content}</p>
            </IconTooltip>
          </div>
        }
      />

      {/* Export Section */}
      <div className="mb-6">
        <div className="border-b px-4 py-4 flex flex-col gap-2">
          <div className="">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="default"
              size="sm"
              className=" gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {SOURCES_TABLE_METRICS.EXPORT.helpText}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 pt-0">
        <SourcesTable onExport={handleExport} />
      </div>
    </StatCard>
  );
};
