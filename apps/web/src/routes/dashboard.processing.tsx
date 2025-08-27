import { createFileRoute } from "@tanstack/react-router";
import { SimpleProcessingPage } from "@/components/processing/simple-processing-page";

export const Route = createFileRoute("/dashboard/processing")({
  component: SimpleProcessingPage,
});
