import { AgentLogsList } from "@/components/dashboard/agent-logs/agent-logs-list";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/agent-logs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4">
      <AgentLogsList />
    </div>
  );
}
