import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  children,
  badge,
  title,
  value,
}) => {
  const action = badge ? <CardAction>{badge}</CardAction> : null;
  return (
    <Card className="@container/card border border-brand/10 shadow-none rounded-lg">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {action}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {children}
      </CardFooter>
    </Card>
  );
};

interface MetricCardListProps {
  children: React.ReactNode;
  className?: string;
}

export const MetricCardList: React.FC<MetricCardListProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "*:data-[slot=card]:from-brand/10 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs ",
        className
      )}
    >
      {children}
    </div>
  );
};
