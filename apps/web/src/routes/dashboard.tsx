import { DashboardLayout } from "@/layouts/dashboard/dashboard-layout";
import { useProcessingStore } from "@/stores/processing.store";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
