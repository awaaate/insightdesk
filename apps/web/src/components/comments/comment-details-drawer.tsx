import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import type { SharedTypes } from "types/shared";

type CommentWithRelations = SharedTypes.Domain.Comment.WithFullRelations;

interface CommentDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: CommentWithRelations | null;
}

export function CommentDetailsDrawer({
  open,
  onOpenChange,
  comment,
}: CommentDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[680px] sm:w-[760px]">
        <SheetHeader>
          <SheetTitle>Comment Details</SheetTitle>
          <SheetDescription>Full analysis and context</SheetDescription>
        </SheetHeader>
        {comment && (
          <ScrollArea className="h-[85vh] pr-4 mt-4">
            <div className="space-y-6">
              {/* Comment */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Comment</div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
                </div>
              </div>

              {/* Context */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Context</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(
                      (comment.insights || [])
                        .map((i: any) => i.business_unit)
                        .filter(Boolean)
                    )
                  ).map((v: string) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                  {Array.from(
                    new Set(
                      (comment.insights || [])
                        .map((i: any) => i.operational_area)
                        .filter(Boolean)
                    )
                  ).map((v: string) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    {comment.source || "No source"}
                  </Badge>
                </div>
              </div>

              {/* Insights */}
              {(comment.insights?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">Insights</div>
                  {(comment.insights || []).map((insight: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3 bg-card">
                      <div className="flex items-center justify-between">
                        <Badge variant={insight.ai_generated ? "default" : "secondary"}>
                          {insight.name}
                        </Badge>
                        {insight.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(insight.confidence * 10)}%
                          </span>
                        )}
                      </div>
                      {insight.description && (
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      )}
                      {insight.sentiment_level && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium mb-1">Sentiment</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {insight.sentiment_level} ({insight.sentiment_name})
                            </Badge>
                            {insight.sentiment_confidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(insight.sentiment_confidence * 10)}%
                              </span>
                            )}
                            {Array.isArray(insight.emotional_drivers) &&
                              insight.emotional_drivers.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {insight.emotional_drivers.map((d: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">
                                      {d}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                          {insight.sentiment_reasoning && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {insight.sentiment_reasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Intention */}
              {(comment as any).intention && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">Intention</div>
                  <div className="border rounded-lg p-3 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{(comment as any).intention.type}</Badge>
                        <span className="text-sm font-medium">
                          {(comment as any).intention.primary_intention}
                        </span>
                      </div>
                      {(comment as any).intention.confidence && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round((comment as any).intention.confidence * 10)}%
                        </span>
                      )}
                    </div>
                    {(comment as any).intention.description && (
                      <p className="text-sm text-muted-foreground">
                        {(comment as any).intention.description}
                      </p>
                    )}
                    {Array.isArray((comment as any).intention.secondary_intentions) &&
                      (comment as any).intention.secondary_intentions.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium mb-1">Secondary</div>
                          <div className="flex gap-1 flex-wrap">
                            {(comment as any).intention.secondary_intentions.map(
                              (s: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {s}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {(comment as any).intention.reasoning && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-medium mb-1">AI Reasoning</div>
                        <p className="text-xs text-muted-foreground">
                          {(comment as any).intention.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

