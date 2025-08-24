import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { LoginPage } from "@/components/pages/login";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <LoginPage />;
}
