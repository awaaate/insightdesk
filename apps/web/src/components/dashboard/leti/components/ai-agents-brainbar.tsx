import { DataCard } from "@/components/data/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain,
  Sparkles,
  MessageSquareQuote,
  Activity,
} from "lucide-react";
import { useMemo } from "react";
import { IconTooltip } from "@/components/common/icon-tooltip";

interface AIAgentsBrainBarProps {
  className?: string;
}

// Agent configurations with their roles and insights
const AGENTS_CONFIG = [
  {
    id: "leti",
    name: "YETI",
    role: "Insight Detection Agent",
    description: "Specialized in identifying predefined and emergent insights from customer comments",
    imageFolder: "BUHO", // Owl for wisdom and insight detection
    imageName: "BUHO_1.png",
    insight: "Hemos detectado 847 ideas nuevas que antes no estaban registradas. La más llamativa: un 12% de los comentarios negativos muestran desconfianza en la seguridad de sus datos personales.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
  },
  {
    id: "gro",
    name: "OGRO",
    role: "Intention Detection Agent",
    description: "Identifies underlying motivations and objectives behind customer comments",
    imageFolder: "TIBURON", // Shark for detecting intentions
    imageName: "TIBURON_1.png",
    insight: "El 68% de los clientes que dicen querer cancelar en realidad buscan sentirse escuchados y valorados. No han tomado la decisión final: tan solo necesitan razones para quedarse.",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
  },
  {
    id: "pix",
    name: "PIXE",
    role: "Sentiment Analysis Agent",
    description: "Analyzes emotional intensity using the PIXE sentiment scale",
    imageFolder: "LIBELULA", // Dragonfly for delicate sentiment detection
    imageName: "LIBELULA_1.png",
    insight: "La frustración se dispara después del segundo intento fallido de contacto: los clientes pasan de estar molestos (nivel 3) a enfadados (nivel 8) de golpe, sin etapas intermedias. ¡Uf! ese salto crea un punto crítico de no retorno.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
  },
];

export const AIAgentsBrainBar: React.FC<AIAgentsBrainBarProps> = ({
  className,
}) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  return (
    <DataCard className={cn("overflow-hidden", className)}>
      {/* Header */}
      <DataCard.Header
        title="AI Agents Brain-bar"
        description="Real-time insights from our specialized AI analysis agents"
        icon={<Brain className="h-5 w-5" />}
      />

      {/* Agents Insights Grid */}
      <div className="p-6 space-y-4">
        {AGENTS_CONFIG.map((agent, index) => (
          <div
            key={agent.id}
            className={cn(
              "relative flex items-start gap-4 p-5 rounded-lg transition-all duration-200",
              "hover:shadow-sm",
              "border",
              "bg-muted/5",
              "border-border/50"
            )}
          >
            {/* Agent Avatar */}
            <div className="flex-shrink-0">
              <div className={cn(
                "relative w-16 h-16 rounded-full overflow-hidden",
                "ring-1 ring-offset-2",
                "ring-border/30",
                "shadow-sm",
                "bg-background"
              )}>
                <div className="absolute inset-1 rounded-full overflow-hidden">
                  <img
                    src={`${serverUrl}/assets/${agent.imageFolder}/${agent.imageName}`}
                    alt={agent.name}
                    className="w-full h-full object-cover scale-90"
                  />
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-background"></span>
                  </div>
                </div>
              </div>
              
              {/* Agent Name */}
              <div className="mt-2 text-center">
                <p className={cn("text-xs font-semibold", agent.color)}>
                  {agent.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {agent.role.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Agent Insight */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className={cn("h-4 w-4", agent.color)} />
                  <span className="text-sm font-medium text-muted-foreground">
                    Latest Analysis
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5",
                      "bg-background/50",
                      "text-muted-foreground",
                      "border-border/50"
                    )}
                  >
                    <Activity className="h-2.5 w-2.5 mr-1" />
                    Live
                  </Badge>
                </div>
                
                <IconTooltip 
                  icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                >
                  <p className="font-medium mb-1">{agent.name}</p>
                  <p className="text-xs">{agent.description}</p>
                </IconTooltip>
              </div>

              {/* Quote Container */}
              <div className="relative">
                {/* Opening Quote */}
                <span className={cn(
                  "absolute -left-1 -top-0.5 text-2xl font-serif opacity-15",
                  agent.color
                )}>
                  "
                </span>
                
                {/* Agent's Insight Text */}
                <blockquote className={cn(
                  "pl-5 pr-3 py-1 text-sm leading-relaxed",
                  "border-l-2",
                  "border-border/30",
                  "italic text-foreground/85"
                )}>
                  {agent.insight}
                </blockquote>
                
                {/* Closing Quote */}
                <span className={cn(
                  "absolute -right-1 bottom-0 text-2xl font-serif opacity-15",
                  agent.color
                )}>
                  "
                </span>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-muted-foreground">
                  Analyzed just now
                </span>
                <span className="text-xs text-muted-foreground">
                  •
                </span>
                <span className="text-xs text-muted-foreground">
                  Based on latest comment batch
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          AI agents continuously analyze incoming data to provide real-time insights and patterns
        </p>
      </div>
    </DataCard>
  );
};