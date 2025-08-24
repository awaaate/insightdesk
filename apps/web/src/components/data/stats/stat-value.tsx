import { cn } from "@/lib/utils";

interface StatValueProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const sizeVariants = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

export function StatValue({
  label,
  value,
  prefix,
  suffix,
  size = "lg",
  className,
  labelClassName,
  valueClassName,
}: StatValueProps) {
  return (
    <div className={cn("px-6 py-2 ", className)}>
      <p className={cn("text-sm text-muted-foreground mb-2", labelClassName)}>
        {label}
      </p>
      <p
        className={cn(
          "font-bold text-foreground",
          sizeVariants[size],
          valueClassName
        )}
      >
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  );
}
