import React from "react";
import { useCommentWithInsights } from "@/stores/processing.store";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  TrendingUp,
  Calendar,
  Zap,
  Brain,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ProcessingCommentProps {
  id: string;
}

export const ProcessingComment: React.FC<ProcessingCommentProps> = ({ id }) => {
  // Get comment with insights in one selector
  const commentWithInsights = useCommentWithInsights(id);

  // Fetch comment data from API
  const { data: commentData, isLoading } = useQuery({
    ...trpc.comments.getByIds.queryOptions({ ids: [id] }),
    enabled: !!commentWithInsights,
  });

  // Fetch insights data from API  
  const insightIds = commentWithInsights?.insightIds || [];
  const { data: insightsData } = useQuery({
    ...trpc.insights.getByIds.queryOptions({ ids: insightIds }),
    enabled: insightIds.length > 0,
  });

  if (!commentWithInsights || isLoading) {
    return <CommentSkeleton />;
  }

  const comment = commentWithInsights;
  const actualComment = commentData?.[0];

  const statusConfig = {
    idle: {
      icon: Clock,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      borderColor: "border-gray-200 dark:border-gray-800",
      label: "En espera",
      pulse: false,
    },
    processing: {
      icon: Brain,
      color: "text-blue-500",
      bgColor:
        "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      borderColor: "border-blue-300 dark:border-blue-700",
      label: "Analizando",
      pulse: true,
    },
    completed: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor:
        "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
      borderColor: "border-emerald-300 dark:border-emerald-700",
      label: "Completado",
      pulse: false,
    },
    failed: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-300 dark:border-red-700",
      label: "Error",
      pulse: false,
    },
  };

  const config = statusConfig[comment.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
          config.bgColor,
          config.borderColor,
          "border-2",
          config.pulse && "animate-pulse"
        )}
      >
        {/* Animated Background Effect */}
        {comment.status === "processing" && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient" />
          </div>
        )}

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  comment.status === "processing"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-white/50 dark:bg-gray-800/50"
                )}
              >
                <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("gap-1.5", config.pulse && "animate-pulse")}
                  >
                    <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
                    {config.label}
                  </Badge>
                  {comment.jobId && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Job #{comment.jobId.slice(0, 6)}
                    </Badge>
                  )}
                </div>
                {actualComment && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(actualComment.created_at).toLocaleString("es", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {actualComment ? (
            <div className="mb-4">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 line-clamp-3">
                {actualComment.content}
              </p>
            </div>
          ) : (
            <Skeleton className="h-12 w-full mb-4" />
          )}

          {/* Insights Section */}
          <div className="space-y-3">
            {comment.status === "processing" ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="relative">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Analizando comentario...
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Descubriendo categorías relevantes con IA
                  </p>
                </div>
              </div>
            ) : comment.status === "completed" && comment.insights.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">
                      {comment.insights.length} categoría
                      {comment.insights.length !== 1 ? "s" : ""} encontrada
                      {comment.insights.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {comment.insights.map(
                      (insight, index) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.1, type: "spring" }}
                        >
                          <InsightBadge
                            insight={insight}
                            data={insightsData?.find(
                              (i) => i.id === insight.id
                            )}
                          />
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : comment.status === "completed" ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-500 italic">
                  No se encontraron categorías específicas
                </p>
              </div>
            ) : comment.status === "failed" ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error al procesar el comentario
                </p>
              </div>
            ) : null}
          </div>

          {/* Progress Indicator for Processing */}
          {comment.status === "processing" && (
            <div className="mt-4">
              <Progress value={33} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Insight Badge Component
const InsightBadge: React.FC<{
  insight: { id: number; type: "created" | "matched" };
  data?: {
    id: number;
    name: string;
    ai_generated: boolean;
    description?: string;
  };
}> = ({ insight, data }) => {
  const isAI = insight.type === "created";

  if (!data) {
    return (
      <Badge variant="outline" className="gap-1">
        <Tag className="h-3 w-3" />
        Insight #{insight.id}
      </Badge>
    );
  }

  return (
    <Badge
      variant={isAI ? "default" : "secondary"}
      className={cn(
        "gap-1.5 transition-all hover:scale-105",
        isAI &&
          "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      )}
    >
      {isAI ? (
        <Sparkles className="h-3.5 w-3.5" />
      ) : (
        <Tag className="h-3.5 w-3.5" />
      )}
      {data.name}
      {isAI && <Zap className="h-3 w-3 text-yellow-300" />}
    </Badge>
  );
};

// Skeleton Component
const CommentSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-12 w-full mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-28" />
      </div>
    </CardContent>
  </Card>
);
