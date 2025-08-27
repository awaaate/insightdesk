import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DataCardHeader } from "./data-card-header";
import { DataCardComparison, DataCardValueItem } from "./data-card-comparison";

interface DataCardProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconColor?: "green" | "blue" | "purple" | "orange";
}

const iconColorVariants = {
  green: "text-green-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
};

const DataCardInternal: React.FC<DataCardProps> = ({
  children,
  className,
  icon,
  iconColor = "blue",
}) => {
  return (
    <div
      className={cn("relative rounded-xl shadow-lg bg-card pb-0", className)}
    >
      {icon && (
        <div className={cn("mb-4 inline-flex", iconColorVariants[iconColor])}>
          {icon}
        </div>
      )}
      {children}
    </div>
  );
};

export const DataCardNamespace = {
  Header: DataCardHeader,
  Comparison: DataCardComparison,
  ValueItem: DataCardValueItem,
};

export const DataCard = Object.assign(DataCardInternal, DataCardNamespace);
