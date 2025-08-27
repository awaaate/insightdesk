import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DataCardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  iconColor?: "green" | "blue" | "purple" | "orange";
  className?: string;
  children?: ReactNode;
  tooltip?: ReactNode;
  action?: ReactNode;
}

const iconColorVariants = {
  green: "text-green-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
};

export const DataCardHeader: React.FC<DataCardHeaderProps> = ({
  title,
  description,
  icon,
  iconColor = "blue",
  className,
  children,
  tooltip,
  action,
}) => {
  const mainContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className={cn(iconColorVariants[iconColor])}>{icon}</span>
        )}
        <h3 className="text-lg font-semibold text-foreground ">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground break-words">
          {description}
        </p>
      )}
    </>
  );

  if (children || tooltip) {
    return (
      <div
        className={cn(
          "p-6 border-b relative flex justify-between items-baseline ",
          className
        )}
      >
        <div>{mainContent}</div>
        {children}
        {action}
        {tooltip}
      </div>
    );
  }

  return (
    <div className={cn("p-6 border-b", className)}>
      {mainContent}
      {children}
      {action}
    </div>
  );
};
