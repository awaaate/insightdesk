import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatChangeProps {
  value: number;
  label?: string;
  type?: "increase" | "decrease" | "neutral";
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const typeVariants = {
  increase: "text-green-500",
  decrease: "text-red-500",
  neutral: "text-gray-400",
};

const sizeVariants = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const iconSizeVariants = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StatChange({
  value,
  label,
  type,
  showIcon = true,
  className,
  size = "md",
}: StatChangeProps) {
  const calculatedType =
    type || (value > 0 ? "increase" : value < 0 ? "decrease" : "neutral");

  const Icon =
    calculatedType === "increase"
      ? TrendingUp
      : calculatedType === "decrease"
      ? TrendingDown
      : Minus;

  const formattedValue = value > 0 ? `+${value}` : value.toString();

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 px-6 py-4 border-t w-full",
        typeVariants[calculatedType],
        sizeVariants[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizeVariants[size]} />}
      <span className="font-medium">
        {formattedValue.substring(0, 6)}% {label}
      </span>
    </div>
  );
}
