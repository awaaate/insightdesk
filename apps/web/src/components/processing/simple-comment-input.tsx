import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useProcessingStore } from "@/stores/processing.store";
import type { SharedTypes } from "types/shared";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function SimpleCommentInput() {
  const [inputText, setInputText] = useState("");
  const [pendingComments, setPendingComments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startProcessing, upsertComments, setStatus } = useProcessingStore();

  // TRPC mutations
  const createCommentsMutation = useMutation(
    trpc.comments.create.mutationOptions()
  );
  const categorizeCommentsMutation = useMutation(
    trpc.processing.categorizeComments.mutationOptions()
  );

  const handleAddComment = () => {
    const lines = inputText.split("\n").filter((line) => line.trim());
    if (lines.length > 0) {
      setPendingComments([...pendingComments, ...lines]);
      setInputText("");
      setError(null);
    }
  };

  const handleRemoveComment = (index: number) => {
    setPendingComments(pendingComments.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPendingComments([]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (pendingComments.length === 0) {
      setError("Agrega algunos comentarios primero");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create comments
      const createInput: SharedTypes.Domain.Comment.CreateManyInput = {
        comments: pendingComments.map((content) => ({
          content: content.trim(),
        })),
      };

      const createResponse =
        await createCommentsMutation.mutateAsync(createInput);

      if (!createResponse.success) {
        throw new Error(
          createResponse.message || "Error al guardar comentarios"
        );
      }

      // Add comment IDs to store
      const newComments = createResponse.commentIds.map(id => ({
        id,
        status: "idle" as const,
        jobId: "",
        insightIds: []
      }));
      upsertComments(newComments);

      // Step 2: Start categorization
      const categorizeInput: SharedTypes.API.Processing.CategorizeInput = {
        commentIds: createResponse.commentIds,
      };

      const categorizeResponse =
        await categorizeCommentsMutation.mutateAsync(categorizeInput);

      if (!categorizeResponse.success) {
        throw new Error(
          categorizeResponse.message || "Error al iniciar análisis"
        );
      }

      // Clear pending comments on success
      setPendingComments([]);
      setStatus("processing");
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado"
      );
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      handleAddComment();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Agregar Comentarios
        </CardTitle>
        <CardDescription>
          Escribe o pega comentarios para analizar. Cada línea será tratada como
          un comentario separado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Escribe tus comentarios aquí...
Cada línea será un comentario separado.
Presiona Cmd+Enter para agregar a la lista."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {inputText.split("\n").filter((line) => line.trim()).length}{" "}
              comentario(s) para agregar
            </p>
            <Button
              onClick={handleAddComment}
              disabled={!inputText.trim() || isSubmitting}
              size="sm"
              variant="secondary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Pending Comments List */}
        {pendingComments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Comentarios listos para analizar
                <Badge variant="secondary">{pendingComments.length}</Badge>
              </h4>
              <Button
                onClick={handleClearAll}
                size="sm"
                variant="ghost"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-1 p-3 rounded-lg bg-muted/50">
              <AnimatePresence mode="popLayout">
                {pendingComments.map((comment, index) => (
                  <motion.div
                    key={`${comment}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group flex items-start gap-2 p-2 rounded hover:bg-background/50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {index + 1}.
                    </span>
                    <span className="text-sm flex-1 break-words">
                      {comment}
                    </span>
                    <button
                      onClick={() => handleRemoveComment(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={pendingComments.length === 0 || isSubmitting}
          className={cn(
            "w-full",
            pendingComments.length > 0 && !isSubmitting && "animate-pulse"
          )}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analizar{" "}
              {pendingComments.length > 0
                ? `${pendingComments.length} comentario${pendingComments.length !== 1 ? "s" : ""}`
                : "comentarios"}
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Los comentarios serán analizados automáticamente y
            categorizados en insights relevantes usando inteligencia artificial.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
