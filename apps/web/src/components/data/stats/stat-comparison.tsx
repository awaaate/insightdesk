import { cn } from "@/lib/utils";

interface StatComparisonItem {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

interface StatComparisonProps {
  before: StatComparisonItem;
  after: StatComparisonItem;
  className?: string;
  valueClassName?: string;
}

const ComparisonItem: React.FC<StatComparisonItem> = ({
  label,
  value,
  description,
  valueClassName,
  className,
}) => {
  return (
    <div className={cn("flex-1 flex flex-col justify-center p-4 ", className)}>
      <p className="text-sm font-medium mb-2">{label}</p>
      <p className={cn("text-3xl font-bold", valueClassName)}>
        {typeof value === "string" ? value.substring(0, 6) : value}
      </p>
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

export function StatComparison({
  before,
  after,
  className,
  valueClassName,
}: StatComparisonProps) {
  return (
    <div className={cn("flex items-center justify-between ", className)}>
      <ComparisonItem
        label={before.label}
        value={before.value}
        description={before.description}
        valueClassName={before.valueClassName ?? valueClassName}
        className={before.className}
      />
      <ComparisonItem
        label={after.label}
        value={after.value}
        description={after.description}
        valueClassName={after.valueClassName ?? valueClassName}
        className={cn("bg-muted border-l", after.className)}
      />
    </div>
  );
}
