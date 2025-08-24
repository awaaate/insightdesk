import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

export interface IconTooltipProps {
  children: React.ReactNode;
  icon: React.ReactNode;
}

export const IconTooltip: React.FC<IconTooltipProps> = ({ children, icon }) => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Learn more about mention analysis"
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{children}</TooltipContent>
      </Tooltip>
    </>
  );
};
