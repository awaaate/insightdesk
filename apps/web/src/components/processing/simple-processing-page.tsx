import { useCommentIds } from "@/stores/processing.store";
import { SimpleCommentInput } from "./simple-comment-input";
import { ProcessingComment } from "./enhanced-processing-comment";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useWebSocketUpdates } from "@/hooks/use-websocket-updates";
import { useProcessingStats } from "@/stores/processing.store";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Sparkles, MessageSquare, Zap } from "lucide-react";

export function SimpleProcessingPage() {
  // WebSocket connection
  const { isConnected } = useWebSocketUpdates({
    url: "ws://localhost:8080/ws",
    autoConnect: true,
  });

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Análisis de Comentarios</h1>
            <p className="text-sm text-muted-foreground">
              Categoriza automáticamente tus comentarios con inteligencia
              artificial
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        {/*  <ProcessingStats
          totalComments={stats.total}
          processingCount={stats.total - stats.completed - stats.failed}
          completedCount={stats.completed}
          failedCount={stats.failed}
          totalInsights={stats.insights}
          progress={progress}
          isConnected={isConnected}
        /> */}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <SimpleCommentInput />
        </motion.div>

        {/* Right Column - Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Comentarios y Categorías
              </CardTitle>
              <CardDescription>
                Vista en tiempo real del análisis de comentarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <ProcessingComments />
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

const ProcessingComments = () => {
  // Use comment IDs for better performance
  const commentIds = useCommentIds();
  const hasComments = commentIds.length > 0;

  if (!hasComments) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          No hay comentarios en proceso
        </p>
        <p className="text-xs text-muted-foreground">
          Agrega algunos comentarios para comenzar el análisis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {commentIds.map((id) => (
          <ProcessingComment key={id} id={id} />
        ))}
      </AnimatePresence>
    </div>
  );
};
