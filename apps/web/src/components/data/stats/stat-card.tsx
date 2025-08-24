import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
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

export function StatCard({
  children,
  className,
  icon,
  iconColor = "blue",
}: StatCardProps) {
  return (
    <div className={cn("relative rounded-xl border bg-card pb-0", className)}>
      {icon && (
        <div className={cn("mb-4 inline-flex", iconColorVariants[iconColor])}>
          {icon}
        </div>
      )}
      {children}
    </div>
  );
}
