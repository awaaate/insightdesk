import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { SharedTypes } from "types/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface AgentLogsListProps {
  className?: string;
}

export const AgentLogsList: React.FC<AgentLogsListProps> = ({ className }) => {
  const { data } = useQuery(trpc.agentLogs.list.queryOptions({}));
  if (!data) return null;
  return (
    <ScrollArea className={cn("h-[600px]", className)}>
      <div className="space-y-4 p-4">
        {data.logs.map((log) => (
          <AgentLogCard key={log.id} log={log} />
        ))}
      </div>
    </ScrollArea>
  );
};

interface AgentLogCardProps {
  log: SharedTypes.Domain.AgentLogs.LogEntry;
}

export const AgentLogCard: React.FC<AgentLogCardProps> = ({ log }) => {
  const { data: comments } = useQuery(
    trpc.comments.getByIds.queryOptions({
      ids: [log.comment_id],
    })
  );
  if (!comments) return null;
  const comment = comments[0];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              log.agent_name === "leti"
                ? "default"
                : log.agent_name === "gro"
                  ? "secondary"
                  : "outline"
            }
          >
            {log.agent_name}
          </Badge>
          <Badge variant={log.success ? "default" : "destructive"}>
            {log.success ? "Success" : "Failed"}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(log.created_at).toLocaleString()}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-sm">Comment: {comment.content}</div>
        <Separator />
        <AgentLogCardMetadata
          metadata={SharedTypes.Domain.AgentLogs.parseMetadata(log.metadata)}
        />
      </CardContent>
    </Card>
  );
};

export const AgentLogCardMetadata: React.FC<{
  metadata: SharedTypes.Domain.AgentLogs.AgentMetadata | null;
}> = ({ metadata }) => {
  if (!metadata) return null;

  const commonDetails = (
    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
      <div>Processing Time: {metadata.data.processingTimeMs}ms</div>
      <div>Provider: {metadata.data.provider}</div>
      <div>Performance: {metadata.data.performance}</div>
    </div>
  );

  if (metadata.agentName === "leti") {
    return (
      <div className="space-y-2">
        <div className="text-sm">Comment ID: {metadata.data.commentId}</div>
        <Separator />
        <div className="space-y-2">
          <div className="font-medium">Insights Detected:</div>
          {metadata.data.insightsDetected.map((insight, i) => (
            <Badge key={i} variant="outline" className="mr-2">
              {insight.insightName} ({insight.confidence.toFixed(2)})
              {insight.isNew && <span className="ml-1 text-green-500">•</span>}
            </Badge>
          ))}
        </div>
        {metadata.data.newInsightsCreated.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium">New Insights:</div>
            {metadata.data.newInsightsCreated.map((insight, i) => (
              <Badge key={i} variant="secondary" className="mr-2">
                {insight.insightName}
              </Badge>
            ))}
          </div>
        )}
        {commonDetails}
      </div>
    );
  }

  if (metadata.agentName === "gro") {
    return (
      <div className="space-y-2">
        <div className="text-sm">Comment ID: {metadata.data.commentId}</div>
        <Separator />
        {metadata.data.intentionDetected && (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Primary Intention: </span>
              <Badge variant="default">
                {metadata.data.intentionDetected.primaryIntention}
              </Badge>
            </div>
            {metadata.data.intentionDetected.secondaryIntentions.length > 0 && (
              <div>
                <span className="font-medium">Secondary Intentions: </span>
                {metadata.data.intentionDetected.secondaryIntentions.map(
                  (intention, i) => (
                    <Badge key={i} variant="outline" className="mr-2">
                      {intention}
                    </Badge>
                  )
                )}
              </div>
            )}
            <div>
              <span className="font-medium">Confidence: </span>
              {metadata.data.intentionDetected.confidence.toFixed(2)}
            </div>
          </div>
        )}
        {commonDetails}
      </div>
    );
  }

  if (metadata.agentName === "pix") {
    return (
      <div className="space-y-2">
        <div className="text-sm">Comment ID: {metadata.data.commentId}</div>
        <Separator />
        <div className="space-y-2">
          <div className="font-medium">Sentiments:</div>
          {metadata.data.sentimentsAnalyzed.map((sentiment, i) => (
            <div key={i} className="space-y-1">
              <Badge variant="outline" className="mr-2">
                {sentiment.insightName} (Level: {sentiment.sentimentLevel})
              </Badge>
              <div className="text-sm text-muted-foreground">
                Confidence: {sentiment.confidence.toFixed(2)}
              </div>
              {sentiment.emotionalDrivers.length > 0 && (
                <div className="ml-4">
                  {sentiment.emotionalDrivers.map((driver, j) => (
                    <Badge key={j} variant="secondary" className="mr-2 mt-1">
                      {driver}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {commonDetails}
      </div>
    );
  }
};
