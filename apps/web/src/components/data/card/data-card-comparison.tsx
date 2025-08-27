import { cn } from "@/lib/utils";

interface DataCardValueItem {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

interface DataComparisonProps {
  right: DataCardValueItem;
  left: DataCardValueItem;
  className?: string;
  valueClassName?: string;
}

export const DataCardValueItem: React.FC<DataCardValueItem> = ({
  label,
  value,
  description,
  valueClassName,
  className,
}) => {
  return (
    <div className={cn("flex-1 flex flex-col justify-center p-4 ", className)}>
      <p className="text-sm font-medium mb-2">{label}</p>

      {typeof value === "string" ? (
        <p className={cn("text-3xl font-bold", valueClassName)}>
          {value.substring(0, 6)}
        </p>
      ) : (
        value
      )}

      {description && typeof description === "string" ? (
        <p className="text-sm text-muted-foreground break-words">
          {description}
        </p>
      ) : (
        description
      )}
    </div>
  );
};

export const DataCardComparison: React.FC<DataComparisonProps> = ({
  right,
  left,
  className,
  valueClassName,
}) => {
  return (
    <div className={cn("flex items-center justify-between ", className)}>
      <DataCardValueItem
        label={right.label}
        value={right.value}
        description={right.description}
        valueClassName={right.valueClassName ?? valueClassName}
        className={right.className}
      />
      <DataCardValueItem
        label={left.label}
        value={left.value}
        description={left.description}
        valueClassName={left.valueClassName ?? valueClassName}
        className={cn("bg-muted border-l", left.className)}
      />
    </div>
  );
};
