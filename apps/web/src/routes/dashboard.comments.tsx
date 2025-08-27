import { createFileRoute } from '@tanstack/react-router'
import { CommentsTableEnhanced } from '@/components/comments/comments-table-enhanced'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MessageSquare,
  Brain,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react"
import { useState } from 'react'
import { trpc } from '@/utils/trpc'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

export const Route = createFileRoute('/dashboard/comments')({
  component: CommentsPage,
})

function CommentsPage() {
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)

  // Fetch stats
  const { data: sentimentStats } = trpc.comments.statsBySentiment.useQuery()
  const { data: intentionStats } = trpc.comments.statsByIntention.useQuery()

  // Fetch single comment when selected
  const { data: selectedComment } = trpc.comments.getWithRelations.useQuery(
    { commentId: selectedCommentId! },
    { enabled: !!selectedCommentId }
  )

  // Calculate summary stats
  const totalAnalyzedComments = sentimentStats?.stats.reduce((sum, s) => sum + s.count, 0) || 0
  const avgSentimentConfidence = sentimentStats?.stats.reduce(
    (sum, s) => sum + (s.avgConfidence || 0) * s.count, 0
  ) / (totalAnalyzedComments || 1)
  
  const dominantIntention = intentionStats?.stats.reduce((prev, current) => 
    current.count > (prev?.count || 0) ? current : prev, 
    intentionStats?.stats[0]
  )
  
  const dominantSentiment = sentimentStats?.stats.reduce((prev, current) =>
    current.count > (prev?.count || 0) ? current : prev,
    sentimentStats?.stats[0]
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Comments Analysis</h1>
        <p className="text-muted-foreground">
          Explore and analyze customer comments with AI-powered insights, sentiment analysis, and intention detection.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Analyzed Comments
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAnalyzedComments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              With sentiment analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Confidence
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgSentimentConfidence ? `${Math.round(avgSentimentConfidence)}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              AI confidence score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Sentiment
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {dominantSentiment?.level || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dominantSentiment ? `${dominantSentiment.count} comments` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Intention
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {dominantIntention?.type || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dominantIntention ? `${dominantIntention.count} comments` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      {sentimentStats && sentimentStats.stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>
              Breakdown of sentiment levels across all analyzed comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sentimentStats.stats.map((stat) => {
                const percentage = (stat.count / totalAnalyzedComments) * 100;
                const getSeverityColor = (severity: string) => {
                  switch (severity) {
                    case "critical": return "bg-red-500";
                    case "high": return "bg-orange-500";
                    case "medium": return "bg-yellow-500";
                    case "low": return "bg-blue-500";
                    case "none": return "bg-gray-400";
                    case "positive": return "bg-green-500";
                    default: return "bg-gray-300";
                  }
                };

                return (
                  <div key={stat.level} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium capitalize">{stat.level}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getSeverityColor(stat.severity)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-sm text-right">
                      <span className="font-semibold">{stat.count}</span>
                      <span className="text-muted-foreground"> ({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>
            Browse and filter through all comments with their insights, sentiments, and intentions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommentsTableEnhanced 
            onCommentSelect={setSelectedCommentId} 
            onExport={() => console.log('Export functionality coming soon')}
          />
        </CardContent>
      </Card>

      {/* Comment Detail Dialog */}
      <Dialog open={!!selectedCommentId} onOpenChange={(open) => !open && setSelectedCommentId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>
              Full analysis and insights for this comment
            </DialogDescription>
          </DialogHeader>
          
          {selectedComment ? (
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Comment Content */}
                <div>
                  <h3 className="font-semibold mb-2">Content</h3>
                  <p className="text-sm leading-relaxed">{selectedComment.content}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {format(new Date(selectedComment.created_at), "MMM d, yyyy h:mm a")}
                  </div>
                </div>

                {/* Insights */}
                {selectedComment.insights && selectedComment.insights.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Detected Insights</h3>
                    <div className="space-y-3">
                      {selectedComment.insights.map((insight, idx) => (
                        <div key={idx} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={insight.ai_generated ? "default" : "secondary"}>
                              {insight.name}
                            </Badge>
                            {insight.confidence && (
                              <span className="text-xs text-muted-foreground">
                                Confidence: {Math.round(insight.confidence * 10)}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          
                          {/* Sentiment for this insight */}
                          {insight.sentiment_level && (
                            <div className="pt-2 border-t">
                              <div className="text-xs font-medium mb-1">Sentiment Analysis:</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {insight.sentiment_level} ({insight.sentiment_name})
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Severity: {insight.sentiment_severity}
                                </span>
                                {insight.sentiment_confidence && (
                                  <span className="text-xs text-muted-foreground">
                                    • {Math.round(insight.sentiment_confidence * 10)}% confident
                                  </span>
                                )}
                              </div>
                              {insight.emotional_drivers && insight.emotional_drivers.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {insight.emotional_drivers.map((driver, i) => (
                                    <Badge key={i} variant="outline" className="text-xs scale-90">
                                      {driver}
                                    </Badge>
                                  ))}
                                </div>
                              )}
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
                  </div>
                )}

                {/* Intention */}
                {selectedComment.intention && (
                  <div>
                    <h3 className="font-semibold mb-2">Detected Intention</h3>
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="default">{selectedComment.intention.type}</Badge>
                          <span className="ml-2 text-sm font-medium">
                            {selectedComment.intention.primary_intention}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {Math.round(selectedComment.intention.confidence * 10)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedComment.intention.description}
                      </p>
                      {selectedComment.intention.secondary_intentions && 
                       selectedComment.intention.secondary_intentions.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium mb-1">Secondary Intentions:</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedComment.intention.secondary_intentions.map((sec, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {sec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedComment.intention.reasoning && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium mb-1">AI Reasoning:</div>
                          <p className="text-xs text-muted-foreground">
                            {selectedComment.intention.reasoning}
                          </p>
                        </div>
                      )}
                      {selectedComment.intention.context_factors && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium mb-1">Context Factors:</div>
                          <p className="text-xs text-muted-foreground">
                            {selectedComment.intention.context_factors}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="space-y-2 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading comment details...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}